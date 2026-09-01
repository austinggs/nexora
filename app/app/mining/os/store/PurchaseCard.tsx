'use client'

import { useMemo, useState } from 'react'
import { HardwareImage } from '../../HardwareImage'
import { purchaseHardware } from './actions'

type Props = { hardware: { id:string; category:string; brand:string; model:string; virtual_price:number; specification?:Record<string,unknown> }; nxaNgnReference: number }

export function PurchaseCard({ hardware, nxaNgnReference }: Props) {
  const [qty, setQty] = useState(1)
  const [currency, setCurrency] = useState<'NXA'|'NEXORA'>('NXA')
  const [confirming, setConfirming] = useState(false)
  const nxaTotal = Number(hardware.virtual_price) * qty
  const nexoraUnit = useMemo(() => Math.ceil(Number(hardware.virtual_price) * nxaNgnReference), [hardware.virtual_price, nxaNgnReference])
  const total = currency === 'NXA' ? nxaTotal : nexoraUnit * qty

  return <article className="glass section" style={{padding:16}}>
    <HardwareImage brand={hardware.brand} model={hardware.model} category={hardware.category} />
    <div style={{marginTop:12}}><div className="eyebrow">{hardware.category}</div><h3 style={{margin:'5px 0'}}>{hardware.brand} {hardware.model}</h3><div className="muted" style={{fontSize:12}}>Game reference: {Number(hardware.virtual_price).toLocaleString()} NXA · NEXORA reference: ₦{nexoraUnit.toLocaleString()}/unit</div></div>
    <div style={{display:'grid',gridTemplateColumns:'92px 1fr',gap:8,alignItems:'center',marginTop:12}}><label className="muted" style={{fontSize:12}} htmlFor={`qty-${hardware.id}`}>Quantity</label><input id={`qty-${hardware.id}`} aria-label="Quantity" type="number" min={1} max={64} value={qty} onChange={e=>setQty(Math.max(1,Math.min(64,Number(e.target.value)||1)))} />
      <label className="muted" style={{fontSize:12}} htmlFor={`currency-${hardware.id}`}>Pay with</label><select id={`currency-${hardware.id}`} value={currency} onChange={e=>setCurrency(e.target.value as 'NXA'|'NEXORA')}><option value="NXA">NXA (game balance)</option><option value="NEXORA">NEXORA balance (real-value ledger)</option></select></div>
    <button className="btn" style={{marginTop:12}} type="button" onClick={()=>setConfirming(true)}>Review purchase · {currency==='NXA'?`${nxaTotal.toLocaleString()} NXA`:`₦${total.toLocaleString()}`}</button>
    {confirming&&<div role="dialog" aria-modal="true" className="glass section" style={{marginTop:12,padding:14}}><strong>Confirm purchase</strong><p className="muted" style={{fontSize:12}}>You are about to spend <strong>{currency==='NXA'?`${nxaTotal.toLocaleString()} NXA`:`₦${total.toLocaleString()}`}</strong>. {currency==='NEXORA'?'This uses money that may originate from your NEXORA earnings. The server will re-check the latest exchange rate, hardware price and balance before charging you.':'This uses your virtual NXA balance. The server will re-check the current hardware price and your available NXA before completing the purchase.'}</p><form action={purchaseHardware}><input type="hidden" name="hardware_id" value={hardware.id}/><input type="hidden" name="quantity" value={qty}/><input type="hidden" name="currency" value={currency}/><input type="hidden" name="expected_unit_price" value={currency==='NXA'?hardware.virtual_price:nexoraUnit}/><input type="hidden" name="confirmed" value="true"/><div style={{display:'flex',gap:8}}><button className="btn" type="submit">Confirm & purchase</button><button className="btn secondary" type="button" onClick={()=>setConfirming(false)}>Cancel</button></div></form></div>}
  </article>
}
