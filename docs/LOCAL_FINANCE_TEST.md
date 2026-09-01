# Local finance verification

This check is intentionally local and safe. It does not broadcast a Celo transaction or move real funds.

## 1. Configure public Supabase values

Create `.env.local` from `.env.example` and provide only the public Supabase URL and anon key.

## 2. Run the preflight

```bash
node scripts/local-finance-check.mjs
```

The check fails if server secrets such as a service-role key, private key, MiniPay secret, or webhook secret are exposed in the local public environment.

## 3. Verify the withdrawal state machine against Supabase

Use a development/test Supabase project and an authenticated test user. Exercise:

1. Create a funded test ledger balance.
2. Call `request_withdrawal` with a unique idempotency key.
3. Repeat the exact request and confirm the same withdrawal is returned.
4. Call `record_withdrawal_debit` once and confirm exactly one debit exists.
5. Repeat the debit operation and confirm no second debit is created.
6. Confirm the withdrawal transitions from `pending` to `processing`.
7. For production, replace the simulated provider step with a direct Celo token transfer from the platform-controlled payout wallet.
8. Record the resulting transaction hash as the provider/on-chain reference.
9. Verify the transaction receipt and token contract before marking the withdrawal completed.

## Important

Do not put a platform private key in `.env.local` for browser testing. Real signing belongs exclusively in a server-side worker/function with restricted secrets. Local verification should validate the financial state machine before an administrator is allowed to operate production payouts.
