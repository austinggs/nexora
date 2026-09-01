import Link from 'next/link'
import { BadgeCheck, Clock3, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OpportunityActions } from './OpportunityActions'

export default async function EarnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: opportunities } = await supabase.from('opportunities').select('id,title,description,reward_amount,duration_minutes,sponsor_name,verification_required').eq('status','active').order('created_at',{ascending:false})
  const { data: completions } = user ? await supabase.from('opportunity_completions').select('opportunity_id,status').eq('user_id',user.id) : { data: [] as {opportunity_id:string,status:string}[] }
  const completionMap = new Map((completions ?? []).map(c => [c.opportunity_id, c.status]))

  return <>
    <div className="topbar"><div><div className="eyebrow">Rewards</div><h1>Earn with clarity.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section"><div className="notice"><ShieldCheck size={16} style={{verticalAlign:'middle'}}/> Verification and rewards are server-authoritative. Your browser cannot mint or credit funds.</div><div style={{display:'grid',gap:10,marginTop:18}}>
      {(opportunities ?? []).map((item) => { const status = completionMap.get(item.id); const requiredSeconds = Math.max(5, Math.floor(item.duration_minutes * 60 / 2)); return <article className="thread" key={item.id}><div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center'}}><div><div style={{display:'flex',gap:8,alignItems:'center'}}><BadgeCheck size={16} color="var(--accent-2)"/><strong>{item.title}</strong></div><div className="muted" style={{fontSize:12,marginTop:8}}><Clock3 size={13} style={{verticalAlign:'middle'}}/> {item.duration_minutes} min · {item.sponsor_name} · {item.verification_required ? `Verification: ${requiredSeconds}s minimum dwell` : 'Standard'}</div></div><div className="reward">+${(Number(item.reward_amount)/100).toFixed(2)}</div></div><p className="thread-copy">{item.description}</p>{user ? <OpportunityActions opportunityId={item.id} status={status} requiredSeconds={requiredSeconds} /> : <Link className="btn" href="/login" style={{display:'inline-flex',marginTop:6}}>Sign in to start</Link>}</article> })}
      {(opportunities ?? []).length === 0 && <div className="muted">No verified opportunities are active right now.</div>}
    </div></section>
  </>
}
