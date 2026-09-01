'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function maintainHardware(formData: FormData) {
  const hardwareId = String(formData.get('hardware_id') ?? '')
  const expectedHealth = Number(formData.get('expected_health') ?? -1)
  const costNxa = Number(formData.get('cost_nxa') ?? -1)
  if (!hardwareId || !Number.isFinite(expectedHealth) || expectedHealth < 0 || expectedHealth > 100 || !Number.isInteger(costNxa) || costNxa < 0 || costNxa > 100000000) {
    redirect('/app/mining/os/hardware?error=invalid')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('apply_hardware_maintenance', {
    p_user_hardware_id: hardwareId,
    p_expected_health: expectedHealth,
    p_cost_nxa: costNxa,
  })
  if (error) redirect(`/app/mining/os/hardware?error=${encodeURIComponent(error.message)}`)
  redirect('/app/mining/os/hardware?maintained=1')
}
