import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WithdrawalForm } from './WithdrawalForm'
import { WalletVerification } from './WalletVerification'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Wallet</div><h1>Your ledger.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>

  const [{ data: balances }, { data: transactions }, { data: withdrawals }, { data: proofs }, { data: walletVerification }] = await Promise.all([
    supabase.rpc('get_wallet_balances'),
    supabase.from('transactions').select('id,transaction_type,category,amount,token,description,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
    supabase.from('withdrawals').select('id,amount,token,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
    supabase.from('payment_proofs').select('id,token,amount,tx_hash,status,created_at,confirmed_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10),
    supabase.from('wallet_verifications').select('wallet_address,status,verified_at,network').eq('user_id',user.id).maybeSingle(),
  ])

  const balanceRows = (balances ?? []) as Array<{ token:string; available_amount:number; pending_amount:number; lifetime_earned:number }>
  const entries = [
    ...(transactions ?? []).map(t => ({ id:t.id, label:`${t.category} · ${t.description ?? ''}`.replace(/ · $/,''), token:t.token, amount:(t.transaction_type === 'credit' ? 1 : -1) * Number(t.amount), status:'completed', time:t.created_at })),
    ...(withdrawals ?? []).map(w => ({ id:w.id, label:`Withdrawal · ${w.token}`, token:w.token, amount:-Number(w.amount), status:w.status, time:w.created_at })),
  ].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0,20)

  return <>
    <div className="topbar"><div><div className="eyebrow">Wallet</div><h1>Your ledger.</h1></div><Link className="btn secondary" href="/app">Back</Link></div>
    <WalletVerification verifiedAddress={walletVerification?.status === 'verified' ? walletVerification.wallet_address : null} />
    <div className="stats">{balanceRows.length === 0 ? <div className="glass stat"><div className="muted">No balances</div><div className="value">$0.00</div><div className="muted" style={{fontSize:11}}>Complete verified earning opportunities to fund your wallet.</div></div> : balanceRows.map(row => <div className="glass stat" key={row.token}><div className="muted">{row.token} available</div><div className="value">${(Number(row.available_amount)/100).toFixed(2)}</div><div className="muted" style={{fontSize:11}}>${(Number(row.pending_amount)/100).toFixed(2)} pending · ${(Number(row.lifetime_earned)/100).toFixed(2)} earned</div></div>)}</div>
    <WithdrawalForm verifiedAddress={walletVerification?.status === 'verified' ? walletVerification.wallet_address : null} balances={balanceRows} />
    <section className="glass section"><div className="section-head"><h3>Transactions</h3><div className="muted" style={{fontSize:11}}>Server-derived from ledger entries</div></div>{entries.map(item => { const positive=item.amount >= 0; const Icon=positive ? ArrowDownLeft : ArrowUpRight; return <div className="opp" key={item.id}><div style={{display:'flex',gap:10,alignItems:'center'}}><div className="avatar"><Icon size={15}/></div><div><strong style={{fontSize:13}}>{item.label}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{item.token} · {item.status === 'completed' ? <><CheckCircle2 size={12}/> completed</> : <><Clock3 size={12}/> {item.status}</>}</div></div></div><strong className={positive ? 'reward' : ''}>{positive ? '+' : '-'}${(Math.abs(item.amount)/100).toFixed(2)}</strong></div> })}{entries.length===0 && <div className="muted">No ledger activity yet.</div>}</section>
    <section className="glass section"><div className="section-head"><h3>Payment proof</h3><div className="muted" style={{fontSize:11}}>Completed payouts are backed by their Celo transaction hash</div></div>{(proofs ?? []).map(proof => <div className="opp" key={proof.id}><div><strong style={{fontSize:13}}>{proof.token} · ${(Number(proof.amount)/100).toFixed(2)}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{proof.status} · {proof.tx_hash ? `${proof.tx_hash.slice(0,10)}…` : 'transaction pending'}</div></div>{proof.tx_hash ? <a className="btn secondary" href={`https://celoscan.io/tx/${proof.tx_hash}`} target="_blank" rel="noreferrer">View <ExternalLink size={13}/></a> : <span className="muted">Awaiting confirmation</span>}</div>)}{(proofs ?? []).length===0 && <div className="muted">No payment proofs yet.</div>}</section>
  </>
}
