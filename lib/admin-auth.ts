import { createClient } from '@/lib/supabase/server'
import { getManualSession } from '@/lib/manual-session'

type AdminIdentity = {
  id: string
  username?: string | null
  full_name?: string | null
  role: string
  source: 'supabase' | 'manual'
}

const ADMIN_ROLES = ['admin','super_admin','finance_admin','content_manager','moderator','support','analyst'] as const

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const manual = await getManualSession()
  if (manual && ADMIN_ROLES.includes(manual.role as (typeof ADMIN_ROLES)[number])) {
    return { id: manual.id, username: manual.username, role: manual.role, source: 'manual' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('full_name,username,role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !ADMIN_ROLES.includes(profile.role as (typeof ADMIN_ROLES)[number])) return null
  return { id: user.id, username: profile.username, full_name: profile.full_name, role: profile.role, source: 'supabase' }
}

export async function requireAdminIdentity(roles?: string[]) {
  const identity = await getAdminIdentity()
  if (!identity) throw new Error('Admin authentication required.')
  if (roles && !roles.includes(identity.role)) throw new Error('Not authorized.')
  return identity
}
