import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markPingRead } from './actions'

export default async function PingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Pings</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data: pings }, { data: prefs }] = await Promise.all([
    supabase.from('pings').select('id,title,body,deep_link,read_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50),
    supabase.rpc('get_or_create_notification_preferences')
  ])

  return <>
    <div className="topbar"><div><div className="eyebrow">Communication</div><h1>Your pings.</h1><div className="muted">Interest-based updates, earning opportunities and system notices.</div></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section"><div className="section-head"><h3>Notification preferences</h3><span className="muted">server-backed</span></div><form action="/api/preferences" method="post" style={{display:'grid',gap:10}}><label><input type="checkbox" name="pings_enabled" defaultChecked={prefs?.pings_enabled ?? true}/> Interest pings</label><label><input type="checkbox" name="system_enabled" defaultChecked={prefs?.system_enabled ?? true}/> System notifications</label><label><input type="checkbox" name="push_enabled" defaultChecked={prefs?.push_enabled ?? true}/> Push-ready notifications</label><button className="btn" type="submit">Save preferences</button></form></section>
    <section className="glass section"><div className="section-head"><h3>Inbox</h3><span className="muted">{(pings ?? []).filter(p=>!p.read_at).length} unread</span></div>{(pings ?? []).length===0 ? <div className="notice">No pings yet. New interest matches and system events will appear here.</div> : (pings ?? []).map(p => <article className="opp" key={p.id} style={{opacity:p.read_at?0.7:1}}><div><strong>{p.title}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{new Date(p.created_at).toLocaleString()}</div><p className="thread-copy">{p.body}</p>{p.deep_link && <Link className="btn secondary" href={p.deep_link}>Open</Link>}</div>{!p.read_at && <form action={markPingRead}><input type="hidden" name="id" value={p.id}/><button className="btn" type="submit">Mark read</button></form>}</article>))}</section>
  </>
}
