# NEXORA Celo Payout Mode

NEXORA supports an explicit server-side payout switch so the product can run without configuring a live Celo payout wallet.

## Modes

### `CELO_PAYOUT_MODE=disabled`

Safe default. Withdrawal requests can still be recorded in the ledger, but NEXORA will not broadcast or confirm a Celo transfer. No fake transaction hash or payment proof is generated.

Use this while the project is being developed, while MiniPay wallet verification is being tested, or when the Celo payout infrastructure is not ready.

### `CELO_PAYOUT_MODE=live`

Enables real server-side Celo ERC-20 transfers. This mode requires the server-only Celo RPC, payout wallet private key, and supported token contract environment variables to be configured and tested first.

## Recommended rollout

1. Keep `CELO_PAYOUT_MODE=disabled` during initial deployment.
2. Test MiniPay wallet connection and signature verification.
3. Configure `CELO_NETWORK=alfajores` for testnet testing and fund the test payout wallet with test assets.
4. Verify the full request → broadcast → receipt → payment-proof flow.
5. Change to `CELO_NETWORK=mainnet` and `CELO_PAYOUT_MODE=live` only after production credentials and balances have been verified.

The user wallet model remains one Celo address per user. USDC, USDT, and USDm are tokens transferred to that same address; token contract addresses identify assets, not separate user wallets.
