# Security baseline

- Supabase RLS is enabled on all exposed public tables.
- Auth uses SSR cookie sessions.
- Browser code only uses the Supabase publishable key.
- Wallet data is user-scoped through RLS.
- Real payout execution is not enabled by this foundation.
- Production financial actions must remain server-authoritative and idempotent.
