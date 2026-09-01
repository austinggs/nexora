import Link from 'next/link'
import { BadgeCheck, Settings2, ShieldCheck } from 'lucide-react'

export default function ProfilePage() {
  return <><div className="topbar"><div><div className="eyebrow">Identity</div><h1>Your profile.</h1></div><Link className="btn secondary" href="/app">Back</Link></div><section className="glass section"><div style={{display:'flex',gap:16,alignItems:'center'}}><div className="avatar" style={{width:64,height:64,fontSize:18}}>NX</div><div><h2 style={{margin:0}}>Nexorian</h2><div className="muted" style={{fontSize:12,marginTop:5}}>Member since 2026 · community builder</div></div></div><div className="stats"><div className="mining-stat"><ShieldCheck size={17}/><div style={{marginTop:8}}><strong>92 Trust</strong></div></div><div className="mining-stat"><BadgeCheck size={17}/><div style={{marginTop:8}}><strong>Verified wallet</strong></div></div><div className="mining-stat"><Settings2 size={17}/><div style={{marginTop:8}}><strong>Preferences</strong></div></div></div></section></>
}
