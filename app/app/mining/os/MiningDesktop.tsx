'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, Box, Cpu, Globe2, HardDrive, Shield, Store, Users, WalletCards, X, Minus, Maximize2 } from 'lucide-react'

type AppId = 'miner'|'wallet'|'market'|'store'|'facility'|'security'|'guild'|'leaderboard'|'terminal'

type WindowState = { id: AppId; title: string; x: number; y: number; w: number; h: number; z: number }

const apps: {id:AppId;title:string;icon:React.ReactNode}[] = [
 {id:'miner',title:'Miner',icon:<Activity size={18}/>},
 {id:'wallet',title:'Wallet',icon:<WalletCards size={18}/>},
 {id:'market',title:'Market',icon:<Globe2 size={18}/>},
 {id:'store',title:'Hardware Store',icon:<Store size={18}/>},
 {id:'facility',title:'Facility',icon:<HardDrive size={18}/>},
 {id:'security',title:'CyberOps',icon:<Shield size={18}/>},
 {id:'guild',title:'Guild',icon:<Users size={18}/>},
 {id:'leaderboard',title:'Leaderboard',icon:<Box size={18}/>},
 {id:'terminal',title:'NXScript',icon:<Cpu size={18}/>},
]

export function MiningDesktop({user,rig,assets,prices,nxa}:{user:{email:string};rig:any;assets:any[];prices:any[];nxa:number}) {
 const [windows,setWindows]=useState<WindowState[]>([])
 const [nextZ,setNextZ]=useState(10)
 const open=(id:AppId)=>setWindows(ws=>ws.some(w=>w.id===id)?ws.map(w=>w.id===id?{...w,z:nextZ}:w):[...ws,{id,title:apps.find(a=>a.id===id)?.title??id,x:80+ws.length*24,y:70+ws.length*18,w:430,h:320,z:nextZ}].slice(-8))
 const close=(id:AppId)=>setWindows(ws=>ws.filter(w=>w.id!==id))
 const focus=(id:AppId)=>{setWindows(ws=>ws.map(w=>w.id===id?{...w,z:nextZ}:w));setNextZ(z=>z+1)}
 const nxaFormatted=useMemo(()=>new Intl.NumberFormat('en-US').format(nxa),[nxa])
 const appContent=(id:AppId)=>{
  if(id==='miner') return <div><div className="os-stat-grid"><div><span>Hash</span><strong>{(Number(rig?.current_hash_rate??0)/1e6).toFixed(2)} MH/s</strong></div><div><span>Rig</span><strong>{rig?.name??'NEX-01'}</strong></div></div><p className="muted">Open the full mining lab for hardware, thermal controls and facility configuration.</p><Link className="btn" href="/app/mining">Open Mining Lab</Link></div>
  if(id==='wallet') return <div><div className="os-balance">{nxaFormatted} <small>NXA</small></div><div className="muted">Game settlement currency. Real NEXORA earnings remain separate.</div><div className="os-list">{assets.length?assets.map((a:any)=><div key={a.asset_code}><span>{a.asset_code}</span><strong>{Number(a.quantity).toFixed(8)}</strong></div>):<div className="muted">No virtual assets yet.</div>}</div></div>
  if(id==='market') return <div className="os-list">{prices.map((p:any)=><div key={p.asset_code}><span><strong>{p.asset_code}</strong> <em>{Number(p.change_24h)>=0?'+':''}{Number(p.change_24h).toFixed(2)}%</em></span><strong>${Number(p.reference_usd).toFixed(6)}</strong></div>)}</div>
  if(id==='store') return <div><p className="muted">Components are purchased from the authoritative hardware catalog after explicit confirmation.</p><Link className="btn" href="/app/mining/catalog">Browse catalog</Link></div>
  if(id==='facility') return <div><p className="muted">Power, cooling, airflow, voltage and room limits are evaluated server-side.</p><Link className="btn" href="/app/mining/facility">Open Facility</Link></div>
  if(id==='security') return <div><p><strong>CyberOps</strong></p><p className="muted">Sandboxed game security layer. NXScript can only act on simulated NEXORA machines and virtual assets.</p><span className="notice">No access to real wallets, operating systems or networks.</span></div>
  if(id==='guild') return <div><p className="muted">Join guilds, contribute to Mega-Blocks and coordinate with other operators.</p><Link className="btn" href="/app/guilds">Open Guilds</Link></div>
  if(id==='leaderboard') return <div><p className="muted">Global mining rankings are calculated from server-side rig state.</p><Link className="btn" href="/app/mining">View leaderboard</Link></div>
  return <div><div className="terminal">NEXORA OS / NXScript 0.1<br/><br/><span>&gt; help</span><br/>scan() · probe() · bypass() · isolate() · defend()<br/><br/><span>&gt; status</span><br/>sandbox: ONLINE<br/>network access: DENIED</div></div>
 }
 return <main className="os-shell">
  <div className="os-topbar"><div className="os-brand">NEXORA OS</div><div className="os-topmeta"><span>{user.email}</span><span>{nxaFormatted} NXA</span><Link href="/app/mining">Exit OS</Link></div></div>
  <div className="os-desktop">
   <div className="os-grid-overlay" />
   <div className="os-shortcuts">{apps.map(a=><button key={a.id} className="os-icon" onDoubleClick={()=>{open(a.id);setNextZ(z=>z+1)}}><span>{a.icon}</span><small>{a.title}</small></button>)}</div>
   {windows.map(w=><section key={w.id} className="os-window glass" onMouseDown={()=>focus(w.id)} style={{left:w.x,top:w.y,width:w.w,height:w.h,zIndex:w.z}}><header><span>{apps.find(a=>a.id===w.id)?.icon}{w.title}</span><div><button onClick={()=>close(w.id)} aria-label="Close"><X size={14}/></button></div></header><div className="os-window-body">{appContent(w.id)}</div></section>)}
  </div>
  <footer className="os-dock">{apps.map(a=><button key={a.id} onClick={()=>{open(a.id);setNextZ(z=>z+1)}} title={a.title}>{a.icon}</button>)}</footer>
 </main>
}
