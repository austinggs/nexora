'use client'

import { useTransition } from 'react'
import { operateRig } from './actions'

export function MiningControls({ overclocked, heat }: { overclocked: boolean; heat: number }) {
  const [pending, startTransition] = useTransition()
  const run = (action: string) => startTransition(async () => { await operateRig(new FormData(Object.assign(document.createElement('form'), { action: '' }) as HTMLFormElement)) })
  return null
}
