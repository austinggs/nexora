import Link from 'next/link'
import { Bell, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Pings</div><h1>Stay in the loop.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>
  const { data: pings } = await supabase.from('pings').select('id,title,body,deep_link,read_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
  return <><div className="topbar"><div><div className="eyebrow">Pings</div><h1>Stay in the loop.</h1></div><Link className="btn secondary" href="/app">Back</Link></div><section className="glass section">{(pings ?? []).map(p => <div className="opp" key={p.id}><div style={{display:'flex',gap:10}}><div className="avatar">{p.read_at ? <CheckCircle2 size={15}/> : <Sparkles size={15}/>}</div><div><strong>{p.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{p.body}</div>{p.deep_link && <Link href={p.deep_link} className="muted" style={{fontSize:11,display:'inline-block',marginTop:6}}>Open</Link>}</div></div><span className="muted" style={{fontSize:11}}>{new Date(p.created_at).toLocaleString()}</span></div>)}{(pings ?? []).length===0 && <div className="muted">No pings yet.</div>}</section></>
}
