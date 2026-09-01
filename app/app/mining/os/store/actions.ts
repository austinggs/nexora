'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function purchaseWithNexoraBalance(formData: FormData) {
  const hardwareId = String(formData.get('hardware_id') ?? '').trim()
  const quantity = Number(formData.get('quantity') ?? 0)
  const expectedUnitPrice = Number(formData.get('expected_unit_price') ?? 0)
  const confirmed = formData.get('confirmed') === 'true'

  if (!hardwareId || !Number.isInteger(quantity) || quantity < 1 || quantity > 64 || !Number.isSafeInteger(expectedUnitPrice) || expectedUnitPrice <= 0 || !confirmed) {
    redirect('/app/mining/os/store?error=confirmation-required')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const quoteId = crypto.randomUUID()
  const { data, error } = await supabase.rpc('purchase_hardware_with_nexa_balance', {
    p_hardware_id: hardwareId,
    p_quantity: quantity,
    p_quote_id: quoteId,
    p_expected_unit_price: expectedUnitPrice,
  })
  if (error) redirect(`/app/mining/os/store?error=${encodeURIComponent(error.message)}`)
  redirect(`/app/mining/os/store?purchased=${encodeURIComponent(String((data as any)?.order_id ?? ''))}`)
}
