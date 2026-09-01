import Link from 'next/link'
import { HardwareImage } from '../HardwareImage'
import { createClient } from '@/lib/supabase/server'

export default async function HardwareCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Hardware catalog</h1><Link className="btn" href="/login">Sign in</Link></main>

  const { data: parts } = await supabase
    .from('hardware_catalog')
    .select('id,category,brand,model,virtual_price,compatibility_rank,specification')
    .order('category')
    .order('brand')
    .order('model')

  return <>
    <div className="topbar">
      <div><div className="eyebrow">Crystal Caverns</div><h1>Hardware catalog.</h1><div className="muted">Real device imagery where publicly available · compatibility remains data-driven.</div></div>
      <Link className="btn secondary" href="/app/mining">Back to mining</Link>
    </div>
    <section className="glass section"><div className="section-head"><div><h3>Complete component library</h3><div className="muted" style={{fontSize:12}}>GPU, CPU, motherboard, memory, power, cooling, storage, rig hardware and ASICs.</div></div><span className="muted">{parts?.length ?? 0} items</span></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(235px,1fr))',gap:12}}>
        {(parts ?? []).map((p:any) => <article className="glass" key={p.id} style={{padding:12}}><HardwareImage brand={p.brand} model={p.model} category={p.category} size={180}/><div style={{marginTop:10}}><div className="eyebrow">{p.category}</div><h3 style={{margin:'4px 0'}}>{p.brand ? `${p.brand} ` : ''}{p.model}</h3><div className="muted" style={{fontSize:11}}>{p.compatibility_rank ?? 'standard'}{p.virtual_price ? ` · ${(Number(p.virtual_price)/100).toFixed(0)} Dust` : ''}</div></div></article>)}
      </div>
    </section>
  </>
}
