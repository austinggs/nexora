import Link from 'next/link'
import { BadgeCheck, MessageCircle, Search, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ExplorePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {}
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const supabase = await createClient()
  let request = supabase
    .from('threads')
    .select('id,title,body,created_at,sponsored,verified,profiles!threads_author_id_fkey(full_name,username,avatar_url)')
    .eq('status','published')
    .order('created_at',{ascending:false})
    .limit(30)
  if (query) request = request.or(`title.ilike.%${query}%,body.ilike.%${query}%`)
  const { data: threads, error } = await request

  return <>
    <div className="topbar"><div><div className="eyebrow">Community</div><h1>Explore.</h1><div className="muted">Discover real conversations from the NEXORA community.</div></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section">
      <form method="get" style={{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220,margin:0}}><label htmlFor="search">Search topics, creators and threads</label><div style={{position:'relative'}}><Search size={17} style={{position:'absolute',left:13,top:13,color:'var(--muted)'}}/><input id="search" name="q" defaultValue={query} placeholder="Try “creator economy”" style={{paddingLeft:40}} /></div></div>
        <button className="btn" type="submit">Search</button>
        {query && <Link className="btn secondary" href="/app/explore">Clear</Link>}
      </form>

      <div className="feed" style={{marginTop:18}}>
        {(threads ?? []).map((thread:any) => {
          const author = thread.profiles?.full_name ?? thread.profiles?.username ?? 'Nexorian'
          const initials = author.slice(0,2).toUpperCase()
          return <article className="thread" key={thread.id}>
            <div className="thread-head"><div className="avatar">{initials}</div><div><strong>{author}</strong><div className="muted" style={{fontSize:11,marginTop:2}}>{thread.profiles?.username ? `@${thread.profiles.username}` : 'Community member'} · {new Date(thread.created_at).toLocaleDateString()}{thread.verified ? ' · Verified' : ''}</div></div></div>
            <div style={{display:'flex',gap:6,alignItems:'center',marginTop:12}}>{thread.verified && <BadgeCheck size={15}/>} {thread.sponsored && <span className="notice" style={{padding:'3px 7px',fontSize:10}}>Sponsored</span>}</div>
            <div className="thread-title">{thread.title}</div>
            <div className="thread-copy">{thread.body}</div>
            <div className="thread-meta"><span><MessageCircle size={13}/> Discussion</span><span><Share2 size={13}/> Share</span></div>
          </article>
        })}
        {!error && (threads ?? []).length === 0 && <div className="muted">{query ? `No published threads matched “${query}”.` : 'No published community threads yet.'}</div>}
        {error && <div className="error">Unable to load the community feed right now. Please try again.</div>}
      </div>
    </section>
  </>
}
