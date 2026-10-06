import { authStorage } from '../lib/authStorage'
import api from '../lib/api'
import type { PageContext } from './types'

export interface ActionCardData {
  token: string
  id: string
  title: string
  lines: string[]
  state: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  result?: string
}

const API_BASE = api.defaults.baseURL ?? '/api'
const auth = () => ({ Authorization: `Bearer ${authStorage.getToken() ?? ''}` })

/** Sends one message and streams the answer. Resolves with the full text and any action cards. */
export async function streamChat(opts: {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: PageContext | null
  signal?: AbortSignal
  onStatus?: (s: string) => void
  onChunk?: (assembled: string) => void
}): Promise<{ text: string; cards: ActionCardData[] }> {
  const response = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ message: opts.message, history: opts.history, ...(opts.context ? { context: opts.context } : {}) }),
    signal: opts.signal,
  })
  if (!response.ok || !response.body) throw new Error('Request failed')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let buffer = ''
  const cards: ActionCardData[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep a partial line for the next read
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload)
        if (parsed.error) { text = parsed.error; continue }
        if (parsed.status) opts.onStatus?.(parsed.status)
        if (parsed.action) cards.push({ ...parsed.action, state: 'pending' })
        if (parsed.chunk) { text += parsed.chunk; opts.onStatus?.(''); opts.onChunk?.(text) }
      } catch { /* a malformed line is skipped */ }
    }
  }
  return { text, cards }
}

export async function confirmCard(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/chat/actions/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ token }),
    })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok && body.ok === true, message: body.message ?? 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
