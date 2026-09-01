import Link from 'next/link'
import { Bell, CheckCircle2, Sparkles } from 'lucide-react'

export default function NotificationsPage() {
  return <><div className="topbar"><div><div className="eyebrow">Pings</div><h1>Stay in the loop.</h1></div><Link className="btn secondary" href="/app">Back</Link></div><section className="glass section"><div className="opp"><div style={{display:'flex',gap:10}}><div className="avatar"><Sparkles size={15}/></div><div><strong>New verified opportunity</strong><div className="muted" style={{fontSize:11,marginTop:4}}>Product feedback sprint · +$0.80</div></div></div><span className="muted">now</span></div><div className="opp"><div style={{display:'flex',gap:10}}><div className="avatar"><Bell size={15}/></div><div><strong>Weekly builder digest</strong><div className="muted" style={{fontSize:11,marginTop:4}}>5 rigs, 3 guilds and the latest mining balance notes.</div></div></div><CheckCircle2 size={15}/></div></section></>
}
