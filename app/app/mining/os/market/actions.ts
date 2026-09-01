'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'

export async function convertAsset(formData: FormData) {
  const symbol = String(formData.get('symbol') ?? '').trim().toUpperCase()
  const quantity = Number(formData.get('quantity') ?? 0)
  if (!/^[A-Z0-9]{2,12}$/.test(symbol) || !Number.isFinite(quantity) || quantity <= 0) redirect('/app/mining/os/market?error=invalid')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const quoteId = crypto.randomUUID()
  const { error } = await supabase.rpc('request_mining_asset_to_nxa', {
    p_symbol: symbol,
    p_quantity: quantity,
    p_quote_id: quoteId,
  })
  if (error) redirect(`/app/mining/os/market?error=${encodeURIComponent(error.message)}`)
  redirect('/app/mining/os/market?converted=1')
}
