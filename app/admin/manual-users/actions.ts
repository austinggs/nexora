'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_ROLES = ['admin','super_admin']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !ADMIN_ROLES.includes(profile.role)) redirect('/admin?error=unauthorized')
  return user
}

export async function createManualUser(formData: FormData) {
  const adminUser = await requireAdmin()
  const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()

  if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(userId)) redirect('/admin/manual-users?error=invalid_user_id')
  if (password.length < 10 || password.length > 72) redirect('/admin/manual-users?error=invalid_password')

  const pepper = process.env.MANUAL_AUTH_PEPPER
  if (!pepper || pepper.length < 32) redirect('/admin/manual-users?error=missing_server_secret')

  const supabase = createClient()
  const { data: existing } = await supabase.from('manual_login_accounts').select('id').eq('user_id', userId).maybeSingle()
  if (existing) redirect('/admin/manual-users?error=user_id_taken')

  const alias = crypto.createHash('sha256').update(`${userId}:${pepper}`).digest('hex') + '@auth.nexora.internal'
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: alias,
    password,
    email_confirm: true,
    user_metadata: { login_method: 'manual_user_id', nexora_user_id: userId, provisioned_by: adminUser.id },
  })
  if (createError || !created.user) redirect(`/admin/manual-users?error=${encodeURIComponent(createError?.message ?? 'create_failed')}`)

  const { error: insertError } = await supabase.from('manual_login_accounts').insert({
    user_id: userId,
    auth_user_id: created.user.id,
    status: 'active',
    created_by: adminUser.id,
  })
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id)
    redirect(`/admin/manual-users?error=${encodeURIComponent(insertError.message)}`)
  }

  if (fullName) await admin.from('profiles').update({ full_name: fullName }).eq('id', created.user.id)
  revalidatePath('/admin/manual-users')
  redirect(`/admin/manual-users?created=${encodeURIComponent(userId)}`)
}
