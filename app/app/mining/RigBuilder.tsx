'use client'

import { useMemo, useState, useTransition } from 'react'
import { configureMultiGpuRig, purchaseHardware } from './builder-actions'
import { HardwareImage } from './HardwareImage'

type Part = { id:string; category:string; brand:string; model:string; virtual_price:number|null; compatibility_rank:string|null; specification:Record<string, any> }
type Owned = { hardware_id:string; quantity:number }

export function RigBuilder({ parts, owned }: { parts: Part[]; owned: Owned[] }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Record<string,string>>({})
  const [selectedGpus, setSelectedGpus] = useState<string[]>([])
  const [selectedPsus, setSelectedPsus] = useState<string[]>([])
  const ownedMap = useMemo(() => new Map(owned.map(x => [x.hardware_id, x.quantity])), [owned])
  const by = (categories:string[]) => parts.filter(p => categories.includes(p.category))
  const groups = [
    ['CPU','cpu',by(['cpu'])],
    ['Motherboard','motherboard',by(['motherboard'])],
    ['RAM','ram',by(['ram'])],
    ['Cooling','cooling',by(['cooler','cooling'])],
  ] as const
  const gpuItems = by(['gpu'])
  const psuItems = by(['psu'])

  function buy(id:string) {
    setMessage('')
    startTransition(async () => {
      const fd = new FormData(); fd.set('hardwareId', id)
      const result = await purchaseHardware(fd)
      setMessage(result.ok ? 'Component purchased. It is now available to equip.' : (result.error || 'Purchase failed.'))
    })
  }

  function toggleOwnedSelection(id:string, state:string[], setter:(next:string[])=>void, max:number) {
    const qty = ownedMap.get(id) ?? 0
    setter(state.includes(id) ? state.filter(x => x !== id) : (qty > state.filter(x => x === id).length && state.length < max ? [...state,id] : state))
  }
  const select = (category:string, value:string) => setSelected(s => ({...s,[category]:value}))
  const configure = () => startTransition(async () => {
    setMessage('')
    const fd = new FormData()
    fd.set('gpuIds',selectedGpus.join(',')); fd.set('cpuId',selected.cpu||''); fd.set('motherboardId',selected.motherboard||''); fd.set('ramId',selected.ram||''); fd.set('coolingId',selected.cooling||''); fd.set('psuIds',selectedPsus.join(','))
    const result = await configureMultiGpuRig(fd)
    setMessage(result.ok ? 'Build saved. Server compatibility, topology, power and PSU checks passed.' : (result.error || 'Configuration failed.'))
  })

  const renderSingle = (title:string, category:string, items:Part[]) => <section className="glass section"><div className="section-head"><h3>{title}</h3><span className="muted">{items.length} catalog items · real-device imagery</span></div><div style={{display:'grid',gap:8,maxHeight:280,overflow:'auto'}}>{items.map(p => <div className="opp" key={p.id} style={{display:'grid',gridTemplateColumns:'58px 1fr auto',gap:10,alignItems:'center'}}><HardwareImage brand={p.brand} model={p.model} category={category} size={58}/><div style={{minWidth:0}}><strong>{p.brand} {p.model}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{p.compatibility_rank ?? 'standard'}{p.virtual_price ? ` · ${(Number(p.virtual_price)/100).toFixed(0)} Dust` : ''}</div></div>{ownedMap.get(p.id) ? <button className={selected[category]===p.id ? 'btn' : 'btn secondary'} type="button" onClick={()=>select(category,p.id)}>Equip</button> : <button className="btn secondary" type="button" disabled={pending} onClick={()=>buy(p.id)}>Buy</button>}</div>)}</div></section>

  const renderMulti = (title:string, category:string, items:Part[], selectedIds:string[], setter:(next:string[])=>void, max:number, hint:string) => <section className="glass section"><div className="section-head"><h3>{title}</h3><span className="muted">{selectedIds.length}/{max} selected</span></div><p className="muted" style={{fontSize:11,marginBottom:10}}>{hint}</p><div style={{display:'grid',gap:8,maxHeight:380,overflow:'auto'}}>{items.map(p => { const qty=ownedMap.get(p.id)||0; const selectedCount=selectedIds.filter(id=>id===p.id).length; const isSelected=selectedCount>0; const canAdd=qty>selectedCount && selectedIds.length<max; return <div className="opp" key={p.id} style={{display:'grid',gridTemplateColumns:'58px 1fr auto',gap:10,alignItems:'center'}}><HardwareImage brand={p.brand} model={p.model} category={category} size={58}/><div style={{minWidth:0}}><strong>{p.brand} {p.model}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>owned {qty}{p.virtual_price ? ` · ${(Number(p.virtual_price)/100).toFixed(0)} Dust` : ''}</div></div>{qty ? <button className={isSelected?'btn':'btn secondary'} type="button" disabled={pending || (!isSelected && !canAdd)} onClick={()=>toggleOwnedSelection(p.id,selectedIds,setter,max)}>{isSelected ? 'Remove' : 'Equip'}</button> : <button className="btn secondary" type="button" disabled={pending} onClick={()=>buy(p.id)}>Buy</button>}</div>})}</div></section>

  return <section className="section" style={{padding:0}}>
    {renderMulti('GPUs','gpu',gpuItems,selectedGpus,setSelectedGpus,19,'Select multiple owned GPUs. The server enforces board GPU-count, slot topology, risers and connector/power constraints.')}
    <div className="grid">{groups.map(([title,category,items]) => <div key={category}>{renderSingle(title,category,items)}</div>)}</div>
    {renderMulti('PSUs','psu',psuItems,selectedPsus,setSelectedPsus,4,"Multiple PSUs are allowed for high-draw rigs. More than one PSU requires the catalog's PSU_SYNC_DUAL adapter.")}
    <div className="notice" style={{marginTop:12}}>The build is validated server-side against the catalog's socket, memory-generation, GPU-capacity, power, connector and cooling rules.</div>
    <button className="btn" type="button" disabled={pending || !selectedGpus.length || !selectedPsus.length || groups.some(([,category]) => !selected[category])} onClick={configure}>{pending ? 'Validating…' : 'Apply compatible build'}</button>
    {message && <div className="notice" style={{marginTop:10}}>{message}</div>}
  </section>
}
