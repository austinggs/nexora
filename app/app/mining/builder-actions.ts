'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function purchaseHardware(formData: FormData) {
  const hardwareId = String(formData.get('hardwareId') ?? '')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !hardwareId) return { ok: false, error: 'Invalid request.' }
  const { error } = await supabase.rpc('purchase_hardware', { p_hardware_id: hardwareId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  return { ok: true }
}

export async function configureRig(formData: FormData) {
  const fields = ['gpuId','cpuId','motherboardId','ramId','coolingId','psuId']
  const values = Object.fromEntries(fields.map(key => [key, String(formData.get(key) ?? '')]))
  if (Object.values(values).some(v => !v)) return { ok: false, error: 'Select every required component.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }
  const { error } = await supabase.rpc('configure_my_rig_full', {
    p_gpu_id: values.gpuId,
    p_cpu_id: values.cpuId,
    p_motherboard_id: values.motherboardId,
    p_ram_id: values.ramId,
    p_cooling_id: values.coolingId,
    p_psu_id: values.psuId,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  return { ok: true }
}

export async function configureMultiGpuRig(formData: FormData) {
  const gpuIds = String(formData.get('gpuIds') ?? '').split(',').map(x => x.trim()).filter(Boolean)
  const pCpu = String(formData.get('cpuId') ?? '')
  const pBoard = String(formData.get('motherboardId') ?? '')
  const pRam = String(formData.get('ramId') ?? '')
  const pCooling = String(formData.get('coolingId') ?? '')
  const psuIds = String(formData.get('psuIds') ?? '').split(',').map(x => x.trim()).filter(Boolean)
  const riserIds = String(formData.get('riserIds') ?? '').split(',').map(x => x.trim()).filter(Boolean)
  if (!gpuIds.length || !pCpu || !pBoard || !pRam || !pCooling || !psuIds.length) return { ok: false, error: 'Select GPUs, CPU, motherboard, RAM, cooling and at least one PSU.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }
  const { error } = await supabase.rpc('configure_multi_gpu_rig', {
    p_gpu_ids: gpuIds,
    p_cpu_id: pCpu,
    p_motherboard_id: pBoard,
    p_ram_id: pRam,
    p_cooling_id: pCooling,
    p_psu_ids: psuIds,
    p_riser_ids: riserIds.length ? riserIds : Array(gpuIds.length).fill('00000000-0000-0000-0000-000000000000'),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  return { ok: true }
}

export async function prestigeRig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in.' }
  const { error } = await supabase.rpc('prestige_my_rig')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/app/mining')
  return { ok: true }
}
