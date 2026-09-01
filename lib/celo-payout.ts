import { createPublicClient, createWalletClient, http, getContract, type Address, type Hash } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

function chain() {
  return process.env.CELO_NETWORK === 'alfajores' ? celoAlfajores : celo
}

function tokenAddress(token: string): Address {
  const normalized = token.toUpperCase()
  if (normalized === 'USDC') return env('CELO_USDC_CONTRACT') as Address
  if (normalized === 'USDT') return env('CELO_USDT_CONTRACT') as Address
  if (normalized === 'USDM') return env('CELO_USDM_CONTRACT') as Address
  throw new Error('Unsupported payout token.')
}

export function getPayoutAccount() {
  const key = env('CELO_PAYOUT_PRIVATE_KEY') as `0x${string}`
  return privateKeyToAccount(key)
}

export async function broadcastCeloTokenTransfer(params: { token: string; amountMinorUnits: bigint; destination: string }) {
  const destination = params.destination.trim() as Address
  if (!/^0x[0-9a-fA-F]{40}$/.test(destination)) throw new Error('Invalid Celo destination address.')
  if (params.amountMinorUnits <= 0n) throw new Error('Payout amount must be positive.')

  const rpc = env('CELO_RPC_URL')
  const network = chain()
  const account = getPayoutAccount()
  const wallet = createWalletClient({ account, chain: network, transport: http(rpc) })
  const publicClient = createPublicClient({ chain: network, transport: http(rpc) })
  const contract = getContract({ address: tokenAddress(params.token), abi: ERC20_ABI, client: { public: publicClient, wallet } })
  const decimals = await contract.read.decimals()
  const txHash = await contract.write.transfer([destination, params.amountMinorUnits], { account })
  return { txHash: txHash as Hash, decimals: Number(decimals), chainId: network.id }
}

export async function confirmCeloTransaction(txHash: Hash) {
  const rpc = env('CELO_RPC_URL')
  const network = chain()
  const publicClient = createPublicClient({ chain: network, transport: http(rpc) })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 })
  return { status: receipt.status, blockNumber: receipt.blockNumber, chainId: network.id }
}
