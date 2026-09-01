import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PurchaseCard } from './PurchaseCard'

export default async function MiningStorePage({ searchParams }: { searchParams?: Promise<Record<string,string|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>NEXORA Hardware Store</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data: hardware }, { data: nxa }, { data: real }, { data: economy }] = await Promise.all([
    supabase.from('hardware_catalog').select('id,category,brand,model,virtual_price,specification').order('category').order('virtual_price').limit(120),
    supabase.rpc('nxa_balance'),
    supabase.from('transactions').select('amount,token,transaction_type').eq('user_id',user.id).eq('token','NGN'),
    supabase.from('nxa_economy_state').select('nxa_ngn_reference').eq('singleton',true).maybeSingle(),
  ])
  const realBalance = (real ?? []).reduce((sum:number,row:any)=>sum + (row.transaction_type === 'credit' ? Number(row.amount) : -Number(row.amount)),0)
  const nxaNgnReference = Number(economy?.nxa_ngn_reference ?? 40)
  return <main className="main"><div className="topbar"><div><div className="eyebrow">NEXORA OS / Store</div><h1>Hardware marketplace.</h1><div className="muted">Real-device-based virtual hardware with separate game and real-value purchase rails.</div></div><Link className="btn secondary" href="/app/mining/os">OS home</Link></div>
    {params.purchased&&<div className="notice" style={{marginBottom:16}}>Purchase completed. Your hardware ownership was updated.</div>}
    {params.error&&<div className="notice" style={{marginBottom:16}}>Purchase could not be completed: {params.error}</div>}
    <section className="glass section"><div className="stats"><div className="mining-stat"><div className="muted">NXA</div><div className="value">{Number(nxa ?? 0).toLocaleString()}</div><div className="muted" style={{fontSize:10}}>game balance</div></div><div className="mining-stat"><div className="muted">NEXORA balance</div><div className="value">₦{realBalance.toLocaleString()}</div><div className="muted" style={{fontSize:10}}>real-value ledger</div></div><div className="mining-stat"><div className="muted">Reference</div><div className="value">₦{nxaNgnReference.toLocaleString()}</div><div className="muted" style={{fontSize:10}}>per NXA · not a fixed peg</div></div></div><div className="muted" style={{fontSize:11,marginTop:8}}>Real-wallet purchases always require explicit confirmation and are independently ledgered from NXA.</div></section>
    <div className="grid" style={{marginTop:18}}>{(hardware ?? []).map((item:any)=><PurchaseCard key={item.id} hardware={item} nxaNgnReference={nxaNgnReference}/>)}</div>
  </main>
}
