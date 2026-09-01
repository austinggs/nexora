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
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [result, runAction] = useActionState(async (_previous: string, formData: FormData) => {
    setPending(true)
    setMessage('')
    try {
      const response = await action(formData)
      const next = response?.ok === false ? (response.error || 'Mining action failed.') : 'Rig state updated.'
      setMessage(next)
      return next
    } catch (error) {
      const next = error instanceof Error ? error.message : 'Mining action failed.'
      setMessage(next)
      return next
    } finally {
      setPending(false)
    }
  }, '')

  return (
    <div>
      <div className="mining-controls" aria-label="Mining controls">
        <form action={runAction}>
          <input type="hidden" name="action" value="toggle_overclock" />
          <button className="btn" type="submit" disabled={pending}>
            <Zap size={15} aria-hidden="true" />{pending ? 'Working…' : overclocked ? 'Disable overclock' : 'Overclock +32%'}
          </button>
        </form>
        <form action={runAction}>
          <input type="hidden" name="action" value="cool" />
          <button className="btn secondary" type="submit" disabled={pending}>
            <Fan size={15} aria-hidden="true" />Cool rig
          </button>
        </form>
        <form action={runAction}>
          <input type="hidden" name="action" value="tick" />
          <button className="btn secondary" type="submit" disabled={pending}>
            <Gauge size={15} aria-hidden="true" />Mine next tick
          </button>
        </form>
        {gremlins > 0 && (
          <form action={runAction}>
            <input type="hidden" name="action" value="defend_gremlin" />
            <button className="btn" type="submit" disabled={pending}>
              Defend gremlin ({gremlinHits}/{gremlins})
            </button>
          </form>
        )}
      </div>
      {message && <div className={result && result !== 'Rig state updated.' ? 'error' : 'notice'} style={{marginTop:10}}>{message}</div>}
      <div className="muted" style={{fontSize:11,marginTop:10}}>
        <Flame size={13} aria-hidden="true" /> Changes are validated and persisted by the NEXORA server.
      </div>
    </div>
  )
}

type CreateAction = (formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>

export function MiningCreateControl({ action }: { action: CreateAction }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState(false)
  return (
    <form action={async (formData) => {
      setPending(true)
      setMessage('')
      setOk(false)
      try {
        const result = await action(formData)
        if (result?.ok === false) {
          setMessage(result.error || 'Unable to create rig.')
        } else {
          setOk(true)
          setMessage('Rig created. Loading your new configuration…')
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to create rig.')
      } finally {
        setPending(false)
      }
    }}>
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Creating rig…' : 'Create NEX-01'}</button>
      {message && <div className={ok ? 'notice' : 'error'} style={{marginTop:10}}>{message}</div>}
    </form>
  )
}

export function PrestigeControl({ action, eligible }: { action: (formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>; eligible: boolean }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [ok, setOk] = useState(false)
  return (
    <form action={async (formData) => {
      setPending(true)
      setMessage('')
      setOk(false)
      try {
        const result = await action(formData)
        if (result?.ok === false) {
          setMessage(result.error || 'Prestige is not available yet.')
        } else {
          setOk(true)
          setMessage('Ghost Rig created. Your prestige level has been updated.')
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Prestige is not available yet.')
      } finally {
        setPending(false)
      }
    }}>
      <button className="btn secondary" type="submit" disabled={pending || !eligible} title={eligible ? 'Create Ghost Rig' : 'Reach 100 discovered blocks first'}>
        {pending ? 'Creating…' : eligible ? 'Create Ghost Rig' : 'Need 100 blocks'}
      </button>
      {message && <div className={ok ? 'notice' : 'error'} style={{marginTop:10}}>{message}</div>}
    </form>
  )
}
