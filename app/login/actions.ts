'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MANUAL_ADMIN_ROLES = ['admin', 'super_admin']

function manualAlias(userId: string) {
  const pepper = process.env.MANUAL_AUTH_PEPPER
  if (!pepper || pepper.length < 32) return null
  return crypto.createHash('sha256').update(`${userId.toLowerCase()}:${pepper}`).digest('hex') + '@auth.nexora.internal'
}

async function loginManualAdmin(userId: string, password: string) {
  const admin = createAdminClient()
  const { data: accounts, error: verifyError } = await admin.rpc('verify_manual_admin_login', {
    p_username: userId,
    p_password: password,
  })

  if (verifyError || !accounts?.length) redirect('/login?mode=user_id&error=invalid_credentials')

  const account = accounts[0] as { account_id: string; username: string; role: string }
  if (!MANUAL_ADMIN_ROLES.includes(account.role)) redirect('/login?mode=user_id&error=invalid_credentials')

  const email = manualAlias(account.username)
  if (!email) redirect('/login?mode=user_id&error=server_configuration')

  // The manual account is the credential authority. Supabase Auth is the
  // session authority. Never create a session until the manual credential
  // has been verified against the database.
  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) redirect('/login?mode=user_id&error=server_configuration')

  let authUser = users.users.find((user) => user.email === email)

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: account.username,
        role: account.role,
        auth_source: 'manual_admin_account',
        manual_account_id: account.account_id,
      },
    })
    if (error || !data.user) redirect('/login?mode=user_id&error=server_configuration')
    authUser = data.user
  } else {
    const { error } = await admin.auth.admin.updateUserById(authUser.id, {
      password,
      user_metadata: {
        ...authUser.user_metadata,
        username: account.username,
        role: account.role,
        auth_source: 'manual_admin_account',
        manual_account_id: account.account_id,
      },
    })
    if (error) redirect('/login?mode=user_id&error=server_configuration')
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ username: account.username, role: account.role, full_name: account.username })
    .eq('id', authUser.id)

  if (profileError) redirect('/login?mode=user_id&error=server_configuration')

  await admin
    .from('manual_admin_accounts')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', account.account_id)

  // Use the regular Supabase browser/session flow so middleware, RLS and
  // server-side authorization all see the same authenticated user.
  const supabase = await createClient()
  const { error: sessionError } = await supabase.auth.signInWithPassword({ email, password })
  if (sessionError) redirect('/login?mode=user_id&error=invalid_credentials')

  revalidatePath('/', 'layout')
  redirect('/app')
}

export async function login(formData: FormData) {
  const mode = String(formData.get('mode') ?? 'email')
  const password = String(formData.get('password') ?? '')

  if (mode === 'user_id') {
    const userId = String(formData.get('userId') ?? '').trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]{3,31}$/.test(userId) || password.length < 8 || password.length > 72) {
      redirect('/login?mode=user_id&error=invalid_credentials')
    }
    await loginManualAdmin(userId, password)
  }

  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=invalid_credentials')
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
