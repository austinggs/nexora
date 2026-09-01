import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const authorized = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET ?? process.env.MINING_RUNTIME_CRON_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ ok: false, error: 'server configuration incomplete' }, { status: 500 })

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const at = new Date().toISOString()
  const { data: rigs, error } = await supabase.from('rigs').select('id').limit(500)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  let processed = 0
  let failed = 0
  const errors: Array<{ rig_id: string; error: string }> = []
  const batchSize = 10

  for (let i = 0; i < (rigs ?? []).length; i += batchSize) {
    const batch = (rigs ?? []).slice(i, i + batchSize)
    const results = await Promise.all(batch.map(async (rig) => ({ rig, result: await supabase.rpc('advance_rig_runtime', { p_rig_id: rig.id, p_now: at, p_source: 'cron' }) })))
    for (const { rig, result } of results) {
      if (result.error) {
        failed += 1
        if (errors.length < 20) errors.push({ rig_id: rig.id, error: result.error.message })
      } else processed += 1
    }
  }

  return NextResponse.json({ ok: failed === 0, processed, failed, errors, at })
}
