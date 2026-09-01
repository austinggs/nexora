'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from './actions'

export function FeedbackForm() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  return <form className="glass section" action={(fd) => { setMessage(''); startTransition(async () => { const r = await submitFeedback(fd); setMessage(r.ok ? 'Feedback submitted.' : (r.error || 'Unable to submit feedback.')) }) }}>
    <div className="section-head"><h3>Leave feedback</h3></div>
    <div style={{display:'grid',gap:10}}>
      <input className="input" name="targetType" placeholder="What are you reviewing? e.g. opportunity" required />
      <select className="input" name="rating" defaultValue="5"><option value="5">5 / 5</option><option value="4">4 / 5</option><option value="3">3 / 5</option><option value="2">2 / 5</option><option value="1">1 / 5</option></select>
      <textarea className="input" name="body" placeholder="Tell us what worked or needs improvement." rows={4} />
      <button className="btn" disabled={pending}>{pending ? 'Submitting…' : 'Submit feedback'}</button>
      {message && <div className="notice">{message}</div>}
    </div>
  </form>
}
