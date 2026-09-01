'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Cpu, Fan, Flame, Gauge, Shield, Sparkles } from 'lucide-react'

export default function MiningPage() {
  const [overclock, setOverclock] = useState(false)
  const [heat, setHeat] = useState(42)
  const hash = useMemo(() => Math.floor(1180000 * (overclock ? 1.32 : 1)), [overclock])
  const cool = () => setHeat((v) => Math.max(18, v - 12))
  return <>
    <div className="topbar"><div><div className="eyebrow">Mining game</div><h1>Crystal Caverns rig.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass mining-card" style={{marginTop:0}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div className="eyebrow">Server-authoritative simulation</div><h2 style={{margin:'7px 0'}}>NEX-01 · Stable build</h2><div className="muted" style={{fontSize:13}}>NVIDIA RTX 5090 · Core i9-14900K · DDR5 · AIO</div></div><Gauge size={28}/></div>
      <div className="stats"><div className="mining-stat"><div className="muted">Hash rate</div><div className="value">{(hash/1000000).toFixed(2)} MH/s</div></div><div className="mining-stat"><div className="muted">Thermal</div><div className="value">{heat}%</div></div><div className="mining-stat"><div className="muted">Biome multiplier</div><div className="value">0.90×</div></div></div>
      <div className="meter"><span style={{width:`${heat}%`}} /></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}><button className="btn" onClick={() => setOverclock((v) => !v)}>{overclock ? 'Disable overclock' : 'Overclock +32%'}</button><button className="btn secondary" onClick={cool}><Fan size={15} style={{verticalAlign:'middle'}}/> Cool rig</button></div>
    </section>
    <div className="grid" style={{marginTop:18}}><section className="glass section"><div className="section-head"><h3>Hardware</h3><Cpu size={17}/></div>{[['GPU','RTX 5090','1.20 MH/s'],['CPU','Core i9-14900K','1.10× compatibility'],['Cooling','AIO','60% efficiency'],['PSU','1200W','stable headroom']].map(([a,b,c])=><div className="opp" key={a}><div><strong>{a}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{b}</div></div><span className="muted" style={{fontSize:12}}>{c}</span></div>)}</section><section className="glass section"><div className="section-head"><h3>Runtime events</h3><Flame size={17}/></div><div className="notice"><Shield size={15}/> Thermal warnings trigger above 80%.</div><div style={{display:'grid',gap:12,marginTop:16}}><div className="muted" style={{fontSize:12}}><Sparkles size={14}/> No gremlin attack active.</div><div className="muted" style={{fontSize:12}}>Block discovery is simulated server-side.</div><div className="muted" style={{fontSize:12}}>Prestige creates a Ghost Rig with a persistent bonus.</div></div></section></div>
  </>
}
