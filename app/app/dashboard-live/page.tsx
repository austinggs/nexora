import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type ThreadRow = { id:string; title:string; body:string; created_at:string; profiles?: Array<{ full_name:string|null; username:string|null }> }

export default async function LiveDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <main className="section"><h1>Sign in required</h1><Link className="btn" href="/login">Sign in</Link></main>
  }

  const [{ data: profile }, { data: opportunities }, { data: threads }] = await Promise.all([
    supabase.from('profiles').select('full_name,username,trust_score').eq('id', user.id).maybeSingle(),
    supabase.from('opportunities').select('id,title,description,reward_amount,duration_minutes,sponsor_name').eq('status','active').order('created_at',{ascending:false}).limit(5),
    supabase.from('threads').select('id,title,body,created_at,profiles!threads_author_id_fkey(full_name,username)').eq('status','published').order('created_at',{ascending:false}).limit(5),
  ])

  const threadRows = (threads ?? []) as unknown as ThreadRow[]

  return <>
    <header className="topbar"><div><div className="eyebrow">Live Supabase data</div><h1>{profile?.full_name ? `Good to see you, ${profile.full_name}.` : 'Your NEXORA dashboard.'}</h1></div><Link className="btn secondary" href="/app">Back to dashboard</Link></header>
    <section className="stats">
      <div className="glass stat"><div className="muted">Trust score</div><div className="value">{profile?.trust_score ?? 0}</div><div className="muted" style={{fontSize:11}}>server-backed profile</div></div>
      <div className="glass stat"><div className="muted">Opportunities</div><div className="value">{opportunities?.length ?? 0}</div><div className="muted" style={{fontSize:11}}>active now</div></div>
      <div className="glass stat"><div className="muted">Community</div><div className="value">{threadRows.length}</div><div className="muted" style={{fontSize:11}}>recent threads</div></div>
    </section>
    <div className="grid">
      <section className="glass section"><div className="section-head"><h3>Verified opportunities</h3><span className="muted">Supabase</span></div>{(opportunities ?? []).map(o => <article className="thread" key={o.id}><strong>{o.title}</strong><div className="muted" style={{fontSize:11,marginTop:6}}>{o.sponsor_name} · {o.duration_minutes} min</div><p className="thread-copy">{o.description}</p><div className="reward">+${(Number(o.reward_amount) / 100).toFixed(2)}</div></article>)}</section>
      <section className="glass section"><div className="section-head"><h3>Recent community</h3><span className="muted">Live</span></div>{threadRows.map(t => { const author = Array.isArray(t.profiles) ? t.profiles[0] : undefined; return <article className="thread" key={t.id}><strong>{t.title}</strong><div className="muted" style={{fontSize:11,marginTop:6}}>{author?.full_name ?? author?.username ?? 'Nexorian'}</div><p className="thread-copy">{t.body}</p></article> })}</section>
    </div>
  </>
}
