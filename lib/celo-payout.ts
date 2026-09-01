import { createPublicClient, createWalletClient, http, getContract, parseEventLogs, type Address, type Hash } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'event', name: 'Transfer', anonymous: false, inputs: [{ name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }, { name: 'value', type: 'uint256', indexed: false }] },
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

function ledgerCentsToTokenUnits(amountCents: bigint, decimals: number) {
  if (amountCents <= 0n) throw new Error('Payout amount must be positive.')
  if (decimals < 2) throw new Error(`Unsupported token precision: ${decimals} decimals.`)
  return amountCents * (10n ** BigInt(decimals - 2))
}

export async function broadcastCeloTokenTransfer(params: { token: string; amountCents: bigint; destination: string }) {
  const destination = params.destination.trim() as Address
  if (!/^0x[0-9a-fA-F]{40}$/.test(destination)) throw new Error('Invalid Celo destination address.')
  if (params.amountCents <= 0n) throw new Error('Payout amount must be positive.')

  const rpc = env('CELO_RPC_URL')
  const network = chain()
  const account = getPayoutAccount()
  const wallet = createWalletClient({ account, chain: network, transport: http(rpc) })
  const publicClient = createPublicClient({ chain: network, transport: http(rpc) })
  const contract = getContract({ address: tokenAddress(params.token), abi: ERC20_ABI, client: { public: publicClient, wallet } })
  const decimals = Number(await contract.read.decimals())
  const tokenUnits = ledgerCentsToTokenUnits(params.amountCents, decimals)
  const payoutBalance = await contract.read.balanceOf([account.address])
  if (payoutBalance < tokenUnits) throw new Error(`Insufficient ${params.token.toUpperCase()} balance in the NEXORA payout wallet.`)
  const txHash = await contract.write.transfer([destination, tokenUnits], { account })
  return { txHash: txHash as Hash, decimals, tokenUnits, chainId: network.id, payoutWallet: account.address }
}

export async function confirmCeloTokenTransfer(params: { txHash: Hash; token: string; destination: string; amountCents: bigint }) {
  const rpc = env('CELO_RPC_URL')
  const network = chain()
  const destination = params.destination.toLowerCase()
  const token = tokenAddress(params.token).toLowerCase()
  const publicClient = createPublicClient({ chain: network, transport: http(rpc) })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: params.txHash, confirmations: 1 })
  if (receipt.status !== 'success') throw new Error('Celo transaction failed.')
  const logs = parseEventLogs({ abi: ERC20_ABI, logs: receipt.logs, eventName: 'Transfer', strict: false })
  const decimals = Number(await publicClient.readContract({ address: tokenAddress(params.token), abi: ERC20_ABI, functionName: 'decimals' }))
  const expectedTokenUnits = ledgerCentsToTokenUnits(params.amountCents, decimals)
  const transfer = logs.find((event) => {
    const address = String(event.address).toLowerCase()
    const args = event.args as { to?: Address; value?: bigint }
    return address === token && String(args.to ?? '').toLowerCase() === destination && args.value === expectedTokenUnits
  })
  if (!transfer) throw new Error('Transaction receipt does not contain the expected token transfer.')
  return { status: receipt.status, blockNumber: receipt.blockNumber, chainId: network.id, decimals, tokenUnits: expectedTokenUnits }
}
