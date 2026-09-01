# Vercel setup

Import `austinggs/nexora` into the connected Vercel team. The repository is configured for Next.js and automatic Git-based previews.

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Then use the GitHub-connected deployment flow so pull requests receive preview deployments and `main` is the production branch.
