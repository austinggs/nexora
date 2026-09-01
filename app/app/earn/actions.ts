'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startOpportunity(opportunityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }

  const { data, error } = await supabase.rpc('start_opportunity', { p_opportunity_id: opportunityId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/earn')
  return { ok: true, completion: data }
}
