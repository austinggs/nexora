'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveFacility(formData: FormData) {
  const n = (key:string, fallback:string) => String(formData.get(key) ?? fallback)
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return { ok:false, error:'Please sign in.' }
  const { error } = await supabase.rpc('configure_mining_facility', {
    p_voltage_v:Number(n('voltage','230')), p_phase:n('phase','single'), p_service_amps:Number(n('amps','16')),
    p_ambient_temp_c:Number(n('ambient','24')), p_room_volume_m3:Number(n('volume','30')),
    p_airflow_cfm:Number(n('airflow','250')), p_exhaust_cfm:Number(n('exhaust','0')), p_cooling_capacity_w:Number(n('cooling','1000')),
  })
  if (error) return { ok:false, error:error.message }
  revalidatePath('/app/mining/facility')
  revalidatePath('/app/mining')
  return { ok:true }
}
