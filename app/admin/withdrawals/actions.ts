'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function transitionWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in.')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile?.role || !['admin','super_admin','finance_admin'].includes(profile.role)) throw new Error('Not authorized.')
  const result = await supabase.rpc('admin_transition_withdrawal', {
    p_withdrawal_id: String(formData.get('withdrawalId') ?? ''),
    p_status: String(formData.get('status') ?? ''),
    p_provider_reference: String(formData.get('providerReference') ?? '') || null,
    p_failure_reason: String(formData.get('failureReason') ?? '') || null,
  })
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/admin/withdrawals')
  revalidatePath('/admin')
}
