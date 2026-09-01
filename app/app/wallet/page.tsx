import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WithdrawalForm } from './WithdrawalForm'
import { WalletVerification } from './WalletVerification'

type BalanceRow = { token: string; available_amount: number; pending_amount: number; lifetime_earned: number }

function formatUsd(cents: number) {
  return `$${(Number(cents) / 100).toFixed(2)}`
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><div className="topbar"><div><div className="eyebrow">Wallet</div><h1>Your ledger.</h1></div><Link className="btn" href="/login">Sign in</Link></div></main>

  const [{ data: balances, error: balancesError }, { data: transactions }, { data: withdrawals }, { data: proofs }, { data: walletVerification }] = await Promise.all([
    supabase.rpc('get_wallet_balances'),
    supabase.from('transactions').select('id,transaction_type,category,amount,token,description,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('withdrawals').select('id,amount,token,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('payment_proofs').select('id,token,amount,tx_hash,status,created_at,confirmed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('wallet_verifications').select('wallet_address,status,verified_at,network').eq('user_id', user.id).maybeSingle(),
  ])

  const balanceRows = (balances ?? []) as BalanceRow[]
  const verifiedAddress = walletVerification?.status === 'verified' && walletVerification.network === 'celo'
    ? walletVerification.wallet_address
    : null
  const pendingWithdrawals = (withdrawals ?? []).filter(item => item.status === 'pending' || item.status === 'processing')
  const entries = (transactions ?? []).map(t => ({
    id: t.id,
    label: `${t.category} · ${t.description ?? ''}`.replace(/ · $/, ''),
    token: t.token,
    amount: (t.transaction_type === 'credit' ? 1 : -1) * Number(t.amount),
    time: t.created_at,
  })).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30)

  return <>
    <div className="topbar"><div><div className="eyebrow">Wallet</div><h1>Your ledger.</h1><div className="muted">Balances are separated by token; withdrawals always use your verified Celo address.</div></div><Link className="btn secondary" href="/app">Back</Link></div>

    <WalletVerification verifiedAddress={verifiedAddress} />

    {balancesError && <div className="error" style={{marginBottom:14}}>Wallet balances are temporarily unavailable. Your ledger entries remain stored server-side.</div>}

    <div className="stats wallet-stats">
      {balanceRows.length === 0 ? <div className="glass stat"><div className="muted">No balances</div><div className="value">$0.00</div><div className="muted" style={{fontSize:11}}>Complete a verified earning opportunity to fund a token balance.</div></div> : balanceRows.map(row => <div className="glass stat" key={row.token}><div className="muted">{row.token} available</div><div className="value">{formatUsd(row.available_amount)}</div><div className="muted" style={{fontSize:11}}>{formatUsd(row.pending_amount)} pending · {formatUsd(row.lifetime_earned)} earned</div></div>)}
    </div>

    <WithdrawalForm verifiedAddress={verifiedAddress} balances={balanceRows} />

    <section className="glass section">
      <div className="section-head"><div><h3>Pending withdrawals</h3><div className="muted" style={{fontSize:11}}>Funds are reserved until the payout is completed or reversed.</div></div><ShieldCheck size={17}/></div>
      {pendingWithdrawals.length === 0 ? <div className="muted">No pending withdrawals.</div> : pendingWithdrawals.map(item => <div className="opp" key={item.id}><div><strong style={{fontSize:13}}>{item.token} withdrawal</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{formatUsd(Number(item.amount))} · {item.status}</div></div><span className="reward">Reserved</span></div>)}
    </section>

    <section className="glass section"><div className="section-head"><h3>Ledger activity</h3><div className="muted" style={{fontSize:11}}>Each row is a single ledger entry.</div></div>{entries.map(item => { const positive = item.amount >= 0; const Icon = positive ? ArrowDownLeft : ArrowUpRight; return <div className="opp" key={item.id}><div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}><div className="avatar"><Icon size={15}/></div><div style={{minWidth:0}}><strong style={{fontSize:13,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{item.token} · <CheckCircle2 size={12} style={{verticalAlign:'-2px'}}/> recorded</div></div></div><strong className={positive ? 'reward' : ''}>{positive ? '+' : '-'}{formatUsd(Math.abs(item.amount))}</strong></div> })}{entries.length === 0 && <div className="muted">No ledger activity yet.</div>}</section>

    <section className="glass section"><div className="section-head"><div><h3>Payment proof</h3><div className="muted" style={{fontSize:11}}>Completed payouts are backed by their Celo transaction hash.</div></div></div>{(proofs ?? []).map(proof => <div className="opp" key={proof.id}><div style={{minWidth:0}}><strong style={{fontSize:13}}>{proof.token} · {formatUsd(Number(proof.amount))}</strong><div className="muted" style={{fontSize:11,marginTop:4}}>{proof.status} · {proof.tx_hash ? `${proof.tx_hash.slice(0,10)}…` : 'transaction pending'}{proof.confirmed_at ? ` · confirmed ${new Date(proof.confirmed_at).toLocaleDateString()}` : ''}</div></div>{proof.tx_hash ? <a className="btn secondary" href={`https://celoscan.io/tx/${proof.tx_hash}`} target="_blank" rel="noreferrer">View <ExternalLink size={13}/></a> : <span className="muted"><Clock3 size={13}/> awaiting</span>}</div>)}{(proofs ?? []).length === 0 && <div className="muted">No payment proofs yet.</div>}</section>
  </>
}
