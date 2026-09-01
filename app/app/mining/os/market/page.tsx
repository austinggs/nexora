import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>Market</h1><Link className="btn" href="/login">Sign in</Link></main>

  const { data: assets } = await supabase.from('mining_assets').select('symbol,name,market_price_usd,game_value_multiplier,difficulty,updated_at').order('symbol')
  const { data: nxa } = await supabase.rpc('get_my_nxa_summary')

  return <main className="main"><div className="topbar"><div><div className="eyebrow">NEXORA OS / Market</div><h1>Virtual market.</h1><div className="muted">Real-world prices are references; NEXORA controls game value.</div></div><Link className="btn secondary" href="/app/mining/os">OS home</Link></div>
    <section className="glass section"><div className="section-head"><h3>NXA</h3><span className="muted">Internal game settlement currency</span></div><div className="stats"><div className="mining-stat"><div className="muted">Game balance</div><div className="value">{Number(nxa?.nxa_balance ?? 0).toLocaleString()} NXA</div></div><div className="mining-stat"><div className="muted">Redeemable</div><div className="value">{Number(nxa?.redeemable_nxa ?? 0).toLocaleString()} NXA</div></div><div className="mining-stat"><div className="muted">Daily issued</div><div className="value">{Number(nxa?.daily_issued ?? 0).toLocaleString()}</div></div></div></section>
    <section className="glass section"><div className="section-head"><h3>Assets</h3><span className="muted">Reference pricing + game multiplier</span></div>{(assets ?? []).map((asset:any)=><div className="opp" key={asset.symbol}><div><strong>{asset.name} <span className="muted">({asset.symbol})</span></strong><div className="muted" style={{fontSize:11,marginTop:4}}>Difficulty {Number(asset.difficulty).toLocaleString()} · Game factor {Number(asset.game_value_multiplier).toFixed(3)}×</div></div><div style={{textAlign:'right'}}><strong>${Number(asset.market_price_usd).toLocaleString(undefined,{maximumFractionDigits:6})}</strong><div className="muted" style={{fontSize:10}}>market reference</div></div></div>)}</section>
  </main>
}
