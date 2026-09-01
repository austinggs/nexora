import Link from 'next/link'
import { Flag, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Safety</div><h1>Community reports.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>

  const { data: reports } = await supabase.from('reports').select('id,target_type,target_id,reason,status,created_at').eq('reporter_id',user.id).order('created_at',{ascending:false}).limit(25)
  return <>
    <div className="topbar"><div><div className="eyebrow">Safety</div><h1>Community reports.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section"><div className="notice"><ShieldCheck size={16}/> Reports are private to you and the moderation team. Decisions are recorded server-side.</div>
      <div style={{display:'grid',gap:10,marginTop:18}}>{(reports ?? []).map(r => <article className="thread" key={r.id}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong><Flag size={14}/> {r.target_type}</strong><span className="badge">{r.status}</span></div><p className="thread-copy">{r.reason}</p><div className="muted" style={{fontSize:11}}>{new Date(r.created_at).toLocaleString()}</div></article>)}{(reports ?? []).length===0 && <div className="muted">No reports submitted.</div>}</div>
    </section>
  </>
}
