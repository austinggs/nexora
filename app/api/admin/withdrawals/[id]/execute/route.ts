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
  const { data: rows, error: listError } = await supabase.rpc('admin_list_withdrawals', { p_status: 'pending' })
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })
  const withdrawal = (rows ?? []).find((row: { id: string }) => row.id === id)
  if (!withdrawal) return NextResponse.json({ error: 'Pending withdrawal not found' }, { status: 404 })
  if (!process.env.CELO_PAYOUT_PRIVATE_KEY) return NextResponse.json({ error: 'Celo payout signer is not configured' }, { status: 503 })

  try {
    const { error: debitError } = await supabase.rpc('record_withdrawal_debit', {
      p_withdrawal_id: withdrawal.id,
      p_reference: `withdrawal:${withdrawal.id}`,
    })
    if (debitError) throw new Error(debitError.message)

    const hash = await sendCeloToken(withdrawal.token as SupportedToken, withdrawal.wallet_address as `0x${string}`, BigInt(withdrawal.amount))
    const { error: processingError } = await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: 'processing',
      p_provider_reference: hash,
      p_failure_reason: null,
    })
    if (processingError) throw new Error(processingError.message)

    const receipt = await waitForCeloTransfer(hash)
    const completed = receipt.status === 'success'
    const { error: transitionError } = await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: completed ? 'completed' : 'failed',
      p_provider_reference: hash,
      p_failure_reason: completed ? null : 'Celo transaction reverted',
    })
    if (transitionError) throw new Error(transitionError.message)

    if (completed) {
      const { error: proofError } = await supabase.from('payment_proofs').insert({
        withdrawal_id: withdrawal.id,
        user_id: withdrawal.user_id,
        direction: 'outbound',
        chain: 'celo',
        token: withdrawal.token,
        amount: withdrawal.amount,
        tx_hash: hash,
        to_address: withdrawal.wallet_address.toLowerCase(),
        explorer_url: celoExplorerUrl(hash),
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      if (proofError) throw new Error(proofError.message)
    }

    return NextResponse.json({ ok: completed, withdrawalId: withdrawal.id, transactionHash: hash, explorerUrl: celoExplorerUrl(hash), receiptStatus: receipt.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Celo payout failed'
    await supabase.rpc('admin_transition_withdrawal', {
      p_withdrawal_id: withdrawal.id,
      p_status: 'failed',
      p_provider_reference: withdrawal.provider_reference ?? null,
      p_failure_reason: message.slice(0, 500),
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
