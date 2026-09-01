import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

const COOKIE = 'nexora_manual_session'
const maxAge = 60 * 60 * 24 * 30

function secret() {
  const value = process.env.MANUAL_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('MANUAL_SESSION_SECRET is not configured.')
  return value
}

function sign(accountId: string) {
  return crypto.createHmac('sha256', secret()).update(accountId).digest('hex')
}

export async function setManualSession(accountId: string) {
  const store = await cookies()
  store.set(COOKIE, `${accountId}.${sign(accountId)}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge })
}

export async function clearManualSession() {
  const store = await cookies()
  store.set(COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

export async function getManualSession() {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  if (!raw) return null
  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  const accountId = raw.slice(0, dot)
  const signature = raw.slice(dot + 1)
  const expected = sign(accountId)
  const provided = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) return null
  const admin = createAdminClient()
  const { data } = await admin.from('manual_admin_accounts').select('id,username,role,status').eq('id', accountId).maybeSingle()
  if (!data || data.status !== 'active') return null
  return { id: data.id, username: data.username, role: data.role }
}
