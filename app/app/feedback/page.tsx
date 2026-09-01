import Link from 'next/link'
import { MessageSquare, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FeedbackForm } from './FeedbackForm'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Feedback</div><h1>Help NEXORA improve.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>
  const { data: feedback } = await supabase.from('feedback').select('id,target_type,rating,body,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(25)
  return <>
    <div className="topbar"><div><div className="eyebrow">Feedback</div><h1>Help NEXORA improve.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <FeedbackForm />
    <section className="glass section"><div className="section-head"><h3>Your feedback</h3><MessageSquare size={16}/></div>{(feedback ?? []).map(item => <article className="thread" key={item.id}><div><strong>{item.target_type}</strong> <span className="muted"><Star size={12}/> {item.rating ?? '—'}/5</span></div><p className="thread-copy">{item.body || 'No written note.'}</p></article>)}{(feedback ?? []).length===0 && <div className="muted">No feedback submitted yet.</div>}</section>
  </>
}
