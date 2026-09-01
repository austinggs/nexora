'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setManualSession } from '@/lib/manual-session'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 8) redirect('/login?error=invalid_credentials')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=invalid_credentials')
  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function manualLogin(formData: FormData) {
  const supabase = await createClient()
  const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(userId) || password.length < 8) redirect('/login?error=invalid_manual_credentials')
  const { data, error } = await supabase.rpc('verify_manual_admin_login', { p_username: userId, p_password: password })
  const account = Array.isArray(data) ? data[0] : data
  if (error || !account?.account_id) redirect('/login?error=invalid_manual_credentials')
  await setManualSession(String(account.account_id))
  revalidatePath('/', 'layout')
  redirect(account.role === 'admin' || account.role === 'super_admin' ? '/admin' : '/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 8) redirect('/signup?error=invalid_signup')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) redirect('/signup?error=signup_failed')
  redirect('/signup?success=check_email')
}
