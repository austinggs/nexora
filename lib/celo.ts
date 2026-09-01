import { createPublicClient, createWalletClient, http, parseUnits, type Hex, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const celo = defineChain({
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: [process.env.CELO_RPC_URL || 'https://forno.celo.org'] } },
  blockExplorers: { default: { name: 'CeloScan', url: 'https://celoscan.io' } },
})

const ERC20_ABI = [{
  type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [
    { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' },
  ], outputs: [{ name: '', type: 'bool' }],
}, { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }] as const

const TOKENS = {
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  USDM: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
} as const

export type SupportedToken = keyof typeof TOKENS

export function getTokenAddress(token: SupportedToken) {
  return TOKENS[token]
}

function requireSigner() {
  const key = process.env.CELO_PAYOUT_PRIVATE_KEY as Hex | undefined
  if (!key) throw new Error('Celo payout signer is not configured')
  return privateKeyToAccount(key)
}

export async function sendCeloToken(token: SupportedToken, destination: `0x${string}`, amountMinor: bigint) {
  const account = requireSigner()
  const transport = http(process.env.CELO_RPC_URL || 'https://forno.celo.org')
  const publicClient = createPublicClient({ chain: celo, transport })
  const walletClient = createWalletClient({ account, chain: celo, transport })
  const decimals = await publicClient.readContract({ address: TOKENS[token], abi: ERC20_ABI, functionName: 'decimals' })
  const amount = amountMinor * (10n ** BigInt(Math.max(0, Number(decimals) - 2)))
  const hash = await walletClient.writeContract({ address: TOKENS[token], abi: ERC20_ABI, functionName: 'transfer', args: [destination, amount] })
  return hash
}

export async function waitForCeloTransfer(hash: Hex) {
  const client = createPublicClient({ chain: celo, transport: http(process.env.CELO_RPC_URL || 'https://forno.celo.org') })
  return client.waitForTransactionReceipt({ hash })
}

export function celoExplorerUrl(hash: string) {
  return `https://celoscan.io/tx/${hash}`
}
