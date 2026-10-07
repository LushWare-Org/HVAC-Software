import { authStorage } from '../lib/authStorage'
import api from '../lib/api'
import type { PageContext } from './types'

export interface PlanStepCard { n: number; title: string; lines: string[]; sends?: string; dependsOn: number[] }
export interface StepOutcome { n: number; title: string; status: 'done' | 'failed' | 'skipped' | 'not_run'; message?: string }
export interface UndoOffer { token: string; id: string; title: string; lines: string[]; expiresAt: string }

export interface ActionCardData {
  token: string
  id: string
  title: string
  lines: string[]
  state: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  result?: string
  /** A plan: its steps, which are ticked, and what happened to each. */
  steps?: PlanStepCard[]
  ticked?: number[]
  outcome?: StepOutcome[]
  /** Under a plan's steps: what was left out and why, and anything to watch for. */
  notes?: string[]
  /** After it ran: a card that reverses it, for 10 minutes. */
  undo?: UndoOffer
  cantUnsend?: string[]
  isUndo?: boolean
}

export interface ConfirmResult { ok: boolean; message: string; steps?: StepOutcome[]; undo?: UndoOffer; cantUnsend?: string[] }

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
        if (parsed.action) cards.push({ ...parsed.action, state: 'pending', ...(parsed.action.steps && { ticked: parsed.action.steps.map((st: PlanStepCard) => st.n) }) })
        if (parsed.chunk) { text += parsed.chunk; opts.onStatus?.(''); opts.onChunk?.(text) }
      } catch { /* a malformed line is skipped */ }
    }
  }
  return { text, cards }
}

export async function confirmCard(token: string, skip: number[] = []): Promise<ConfirmResult> {
  try {
    const res = await fetch(`${API_BASE}/chat/actions/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ token, ...(skip.length && { skip }) }),
    })
    const body = await res.json().catch(() => ({}))
    return {
      ok: res.ok && body.ok === true,
      message: body.message ?? 'Something went wrong. Please try again.',
      ...(Array.isArray(body.steps) && { steps: body.steps }),
      ...(body.undo?.token && { undo: body.undo }),
      ...(Array.isArray(body.cantUnsend) && body.cantUnsend.length && { cantUnsend: body.cantUnsend }),
    }
  } catch {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
