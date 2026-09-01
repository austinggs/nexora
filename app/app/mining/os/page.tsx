import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MiningDesktop } from './MiningDesktop'

export default async function MiningOSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <main className="section"><h1>NEXORA OS</h1><Link className="btn" href="/login">Sign in</Link></main>

  const [{ data: rig }, { data: assets }, { data: prices }, { data: nxa }, { data: runtime }] = await Promise.all([
    supabase.from('rigs').select('id,name,current_hash_rate,config').eq('user_id', user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),
    supabase.from('mining_assets').select('asset_code,quantity').eq('user_id', user.id).order('asset_code'),
    supabase.from('mining_asset_prices').select('asset_code,reference_usd,game_usd,change_24h').order('asset_code'),
    supabase.rpc('nxa_balance'),
    supabase.rpc('refresh_my_rig_runtime'),
  ])

  return <MiningDesktop user={{ email: user.email ?? 'operator' }} rig={rig} assets={assets ?? []} prices={prices ?? []} nxa={Number(nxa ?? 0)} runtime={runtime ?? undefined} />
}
