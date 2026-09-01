'use client'

import { useState } from 'react'
import { HardwareImage } from '../../HardwareImage'
import { purchaseWithNexoraBalance } from './actions'

type Props = { hardware: { id:string; category:string; brand:string; model:string; virtual_price:number; specification?:Record<string,unknown> } }

export function PurchaseCard({ hardware }: Props) {
  const [qty, setQty] = useState(1)
  const [confirming, setConfirming] = useState(false)
  const total = Number(hardware.virtual_price) * qty

  return <article className="glass section" style={{padding:16}}>
    <HardwareImage brand={hardware.brand} model={hardware.model} category={hardware.category} />
    <div style={{marginTop:12}}><div className="eyebrow">{hardware.category}</div><h3 style={{margin:'5px 0'}}>{hardware.brand} {hardware.model}</h3><div className="muted" style={{fontSize:12}}>Game price: {Number(hardware.virtual_price).toLocaleString()} NXA</div></div>
    <div style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}><input aria-label="Quantity" type="number" min={1} max={64} value={qty} onChange={e=>setQty(Math.max(1,Math.min(64,Number(e.target.value)||1)))} style={{width:78}}/><button className="btn" type="button" onClick={()=>setConfirming(true)}>Buy</button></div>
    {confirming&&<div role="dialog" aria-modal="true" className="glass section" style={{marginTop:12,padding:14}}><strong>Confirm purchase</strong><p className="muted" style={{fontSize:12}}>This will spend <strong>{total.toLocaleString()} NXA</strong> of your NEXORA balance. The server will re-check the current hardware price and your available balance before completing the purchase.</p><form action={purchaseWithNexoraBalance}><input type="hidden" name="hardware_id" value={hardware.id}/><input type="hidden" name="quantity" value={qty}/><input type="hidden" name="expected_unit_price" value={hardware.virtual_price}/><input type="hidden" name="confirmed" value="true"/><div style={{display:'flex',gap:8}}><button className="btn" type="submit">Confirm & purchase</button><button className="btn secondary" type="button" onClick={()=>setConfirming(false)}>Cancel</button></div></form></div>}
  </article>
}
