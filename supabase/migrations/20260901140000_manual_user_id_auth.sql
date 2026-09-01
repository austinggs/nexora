create table if not exists public.manual_login_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','disabled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_login_accounts_auth_user_id_idx on public.manual_login_accounts(auth_user_id);

alter table public.manual_login_accounts enable row level security;

drop policy if exists "Admins can read manual login accounts" on public.manual_login_accounts;
create policy "Admins can read manual login accounts" on public.manual_login_accounts
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','super_admin')));

create or replace function private.manual_login_alias(p_user_id text, p_pepper text)
returns text
language sql
immutable
as $$
  select encode(digest(lower(trim(p_user_id)) || ':' || p_pepper, 'sha256'), 'hex') || '@auth.nexora.internal'
$$;

create or replace function private.manual_login_id_valid(p_user_id text)
returns boolean
language sql
immutable
as $$
  select lower(trim(coalesce(p_user_id,''))) ~ '^[a-z0-9][a-z0-9._-]{3,31}$'
$$;

grant usage on schema public to authenticated;
revoke all on table public.manual_login_accounts from anon;
revoke all on table public.manual_login_accounts from authenticated;
