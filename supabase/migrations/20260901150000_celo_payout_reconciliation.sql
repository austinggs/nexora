-- Celo payout worker support. The database never signs or broadcasts transactions.
-- A processing withdrawal is an explicit payout attempt; an operator/worker must reconcile
-- an unknown broadcast rather than blindly retrying and risking a duplicate payout.

create or replace function public.claim_withdrawal_for_payout(p_withdrawal_id uuid)
returns public.withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.withdrawals;
  v_is_service boolean := current_setting('request.jwt.claim.role', true) = 'service_role';
begin
  if not v_is_service then
    raise exception 'service role required';
  end if;

  select * into v_row
  from public.withdrawals
  where id = p_withdrawal_id
  for update;

  if v_row.id is null then raise exception 'withdrawal not found'; end if;
  if v_row.status <> 'pending' then raise exception 'withdrawal is not pending'; end if;
  if v_row.amount <= 0 then raise exception 'invalid withdrawal amount'; end if;
  if v_row.token not in ('USDC','USDT','USDM') then raise exception 'unsupported payout token'; end if;
  if v_row.wallet_address !~* '^0x[0-9a-f]{40}$' then raise exception 'invalid payout wallet'; end if;

  perform public.record_withdrawal_debit(v_row.id, 'withdrawal:' || v_row.id::text);

  select * into v_row from public.withdrawals where id = p_withdrawal_id;
  return v_row;
end;
$$;

revoke all on function public.claim_withdrawal_for_payout(uuid) from public;
grant execute on function public.claim_withdrawal_for_payout(uuid) to service_role;

create or replace function public.finalize_celo_withdrawal(
  p_withdrawal_id uuid,
  p_tx_hash text
)
returns public.withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.withdrawals;
  v_debit public.transactions;
  v_hash text := lower(trim(coalesce(p_tx_hash,'')));
  v_proof public.payment_proofs;
  v_is_service boolean := current_setting('request.jwt.claim.role', true) = 'service_role';
begin
  if not v_is_service then raise exception 'service role required'; end if;
  if v_hash !~ '^0x[0-9a-f]{64}$' then raise exception 'valid Celo transaction hash required'; end if;

  select * into v_row from public.withdrawals where id=p_withdrawal_id for update;
  if v_row.id is null then raise exception 'withdrawal not found'; end if;
  if v_row.status <> 'processing' then raise exception 'withdrawal is not processing'; end if;

  select * into v_debit from public.transactions
  where category='withdrawal' and transaction_type='debit'
    and metadata->>'withdrawal_id'=p_withdrawal_id::text
  order by created_at desc limit 1;
  if v_debit.id is null then raise exception 'withdrawal debit reservation not found'; end if;

  if exists(select 1 from public.payment_proofs where tx_hash=v_hash and withdrawal_id is distinct from p_withdrawal_id) then
    raise exception 'transaction hash already belongs to another withdrawal';
  end if;

  select * into v_proof from public.payment_proofs where withdrawal_id=p_withdrawal_id limit 1;
  if v_proof.id is null then
    insert into public.payment_proofs(transaction_id,user_id,token,amount,network,tx_hash,status,metadata,withdrawal_id,confirmed_at)
    values(v_debit.id,v_row.user_id,v_row.token,v_row.amount,'celo',v_hash,'confirmed',jsonb_build_object('source','celo_direct_transfer'),p_withdrawal_id,now())
    returning * into v_proof;
  else
    update public.payment_proofs set transaction_id=v_debit.id,tx_hash=v_hash,status='confirmed',network='celo',confirmed_at=now(),metadata=metadata||jsonb_build_object('source','celo_direct_transfer') where id=v_proof.id;
  end if;

  update public.withdrawals
  set status='completed', provider_reference=v_hash, failure_reason=null, completed_at=now(), updated_at=now()
  where id=p_withdrawal_id returning * into v_row;

  insert into public.audit_logs(actor_id,actor_type,action,target_type,target_id,metadata)
  values(null,'system','withdrawal.celo_confirmed','withdrawal',p_withdrawal_id,jsonb_build_object('tx_hash',v_hash));

  return v_row;
end;
$$;

revoke all on function public.finalize_celo_withdrawal(uuid,text) from public;
grant execute on function public.finalize_celo_withdrawal(uuid,text) to service_role;
