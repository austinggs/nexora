# NEXORA implementation state

## Implemented

- Supabase SSR authentication and protected app routes.
- Profile bootstrap on new Auth users.
- Community categories/topics, threads, comments, reactions and saves.
- Live dashboard, Earn, Wallet, Pings, Profile and Mining data paths.
- Server-authoritative opportunity start/completion.
- Verification dwell-time checks.
- Idempotent reward settlement.
- Ledger reward credits and opportunity budget decrement.
- Payment-proof records.
- Wallet summary derived from the transaction ledger.
- Withdrawal request and debit reservation functions with idempotency.
- Withdrawal/payment tables protected by RLS.
- Local finance preflight that rejects public exposure of server secrets.
- Direct Celo transfer architecture; no dependency on a MiniPay API.

## Still required before production money movement

- Server-side Celo signer/payout worker using a dedicated platform payout wallet.
- Token contract/address configuration for supported production assets.
- Celo RPC configuration and receipt confirmation worker.
- Destination-wallet verification/risk policy.
- Admin withdrawal review controls and audit UI.
- On-chain transaction hash persistence into payment proofs.
- End-to-end test on a Celo test environment before mainnet funds.

## Safety rule

Never place a platform private key in NEXT_PUBLIC_* variables or browser code. The browser may request a withdrawal; only the trusted server-side payout worker may sign and broadcast the Celo transaction.
