import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login',request.url))

  const parseBool = (key:string) => form.get(key) === 'on'
  const { error } = await supabase.rpc('update_notification_preferences', {
    p_pings_enabled: parseBool('pings_enabled'),
    p_system_enabled: parseBool('system_enabled'),
    p_email_enabled: false,
    p_push_enabled: parseBool('push_enabled'),
    p_quiet_start: null,
    p_quiet_end: null,
  })
  if (error) return NextResponse.json({error:error.message},{status:400})
  return NextResponse.redirect(new URL('/app/pings',request.url))
}
