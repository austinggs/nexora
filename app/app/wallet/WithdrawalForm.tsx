'use client'

import { useState, useTransition } from 'react'
import { requestWithdrawal } from './actions'

type Balance = { token:string; available_amount:number; pending_amount:number; lifetime_earned:number }

export function WithdrawalForm({ verifiedAddress, balances }: { verifiedAddress?: string | null; balances: Balance[] }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState(false)
  const [token, setToken] = useState('USDC')
  const balance = balances.find(item => item.token === token)?.available_amount ?? 0

  return <form className="glass section" action={(formData) => {
    setMessage('')
    setOk(false)
    startTransition(async () => {
      const result = await requestWithdrawal(formData)
      setOk(Boolean(result.ok))
      setMessage(result.ok ? 'Withdrawal queued. Payment proof will be generated after on-chain confirmation.' : (result.error || 'Unable to create withdrawal.'))
    })
  }}>
    <div className="section-head"><div><h3>Withdraw</h3><div className="muted" style={{fontSize:11}}>Direct Celo transfer to your verified MiniPay address</div></div></div>
    <div style={{display:'grid',gap:10}}>
      {!verifiedAddress && <div className="error">Connect and verify your MiniPay wallet above before requesting a withdrawal.</div>}
      <input className="input" name="amount" inputMode="decimal" placeholder="Amount in USD cents (e.g. 500 = $5.00)" required disabled={!verifiedAddress} />
      <select className="input" name="token" value={token} onChange={(event) => setToken(event.target.value)} disabled={!verifiedAddress}><option>USDC</option><option>USDT</option><option>USDM</option></select>
      <input type="hidden" name="walletAddress" value={verifiedAddress ?? ''} />
      <div className="muted" style={{fontSize:11}}>Available {token}: ${(Number(balance)/100).toFixed(2)} · Destination: {verifiedAddress ? `${verifiedAddress.slice(0,10)}…${verifiedAddress.slice(-8)}` : 'not verified'}</div>
      <button className="btn" type="submit" disabled={pending || !verifiedAddress}>{pending ? 'Submitting…' : 'Request withdrawal'}</button>
      {message && <div className={ok ? 'notice' : 'error'}>{message}</div>}
      <div className="muted" style={{fontSize:11}}>Your single MiniPay Celo address can receive the selected Celo stablecoin. NEXORA converts the USD-cent ledger amount into the token contract’s actual decimal units before broadcasting.</div>
    </div>
  </form>
}
