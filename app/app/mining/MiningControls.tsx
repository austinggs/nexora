'use client'

import { useActionState, useState } from 'react'
import { Fan, Flame, Gauge, Zap } from 'lucide-react'

export type MiningAction = (formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>

export function MiningControls({
  action,
  overclocked,
  gremlins,
  gremlinHits,
}: {
  action: MiningAction
  overclocked: boolean
  gremlins: number
  gremlinHits: number
}) {
  const [result, runAction] = useActionState(async (_previous: string, formData: FormData) => {
    const response = await action(formData)
    return response?.ok === false ? (response.error || 'Mining action failed.') : 'updated'
  }, '')
  const [pendingAction, setPendingAction] = useState('')

  const submit = (name: string) => (event: React.FormEvent<HTMLFormElement>) => {
    setPendingAction(name)
    const form = event.currentTarget
    queueMicrotask(() => form.requestSubmit())
  }

  const busy = pendingAction !== ''
  const feedback = result === 'updated' ? 'Rig state updated.' : result

  return (
    <div>
      <div className="mining-controls" aria-label="Mining controls">
        <form action={runAction} onSubmit={submit('toggle_overclock')}>
          <input type="hidden" name="action" value="toggle_overclock" />
          <button className="btn" type="submit" disabled={busy}>
            <Zap size={15} aria-hidden="true" />{overclocked ? 'Disable overclock' : 'Overclock +32%'}
          </button>
        </form>
        <form action={runAction} onSubmit={submit('cool')}>
          <input type="hidden" name="action" value="cool" />
          <button className="btn secondary" type="submit" disabled={busy}>
            <Fan size={15} aria-hidden="true" />Cool rig
          </button>
        </form>
        <form action={runAction} onSubmit={submit('tick')}>
          <input type="hidden" name="action" value="tick" />
          <button className="btn secondary" type="submit" disabled={busy}>
            <Gauge size={15} aria-hidden="true" />Mine next tick
          </button>
        </form>
        {gremlins > 0 && (
          <form action={runAction} onSubmit={submit('defend_gremlin')}>
            <input type="hidden" name="action" value="defend_gremlin" />
            <button className="btn" type="submit" disabled={busy}>
              Defend gremlin ({gremlinHits}/{gremlins})
            </button>
          </form>
        )}
      </div>
      {feedback && <div className={result && result !== 'updated' ? 'error' : 'notice'} style={{marginTop:10}}>{feedback}</div>}
      <div className="muted" style={{fontSize:11,marginTop:10}}>
        <Flame size={13} aria-hidden="true" /> Changes are validated and persisted by the NEXORA server.
      </div>
    </div>
  )
}

export function MiningCreateControl({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <form action={async (formData) => {
      setPending(true)
      setMessage('')
      try {
        await action(formData)
        setMessage('Rig created. Loading your new configuration…')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to create rig.')
      } finally {
        setPending(false)
      }
    }}>
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Creating rig…' : 'Create NEX-01'}</button>
      {message && <div className={message.startsWith('Rig created') ? 'notice' : 'error'} style={{marginTop:10}}>{message}</div>}
    </form>
  )
}

export function PrestigeControl({ action, eligible }: { action: (formData: FormData) => Promise<unknown>; eligible: boolean }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <form action={async (formData) => {
      setPending(true)
      setMessage('')
      try {
        await action(formData)
        setMessage('Ghost Rig created. Your prestige level has been updated.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Prestige is not available yet.')
      } finally {
        setPending(false)
      }
    }}>
      <button className="btn secondary" type="submit" disabled={pending || !eligible} title={eligible ? 'Create Ghost Rig' : 'Reach 100 discovered blocks first'}>
        {pending ? 'Creating…' : eligible ? 'Create Ghost Rig' : 'Need 100 blocks'}
      </button>
      {message && <div className={message.startsWith('Ghost Rig') ? 'notice' : 'error'} style={{marginTop:10}}>{message}</div>}
    </form>
  )
}
