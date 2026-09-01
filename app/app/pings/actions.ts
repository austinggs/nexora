'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markPingRead(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return
  await supabase.rpc('mark_ping_read',{p_ping_id:id})
  revalidatePath('/app/pings')
}
