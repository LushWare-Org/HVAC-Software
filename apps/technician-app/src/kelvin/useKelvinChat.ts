import { useCallback, useRef, useState } from 'react'
import { fetch } from 'expo/fetch'
import api from '@/lib/api'
import { getToken } from '@/lib/storage'
import { queryClient } from '@/lib/queryClient'

/** A change Kelvin prepared, waiting for the technician to confirm. */
export interface KelvinCard {
  token: string
  id: string
  title: string
  lines: string[]
  state: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  result?: string
}

export interface Turn {
  role: 'user' | 'assistant'
  content: string
  card?: KelvinCard
  /** Context for Kelvin only (the outcome of a card); not shown. */
  hidden?: boolean
  /** Said out loud rather than typed. */
  spoken?: boolean
}

/** The job on screen, so "this job" means it. */
export interface ScreenJob { id: string; jobNumber: string; customerName?: string; title?: string }

const base = () => String(api.defaults.baseURL ?? '').replace(/\/$/, '')

/**
 * The conversation with Kelvin: replies stream in as he writes them (expo/fetch
 * can read a stream, React Native's fetch cannot), and changes come as cards.
 */
export function useKelvinChat(opts: { onReply?: (text: string, spoken: boolean) => void; onConfirmed?: (out: { ok: boolean; navigateTo?: string }) => void } = {}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [streaming, setStreaming] = useState(false)
  const [partial, setPartial] = useState('')
  const [status, setStatus] = useState('')
  const abort = useRef<AbortController | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const send = useCallback(async (text: string, job: ScreenJob | null, spoken = false) => {
    const message = text.trim()
    if (!message || streaming) return
    const history = turns.filter(t => !t.card).map(({ role, content }) => ({ role, content }))
    setTurns(t => [...t, { role: 'user', content: message, spoken }])
    setStreaming(true)
    setPartial('')
    setStatus('')
    abort.current = new AbortController()
    let reply = ''
    const cards: KelvinCard[] = []
    try {
      const token = await getToken()
      const res = await fetch(`${base()}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({
          message,
          history,
          ...(job && { context: { page: 'job', label: 'Job', record: { type: 'job', id: job.id, label: `${job.jobNumber}${job.title ? `, ${job.title}` : ''}${job.customerName ? `, ${job.customerName}` : ''}` } } }),
        }),
        signal: abort.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(`Kelvin is unavailable (${res.status})`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          try {
            const p = JSON.parse(payload)
            if (p.error) reply = p.error
            if (p.status) setStatus(p.status)
            if (p.action) cards.push({ ...p.action, state: 'pending' })
            if (p.chunk) { reply += p.chunk; setStatus(''); setPartial(reply) }
          } catch { /* a partial line; the buffer completes it */ }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') reply = reply || "I couldn't reach the office systems just now. Try again in a moment."
    } finally {
      setTurns(t => [
        ...t,
        ...(reply || !cards.length ? [{ role: 'assistant' as const, content: reply }] : []),
        ...cards.map(card => ({ role: 'assistant' as const, content: '', card })),
      ])
      setStreaming(false)
      setPartial('')
      setStatus('')
      if (reply) optsRef.current.onReply?.(reply, spoken)
    }
  }, [streaming, turns])

  const update = (id: string, patch: Partial<KelvinCard>) =>
    setTurns(t => t.map(x => (x.card?.id === id ? { ...x, card: { ...x.card, ...patch } } : x)))

  const confirm = useCallback(async (card: KelvinCard) => {
    update(card.id, { state: 'running' })
    let ok = false
    let message = 'That did not work. Try again.'
    let navigateTo: string | undefined
    try {
      const { data } = await api.post('/chat/actions/confirm', { token: card.token })
      ok = data?.ok === true
      if (data?.message) message = data.message
      navigateTo = typeof data?.navigateTo === 'string' ? data.navigateTo : undefined
    } catch (err: any) {
      message = err?.response?.data?.message ?? message
    }
    update(card.id, { state: ok ? 'done' : 'failed', result: message })
    setTurns(t => [...t, { role: 'assistant', content: ok ? `The technician confirmed. ${message}` : `The technician confirmed but it failed. ${message}`, hidden: true }])
    if (ok) {
      for (const key of ['jobs', 'assignments', 'workOrders', 'inventory', 'threads']) queryClient.invalidateQueries({ queryKey: [key] })
    }
    optsRef.current.onConfirmed?.({ ok, navigateTo })
  }, [])

  const cancel = useCallback((card: KelvinCard) => {
    update(card.id, { state: 'cancelled' })
    setTurns(t => [...t, { role: 'assistant', content: `The technician cancelled "${card.title}". Nothing changed.`, hidden: true }])
  }, [])

  const stop = useCallback(() => abort.current?.abort(), [])

  return { turns, streaming, partial, status, send, confirm, cancel, stop }
}
