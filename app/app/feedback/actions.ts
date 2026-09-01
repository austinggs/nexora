'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitFeedback(formData: FormData) {
  const targetType = String(formData.get('targetType') ?? '').trim().slice(0,120)
  const rating = Number(formData.get('rating') ?? 0)
  const body = String(formData.get('body') ?? '').trim().slice(0,2000)
  if (!targetType) return { ok:false, error:'Target is required.' }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok:false, error:'Rating must be 1-5.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok:false, error:'Please sign in.' }
  const { error } = await supabase.from('feedback').insert({ user_id:user.id, target_type:targetType, rating, body:body || null })
  if (error) return { ok:false, error:error.message }
  revalidatePath('/app/feedback')
  return { ok:true }
}
