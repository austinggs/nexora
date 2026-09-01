# Supabase setup

The production database is already initialized in the connected NEXORA Supabase project.

- Schema: tables + RLS policies are applied in the project.
- Seed: `seed.sql` contains the mining hardware seed data.
- Client auth: Next.js uses `@supabase/ssr` with browser/server clients and a Proxy for cookie session refresh.

Never commit Supabase secret keys. Only the publishable key belongs in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
