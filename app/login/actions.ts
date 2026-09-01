'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function manualAlias(userId: string) {
  const pepper = process.env.MANUAL_AUTH_PEPPER
  if (!pepper || pepper.length < 32) return null
  return crypto.createHash('sha256').update(`${userId.toLowerCase()}:${pepper}`).digest('hex') + '@auth.nexora.internal'
}

export async function login(formData: FormData) {
  const mode = String(formData.get('mode') ?? 'email')
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()

  let email = String(formData.get('email') ?? '').trim()
  if (mode === 'user_id') {
    const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(userId)) redirect('/login?mode=user_id&error=invalid_credentials')
    const alias = manualAlias(userId)
    if (!alias) redirect('/login?mode=user_id&error=server_configuration')
    email = alias
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login${mode === 'user_id' ? '?mode=user_id&' : '?'}error=invalid_credentials`)
  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) redirect('/login?error=signup_failed')
  redirect('/login?success=check_email')
}
