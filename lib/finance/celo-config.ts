import { celo } from 'viem/chains'

export const CELO_TOKENS = {
  USDC: process.env.CELO_USDC_ADDRESS,
  USDT: process.env.CELO_USDT_ADDRESS,
  USDM: process.env.CELO_USDM_ADDRESS,
} as const

export type SupportedToken = keyof typeof CELO_TOKENS

export function getCeloConfig() {
  const rpcUrl = process.env.CELO_RPC_URL
  const payoutPrivateKey = process.env.CELO_PAYOUT_PRIVATE_KEY

  if (!rpcUrl) throw new Error('CELO_RPC_URL is not configured.')
  if (!payoutPrivateKey) throw new Error('CELO_PAYOUT_PRIVATE_KEY is not configured.')
  if (process.env.NEXT_PUBLIC_CELO_PAYOUT_PRIVATE_KEY) {
    throw new Error('Payout private key must never use a NEXT_PUBLIC_ variable.')
  }

  return { chain: celo, rpcUrl, payoutPrivateKey } as const
}

export function getTokenAddress(token: string) {
  if (!(token in CELO_TOKENS)) throw new Error(`Unsupported payout token: ${token}`)
  const address = CELO_TOKENS[token as SupportedToken]
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Token contract is not configured for ${token}.`)
  }
  return address as `0x${string}`
}
