'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setManualSession } from '@/lib/manual-session'

export async function manualLogin(formData: FormData) {
  const supabase = await createClient()
  const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!/^[a-z0-9][a-z0-9._@-]{3,63}$/.test(userId) || password.length < 8) {
    redirect('/login?mode=user_id&error=invalid_manual_credentials')
  }

  const { data, error } = await supabase.rpc('verify_manual_admin_login', {
    p_username: userId,
    p_password: password,
  })
  const account = Array.isArray(data) ? data[0] : data

  if (error || !account?.account_id || account.status !== 'active') {
    redirect('/login?mode=user_id&error=invalid_manual_credentials')
  }

  await setManualSession(String(account.account_id))
  revalidatePath('/', 'layout')
  redirect(account.role === 'admin' || account.role === 'super_admin' || account.role === 'finance_admin' || account.role === 'content_manager' || account.role === 'moderator' || account.role === 'support' || account.role === 'analyst' ? '/admin' : '/app')
}
