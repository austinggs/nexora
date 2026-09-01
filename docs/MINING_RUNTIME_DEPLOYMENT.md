# Mining Runtime Heartbeat

The mining runtime is time-based rather than browser-dependent.

## Required server environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (Vercel's recommended cron authorization secret) or `MINING_RUNTIME_CRON_SECRET`

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client code.

## Database migration

Apply `supabase/migrations/20260901123000_mining_runtime_heartbeat.sql` before enabling the cron job. It creates the service-only `advance_rig_runtime` RPC and records per-rig heartbeat timestamps.

## Runtime model

- Active UI requests refresh the current user's rig runtime.
- The scheduled heartbeat advances every rig using elapsed time.
- A single heartbeat advances at most six hours, preventing runaway catch-up after outages.
- The heartbeat endpoint is service-secret protected.
- The endpoint processes rigs in batches of ten.

## Vercel

`vercel.json` schedules `/api/cron/mining-runtime` once per minute. Vercel sends the cron authorization when `CRON_SECRET` is configured.
