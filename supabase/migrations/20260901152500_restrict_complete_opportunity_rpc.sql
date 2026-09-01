-- complete_opportunity is an authenticated-user action, never an anonymous RPC.
revoke execute on function public.complete_opportunity(uuid,timestamptz) from anon;
grant execute on function public.complete_opportunity(uuid,timestamptz) to authenticated;
