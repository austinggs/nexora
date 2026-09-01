import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HardwareImage } from '../HardwareImage'
import { maintainHardware } from './actions'

export default async function HardwarePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Hardware</h1><Link className="btn" href="/login">Sign in</Link></main>

  const { data: items } = await supabase.rpc('get_my_hardware_health')
  const ids = (items ?? []).map((item:any) => item.hardware_id)
  const { data: catalog } = ids.length ? await supabase.from('hardware_catalog').select('id,category,brand,model,virtual_price').in('id', ids) : { data: [] as any[] }
  const map = new Map((catalog ?? []).map((item:any) => [item.id, item]))

  return <main className="main"><div className="topbar"><div><div className="eyebrow">NEXORA OS / Hardware</div><h1>Your hardware.</h1><div className="muted">Purchased components persist here with health, operating hours and thermal-cycle history.</div></div><Link className="btn secondary" href="/app/mining/os">OS home</Link></div>
    {(items ?? []).length === 0 ? <section className="glass section"><h3>No owned hardware yet.</h3><p className="muted">Buy components from the Hardware Store before building or maintaining a rig.</p><Link className="btn" href="/app/mining/os/store">Open store</Link></section> : <div className="grid">{(items ?? []).map((item:any) => { const h = map.get(item.hardware_id); if (!h) return null; return <article className="glass section" key={item.id}><HardwareImage brand={h.brand} model={h.model} category={h.category}/><div style={{marginTop:12}}><div className="eyebrow">{h.category}</div><h3 style={{margin:'5px 0'}}>{h.brand} {h.model}</h3><div className="stats"><div className="mining-stat"><div className="muted">Health</div><div className="value">{Number(item.health).toFixed(0)}%</div></div><div className="mining-stat"><div className="muted">Hours</div><div className="value">{Number(item.operating_hours).toFixed(1)}</div></div><div className="mining-stat"><div className="muted">Thermal cycles</div><div className="value">{Number(item.thermal_cycles).toLocaleString()}</div></div></div><form action={maintainHardware} style={{display:'grid',gap:8}}><input type="hidden" name="hardware_id" value={item.id}/><input type="hidden" name="expected_health" value={item.health}/><input type="hidden" name="cost_nxa" value={Math.max(25,Math.ceil((100-Number(item.health))*8))}/><button className="btn secondary" type="submit">Restore to 100% · {Math.max(25,Math.ceil((100-Number(item.health))*8)).toLocaleString()} NXA</button></form></div></article> })}</div>}
  </main>
}
