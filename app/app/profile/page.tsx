import Link from 'next/link'
import { BadgeCheck, Settings2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Identity</div><h1>Your profile.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>
  const { data: profile } = await supabase.from('profiles').select('full_name,username,bio,trust_score,created_at,onboarding_complete').eq('id',user.id).maybeSingle()
  const memberSince = profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()
  return <><div className="topbar"><div><div className="eyebrow">Identity</div><h1>Your profile.</h1></div><Link className="btn secondary" href="/app">Back</Link></div><section className="glass section"><div style={{display:'flex',gap:16,alignItems:'center'}}><div className="avatar" style={{width:64,height:64,fontSize:18}}>{(profile?.full_name ?? profile?.username ?? 'NX').slice(0,2).toUpperCase()}</div><div><h2 style={{margin:0}}>{profile?.full_name ?? profile?.username ?? 'Nexorian'}</h2><div className="muted" style={{fontSize:12,marginTop:5}}>@{profile?.username ?? 'nexorian'} · member since {memberSince}</div>{profile?.bio && <div className="thread-copy" style={{marginTop:8}}>{profile.bio}</div>}</div></div><div className="stats"><div className="mining-stat"><ShieldCheck size={17}/><div style={{marginTop:8}}><strong>{profile?.trust_score ?? 0} Trust</strong></div></div><div className="mining-stat"><BadgeCheck size={17}/><div style={{marginTop:8}}><strong>{profile?.onboarding_complete ? 'Onboarding complete' : 'Onboarding pending'}</strong></div></div><div className="mining-stat"><Settings2 size={17}/><div style={{marginTop:8}}><strong>Preferences</strong></div></div></div></section></>
}
