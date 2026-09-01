import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const title = String(form.get('title') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  const deepLink = String(form.get('deep_link') ?? '').trim() || null
  if (!title || !body || title.length > 140 || body.length > 2000) return NextResponse.json({ error: 'Invalid notification.' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!['admin','super_admin','support','content_manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { error } = await supabase.rpc('create_broadcast_system_notification', { p_title: title, p_body: body, p_deep_link: deepLink })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.redirect(new URL('/admin/notifications', request.url))
}
