import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminIdentity } from '@/lib/admin-auth'

export default async function AdminPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect('/login?mode=user_id&error=admin_auth_required')

  const dataClient = createAdminClient()
  const [{ data: opportunities }, { data: accounts }, { data: withdrawals }] = await Promise.all([
    dataClient.from('opportunities').select('id,title,sponsor_name,reward_amount,token,budget_remaining,status,created_at').order('created_at',{ascending:false}).limit(20),
    dataClient.from('manual_admin_accounts').select('username,role,status').order('created_at',{ascending:false}).limit(100),
    dataClient.from('withdrawals').select('id,amount,token,status,created_at').in('status',['pending','processing']).order('created_at',{ascending:false}).limit(20),
  ])

  const name = identity.full_name ?? identity.username ?? 'Admin'

  return <main className="main" style={{paddingTop:32}}><div className="topbar"><div><div className="eyebrow">Operations</div><h1>NEXORA Admin.</h1><div className="muted" style={{fontSize:12}}>{name} · {identity.role}</div></div><Link className="btn secondary" href="/app">Back</Link></div>
    <div className="stats"><div className="glass stat"><div className="muted">Opportunities</div><div className="value">{opportunities?.length ?? 0}</div></div><div className="glass stat"><div className="muted">Open withdrawals</div><div className="value">{withdrawals?.length ?? 0}</div></div><div className="glass stat"><div className="muted">Manual accounts</div><div className="value">{accounts?.length ?? 0}</div></div></div>
    <div className="grid"><section className="glass section"><div className="section-head"><h3>Opportunity operations</h3><Link className="btn secondary" href="/admin/opportunities">Manage</Link></div>{(opportunities ?? []).slice(0,8).map(o=><div className="opp" key={o.id}><div><strong>{o.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{o.sponsor_name} · {(Number(o.reward_amount)/100).toFixed(2)} {o.token} · budget {(Number(o.budget_remaining)/100).toFixed(2)}</div></div><span className="muted" style={{fontSize:12}}>{o.status}</span></div>)}</section>
    <section className="glass section"><div className="section-head"><h3>Withdrawal queue</h3><Link className="btn" href="/admin/withdrawals">Review</Link></div>{(withdrawals ?? []).slice(0,8).map(w=><div className="opp" key={w.id}><div><strong>{(Number(w.amount)/100).toFixed(2)} {w.token}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>Requested {new Date(w.created_at).toLocaleString()}</div></div><span className="muted">{w.status}</span></div>)}{(withdrawals ?? []).length===0&&<div className="muted">No pending withdrawals.</div>}</section></div>
    <section className="glass section"><div className="section-head"><h3>Manual User ID accounts</h3><Link className="btn secondary" href="/admin/manual-users">Manage access</Link></div>{(accounts ?? []).slice(0,10).map(a=><div className="opp" key={a.username}><div><strong>{a.username}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{a.role}</div></div><span className="muted">{a.status}</span></div>)}</section>
    <div className="notice" style={{marginTop:18}}>Administrative access accepts either a standard Supabase-admin session or a verified NEXORA Managed User ID session. Financial actions remain server-side.</div>
  </main>
}
