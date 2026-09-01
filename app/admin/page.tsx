import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getManualSession } from '@/lib/manual-session'

const ADMIN_ROLES = ['admin','super_admin','finance_admin','content_manager','moderator','support','analyst']

export default async function AdminPage() {
  const supabase = await createClient()
  const manual = await getManualSession()
  const { data: { user } } = await supabase.auth.getUser()

  let identity: { name: string; role: string } | null = null
  let dataClient = supabase
  if (manual) {
    if (!['admin','super_admin'].includes(manual.role)) redirect('/login?error=invalid_manual_credentials')
    identity = { name: manual.username, role: manual.role }
    dataClient = createAdminClient()
  } else {
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role,full_name,username').eq('id', user.id).maybeSingle()
    if (!profile?.role || !ADMIN_ROLES.includes(profile.role)) return <main className="section"><div className="glass section"><div className="eyebrow">Restricted</div><h1>Admin access required.</h1><p className="muted">Your account does not have an operational admin role.</p><Link className="btn" href="/app">Back to NEXORA</Link></div></main>
    identity = { name: profile.full_name ?? profile.username ?? user.email ?? 'Admin', role: profile.role }
  }

  const [{ data: opportunities }, { data: accounts }] = await Promise.all([
    dataClient.from('opportunities').select('id,title,sponsor_name,reward_amount,token,budget_remaining,status,created_at').order('created_at',{ascending:false}).limit(20),
    dataClient.from('manual_admin_accounts').select('username,role,status').order('created_at',{ascending:false}).limit(100),
  ])

  return <main className="main" style={{paddingTop:32}}><div className="topbar"><div><div className="eyebrow">Operations</div><h1>NEXORA Admin.</h1><div className="muted" style={{fontSize:12}}>{identity.name} · {identity.role}</div></div><Link className="btn secondary" href={manual ? '/login' : '/app'}>{manual ? 'Sign out' : 'Back'}</Link></div>
    <div className="stats"><div className="glass stat"><div className="muted">Opportunities</div><div className="value">{opportunities?.length ?? 0}</div></div><div className="glass stat"><div className="muted">Manual accounts</div><div className="value">{accounts?.length ?? 0}</div></div><div className="glass stat"><div className="muted">Admin role</div><div className="value" style={{fontSize:18,textTransform:'capitalize'}}>{identity.role.replaceAll('_',' ')}</div></div></div>
    <div className="grid"><section className="glass section"><div className="section-head"><h3>Opportunity operations</h3><Link className="btn secondary" href="/admin/opportunities">Manage</Link></div>{(opportunities ?? []).slice(0,8).map(o=><div className="opp" key={o.id}><div><strong>{o.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{o.sponsor_name} · {(Number(o.reward_amount)/100).toFixed(2)} {o.token} · budget {(Number(o.budget_remaining)/100).toFixed(2)}</div></div><span className="muted" style={{fontSize:12}}>{o.status}</span></div>)}</section>
    <section className="glass section"><div className="section-head"><h3>Manual User ID accounts</h3><Link className="btn" href="/admin/manual-users">Manage access</Link></div>{(accounts ?? []).slice(0,8).map(a=><div className="opp" key={a.username}><div><strong>{a.username}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{a.role}</div></div><span className="muted">{a.status}</span></div>)}</section></div>
    {manual && <div className="notice" style={{marginTop:18}}>You are signed in through the database-only Manual User ID administrator path.</div>}
  </main>
}
