import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PurchaseCard } from './PurchaseCard'

export default async function MiningStorePage({ searchParams }: { searchParams?: Promise<Record<string,string|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>NEXORA Hardware Store</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data: hardware }, { data: nxa }, { data: real }] = await Promise.all([
    supabase.from('hardware_catalog').select('id,category,brand,model,virtual_price,specification').order('category').order('virtual_price').limit(120),
    supabase.rpc('nxa_balance'),
    supabase.from('transactions').select('amount,token,transaction_type').eq('user_id',user.id).eq('token','NGN'),
  ])
  const realBalance = (real ?? []).reduce((sum:number,row:any)=>sum + (row.transaction_type === 'credit' ? Number(row.amount) : -Number(row.amount)),0)
  return <main className="main"><div className="topbar"><div><div className="eyebrow">NEXORA OS / Store</div><h1>Hardware marketplace.</h1><div className="muted">Buy real-device-based virtual hardware for your rig.</div></div><Link className="btn secondary" href="/app/mining/os">OS home</Link></div>
    {params.purchased&&<div className="notice" style={{marginBottom:16}}>Purchase completed. Your hardware ownership was updated.</div>}
    {params.error&&<div className="notice" style={{marginBottom:16}}>Purchase could not be completed: {params.error}</div>}
    <section className="glass section"><div className="stats"><div className="mining-stat"><div className="muted">NXA</div><div className="value">{Number(nxa ?? 0).toLocaleString()}</div></div><div className="mining-stat"><div className="muted">NEXORA balance</div><div className="value">₦{realBalance.toLocaleString()}</div></div><div className="mining-stat"><div className="muted">Confirmation</div><div className="value" style={{fontSize:18}}>Required</div></div></div></section>
    <div className="grid" style={{marginTop:18}}>{(hardware ?? []).map((item:any)=><PurchaseCard key={item.id} hardware={item}/>)}</div>
  </main>
}
