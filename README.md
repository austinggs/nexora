# NEXORA

NEXORA is a trust-first social discovery platform combining community threads, verified earning opportunities, a ledger-based wallet, and a virtual mining game.

## Stack

- Next.js 16 App Router + TypeScript
- Supabase Auth + PostgreSQL + Realtime
- Tailwind CSS
- Vercel deployment

## Development

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Add server-only `MANUAL_SESSION_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` when using database-managed admin sessions.
4. Run `npm install` and `npm run dev`.
5. Run `npm run build` before deployment.

Financial operations are server-authoritative and must use the ledger. Never put a Supabase secret/service key in browser code.
