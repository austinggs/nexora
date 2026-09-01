import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Admin notifications</h1><Link className="btn" href="/login">Sign in</Link></main>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
  if (!['admin','super_admin','support','content_manager'].includes(profile?.role ?? '')) return <main className="section"><h1>Forbidden</h1><p className="muted">You do not have permission to manage system notifications.</p></main>
  return <main className="section">
    <div className="topbar"><div><div className="eyebrow">Restricted</div><h1>System notifications.</h1></div><Link className="btn secondary" href="/admin">Back to admin</Link></div>
    <section className="glass section"><form action="/api/admin/notifications" method="post" style={{display:'grid',gap:12}}><label>Title<input name="title" required maxLength={140}/></label><label>Message<textarea name="body" required maxLength={2000} rows={6}/></label><label>Deep link (optional)<input name="deep_link" maxLength={300}/></label><button className="btn" type="submit">Send system notification</button></form></section>
  </main>
}
