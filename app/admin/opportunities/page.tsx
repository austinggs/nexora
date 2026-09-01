import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminIdentity } from '@/lib/admin-auth'
import { setOpportunityStatus, createOpportunity } from './actions'

const STATUSES = ['draft', 'active', 'paused', 'completed', 'expired']

export default async function AdminOpportunitiesPage() {
  const identity = await getAdminIdentity()
  if (!identity) return <main className="section"><div className="glass section"><h1>Restricted.</h1><Link className="btn" href="/login?mode=user_id">Sign in</Link></div></main>
  if (!['admin', 'super_admin', 'content_manager'].includes(identity.role)) return <main className="section"><div className="glass section"><h1>Restricted.</h1><Link className="btn" href="/app">Back</Link></div></main>

  const db = createAdminClient()
  const { data: opps, error } = await db.from('opportunities').select('id,title,sponsor_name,description,reward_amount,token,duration_minutes,budget_remaining,status,created_at').order('created_at', { ascending: false })

  return <main className="main" style={{ paddingTop: 32 }}>
    <div className="topbar"><div><div className="eyebrow">Admin · Rewards</div><h1>Opportunity management.</h1><div className="muted" style={{fontSize:12}}>{identity.username ?? identity.full_name ?? 'Administrator'}</div></div><Link className="btn secondary" href="/admin">Back</Link></div>
    {error && <div className="error" style={{ marginBottom: 16 }}>Unable to load opportunities.</div>}
    <section className="glass section">
      <div className="section-head"><h3>Create opportunity</h3><span className="muted">Starts as draft</span></div>
      <form action={createOpportunity} style={{ display: 'grid', gap: 10 }}>
        <input className="input" name="sponsorName" placeholder="Sponsor name" required maxLength={120} />
        <input className="input" name="title" placeholder="Title" required maxLength={160} />
        <textarea className="input" name="description" placeholder="Description" required maxLength={5000} />
        <div className="grid"><label className="field"><span>Reward (minor units)</span><input className="input" name="rewardAmount" type="number" min="1" step="1" required /></label><label className="field"><span>Budget (minor units)</span><input className="input" name="budgetRemaining" type="number" min="1" step="1" required /></label></div>
        <div className="grid"><label className="field"><span>Token</span><select className="input" name="token" defaultValue="USDC"><option>USDC</option><option>USDT</option><option>USDM</option></select></label><label className="field"><span>Verification duration (minutes)</span><input className="input" name="durationMinutes" type="number" min="1" max="1440" defaultValue="5" required /></label></div>
        <button className="btn" type="submit">Create draft</button>
      </form>
    </section>
    <section className="glass section" style={{ marginTop: 18 }}>
      <div className="section-head"><h3>Existing opportunities</h3><span className="muted">{opps?.length ?? 0} total</span></div>
      <div style={{ display: 'grid', gap: 10 }}>{(opps ?? []).map(o => <article className="opp" key={o.id}><div style={{ minWidth: 0, flex: 1 }}><strong>{o.title}</strong><div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{o.sponsor_name} · {(Number(o.reward_amount) / 100).toFixed(2)} {o.token} · budget {(Number(o.budget_remaining) / 100).toFixed(2)}</div><div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{o.duration_minutes} min verification · created {new Date(o.created_at).toLocaleString()}</div></div><form action={setOpportunityStatus} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}><input type="hidden" name="opportunityId" value={o.id} /><select className="input" name="status" defaultValue={o.status}>{STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select><button className="btn secondary" type="submit">Save</button></form></article>)}{(opps ?? []).length === 0 && <div className="muted">No opportunities have been created.</div>}</div>
    </section>
  </main>
}
