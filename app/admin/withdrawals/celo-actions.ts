'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminIdentity } from '@/lib/admin-auth'
import { broadcastCeloTokenTransfer, confirmCeloTokenTransfer } from '@/lib/celo-payout'

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function broadcastWithdrawal(formData: FormData) {
  const admin = await requireAdminIdentity(['admin','super_admin','finance_admin'])
  const withdrawalId = String(formData.get('withdrawalId') ?? '').trim()
  if (!uuid(withdrawalId)) throw new Error('Invalid withdrawal.')
  const db = createAdminClient()
  const { data: withdrawal } = await db.from('withdrawals').select('id,amount,token,wallet_address,status,provider_reference').eq('id', withdrawalId).maybeSingle()
  if (!withdrawal) throw new Error('Withdrawal not found.')
  if (withdrawal.status !== 'pending') throw new Error(`Withdrawal is already ${withdrawal.status}.`)

  const { txHash, decimals, tokenUnits } = await broadcastCeloTokenTransfer({ token: withdrawal.token, amountCents: BigInt(withdrawal.amount), destination: withdrawal.wallet_address })
  const { error } = await db.rpc('admin_record_withdrawal_result', { p_withdrawal_id: withdrawalId, p_status: 'processing', p_tx_hash: txHash, p_failure_reason: null, p_admin_username: admin.username, })
  if (error) throw new Error(error.message)
  await db.from('audit_logs').insert({ actor_id: admin.id, actor_type: 'admin', action: 'withdrawal.broadcast', target_type: 'withdrawal', target_id: withdrawalId, metadata: { admin_username: admin.username, decimals, token_units: tokenUnits.toString(), chain: 'celo' } })
  revalidatePath('/admin/withdrawals'); revalidatePath('/admin')
}

export async function confirmWithdrawal(formData: FormData) {
  const admin = await requireAdminIdentity(['admin','super_admin','finance_admin'])
  const withdrawalId = String(formData.get('withdrawalId') ?? '').trim()
  if (!uuid(withdrawalId)) throw new Error('Invalid withdrawal.')
  const db = createAdminClient()
  const { data: withdrawal } = await db.from('withdrawals').select('id,amount,token,wallet_address,status,provider_reference').eq('id', withdrawalId).maybeSingle()
  if (!withdrawal) throw new Error('Withdrawal not found.')
  if (withdrawal.status !== 'processing') throw new Error('Withdrawal must be processing before confirmation.')
  if (!withdrawal.provider_reference || !/^0x[0-9a-fA-F]{64}$/.test(withdrawal.provider_reference)) throw new Error('No valid Celo transaction hash is recorded.')
  await confirmCeloTokenTransfer({ txHash: withdrawal.provider_reference as `0x${string}`, token: withdrawal.token, destination: withdrawal.wallet_address, amountCents: BigInt(withdrawal.amount) })
  const { error } = await db.rpc('admin_record_withdrawal_result', { p_withdrawal_id: withdrawalId, p_status: 'completed', p_tx_hash: withdrawal.provider_reference, p_failure_reason: null, p_admin_username: admin.username })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/withdrawals'); revalidatePath('/admin')
}

export async function failWithdrawal(formData: FormData) {
  const admin = await requireAdminIdentity(['admin','super_admin','finance_admin'])
  const withdrawalId = String(formData.get('withdrawalId') ?? '').trim()
  const reason = String(formData.get('failureReason') ?? 'Admin rejected payout').trim().slice(0, 500)
  if (!uuid(withdrawalId)) throw new Error('Invalid withdrawal.')
  const db = createAdminClient()
  const { error } = await db.rpc('admin_record_withdrawal_result', { p_withdrawal_id: withdrawalId, p_status: 'failed', p_tx_hash: null, p_failure_reason: reason, p_admin_username: admin.username })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/withdrawals'); revalidatePath('/admin')
}
