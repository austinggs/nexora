import 'server-only'

import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Server authentication is not configured')
  return createSupabaseClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
}

function manualAlias(userId: string) {
  const secret = process.env.MANUAL_SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('Manual authentication is not configured')
  return `${crypto.createHmac('sha256', secret).update(userId.toLowerCase()).digest('hex')}@auth.nexora.internal`
}

export async function authenticateManualAdmin(userId: string, password: string) {
  const supabase = adminClient()
  const normalized = userId.trim().toLowerCase()
  const { data: account, error } = await supabase
    .from('manual_admin_accounts')
    .select('username,password_hash,role')
    .eq('username', normalized)
    .maybeSingle()

  if (error || !account || account.role !== 'admin') return null
  const valid = await bcrypt.compare(password, account.password_hash)
  if (!valid) return null

  const email = manualAlias(normalized)
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  const existing = users.users.find((u) => u.email === email)

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { manual_user_id: normalized, auth_type: 'manual_admin' },
      app_metadata: { role: 'admin', auth_type: 'manual_admin' },
    })
    if (updateError) throw updateError
  } else {
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { manual_user_id: normalized, auth_type: 'manual_admin' },
      app_metadata: { role: 'admin', auth_type: 'manual_admin' },
    })
    if (createError) throw createError
  }

  return { email, userId: normalized }
}
