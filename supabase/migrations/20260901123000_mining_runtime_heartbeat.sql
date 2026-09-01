create table if not exists public.mining_runtime_heartbeats (
  rig_id uuid primary key references public.rigs(id) on delete cascade,
  user_id uuid not null,
  last_advanced_at timestamptz not null default now(),
  last_duration_seconds integer not null default 0,
  last_source text not null default 'manual',
  updated_at timestamptz not null default now()
);

create index if not exists mining_runtime_heartbeats_user_id_idx on public.mining_runtime_heartbeats(user_id);

alter table public.mining_runtime_heartbeats enable row level security;

drop policy if exists "Users can read own mining heartbeat" on public.mining_runtime_heartbeats;
create policy "Users can read own mining heartbeat" on public.mining_runtime_heartbeats
for select to authenticated using (user_id = (select auth.uid()));

create or replace function private.advance_rig_runtime(
  p_rig_id uuid,
  p_now timestamptz,
  p_source text default 'cron'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_last timestamptz;
  v_now timestamptz := coalesce(p_now, now());
  v_seconds integer;
  v_result jsonb;
  v_old_sub text;
begin
  if p_rig_id is null then raise exception 'rig id required'; end if;
  select user_id into v_user from public.rigs where id = p_rig_id;
  if v_user is null then raise exception 'rig not found'; end if;

  select last_advanced_at into v_last
    from public.mining_runtime_heartbeats
   where rig_id = p_rig_id
   for update;

  if v_last is null then
    select coalesce((config->>'last_runtime_at')::timestamptz, updated_at, now()) into v_last
      from public.rigs where id = p_rig_id;
  end if;

  v_seconds := greatest(0, least(21600, floor(extract(epoch from (v_now - v_last)))::integer));

  v_old_sub := current_setting('request.jwt.claim.sub', true);
  perform set_config('request.jwt.claim.sub', v_user::text, true);
  begin
    v_result := public.refresh_my_rig_runtime();
  exception when others then
    if v_old_sub is null then
      perform set_config('request.jwt.claim.sub', '', true);
    else
      perform set_config('request.jwt.claim.sub', v_old_sub, true);
    end if;
    raise;
  end;

  if v_old_sub is null then
    perform set_config('request.jwt.claim.sub', '', true);
  else
    perform set_config('request.jwt.claim.sub', v_old_sub, true);
  end if;

  insert into public.mining_runtime_heartbeats(rig_id,user_id,last_advanced_at,last_duration_seconds,last_source,updated_at)
  values(p_rig_id,v_user,v_now,v_seconds,coalesce(nullif(p_source,''),'cron'),now())
  on conflict (rig_id) do update set
    user_id=excluded.user_id,
    last_advanced_at=excluded.last_advanced_at,
    last_duration_seconds=excluded.last_duration_seconds,
    last_source=excluded.last_source,
    updated_at=now();

  return coalesce(v_result, jsonb_build_object('rig_id',p_rig_id,'elapsed_seconds',v_seconds));
end;
$$;

revoke all on function private.advance_rig_runtime(uuid,timestamptz,text) from public;
grant execute on function private.advance_rig_runtime(uuid,timestamptz,text) to service_role;

create or replace function public.advance_rig_runtime(p_rig_id uuid, p_now timestamptz, p_source text default 'cron')
returns jsonb
language sql
security definer
set search_path = public, private
as $$
  select private.advance_rig_runtime(p_rig_id,p_now,p_source);
$$;

revoke all on function public.advance_rig_runtime(uuid,timestamptz,text) from public, anon, authenticated;
grant execute on function public.advance_rig_runtime(uuid,timestamptz,text) to service_role;
