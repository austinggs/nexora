'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminIdentity } from '@/lib/admin-auth'

export async function transitionWithdrawal(formData: FormData) {
  const admin = await requireAdminIdentity(['admin','super_admin','finance_admin'])
  const withdrawalId = String(formData.get('withdrawalId') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim().toLowerCase()
  const providerReference = String(formData.get('providerReference') ?? '').trim() || null
  const failureReason = String(formData.get('failureReason') ?? '').trim() || null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(withdrawalId)) throw new Error('Invalid withdrawal.')
  if (!['processing','completed','failed','reversed'].includes(status)) throw new Error('Invalid withdrawal status.')

  const db = createAdminClient()
  const { data: current } = await db.from('withdrawals').select('*').eq('id', withdrawalId).maybeSingle()
  if (!current) throw new Error('Withdrawal not found.')
  if (current.status === 'completed' && status !== 'completed') throw new Error('A completed withdrawal cannot be reopened.')
  if (status === 'completed' && !providerReference) throw new Error('A confirmed Celo transaction hash is required.')

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (providerReference) patch.provider_reference = providerReference
  if (failureReason) patch.failure_reason = failureReason
  if (status === 'processing') patch.provider_reference = providerReference
  if (status === 'completed') patch.completed_at = new Date().toISOString()
  if (status === 'processing') patch.processed_at = new Date().toISOString()

  const { error } = await db.from('withdrawals').update(patch).eq('id', withdrawalId)
  if (error) throw new Error(error.message)

  await db.from('audit_logs').insert({
    actor_id: null,
    actor_type: 'manual_admin',
    action: `withdrawal.${status}`,
    target_type: 'withdrawal',
    target_id: withdrawalId,
    metadata: { admin_username: admin.username, provider_reference: providerReference },
  })

  revalidatePath('/admin/withdrawals')
  revalidatePath('/admin')
}
