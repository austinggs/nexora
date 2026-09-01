import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processCeloWithdrawal } from '@/lib/finance/celo-payout'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !['admin', 'super_admin', 'finance_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid withdrawal id' }, { status: 400 })
  }

  try {
    const withdrawal = await processCeloWithdrawal(id)
    return NextResponse.json({ withdrawal })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payout failed or requires reconciliation'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
