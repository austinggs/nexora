'use client'

import { useState, useTransition } from 'react'
import { createWalletChallenge, verifyWalletChallenge } from './verification-actions'

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

export function WalletVerification({ verifiedAddress }: { verifiedAddress?: string | null }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'verified' | 'error'>(verifiedAddress ? 'verified' : 'idle')

  const connect = () => {
    setMessage('')
    startTransition(async () => {
      try {
        if (!window.ethereum) throw new Error('Open NEXORA inside MiniPay to connect your wallet.')
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
        const address = accounts?.[0]
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
        if (!address) throw new Error('No Celo wallet address was returned.')
        const challenge = await createWalletChallenge(address, String(parseInt(chainId, 16)))
        if (!challenge.ok) throw new Error(challenge.error)
        const signature = await window.ethereum.request({ method: 'personal_sign', params: [challenge.message, address] }) as string
        const result = await verifyWalletChallenge(address, String(parseInt(chainId, 16)), signature)
        if (!result.ok) throw new Error(result.error)
        setStatus('verified')
        setMessage(`Verified: ${address}`)
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Wallet verification failed.')
      }
    })
  }

  return <section className="glass section">
    <div className="section-head">
      <div><h3>MiniPay wallet</h3><div className="muted" style={{fontSize:11}}>One Celo address for your NEXORA payouts</div></div>
      {status === 'verified' && <span className="notice">Verified</span>}
    </div>
    <div style={{display:'grid',gap:10}}>
      <div className="muted" style={{fontSize:12}}>{verifiedAddress ? `Verified address: ${verifiedAddress}` : 'Connect MiniPay and sign a wallet-ownership message. NEXORA never receives your private key.'}</div>
      <button className="btn" type="button" onClick={connect} disabled={pending}>{pending ? 'Verifying…' : verifiedAddress ? 'Verify / change wallet' : 'Connect MiniPay'}</button>
      {message && <div className={status === 'error' ? 'error' : 'notice'}>{message}</div>}
    </div>
  </section>
}
