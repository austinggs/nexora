import 'server-only'

import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem'
import { celo } from 'viem/chains'

const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing server environment variable: ${name}`)
  if (name.startsWith('NEXT_PUBLIC_')) throw new Error(`Payout configuration cannot be public: ${name}`)
  return value
}

function address(name: string): Address {
  const value = env(name)
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error(`Invalid Ethereum address in ${name}`)
  return value as Address
}

function privateKey(): `0x${string}` {
  const value = env('CELO_PAYOUT_PRIVATE_KEY')
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error('Invalid CELO_PAYOUT_PRIVATE_KEY')
  return value as `0x${string}`
}

export function celoTokenAddress(token: string): Address {
  const key = `CELO_${token.toUpperCase()}_ADDRESS`
  if (!['USDC', 'USDT', 'USDM'].includes(token.toUpperCase())) throw new Error('Unsupported payout token')
  return address(key)
}

export function celoClients() {
  const rpcUrl = env('CELO_RPC_URL')
  const account = privateKeyToAccount(privateKey())
  return {
    account,
    publicClient: createPublicClient({ chain: celo, transport: http(rpcUrl) }),
    walletClient: createWalletClient({ account, chain: celo, transport: http(rpcUrl) }),
  }
}

export async function sendCeloTokenTransfer(token: string, destination: Address, amount: bigint): Promise<Hash> {
  if (amount <= 0n) throw new Error('Transfer amount must be positive')
  const { account, publicClient, walletClient } = celoClients()
  const hash = await walletClient.writeContract({
    address: celoTokenAddress(token),
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [destination, amount],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

export async function getCeloTransaction(hash: Hash) {
  const { publicClient } = celoClients()
  return publicClient.getTransactionReceipt({ hash })
}
