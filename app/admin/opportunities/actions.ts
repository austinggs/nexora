'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireRole(roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in.')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !roles.includes(profile.role)) throw new Error('Not authorized.')
  return supabase
}

export async function createOpportunity(formData: FormData) {
  const supabase = await requireRole(['admin','super_admin','content_manager'])
  const result = await supabase.rpc('admin_create_opportunity', {
    p_sponsor_name: String(formData.get('sponsorName') ?? ''),
    p_title: String(formData.get('title') ?? ''),
    p_description: String(formData.get('description') ?? ''),
    p_reward_amount: Number(formData.get('rewardAmount') ?? 0),
    p_token: String(formData.get('token') ?? 'USDC'),
    p_duration_minutes: Number(formData.get('durationMinutes') ?? 5),
    p_budget_remaining: Number(formData.get('budgetRemaining') ?? 0),
  })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/opportunities')
}

export async function setOpportunityStatus(formData: FormData) {
  const supabase = await requireRole(['admin','super_admin','content_manager'])
  const result = await supabase.rpc('admin_set_opportunity_status', {
    p_opportunity_id: String(formData.get('opportunityId') ?? ''),
    p_status: String(formData.get('status') ?? 'draft'),
  })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/opportunities')
}
