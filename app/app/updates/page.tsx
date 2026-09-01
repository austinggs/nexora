import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function UpdatesPage() {
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Updates</h1><Link className="btn" href="/login">Sign in</Link></main>
  const { data: updates } = await supabase.from('updates').select('id,title,body,version,published_at').order('published_at',{ascending:false}).limit(50)
  return <>
    <div className="topbar"><div><div className="eyebrow">NEXORA</div><h1>Updates & changelog.</h1><div className="muted">Product changes, releases and important platform notices.</div></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section">{(updates??[]).length===0 ? <div className="notice">No published updates yet.</div> : (updates??[]).map((u:any)=><article className="thread" key={u.id}><div className="eyebrow">{u.version || 'Update'} · {new Date(u.published_at).toLocaleDateString()}</div><h3>{u.title}</h3><p className="thread-copy">{u.body}</p></article>)}</section>
  </>
}
