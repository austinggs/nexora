import { AppShell } from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name,username,role').eq('id', user.id).maybeSingle()
    : { data: null }

  const displayName = profile?.full_name?.trim() || profile?.username?.trim() || 'Nexorian'
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'NX'

  return (
    <AppShell
      identity={user ? {
        displayName,
        username: profile?.username ?? null,
        initials,
        verified: Boolean(profile?.role && profile.role !== 'user'),
      } : null}
    >
      {children}
    </AppShell>
  )
}
