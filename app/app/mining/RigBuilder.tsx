'use client'

import { useMemo, useState, useTransition } from 'react'
import { configureRig, purchaseHardware } from './builder-actions'

type Part = { id:string; category:string; brand:string; model:string; virtual_price:number; compatibility_rank:string|null; specification:Record<string, any> }

type Owned = { hardware_id:string; quantity:number }

export function RigBuilder({ parts, owned }: { parts: Part[]; owned: Owned[] }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Record<string,string>>({})
  const ownedSet = useMemo(() => new Set(owned.filter(x => x.quantity > 0).map(x => x.hardware_id)), [owned])
  const gpu = parts.filter(p => p.category==='gpu')
  const cpu = parts.filter(p => p.category==='cpu')
  const cooling = parts.filter(p => p.category==='cooling')
  const psu = parts.filter(p => p.category==='psu')

  function buy(id:string) {
    setMessage('')
    startTransition(async () => {
      const fd = new FormData(); fd.set('hardwareId', id)
      const result = await purchaseHardware(fd)
      setMessage(result.ok ? 'Component purchased. Configure the rig when all required parts are owned.' : (result.error || 'Purchase failed.'))
    })
  }

  const select = (category:string, value:string) => setSelected(s => ({...s,[category]:value}))
  const configure = () => startTransition(async () => {
    setMessage('')
    const fd = new FormData(); fd.set('gpuId',selected.gpu||''); fd.set('cpuId',selected.cpu||''); fd.set('coolingId',selected.cooling||''); fd.set('psuId',selected.psu||'')
    const result = await configureRig(fd)
    setMessage(result.ok ? 'Rig configuration saved.' : (result.error || 'Configuration failed.'))
  })

  const renderPart = (title:string, category:string, items:Part[]) => <div className="glass section"><div className="section-head"><h3>{title}</h3><span className="muted">owned parts only can be equipped</span></div><div style={{display:'grid',gap:8}}>{items.map(p => <div className="opp" key={p.id}><div><strong>{p.brand} {p.model}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{p.compatibility_rank ?? 'standard'} · {(p.virtual_price/100).toFixed(2)} Dust</div></div>{ownedSet.has(p.id) ? <button className={selected[category]===p.id ? 'btn' : 'btn secondary'} type="button" onClick={()=>select(category,p.id)}>Equip</button> : <button className="btn secondary" type="button" disabled={pending} onClick={()=>buy(p.id)}>Buy</button>}</div>)}</div></div>

  return <section className="section" style={{padding:0}}>{renderPart('GPU','gpu',gpu)}{renderPart('CPU','cpu',cpu)}{renderPart('Cooling','cooling',cooling)}{renderPart('PSU','psu',psu)}<button className="btn" type="button" disabled={pending || !selected.gpu || !selected.cpu || !selected.cooling || !selected.psu} onClick={configure}>{pending ? 'Saving…' : 'Apply configuration'}</button>{message && <div className="notice" style={{marginTop:10}}>{message}</div>}</section>
}
