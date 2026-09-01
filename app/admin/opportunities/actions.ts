'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TOKENS = new Set(['USDC', 'USDT', 'USDM'])
const STATUSES = new Set(['draft', 'active', 'paused', 'completed', 'expired'])

async function requireRole(roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in.')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !roles.includes(profile.role)) throw new Error('Not authorized.')
  return supabase
}

function boundedInteger(value: FormDataEntryValue | null, min: number, max: number) {
  const parsed = Number(value ?? 0)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error('Invalid numeric value.')
  return parsed
}

export async function createOpportunity(formData: FormData) {
  const supabase = await requireRole(['admin', 'super_admin', 'content_manager'])
  const sponsorName = String(formData.get('sponsorName') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const token = String(formData.get('token') ?? 'USDC').trim().toUpperCase()
  const rewardAmount = boundedInteger(formData.get('rewardAmount'), 1, Number.MAX_SAFE_INTEGER)
  const budgetRemaining = boundedInteger(formData.get('budgetRemaining'), rewardAmount, Number.MAX_SAFE_INTEGER)
  const durationMinutes = boundedInteger(formData.get('durationMinutes'), 1, 1440)

  if (!sponsorName || sponsorName.length > 120 || !title || title.length > 160 || !description || description.length > 5000) throw new Error('Invalid opportunity fields.')
  if (!TOKENS.has(token)) throw new Error('Unsupported token.')

  const result = await supabase.rpc('admin_create_opportunity', {
    p_sponsor_name: sponsorName,
    p_title: title,
    p_description: description,
    p_reward_amount: rewardAmount,
    p_token: token,
    p_duration_minutes: durationMinutes,
    p_budget_remaining: budgetRemaining,
  })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/opportunities')
  revalidatePath('/admin')
}

export async function setOpportunityStatus(formData: FormData) {
  const supabase = await requireRole(['admin', 'super_admin', 'content_manager'])
  const opportunityId = String(formData.get('opportunityId') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunityId) || !STATUSES.has(status)) throw new Error('Invalid opportunity update.')

  const result = await supabase.rpc('admin_set_opportunity_status', {
    p_opportunity_id: opportunityId,
    p_status: status,
  })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/opportunities')
  revalidatePath('/admin')
}
