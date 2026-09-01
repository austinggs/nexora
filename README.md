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
3. Run `npm install` and `npm run dev`.

Financial operations are server-authoritative and must use the ledger. Never put a Supabase secret/service key in browser code.
