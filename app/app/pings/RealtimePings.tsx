'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function RealtimePings({ userId }: { userId: string }) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) return
    const supabase = createBrowserClient(url, key)
    const channel = supabase.channel(`nexora-pings-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pings', filter: `user_id=eq.${userId}` }, () => {
        window.dispatchEvent(new CustomEvent('nexora:ping'))
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [userId])
  return null
}
