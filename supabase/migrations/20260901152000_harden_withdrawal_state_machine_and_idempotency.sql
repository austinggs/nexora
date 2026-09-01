-- Withdrawal safety hardening: durable idempotency, explicit lifecycle timestamps,
-- reservation-only processing, and payment-proof creation on completion.

alter table public.withdrawals add column if not exists idempotency_key text;
alter table public.withdrawals add column if not exists processed_at timestamptz;
alter table public.withdrawals add column if not exists completed_at timestamptz;

create unique index if not exists withdrawals_user_id_idempotency_key_uidx
  on public.withdrawals(user_id,idempotency_key)
  where idempotency_key is not null;

create or replace function public.request_withdrawal(
  p_amount bigint, p_token text, p_wallet_address text, p_idempotency_key text
) returns public.withdrawals
language plpgsql security invoker set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_balance bigint;
  v_existing public.withdrawals;
  v_withdrawal public.withdrawals;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_token not in ('USDC','USDT','USDM') then raise exception 'unsupported token'; end if;
  if p_wallet_address !~* '^0x[0-9a-f]{40}$' then raise exception 'invalid Celo wallet address'; end if;
  if length(trim(p_idempotency_key)) < 8 or length(p_idempotency_key) > 128 then raise exception 'invalid idempotency key'; end if;

  select * into v_existing from public.withdrawals
   where user_id=v_user and idempotency_key=p_idempotency_key limit 1;
  if v_existing.id is not null then return v_existing; end if;

  select coalesce(sum(case when t.transaction_type='credit' then t.amount else -t.amount end),0)
    into v_balance from public.transactions t
   where t.user_id=v_user and t.token=p_token;
  if v_balance < p_amount then raise exception 'insufficient available balance'; end if;

  insert into public.withdrawals(user_id,amount,token,wallet_address,status,idempotency_key,provider_reference)
  values(v_user,p_amount,p_token,lower(trim(p_wallet_address)),'pending',p_idempotency_key,null)
  returning * into v_withdrawal;
  return v_withdrawal;
exception when unique_violation then
  select * into v_existing from public.withdrawals
   where user_id=v_user and idempotency_key=p_idempotency_key limit 1;
  if v_existing.id is not null then return v_existing; end if;
  raise;
end; $$;

create or replace function private.record_withdrawal_debit_impl(
  p_withdrawal_id uuid, p_reference text
) returns public.transactions
language plpgsql security definer set search_path=public as $$
declare
  v_w public.withdrawals;
  v_balance bigint;
  v_tx public.transactions;
  v_role text;
  v_is_service boolean := current_setting('request.jwt.claim.role',true)='service_role';
begin
  if not v_is_service then
    select role into v_role from public.profiles where id=auth.uid();
    if v_role not in ('admin','super_admin','finance_admin') then raise exception 'not authorized'; end if;
  end if;
  if p_reference is null or length(trim(p_reference)) < 8 then raise exception 'invalid debit reference'; end if;

  select * into v_w from public.withdrawals where id=p_withdrawal_id for update;
  if v_w.id is null then raise exception 'withdrawal not found'; end if;
  if exists(select 1 from public.transactions where reference=p_reference) then
    select * into v_tx from public.transactions where reference=p_reference limit 1;
    return v_tx;
  end if;
  if v_w.status <> 'pending' then raise exception 'withdrawal is not payable'; end if;

  select coalesce(sum(case when t.transaction_type='credit' then t.amount else -t.amount end),0)
    into v_balance from public.transactions t
   where t.user_id=v_w.user_id and t.token=v_w.token;
  if v_balance < v_w.amount then raise exception 'insufficient available balance'; end if;

  insert into public.transactions(
    user_id,transaction_type,category,amount,token,balance_after,reference,description,metadata
  ) values(
    v_w.user_id,'debit','withdrawal',v_w.amount,v_w.token,v_balance-v_w.amount,p_reference,
    'Withdrawal reserved for payout',
    jsonb_build_object('withdrawal_id',p_withdrawal_id,'idempotency_key',v_w.idempotency_key)
  ) returning * into v_tx;

  update public.withdrawals set status='processing',processed_at=now(),updated_at=now()
   where id=p_withdrawal_id;
  return v_tx;
