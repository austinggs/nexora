create or replace function public.request_withdrawal(p_amount bigint,p_token text,p_wallet_address text,p_idempotency_key text)
returns public.withdrawals
language plpgsql
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_balance bigint;
  v_existing public.withdrawals;
  v_withdrawal public.withdrawals;
  v_ref text;
  v_verified_wallet public.wallet_verifications;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_amount<=0 then raise exception 'amount must be positive'; end if;
  if p_token not in('USDC','USDT','USDM') then raise exception 'unsupported token'; end if;
  if not regexp_like(trim(p_wallet_address),'^0x[0-9a-fA-F]{40}$') then raise exception 'invalid Celo wallet address'; end if;
  if length(trim(p_idempotency_key))<8 then raise exception 'invalid idempotency key'; end if;

  select * into v_existing
  from public.withdrawals
  where user_id=v_user and idempotency_key=p_idempotency_key
  limit 1;
  if v_existing.id is not null then return v_existing; end if;

  select * into v_verified_wallet
  from public.wallet_verifications
  where user_id=v_user and status='verified' and network='celo'
  order by verified_at desc nulls last, created_at desc
  limit 1;
  if v_verified_wallet.id is null then raise exception 'verify your MiniPay Celo wallet before withdrawing'; end if;
  if lower(trim(v_verified_wallet.wallet_address)) <> lower(trim(p_wallet_address)) then raise exception 'withdrawal address must match your verified Celo wallet'; end if;

  select coalesce(sum(case when t.transaction_type='credit' then t.amount else -t.amount end),0)
  into v_balance
  from public.transactions t
  where t.user_id=v_user and t.token=p_token;
  if v_balance<p_amount then raise exception 'insufficient available balance'; end if;

  insert into public.withdrawals(user_id,amount,token,wallet_address,status,idempotency_key)
  values(v_user,p_amount,p_token,lower(trim(p_wallet_address)),'pending',p_idempotency_key)
  returning * into v_withdrawal;

  v_ref:='withdrawal-reserve:'||v_withdrawal.id;
  insert into public.transactions(user_id,transaction_type,category,amount,token,balance_after,reference,description,metadata)
  values(v_user,'debit','withdrawal',p_amount,p_token,v_balance-p_amount,v_ref,'Withdrawal funds reserved',jsonb_build_object('withdrawal_id',v_withdrawal.id,'idempotency_key',p_idempotency_key,'wallet_address',lower(trim(p_wallet_address))));
  return v_withdrawal;
end;
$function$;

create unique index if not exists withdrawals_user_id_idempotency_key_uidx on public.withdrawals(user_id,idempotency_key) where idempotency_key is not null;
