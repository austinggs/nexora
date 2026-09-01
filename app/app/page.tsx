import Link from 'next/link'
import { ArrowUpRight, Flame, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import { TopActions } from '@/components/app-shell'

const threads = [
  { name: 'Amina', tag: 'Creator economy', title: 'What actually makes a reward opportunity trustworthy?', copy: 'I built a simple checklist around sponsor identity, budget transparency, verification and payout proof.', meta: '18 replies · 42 reactions' },
  { name: 'Kofi', tag: 'PC builders', title: 'My first Crystal Caverns rig is finally stable', copy: 'Swapped the cooler, reduced overclock bias and got heat under control without sacrificing too much hash rate.', meta: '9 replies · 31 reactions' },
]

const opportunities = [
  { title: 'Product feedback sprint', detail: '12 min · Verified sponsor', reward: '+$0.80' },
  { title: 'Creator discovery survey', detail: '7 min · Verified sponsor', reward: '+$0.45' },
  { title: 'Community onboarding', detail: '5 min · Verified sponsor', reward: '+$0.25' },
]

export default function DashboardPage() {
  return (
    <>
      <header className="topbar"><div><div className="eyebrow">Tuesday · September 1</div><h1>Good morning, Nexorian.</h1></div><TopActions /></header>
      <section className="glass hero">
        <div>
          <div className="eyebrow">Trust-first discovery</div>
          <h2>One place to discover, earn and build.</h2>
          <p>NEXORA connects thoughtful community conversations with verified opportunities and a virtual mining game. Rewards are transparent, wallet activity is ledger-based, and game state stays server-authoritative.</p>
          <div className="hero-actions"><Link className="btn" href="/app/earn">Explore opportunities <ArrowUpRight size={16} style={{verticalAlign:'middle'}} /></Link><Link className="btn secondary" href="/app/mining">Open mining rig</Link></div>
        </div>
        <div className="glass" style={{padding:20,alignSelf:'stretch',position:'relative',zIndex:1}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><span className="muted">Trust score</span><ShieldCheck size={19} color="var(--accent-2)" /></div>
          <div style={{fontSize:48,fontWeight:800,letterSpacing:'-.06em',marginTop:14}}>92</div>
          <div className="meter"><span style={{width:'92%'}} /></div>
          <p className="muted" style={{fontSize:12,lineHeight:1.6}}>Built from verified activity, successful payouts, feedback and healthy community behavior.</p>
        </div>
      </section>

      <section className="stats">
        <div className="glass stat"><div className="muted">Available balance</div><div className="value">$12.48</div><div className="muted" style={{fontSize:11}}>USDC · ledger-backed</div></div>
        <div className="glass stat"><div className="muted">This month</div><div className="value">$38.20</div><div className="muted" style={{fontSize:11}}>verified rewards</div></div>
        <div className="glass stat"><div className="muted">Mining rate</div><div className="value">1.18 MH/s</div><div className="muted" style={{fontSize:11}}>heat 42%</div></div>
      </section>

      <div className="grid">
        <section className="glass section"><div className="section-head"><h3>For you</h3><Link className="muted" href="/app/explore" style={{fontSize:12}}>See all</Link></div><div className="feed">{threads.map((thread) => <article className="thread" key={thread.title}><div className="thread-head"><div className="avatar">{thread.name.slice(0,2).toUpperCase()}</div><div><strong style={{fontSize:13}}>{thread.name}</strong><div className="muted" style={{fontSize:11}}>{thread.tag}</div></div></div><div className="thread-title">{thread.title}</div><div className="thread-copy">{thread.copy}</div><div className="thread-meta"><span>{thread.meta}</span><span>Verified</span></div></article>)}</div></section>
        <div>
          <section className="glass section"><div className="section-head"><h3>Verified opportunities</h3><Link className="muted" href="/app/earn" style={{fontSize:12}}>View all</Link></div>{opportunities.map((item) => <div className="opp" key={item.title}><div><strong style={{fontSize:13}}>{item.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{item.detail}</div></div><div className="reward">{item.reward}</div></div>)}</section>
          <section className="glass mining-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div className="eyebrow">Mining online</div><h3 style={{margin:'6px 0 0'}}>Crystal Caverns</h3></div><Flame size={20} color="var(--accent-2)" /></div><div className="mining-grid"><div className="mining-stat"><div className="muted" style={{fontSize:11}}>Hash rate</div><strong>1.18 MH/s</strong></div><div className="mining-stat"><div className="muted" style={{fontSize:11}}>Pending Dust</div><strong>428.6</strong></div></div><div style={{display:'flex',gap:8,marginTop:16,alignItems:'center',fontSize:12}}><Zap size={15}/><span className="muted">Thermals stable · next tick in 50ms</span></div></section>
        </div>
      </div>
      <div style={{display:'flex',gap:18,marginTop:18,flexWrap:'wrap'}}><span className="muted" style={{fontSize:11}}><Users size={13} style={{verticalAlign:'middle'}}/> 1,248 active builders</span><span className="muted" style={{fontSize:11}}><Sparkles size={13} style={{verticalAlign:'middle'}}/> 84 verified opportunities today</span></div>
    </>
  )
}