end; $$;

create or replace function private.admin_transition_withdrawal_impl(
  p_withdrawal_id uuid, p_status text, p_provider_reference text, p_failure_reason text
) returns public.withdrawals
language plpgsql security definer set search_path=public as $$
declare
  v_role text;
  v_row public.withdrawals;
  v_from_status text;
  v_debit public.transactions;
  v_balance bigint;
  v_hash text;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if v_role not in ('admin','super_admin','finance_admin') then raise exception 'not authorized'; end if;
  if p_status not in ('processing','completed','failed','reversed') then raise exception 'invalid status'; end if;

  select * into v_row from public.withdrawals where id=p_withdrawal_id for update;
  if v_row.id is null then raise exception 'withdrawal not found'; end if;
  v_from_status := v_row.status;
  if v_from_status in ('completed','failed','reversed') then raise exception 'withdrawal is final'; end if;
  if p_status='processing' then raise exception 'processing must be entered through the payout reservation function'; end if;
  if v_from_status <> 'processing' then raise exception 'withdrawal must be processing'; end if;

  if p_status='completed' then
    v_hash := lower(trim(coalesce(p_provider_reference,'')));
    if v_hash !~ '^0x[0-9a-f]{64}$' then raise exception 'valid Celo transaction hash required'; end if;
    select * into v_debit from public.transactions
     where category='withdrawal' and transaction_type='debit'
       and metadata->>'withdrawal_id'=p_withdrawal_id::text
     order by created_at desc limit 1;
    if v_debit.id is null then raise exception 'withdrawal debit reservation not found'; end if;

    if exists(select 1 from public.payment_proofs where withdrawal_id=p_withdrawal_id) then
      update public.payment_proofs
         set tx_hash=v_hash,status='pending',metadata=metadata||jsonb_build_object('admin_confirmed_at',now())
       where withdrawal_id=p_withdrawal_id;
    else
      insert into public.payment_proofs(
        transaction_id,user_id,token,amount,network,tx_hash,status,metadata,withdrawal_id
      ) values(
        v_debit.id,v_row.user_id,v_row.token,v_row.amount,'celo',v_hash,'pending',
        jsonb_build_object('source','celo_direct_transfer'),p_withdrawal_id
      );
    end if;

    update public.withdrawals
       set status='completed',provider_reference=v_hash,failure_reason=null,completed_at=now(),updated_at=now()
     where id=p_withdrawal_id returning * into v_row;
  else
    if not exists(select 1 from public.transactions where reference='withdrawal-reversal:'||p_withdrawal_id) then
      select coalesce(sum(case when t.transaction_type='credit' then t.amount else -t.amount end),0)
        into v_balance from public.transactions t
       where t.user_id=v_row.user_id and t.token=v_row.token;
      insert into public.transactions(
        user_id,transaction_type,category,amount,token,balance_after,reference,description,metadata
      ) values(
        v_row.user_id,'credit','refund',v_row.amount,v_row.token,v_balance+v_row.amount,
        'withdrawal-reversal:'||v_row.id,'Withdrawal returned after payout failure',
        jsonb_build_object('withdrawal_id',v_row.id,'reason',p_failure_reason)
      );
    end if;
    update public.withdrawals
       set status=p_status,provider_reference=null,
           failure_reason=nullif(trim(coalesce(p_failure_reason,'')),''),updated_at=now()
     where id=p_withdrawal_id returning * into v_row;
  end if;

  insert into public.audit_logs(actor_id,actor_type,action,target_type,target_id,metadata)
  values(auth.uid(),'admin','withdrawal.status_changed','withdrawal',p_withdrawal_id,
         jsonb_build_object('from_status',v_from_status,'to_status',p_status,'provider_reference',p_provider_reference));
  return v_row;
end; $$;

revoke all on function public.record_withdrawal_debit(uuid,text) from public,anon,authenticated;
grant execute on function public.record_withdrawal_debit(uuid,text) to service_role;
revoke all on function private.record_withdrawal_debit_impl(uuid,text) from public,anon,authenticated;
revoke all on function private.admin_transition_withdrawal_impl(uuid,text,text,text) from public,anon,authenticated;
