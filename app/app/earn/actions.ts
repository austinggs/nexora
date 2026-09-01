'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function startOpportunity(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  if (!opportunityId) return { ok: false, error: 'Missing opportunity.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { data, error } = await supabase.rpc('start_opportunity', { p_opportunity_id: opportunityId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/earn')
  return { ok: true, completion: data }
}
