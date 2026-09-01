'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestWithdrawal(formData: FormData) {
  const amount = Number(formData.get('amount'))
  const token = String(formData.get('token') || 'USDC')
  const walletAddress = String(formData.get('walletAddress') || '').trim()
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, error: 'Enter a valid amount in cents.' }
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return { ok: false, error: 'Enter a valid Celo wallet address.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_amount: amount,
    p_token: token,
    p_wallet_address: walletAddress,
    p_idempotency_key: crypto.randomUUID(),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, withdrawal: data }
}
