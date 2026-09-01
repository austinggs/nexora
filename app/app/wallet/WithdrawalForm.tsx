'use client'

import { useState, useTransition } from 'react'
import { requestWithdrawal } from './actions'

export function WithdrawalForm() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState(false)

  return <form className="glass section" action={(formData) => {
    setMessage('')
    setOk(false)
    startTransition(async () => {
      const result = await requestWithdrawal(formData)
      setOk(Boolean(result.ok))
      setMessage(result.ok ? 'Withdrawal queued. Payment proof will be generated after on-chain confirmation.' : (result.error || 'Unable to create withdrawal.'))
    })
  }}>
    <div className="section-head"><h3>Withdraw</h3><span className="muted">Celo · direct transfer</span></div>
    <div style={{display:'grid',gap:10}}>
      <input className="input" name="amount" inputMode="numeric" placeholder="Amount in cents (e.g. 500 = $5.00)" required />
      <select className="input" name="token" defaultValue="USDC"><option>USDC</option><option>USDT</option><option>USDM</option></select>
      <input className="input" name="walletAddress" placeholder="Destination Celo wallet 0x…" autoComplete="off" required />
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Submitting…' : 'Request withdrawal'}</button>
      {message && <div className={ok ? 'notice' : 'error'}>{message}</div>}
      <div className="muted" style={{fontSize:11}}>For outbound transfers, NEXORA creates the payment proof from the confirmed Celo transaction. User-submitted inbound transfers must include their own transaction hash.</div>
    </div>
  </form>
}
