# NEXORA implementation

This build turns the supplied production specification into a working foundation.

## Implemented

- Mobile-first liquid-glass platform shell
- Landing page and secure login/signup flow
- Home dashboard
- Explore/community feed
- Verified opportunities UI
- Ledger wallet UI
- Interactive mining rig UI with overclock/cooling state
- Pings and profile screens
- Supabase SSR browser/server clients and Next.js Proxy session refresh
- Supabase schema with RLS across public tables
- Starter categories, topics and earning opportunities
- Mining hardware seed file
- GitHub Actions build check
- Vercel project configuration

## Next implementation slices

1. Wire dashboard cards to live Supabase queries.
2. Add onboarding interests and profile creation trigger.
3. Move reward completion and wallet mutations into server-only transactional functions.
4. Add idempotency keys, webhook verification and payment proof generation before enabling real withdrawals.
5. Add Supabase Realtime subscriptions for pings and mining events.
6. Add Fastify/uWebSockets worker services only when the mining simulation needs persistent 20Hz server ticks.
