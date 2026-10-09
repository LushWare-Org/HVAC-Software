import { useCallback, useRef, useState } from 'react'
import { authStorage } from '../lib/authStorage'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

/** A request the assistant prepared, waiting for the customer to confirm. */
export interface ActionCardData {
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
  /** Set on a card turn; shown, never sent back as history. */
  action?: ActionCardData
  /** Sent to the assistant as context but not shown (the card already shows it). */
  hidden?: boolean
}

const API_BASE = api.defaults.baseURL ?? '/api'
const auth = () => ({ Authorization: `Bearer ${authStorage.getToken() ?? ''}` })

/** The portal assistant's conversation: streaming replies, confirm cards, and their outcome. */
export function useAssistantChat() {
  const [history, setHistory] = useState<Turn[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return
    setHistory(h => [...h, { role: 'user', content: message }])
    setStreaming(true)
    setStreamingContent('')
    setStatusMsg('')
    abortRef.current = new AbortController()
    try {
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ message, history: history.filter(t => !t.action).map(({ role, content }) => ({ role, content })) }),
        signal: abortRef.current.signal,
      })
      if (!response.ok) throw new Error('Request failed')
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assembled = ''
      const cards: ActionCardData[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) { assembled = parsed.error; break }
            if (parsed.status) setStatusMsg(parsed.status)
            if (parsed.action) cards.push({ ...parsed.action, state: 'pending' })
            if (parsed.chunk) { assembled += parsed.chunk; setStatusMsg(''); setStreamingContent(assembled) }
          } catch { /* a partial line; the next read completes it */ }
        }
      }
      setHistory(h => [
        ...h,
        ...(assembled || !cards.length ? [{ role: 'assistant' as const, content: assembled }] : []),
        ...cards.map(action => ({ role: 'assistant' as const, content: '', action })),
      ])
    } catch (err: any) {
      if (err.name !== 'AbortError') setHistory(h => [...h, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setStatusMsg('')
    }
  }, [streaming, history])

  const updateCard = (id: string, patch: Partial<ActionCardData>) =>
    setHistory(h => h.map(t => (t.action?.id === id ? { ...t, action: { ...t.action, ...patch } } : t)))

  const confirm = useCallback(async (card: ActionCardData) => {
    updateCard(card.id, { state: 'running' })
    let ok = false
    let message = 'Something went wrong. Please try again.'
    try {
      const res = await fetch(`${API_BASE}/chat/actions/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ token: card.token }),
      })
      const body = await res.json().catch(() => ({}))
      ok = res.ok && body.ok === true
      if (body.message) message = body.message
    } catch { /* network failure: message above */ }
    updateCard(card.id, { state: ok ? 'done' : 'failed', result: message })
    setHistory(h => [...h, { role: 'assistant', content: ok ? `The customer confirmed. ${message}` : `The customer confirmed but it failed. ${message}`, hidden: true }])
    // Every portal query key starts with 'customer', so their visits, quotes and messages refresh.
    if (ok) queryClient.invalidateQueries({ queryKey: ['customer'] })
  }, [])

  const cancel = useCallback((card: ActionCardData) => {
    updateCard(card.id, { state: 'cancelled' })
    setHistory(h => [...h, { role: 'assistant', content: `The customer pressed Cancel on "${card.title}". Nothing was sent.`, hidden: true }])
  }, [])

  return { history, streaming, streamingContent, statusMsg, send, confirm, cancel }
}
