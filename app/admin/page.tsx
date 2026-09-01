import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role,full_name,username').eq('id', user.id).maybeSingle()
  if (!profile?.role || !['admin','super_admin','finance_admin','content_manager','moderator','support','analyst'].includes(profile.role)) {
    return <main className="section"><div className="glass section"><div className="eyebrow">Restricted</div><h1>Admin access required.</h1><p className="muted">Your account does not have an operational admin role.</p><Link className="btn" href="/app">Back to NEXORA</Link></div></main>
  }

  const [{ data: opportunities }, { data: withdrawals }] = await Promise.all([
    supabase.from('opportunities').select('id,title,sponsor_name,reward_amount,token,budget_remaining,status,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.rpc('admin_list_withdrawals',{p_status:null}),
  ])

  return <main className="main" style={{paddingTop:32}}><div className="topbar"><div><div className="eyebrow">Operations</div><h1>NEXORA Admin.</h1><div className="muted" style={{fontSize:12}}>{profile.full_name ?? profile.username ?? user.email} · {profile.role}</div></div><Link className="btn secondary" href="/app">Back</Link></div>
    <div className="stats"><div className="glass stat"><div className="muted">Opportunities</div><div className="value">{opportunities?.length ?? 0}</div></div><div className="glass stat"><div className="muted">Withdrawal queue</div><div className="value">{withdrawals?.filter(w => w.status==='pending' || w.status==='processing').length ?? 0}</div></div><div className="glass stat"><div className="muted">Admin role</div><div className="value" style={{fontSize:18,textTransform:'capitalize'}}>{profile.role.replaceAll('_',' ')}</div></div></div>
    <div className="grid"><section className="glass section"><div className="section-head"><h3>Opportunity operations</h3><Link className="btn secondary" href="/admin/opportunities">Manage</Link></div>{(opportunities ?? []).slice(0,8).map(o=><div className="opp" key={o.id}><div><strong>{o.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{o.sponsor_name} · {(Number(o.reward_amount)/100).toFixed(2)} {o.token} · budget {(Number(o.budget_remaining)/100).toFixed(2)}</div></div><span className="muted" style={{fontSize:12}}>{o.status}</span></div>)}</section>
    <section className="glass section"><div className="section-head"><h3>Withdrawals</h3><Link className="btn secondary" href="/admin/withdrawals">Review</Link></div>{(withdrawals ?? []).slice(0,8).map(w=><div className="opp" key={w.id}><div><strong>{(Number(w.amount)/100).toFixed(2)} {w.token}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>user {w.user_id.slice(0,8)}… · {w.wallet_address.slice(0,10)}…</div></div><span className="muted" style={{fontSize:12}}>{w.status}</span></div>)}{(withdrawals ?? []).length===0&&<div className="muted">No withdrawals yet.</div>}</section></div>
  </main>
}
