'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeOpportunity(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const dwellSeconds = Number(formData.get('dwellSeconds') ?? 0)
  if (!opportunityId) return { ok: false, error: 'Missing opportunity.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { data, error } = await supabase.rpc('complete_opportunity', {
    p_opportunity_id: opportunityId,
    p_verification_data: { dwell_seconds: Number.isFinite(dwellSeconds) ? Math.max(0, Math.floor(dwellSeconds)) : 0 },
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/earn')
  revalidatePath('/app/wallet')
  return { ok: true, completion: data }
}
