import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Clock3, ShieldCheck } from 'lucide-react'

const opportunities = [
  ['Product feedback sprint','12 min','0.80','Verified sponsor'],
  ['Creator discovery survey','7 min','0.45','Verified sponsor'],
  ['Community onboarding','5 min','0.25','Verified sponsor'],
  ['Mobile UX pulse','10 min','0.65','Verified sponsor'],
]

export default function EarnPage() {
  return <>
    <div className="topbar"><div><div className="eyebrow">Rewards</div><h1>Earn with clarity.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section"><div className="notice"><ShieldCheck size={16} style={{verticalAlign:'middle'}}/> Every opportunity is labeled by verification state. NEXORA never guarantees returns or uses paid randomization.</div><div style={{display:'grid',gap:10,marginTop:18}}>{opportunities.map(([title,time,reward,status]) => <article className="thread" key={title}><div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center'}}><div><div style={{display:'flex',gap:8,alignItems:'center'}}><BadgeCheck size={16} color="var(--accent-2)"/><strong>{title}</strong></div><div className="muted" style={{fontSize:12,marginTop:8}}><Clock3 size={13} style={{verticalAlign:'middle'}}/> {time} · {status}</div></div><div className="reward">+${reward}</div></div><button className="btn" style={{marginTop:14}}>Start opportunity</button></article>)}</div></section>
  </>
}
