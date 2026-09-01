import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createGuild, joinGuild, leaveGuild, contribute } from './actions'

export default async function GuildsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><Link className="btn" href="/login">Sign in</Link></main>
  const { data: guilds } = await supabase.from('guilds').select('id,name,member_count,mega_block_progress,mega_block_threshold,owner_id,created_at').order('mega_block_progress',{ascending:false}).limit(30)
  const { data: memberships } = await supabase.from('guild_memberships').select('guild_id,total_contribution').eq('user_id',user.id)
  const memberMap = new Map((memberships ?? []).map(m=>[m.guild_id,m.total_contribution]))
  const createGuildAction = async (formData: FormData) => { 'use server'; await createGuild(formData) }
  const joinGuildAction = async (formData: FormData) => { 'use server'; await joinGuild(formData) }
  const leaveGuildAction = async (formData: FormData) => { 'use server'; await leaveGuild(formData) }
  const contributeAction = async (formData: FormData) => { 'use server'; await contribute(formData) }
  return <main className="main" style={{paddingTop:32}}><div className="topbar"><div><div className="eyebrow">Mining social</div><h1>Guilds & Mega-Blocks.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <section className="glass section"><div className="section-head"><div><h3>Create guild</h3><div className="muted" style={{fontSize:11}}>Guild progress is shared and persistent.</div></div></div><form action={createGuildAction} style={{display:'flex',gap:8}}><input className="input" name="name" placeholder="Guild name" required/><button className="btn" type="submit">Create</button></form></section>
    <section className="section" style={{padding:0,display:'grid',gap:10}}>{(guilds??[]).map(g=>{const joined=memberMap.has(g.id); const pct=Math.min(100,g.mega_block_threshold ? Number(g.mega_block_progress)/Number(g.mega_block_threshold)*100:0); return <article className="glass section" key={g.id}><div className="section-head"><div><h3>{g.name}</h3><div className="muted" style={{fontSize:11}}>{g.member_count} members · {Number(g.mega_block_progress).toLocaleString()} / {Number(g.mega_block_threshold).toLocaleString()} progress</div></div><span className="badge">{joined?'Member':'Open'}</span></div><div className="meter"><span style={{width:`${pct}%`}} /></div><div className="muted" style={{fontSize:11,marginTop:8}}>Your contribution: {Number(memberMap.get(g.id)??0).toLocaleString()}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>{joined ? <><form action={contributeAction}><input type="hidden" name="guildId" value={g.id}/><input type="hidden" name="amount" value="1000"/><button className="btn" type="submit">Contribute 1,000</button></form><form action={leaveGuildAction}><input type="hidden" name="guildId" value={g.id}/><button className="btn secondary" type="submit">Leave</button></form></> : <form action={joinGuildAction}><input type="hidden" name="guildId" value={g.id}/><button className="btn" type="submit">Join guild</button></form>}</div></article>})}</section>
  </main>
}
