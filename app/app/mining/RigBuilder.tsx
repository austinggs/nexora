'use client'

import { useMemo, useState, useTransition } from 'react'
import { configureRig, purchaseHardware } from './builder-actions'
import { HardwareImage } from './HardwareImage'

type Part = { id:string; category:string; brand:string; model:string; virtual_price:number|null; compatibility_rank:string|null; specification:Record<string, any> }
type Owned = { hardware_id:string; quantity:number }

export function RigBuilder({ parts, owned }: { parts: Part[]; owned: Owned[] }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Record<string,string>>({})
  const ownedSet = useMemo(() => new Set(owned.filter(x => x.quantity > 0).map(x => x.hardware_id)), [owned])
  const by = (categories:string[]) => parts.filter(p => categories.includes(p.category))
  const groups = [
    ['GPU','gpu',by(['gpu'])],
    ['CPU','cpu',by(['cpu'])],
    ['Motherboard','motherboard',by(['motherboard'])],
    ['RAM','ram',by(['ram'])],
    ['Cooling','cooling',by(['cooler','cooling'])],
    ['PSU','psu',by(['psu'])],
  ] as const

  function buy(id:string) {
    setMessage('')
    startTransition(async () => {
      const fd = new FormData(); fd.set('hardwareId', id)
      const result = await purchaseHardware(fd)
      setMessage(result.ok ? 'Component purchased. It is now available to equip.' : (result.error || 'Purchase failed.'))
    })
  }

  const select = (category:string, value:string) => setSelected(s => ({...s,[category]:value}))
  const configure = () => startTransition(async () => {
    setMessage('')
    const fd = new FormData()
    fd.set('gpuId',selected.gpu||''); fd.set('cpuId',selected.cpu||''); fd.set('motherboardId',selected.motherboard||''); fd.set('ramId',selected.ram||''); fd.set('coolingId',selected.cooling||''); fd.set('psuId',selected.psu||'')
    const result = await configureRig(fd)
    setMessage(result.ok ? 'Rig configuration saved. Compatibility and power checks passed.' : (result.error || 'Configuration failed.'))
  })

  const renderPart = (title:string, category:string, items:Part[]) => <section className="glass section"><div className="section-head"><h3>{title}</h3><span className="muted">{items.length} catalog items · real-device imagery</span></div><div style={{display:'grid',gap:8,maxHeight:category==='gpu'||category==='cpu'?420:280,overflow:'auto'}}>{items.map(p => <div className="opp" key={p.id} style={{display:'grid',gridTemplateColumns:'72px 1fr auto',gap:10,alignItems:'center'}}><HardwareImage brand={p.brand} model={p.model} category={category} size={72}/><div style={{minWidth:0}}><strong>{p.brand} {p.model}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{p.compatibility_rank ?? 'standard'}{p.virtual_price ? ` · ${(Number(p.virtual_price)/100).toFixed(0)} Dust` : ''}</div></div>{ownedSet.has(p.id) ? <button className={selected[category]===p.id ? 'btn' : 'btn secondary'} type="button" onClick={()=>select(category,p.id)}>Equip</button> : <button className="btn secondary" type="button" disabled={pending} onClick={()=>buy(p.id)}>Buy</button>}</div>)}</div></section>

  return <section className="section" style={{padding:0}}><div className="grid">{groups.map(([title,category,items]) => <div key={category}>{renderPart(title,category,items)}</div>)}</div><div className="notice" style={{marginTop:12}}>The server checks socket, memory generation, GPU capacity, PSU headroom and cooling compatibility before saving the build.</div><button className="btn" type="button" disabled={pending || groups.some(([,category]) => !selected[category])} onClick={configure}>{pending ? 'Saving…' : 'Apply compatible build'}</button>{message && <div className="notice" style={{marginTop:10}}>{message}</div>}</section>
}
