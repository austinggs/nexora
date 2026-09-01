import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3 } from 'lucide-react'

export default function WalletPage() {
  return <>
    <div className="topbar"><div><div className="eyebrow">Wallet</div><h1>Your ledger.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <div className="stats"><div className="glass stat"><div className="muted">Available</div><div className="value">$12.48</div><div className="muted" style={{fontSize:11}}>USDC</div></div><div className="glass stat"><div className="muted">Pending</div><div className="value">$2.10</div><div className="muted" style={{fontSize:11}}>processing</div></div><div className="glass stat"><div className="muted">Lifetime</div><div className="value">$38.20</div><div className="muted" style={{fontSize:11}}>earned</div></div></div>
    <section className="glass section"><div className="section-head"><h3>Transactions</h3><div className="muted" style={{fontSize:11}}>Balance is derived from ledger entries</div></div>{[
      ['Reward · Product feedback','+$0.80','completed',ArrowDownLeft],['Reward · Creator survey','+$0.45','completed',ArrowDownLeft],['Withdrawal','-$5.00','processing',ArrowUpRight],['Referral reward','+$1.20','completed',ArrowDownLeft]
    ].map(([label,amount,status,Icon]) => <div className="opp" key={label as string}><div style={{display:'flex',gap:10,alignItems:'center'}}><div className="avatar"><Icon size={15}/></div><div><strong style={{fontSize:13}}>{label as string}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{status === 'completed' ? <><CheckCircle2 size={12}/> completed</> : <><Clock3 size={12}/> processing</>}</div></div></div><strong className={String(amount).startsWith('+') ? 'reward' : ''}>{amount as string}</strong></div>)}</section>
    <p className="footer-note">Financial actions are server-authoritative. Withdrawal processing will require a verified destination wallet and idempotency protection before any funds move.</p>
  </>
}
