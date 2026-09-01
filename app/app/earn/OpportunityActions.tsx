'use client'

import { useEffect, useState, useTransition } from 'react'
import { completeOpportunity } from './complete-actions'
import { startOpportunity } from './actions'

export function OpportunityActions({ opportunityId, status, requiredSeconds }: { opportunityId: string; status?: string; requiredSeconds: number }) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!startedAt) return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  if (status === 'paid' || status === 'verified') return <div className="muted" style={{fontSize:12}}>Reward credited · verified</div>
  if (status === 'rejected') return <div className="muted" style={{fontSize:12}}>Verification failed. You can’t claim this attempt again.</div>
  if (status === 'started' && !startedAt) return <button className="btn" type="button" onClick={() => setStartedAt(Date.now())}>Continue verification</button>
  if (startedAt) {
    const remaining = Math.max(0, requiredSeconds - elapsed)
    return <div style={{display:'grid',gap:8}}><div className="muted" style={{fontSize:12}}>Verification timer: {remaining ? `${remaining}s remaining` : 'ready to submit'}</div><button className="btn" type="button" disabled={remaining > 0 || pending} onClick={() => startTransition(async () => { const fd = new FormData(); fd.set('opportunityId', opportunityId); fd.set('dwellSeconds', String(elapsed)); const result = await completeOpportunity(fd); setMessage(result.ok ? 'Reward credited.' : result.error ?? 'Unable to complete.') })}>{pending ? 'Verifying…' : 'Submit & claim reward'}</button>{message && <div className="muted" style={{fontSize:12}}>{message}</div>}</div>
  }
  return <button className="btn" type="button" disabled={pending} onClick={() => startTransition(async () => { const fd = new FormData(); fd.set('opportunityId', opportunityId); const result = await startOpportunity(fd); if (result.ok) setStartedAt(Date.now()); else setMessage(result.error ?? 'Unable to start.') })}>{pending ? 'Starting…' : 'Start opportunity'}</button>
}
