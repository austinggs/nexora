'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ROLES = ['admin','super_admin']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !ADMIN_ROLES.includes(profile.role)) redirect('/admin?error=unauthorized')
  return supabase
}

export async function createManualUser(formData: FormData) {
  const supabase = await requireAdmin()
  const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'user').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(userId)) redirect('/admin/manual-users?error=invalid_user_id')
  if (password.length < 8 || password.length > 72) redirect('/admin/manual-users?error=invalid_password')
  if (!['user','support','moderator'].includes(role)) redirect('/admin/manual-users?error=invalid_role')
  const { error } = await supabase.rpc('admin_create_manual_account', { p_user_id: userId, p_password: password, p_role: role })
  if (error) redirect(`/admin/manual-users?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/manual-users')
  redirect(`/admin/manual-users?created=${encodeURIComponent(userId)}`)
}
