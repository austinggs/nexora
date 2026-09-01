import Link from 'next/link'
import { Cpu, Fan, Flame, Gauge, Shield, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createRig, operateRig } from './actions'

export default async function MiningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Mining game</div><h1>Crystal Caverns rig.</h1></div><Link className="btn secondary" href="/login">Sign in</Link></div></main>

  const { data: rig } = await supabase.from('rigs').select('*').eq('user_id', user.id).order('created_at',{ascending:true}).limit(1).maybeSingle()
  const config = (rig?.config ?? {}) as Record<string, unknown>
  const heat = Number(config.heat ?? 42)
  const overclocked = Boolean(config.overclocked ?? false)
  const hash = Number(rig?.current_hash_rate ?? 1200000)
  const pendingDust = Number(config.pending_dust ?? 0)

  return <>
    <div className="topbar"><div><div className="eyebrow">Mining game</div><h1>Crystal Caverns rig.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    {!rig ? <section className="glass section"><h3>Set up your first rig</h3><p className="muted">Create the starter NEX-01 rig and keep all simulation state in Supabase.</p><form action={createRig}><button className="btn" type="submit">Create NEX-01</button></form></section> : <>
      <section className="glass mining-card" style={{marginTop:0}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div className="eyebrow">Server-authoritative simulation</div><h2 style={{margin:'7px 0'}}>{rig.name} · {overclocked ? 'Overclocked' : 'Stable'}</h2><div className="muted" style={{fontSize:13}}>{rig.gpu_brand.toUpperCase()} {rig.gpu_model} · {rig.cpu_brand.toUpperCase()} {rig.cpu_model} · {rig.ram_type ?? 'RAM'} · {rig.cooling_unit.toUpperCase()}</div></div><Gauge size={28}/></div>
        <div className="stats"><div className="mining-stat"><div className="muted">Hash rate</div><div className="value">{(hash/1000000).toFixed(2)} MH/s</div></div><div className="mining-stat"><div className="muted">Thermal</div><div className="value">{heat.toFixed(0)}%</div></div><div className="mining-stat"><div className="muted">Pending Dust</div><div className="value">{pendingDust.toFixed(1)}</div></div></div>
        <div className="meter"><span style={{width:`${Math.min(100,Math.max(0,heat))}%`}} /></div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}><form action={operateRig}><input type="hidden" name="action" value="toggle_overclock"/><button className="btn" type="submit">{overclocked ? 'Disable overclock' : 'Overclock +32%'}</button></form><form action={operateRig}><input type="hidden" name="action" value="cool"/><button className="btn secondary" type="submit"><Fan size={15} style={{verticalAlign:'middle'}}/> Cool rig</button></form><form action={operateRig}><input type="hidden" name="action" value="tick"/><button className="btn secondary" type="submit">Mine next tick</button></form></div>
      </section>
      <div className="grid" style={{marginTop:18}}><section className="glass section"><div className="section-head"><h3>Hardware</h3><Cpu size={17}/></div>{[['GPU',`${rig.gpu_brand} ${rig.gpu_model}`,`${(hash/1000000).toFixed(2)} MH/s`],['CPU',`${rig.cpu_brand} ${rig.cpu_model}`,'compatible'],['Cooling',rig.cooling_unit.toUpperCase(),'server tracked'],['PSU',`${rig.psu_capacity ?? '—'}W`,'stable headroom']].map(([a,b,c])=><div className="opp" key={a}><div><strong>{a}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{b}</div></div><span className="muted" style={{fontSize:12}}>{c}</span></div>)}</section><section className="glass section"><div className="section-head"><h3>Runtime events</h3><Flame size={17}/></div><div className="notice"><Shield size={15}/> Thermal warnings trigger above 80%.</div><div style={{display:'grid',gap:12,marginTop:16}}><div className="muted" style={{fontSize:12}}><Sparkles size={14}/> {heat >= 80 ? 'Thermal warning active.' : 'No gremlin attack active.'}</div><div className="muted" style={{fontSize:12}}>Block discovery is simulated server-side.</div><div className="muted" style={{fontSize:12}}>Prestige can later create a persistent Ghost Rig bonus.</div></div></section></div>
    </>}
  </>
}
