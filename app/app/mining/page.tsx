import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Cpu, Fan, Flame, Gauge, Sparkles, Zap, Trophy, LibraryBig, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createRig, operateRig } from './actions'
import { RigBuilder } from './RigBuilder'
import { prestigeRig } from './builder-actions'

const RigViewer = dynamic(() => import('./RigViewer'), { ssr: false, loading: () => <div className="glass section" style={{height:310,display:'grid',placeItems:'center'}}>Loading 3D rig viewer…</div> })

export default async function MiningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Mining game</div><h1>Crystal Caverns rig.</h1></div><Link className="btn secondary" href="/login">Sign in</Link></div></main>

  const [{ data: rig }, { data: parts }, { data: owned }, { data: leaderboard }] = await Promise.all([
    supabase.from('rigs').select('*').eq('user_id', user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),
    supabase.from('hardware_catalog').select('id,category,brand,model,virtual_price,compatibility_rank,specification').in('category',['gpu','cpu','motherboard','ram','cooling','cooler','psu']).order('category').order('virtual_price'),
    supabase.from('user_hardware').select('hardware_id,quantity').eq('user_id',user.id),
    supabase.rpc('get_mining_leaderboard',{p_limit:10}),
  ])
  const config = (rig?.config ?? {}) as Record<string, unknown>
  const heat = Number(config.heat ?? 42)
  const overclocked = Boolean(config.overclocked ?? false)
  const hash = Number(rig?.current_hash_rate ?? 0)
  const pendingDust = Number(config.pending_dust ?? 0)
  const power = Number(config.configured_power_w ?? 0)
  const tempLimit = Number(config.gpu_temp_limit_c ?? 90)
  const gremlins = Number(config.gremlin_count ?? 0)
  const gremlinHits = Number(config.gremlin_hits ?? 0)

  return <>
    <div className="topbar"><div><div className="eyebrow">Mining game</div><h1>Crystal Caverns rig.</h1></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link className="btn secondary" href="/app/mining/os"><Monitor size={15}/> Open NEXORA OS</Link><Link className="btn secondary" href="/app/mining/catalog"><LibraryBig size={15}/> Hardware catalog</Link><Link className="btn secondary" href="/app">Back</Link></div></div>
    {!rig ? <section className="glass section"><h3>Set up your first rig</h3><p className="muted">Create the starter NEX-01 rig. Components, power budget, thermal state and mining events remain server-authoritative.</p><form action={createRig}><button className="btn" type="submit">Create NEX-01</button></form></section> : <>
      <div className="grid" style={{marginTop:0}}>
        <section className="glass section"><div className="section-head"><div><div className="eyebrow">Holographic rig</div><h2 style={{margin:'6px 0'}}>{rig.name}</h2></div><Gauge size={20}/></div><RigViewer heat={heat} overclocked={overclocked}/></section>
        <section className="glass section"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div className="eyebrow">Server-authoritative simulation</div><h3 style={{margin:'6px 0'}}>{overclocked ? 'Overclocked' : 'Stable load'}</h3><div className="muted" style={{fontSize:12}}>{rig.gpu_brand.toUpperCase()} {rig.gpu_model} · {rig.cpu_brand.toUpperCase()} {rig.cpu_model}{rig.motherboard_model ? ` · ${rig.motherboard_model}` : ''}</div></div><Zap size={18}/></div>
          <div className="stats"><div className="mining-stat"><div className="muted">Hash rate</div><div className="value">{(hash/1000000).toFixed(2)} MH/s</div></div><div className="mining-stat"><div className="muted">Thermal</div><div className="value">{heat.toFixed(1)}%</div></div><div className="mining-stat"><div className="muted">Power</div><div className="value">{power}W</div></div></div>
          <div className="muted" style={{fontSize:11}}>GPU thermal ceiling: {tempLimit}°C equivalent · PSU headroom is enforced before configuration.</div>
          <div className="meter" style={{marginTop:14}}><span style={{width:`${Math.min(100,Math.max(0,heat))}%`}} /></div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}><form action={operateRig}><input type="hidden" name="action" value="toggle_overclock"/><button className="btn" type="submit">{overclocked ? 'Disable overclock' : 'Overclock +32%'}</button></form><form action={operateRig}><input type="hidden" name="action" value="cool"/><button className="btn secondary" type="submit"><Fan size={15}/> Cool rig</button></form><form action={operateRig}><input type="hidden" name="action" value="tick"/><button className="btn secondary" type="submit">Mine next tick</button></form>{gremlins>0&&<form action={operateRig}><input type="hidden" name="action" value="defend_gremlin"/><button className="btn" type="submit">Defend gremlin ({gremlinHits}/{gremlins})</button></form>}</div>
          <div className={heat>80?'error':'notice'} style={{marginTop:14}}><Flame size={15}/> {heat>80?'Thermal warning active. Reduce load or improve cooling.':'Thermal warning begins above 80%.'} {gremlins>0?` Gremlin attack: ${gremlins-gremlinHits} remaining.`:' No gremlin attack active.'}</div>
        </section>
      </div>
      <section className="glass section"><div className="section-head"><div><div className="eyebrow">Build lab</div><h3>Full hardware catalog & compatibility</h3></div><Cpu size={17}/></div><p className="muted" style={{fontSize:12}}>The catalog uses socket, RAM generation, PCIe bus, power class and cooling class as compatibility keys. The server validates CPU → board → RAM, GPU capacity, PSU headroom and cooling before saving a build.</p><RigBuilder parts={(parts ?? []) as any} owned={(owned ?? []) as any}/></section>
      <div className="grid"><section className="glass section"><div className="section-head"><h3>Dust economy</h3><Sparkles size={17}/></div><div className="value" style={{fontSize:28}}>{pendingDust.toFixed(0)} Dust</div><div className="muted" style={{fontSize:12}}>Virtual mining currency only. It is not presented as a guaranteed real-money return.</div></section><section className="glass section"><div className="section-head"><h3>Prestige</h3><Gauge size={17}/></div><div className="muted" style={{fontSize:12,marginBottom:12}}>Prestige requires 100 discovered blocks. It resets the active rig's block count and creates a persistent Ghost Rig bonus.</div><form action={prestigeRig}><button className="btn secondary" type="submit">Create Ghost Rig</button></form></section></div>
      <section className="glass section"><div className="section-head"><div><div className="eyebrow">Competition</div><h3>Mining leaderboard</h3></div><Trophy size={17}/></div>{(leaderboard??[]).map((row:any,i:number)=><div className="opp" key={`${row.username}-${i}`}><div><strong>#{i+1} {row.username}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{(Number(row.hash_rate)/1000000).toFixed(2)} MH/s · {row.blocks} blocks · prestige {row.prestige}</div></div></div>)}</section>
    </>}
  </>
}
