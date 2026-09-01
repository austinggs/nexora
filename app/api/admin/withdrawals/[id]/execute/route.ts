import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCeloToken, waitForCeloTransfer, celoExplorerUrl, type SupportedToken } from '@/lib/celo'

const FINANCE_ROLES = new Set(['admin', 'super_admin', 'finance_admin'])

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || !FINANCE_ROLES.has(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .select('id,user_id,amount,token,wallet_address,status,provider_reference')
    .eq('id', id)
    .maybeSingle()
  if (error || !withdrawal) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
  if (withdrawal.status !== 'pending') return NextResponse.json({ error: `Withdrawal is ${withdrawal.status}` }, { status: 409 })
  if (!process.env.CELO_PAYOUT_PRIVATE_KEY) return NextResponse.json({ error: 'Celo payout signer is not configured' }, { status: 503 })

  try {
    await supabase.rpc('record_withdrawal_debit', {
      p_withdrawal_id: withdrawal.id,
      p_reference: `withdrawal:${withdrawal.id}`,
    })

    const hash = await sendCeloToken(withdrawal.token as SupportedToken, withdrawal.wallet_address as `0x${string}`, BigInt(withdrawal.amount))
    await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: 'processing',
      p_provider_reference: hash,
      p_failure_reason: null,
    })

    const receipt = await waitForCeloTransfer(hash)
    const completed = receipt.status === 'success'
    await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: completed ? 'completed' : 'failed',
      p_provider_reference: hash,
      p_failure_reason: completed ? null : 'Celo transaction reverted',
    })

    return NextResponse.json({ ok: completed, withdrawalId: withdrawal.id, transactionHash: hash, explorerUrl: celoExplorerUrl(hash), receiptStatus: receipt.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Celo payout failed'
    await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: 'failed',
      p_provider_reference: withdrawal.provider_reference,
      p_failure_reason: message.slice(0, 500),
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
