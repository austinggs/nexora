import Link from 'next/link'
import { Gift, ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Referrals</div><h1>Grow the network.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase.from('profiles').select('trust_score,username').eq('id',user.id).maybeSingle(),
    supabase.from('referrals').select('id,referral_code,status,reward_amount,reward_token,created_at').eq('referrer_id',user.id).order('created_at',{ascending:false}).limit(20),
  ])

  return <>
    <div className="topbar"><div><div className="eyebrow">Trust & referrals</div><h1>Build trusted reach.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <div className="stats"><div className="glass stat"><div className="muted">Trust score</div><div className="value">{profile?.trust_score ?? 0}</div><div className="muted" style={{fontSize:11}}>server-calculated</div></div><div className="glass stat"><div className="muted">Referrals</div><div className="value">{referrals?.length ?? 0}</div><div className="muted" style={{fontSize:11}}>tracked invitations</div></div></div>
    <section className="glass section"><div className="section-head"><h3>Referral activity</h3><span className="muted"><Users size={14}/> tracked by NEXORA</span></div>{(referrals ?? []).map(r => <div className="opp" key={r.id}><div><strong>{r.referral_code}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{r.status} · {r.reward_token}{r.reward_amount ? ` · ${(Number(r.reward_amount)/100).toFixed(2)}` : ''}</div></div><span className="badge"><ShieldCheck size={12}/> Trust-led</span></div>)}{(referrals ?? []).length===0 && <div className="muted">No referrals yet. Referral rewards are tracked in the server ledger.</div>}</section>
    <section className="glass section"><div className="section-head"><h3>Trust principles</h3><Gift size={16}/></div><p className="thread-copy">NEXORA rewards useful participation and protects the community with transparent referral states, moderation, and auditable reward entries.</p></section>
  </>
}
