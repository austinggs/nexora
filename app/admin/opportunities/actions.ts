'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminIdentity } from '@/lib/admin-auth'

const TOKENS = new Set(['USDC', 'USDT', 'USDM'])
const STATUSES = new Set(['draft', 'active', 'paused', 'completed', 'expired'])

function boundedInteger(value: FormDataEntryValue | null, min: number, max: number) {
  const parsed = Number(value ?? 0)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error('Invalid numeric value.')
  return parsed
}

export async function createOpportunity(formData: FormData) {
  const admin = await requireAdminIdentity(['admin', 'super_admin', 'content_manager'])
  const sponsorName = String(formData.get('sponsorName') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const token = String(formData.get('token') ?? 'USDC').trim().toUpperCase()
  const rewardAmount = boundedInteger(formData.get('rewardAmount'), 1, Number.MAX_SAFE_INTEGER)
  const budgetRemaining = boundedInteger(formData.get('budgetRemaining'), rewardAmount, Number.MAX_SAFE_INTEGER)
  const durationMinutes = boundedInteger(formData.get('durationMinutes'), 1, 1440)

  if (!sponsorName || sponsorName.length > 120 || !title || title.length > 160 || !description || description.length > 5000) throw new Error('Invalid opportunity fields.')
  if (!TOKENS.has(token)) throw new Error('Unsupported token.')

  const db = createAdminClient()
  const { data, error } = await db.from('opportunities').insert({
    sponsor_name: sponsorName,
    title,
    description,
    reward_amount: rewardAmount,
    token,
    duration_minutes: durationMinutes,
    budget_remaining: budgetRemaining,
    status: 'draft',
  }).select('id').single()
  if (error) throw new Error(error.message)

  await db.from('audit_logs').insert({ actor_id: null, actor_type: 'manual_admin', action: 'opportunity.create', target_type: 'opportunity', target_id: data.id, metadata: { admin_username: admin.username } })
  revalidatePath('/admin/opportunities')
  revalidatePath('/admin')
}

export async function setOpportunityStatus(formData: FormData) {
  const admin = await requireAdminIdentity(['admin', 'super_admin', 'content_manager'])
  const opportunityId = String(formData.get('opportunityId') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunityId) || !STATUSES.has(status)) throw new Error('Invalid opportunity update.')

  const db = createAdminClient()
  const { error } = await db.from('opportunities').update({ status }).eq('id', opportunityId)
  if (error) throw new Error(error.message)
  await db.from('audit_logs').insert({ actor_id: null, actor_type: 'manual_admin', action: `opportunity.${status}`, target_type: 'opportunity', target_id: opportunityId, metadata: { admin_username: admin.username } })
  revalidatePath('/admin/opportunities')
  revalidatePath('/admin')
}
