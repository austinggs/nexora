'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function operateRig(formData: FormData) {
  const action = String(formData.get('action') ?? '')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }
  const { error } = await supabase.rpc('operate_my_rig', { p_action: action })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  revalidatePath('/app')
  return { ok: true }
}

export async function createRig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }
  const { error } = await supabase.rpc('create_my_rig')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  return { ok: true }
}
