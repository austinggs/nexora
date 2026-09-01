'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function purchaseHardware(formData: FormData) {
  const hardwareId = String(formData.get('hardware_id') ?? '').trim()
  const quantity = Number(formData.get('quantity') ?? 0)
  const currency = String(formData.get('currency') ?? '').trim().toUpperCase()
  const expectedUnitPrice = Number(formData.get('expected_unit_price') ?? 0)
  const confirmed = formData.get('confirmed') === 'true'

  if (!hardwareId || !Number.isInteger(quantity) || quantity < 1 || quantity > 64 || !Number.isSafeInteger(expectedUnitPrice) || expectedUnitPrice <= 0 || !confirmed || !['NXA', 'NEXORA'].includes(currency)) {
    redirect('/app/mining/os/store?error=confirmation-required')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const quoteId = crypto.randomUUID()
  if (currency === 'NEXORA') {
    const { data, error } = await supabase.rpc('purchase_hardware_with_nexa_balance', {
      p_hardware_id: hardwareId,
      p_quantity: quantity,
      p_quote_id: quoteId,
      p_expected_unit_price: expectedUnitPrice,
    })
    if (error) redirect(`/app/mining/os/store?error=${encodeURIComponent(error.message)}`)
    redirect(`/app/mining/os/store?purchased=${encodeURIComponent(String((data as { order_id?: string })?.order_id ?? ''))}`)
  }

  const expiresAt = new Date(Date.now() + 60_000).toISOString()
  const { data, error } = await supabase.rpc('confirm_nxa_hardware_purchase', {
    p_hardware_id: hardwareId,
    p_quantity: quantity,
    p_quote_expires_at: expiresAt,
    p_idempotency_key: quoteId,
  })
  if (error) redirect(`/app/mining/os/store?error=${encodeURIComponent(error.message)}`)
  redirect(`/app/mining/os/store?purchased=${encodeURIComponent(String(data ?? ''))}`)
}
