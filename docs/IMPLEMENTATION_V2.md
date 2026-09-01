# Implementation boundary

The financial system is intentionally not connected to real-money payout execution in this foundation. Before production withdrawals, add server-only ledger transactions, idempotency, webhook signature/replay verification, risk checks and payment proof generation as specified by the product requirements.
