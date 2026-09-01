import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createManualUser } from './actions'

export default async function ManualUsersPage({ searchParams }: { searchParams?: Promise<Record<string,string|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !['admin','super_admin'].includes(profile.role)) redirect('/admin?error=unauthorized')

  const { data: accounts } = await supabase.from('manual_admin_accounts').select('username,role,status,created_at,last_login_at').order('created_at',{ascending:false}).limit(100)
  return <main className="main" style={{paddingTop:32}}>
    <div className="topbar"><div><div className="eyebrow">Admin / Access</div><h1>Manual user accounts.</h1><div className="muted">Provision a NEXORA User ID and password for administrator-managed access.</div></div><Link className="btn secondary" href="/admin">Back</Link></div>
    {params.created && <div className="notice" style={{marginBottom:16}}>Created manual account: <strong>{params.created}</strong></div>}
    {params.error && <div className="error" style={{marginBottom:16}}>Could not create account: {params.error}</div>}
    <section className="glass section"><div className="section-head"><h3>Create account</h3><span className="muted">Admin only</span></div><form action={createManualUser} style={{display:'grid',gap:10,maxWidth:520}}><label className="field"><span>User ID</span><input name="userId" required minLength={4} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9._-]{3,31}" placeholder="e.g. user_2048" autoComplete="off"/><small className="muted">4–32 characters: letters, numbers, dot, underscore and hyphen.</small></label><label className="field"><span>Password</span><input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password"/><small className="muted">Stored only as a one-way hash. Never shown back to administrators.</small></label><label className="field"><span>Account role</span><select name="role" defaultValue="user"><option value="user">User</option><option value="support">Support</option><option value="moderator">Moderator</option></select></label><button className="btn" type="submit">Create manual account</button></form></section>
    <section className="glass section" style={{marginTop:18}}><div className="section-head"><h3>Existing manual accounts</h3><span className="muted">{accounts?.length ?? 0}</span></div>{(accounts??[]).map(a=><div className="opp" key={a.username}><div><strong>{a.username}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{a.role} · created {new Date(a.created_at).toLocaleString()}{a.last_login_at ? ` · last login ${new Date(a.last_login_at).toLocaleString()}` : ''}</div></div><span className="muted">{a.status}</span></div>)}</section>
  </main>
}
