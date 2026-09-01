'use server'

import { randomBytes } from 'node:crypto'
import { verifyMessage } from 'viem'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_CHAIN_IDS = new Set((process.env.CELO_NETWORK === 'alfajores' ? [44787] : [42220]).map(String))
const MESSAGE_PREFIX = 'NEXORA wallet verification'

function validAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value)
}

function buildMessage(address: string, nonce: string, chainId: string) {
  return `${MESSAGE_PREFIX}\nAddress: ${address}\nChain: Celo (${chainId})\nNonce: ${nonce}\nThis signature verifies wallet ownership only and does not authorize a transfer.`
}

export async function createWalletChallenge(walletAddress: string, chainId: string) {
  const address = walletAddress.trim()
  const chain = chainId.trim()
  if (!validAddress(address)) return { ok: false, error: 'Invalid Celo wallet address.' }
  if (!ALLOWED_CHAIN_IDS.has(chain)) return { ok: false, error: 'Connect MiniPay to the configured Celo network.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const nonce = randomBytes(24).toString('hex')
  const db = createAdminClient()
  const { error } = await db.from('wallet_verifications').upsert({
    user_id: user.id,
    wallet_address: address.toLowerCase(),
    network: 'celo',
    method: 'signature',
    nonce,
    status: 'pending',
    verified_at: null,
  }, { onConflict: 'user_id' })
  if (error) return { ok: false, error: error.message }

  return { ok: true, message: buildMessage(address, nonce, chain) }
}

export async function verifyWalletChallenge(walletAddress: string, chainId: string, signature: string) {
  const address = walletAddress.trim()
  const chain = chainId.trim()
  if (!validAddress(address)) return { ok: false, error: 'Invalid Celo wallet address.' }
  if (!ALLOWED_CHAIN_IDS.has(chain)) return { ok: false, error: 'Connect MiniPay to the configured Celo network.' }
  if (!/^0x[0-9a-fA-F]+$/.test(signature)) return { ok: false, error: 'Invalid wallet signature.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const db = createAdminClient()
  const { data: challenge, error: readError } = await db.from('wallet_verifications')
    .select('id,nonce,status,created_at,wallet_address,network')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (readError || !challenge) return { ok: false, error: 'Wallet verification challenge not found.' }
  if (challenge.network !== 'celo' || challenge.wallet_address.toLowerCase() !== address.toLowerCase()) return { ok: false, error: 'Wallet verification address mismatch.' }
  if (Date.now() - new Date(challenge.created_at).getTime() > 10 * 60 * 1000) return { ok: false, error: 'Wallet verification challenge expired. Start again.' }

  const message = buildMessage(address, challenge.nonce, chain)
  const valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` })
  if (!valid) return { ok: false, error: 'Signature verification failed.' }

  const { error } = await db.from('wallet_verifications').update({ status: 'verified', verified_at: new Date().toISOString(), nonce: null }).eq('id', challenge.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
