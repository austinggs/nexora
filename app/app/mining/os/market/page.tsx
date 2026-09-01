import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { convertAsset } from './actions'

export default async function MarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Market</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data: holdings }, { data: nxa }] = await Promise.all([
    supabase.rpc('get_mining_asset_holdings'),
    supabase.rpc('get_my_nxa_summary'),
  ])

  return <main className="main"><div className="topbar"><div><div className="eyebrow">NEXORA OS / Market</div><h1>Virtual market.</h1><div className="muted">Real-world prices are references; NEXORA controls game value.</div></div><Link className="btn secondary" href="/app/mining/os">OS home</Link></div>
    <section className="glass section"><div className="section-head"><h3>NXA</h3><span className="muted">Internal game settlement currency</span></div><div className="stats"><div className="mining-stat"><div className="muted">Game balance</div><div className="value">{Number(nxa?.nxa_balance ?? 0).toLocaleString()} NXA</div></div><div className="mining-stat"><div className="muted">Redeemable</div><div className="value">{Number(nxa?.redeemable_nxa ?? 0).toLocaleString()} NXA</div></div><div className="mining-stat"><div className="muted">Daily issued</div><div className="value">{Number(nxa?.daily_issued ?? 0).toLocaleString()}</div></div></div></section>
    <section className="glass section"><div className="section-head"><h3>Assets</h3><span className="muted">Market reference → controlled game value</span></div>{(holdings ?? []).map((asset:any)=><div className="opp" key={asset.symbol}><div><strong>{asset.name} <span className="muted">({asset.symbol})</span></strong><div className="muted" style={{fontSize:11,marginTop:4}}>Holdings {Number(asset.quantity)} · Game value ${Number(asset.game_value_usd).toFixed(4)}</div></div><div style={{display:'grid',gap:6,minWidth:150}}><div style={{textAlign:'right'}}><strong>${Number(asset.market_price_usd).toLocaleString(undefined,{maximumFractionDigits:8})}</strong><div className="muted" style={{fontSize:10}}>real market reference · ×{Number(asset.game_value_multiplier).toFixed(3)}</div></div>{Number(asset.quantity)>0&&<form action={convertAsset} style={{display:'flex',gap:6}}><input type="hidden" name="symbol" value={asset.symbol}/><input type="number" name="quantity" min="0.00000001" step="any" max={String(asset.quantity)} placeholder="amount" required style={{minWidth:0}}/><button className="btn" type="submit">Convert to NXA</button></form>}</div></div>)}</section>
  </main>
}
