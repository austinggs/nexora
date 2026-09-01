'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function rpc(name: string, args: Record<string, unknown> = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok:false,error:'Please sign in.' }
  const { error } = await supabase.rpc(name,args)
  if (error) return { ok:false,error:error.message }
  revalidatePath('/app/guilds')
  revalidatePath('/app/mining')
  return { ok:true }
}

export async function createGuild(formData: FormData) { return rpc('create_guild',{p_name:String(formData.get('name')??'')}) }
export async function joinGuild(formData: FormData) { return rpc('join_guild',{p_guild_id:String(formData.get('guildId')??'')}) }
export async function leaveGuild(formData: FormData) { return rpc('leave_guild',{p_guild_id:String(formData.get('guildId')??'')}) }
export async function contribute(formData: FormData) { return rpc('contribute_to_guild',{p_guild_id:String(formData.get('guildId')??''),p_amount:Number(formData.get('amount')??0)}) }
