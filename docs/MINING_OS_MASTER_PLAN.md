# NEXORA Mining OS — Master Architecture

## Economic boundaries

- NEXORA Earn Balance is the real-reward ledger for verified tasks and referrals.
- Mining Assets are virtual crypto-style game assets.
- NXA (NEXA) is an internal Mining OS game/settlement currency.
- Game NXA is not 1:1 with NGN and is not initially a public blockchain token.
- Only eligible/redeemable NXA can move into the real NEXORA settlement wallet.
- Mining and CyberOps can never directly modify real wallet balances.

## Current implementation

- NXA ledger with mint/burn accounting.
- Daily issuance cap and global supply counters.
- Virtual asset price table with real-market reference fields.
- Per-user Mining Asset balances.
- Server-side NXA balance RPC.
- Server-side spend path.
- Server-only issuance path for mining rewards.
- Interactive NEXORA OS desktop at `/app/mining/os`.
- OS apps for Miner, Wallet, Market, Hardware Store, Facility, CyberOps, Guild, Leaderboard and NXScript.
- 3D rig launches the OS.

## Planned stages

1. Economy: conversion, redeemable NXA, controlled issuance, sinks and admin economy controls.
2. OS shell: windows, persistence, app permissions, system state and notifications.
3. Market: real-world reference prices, game valuation, volatility and difficulty feeds.
4. Hardware Store: explicit purchase confirmation, ledger debit, ownership, maintenance and depreciation.
5. Facility economy: electricity, cooling and infrastructure costs.
6. Multiplayer: presence, shared spaces, visits, chat and live events.
7. CyberOps: sandboxed NXScript VM, offensive/defensive game mechanics, offline automation and bounties.
8. Guild/competitive: Mega-Blocks, build challenges and seasonal leaderboards.
9. Social: rig cards, build sharing, events, achievements and profile integration.
10. Redemption: eligibility engine, settlement to the user's NEXORA wallet, direct Celo withdrawal and payment proof.
11. Hardening: economy simulation, abuse testing, E2E, load and security testing.

## Security boundaries

- The browser never receives payout private keys or database service keys.
- CyberOps targets simulated NEXORA machines only.
- NXA mutation primitives are not directly callable by normal clients.
- Real-money operations remain ledger-based, idempotent and auditable.
