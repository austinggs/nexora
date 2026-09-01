# Vercel

Connect `austinggs/nexora` to the existing Vercel team/project flow. The repository includes `vercel.json` and is ready for automatic preview deployments once the GitHub repository is imported into Vercel.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not add Supabase secret keys to Vercel client-visible variables.
