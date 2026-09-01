# Manual User ID authentication

NEXORA supports a second login mode for administrator-provisioned accounts.

## User experience

Users choose **User ID** on `/login` and enter the administrator-issued User ID and password. The internal Supabase Auth email alias is never shown to the user and is derived server-side from the normalized User ID plus `MANUAL_AUTH_PEPPER`.

Regular email/password login and public signup remain unchanged.

## Admin provisioning

Authorized `admin` and `super_admin` users can open `/admin/manual-users` and create a manual account. The password is passed only to Supabase Auth's admin API; NEXORA does not store plaintext passwords.

The account table stores only the visible User ID, the internal Supabase Auth user UUID, status, creator, and timestamps.

## Required server environment

`MANUAL_AUTH_PEPPER` must be a random secret of at least 32 characters and must be configured only as a server-side environment variable in Vercel/production. Never expose it as `NEXT_PUBLIC_*` and never commit its value to Git.

`SUPABASE_SERVICE_ROLE_KEY` is also required server-side for administrator provisioning and must never be exposed to the browser.

## Safety properties

- Only `admin` and `super_admin` roles can provision manual accounts.
- Manual accounts are created with `email_confirm: true` because the underlying address is an internal alias, not a user's inbox.
- Authentication still uses Supabase Auth sessions/cookies.
- Login failures are intentionally generic.
- User IDs are limited to 4–32 characters and `[a-z0-9._-]` after normalization.
- Manual accounts are not public signup identities.
