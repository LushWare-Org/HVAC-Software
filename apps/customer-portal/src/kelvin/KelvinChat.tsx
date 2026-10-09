import { useEffect, useRef, useState } from 'react'
import { ArrowUp, CheckCircle2, Loader2, ShieldCheck, X, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import KelvinFace, { type Mood } from './KelvinFace'
import { renderMarkdown } from './markdown'
import { useAssistantChat, type ActionCardData, type Turn } from './useAssistantChat'
import './kelvin-portal.css'

const STARTERS = [
  'My AC is not cooling. Can someone come out?',
  'When is my next visit?',
  'I need to move my next visit',
]

/** The top bar's Kelvin pill opens his panel. */
export function openKelvin() {
  window.dispatchEvent(new Event('kelvin:open'))
}

/** Other parts of the portal open Kelvin with a request, e.g. a note's "Change time" button. */
export function askKelvin(message: string) {
  window.dispatchEvent(new CustomEvent('kelvin:ask', { detail: { message } }))
}

/**
 * Kelvin for customers: his face in the corner and a panel to ask him things.
 * Calmer than the office Kelvin: he never pops up on his own. Every change he
 * prepares waits on a card for the customer to confirm.
 */
export default function KelvinChat() {
  const { user } = useAuth()
  const { settings } = useCompany()
  const chat = useAssistantChat()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pleased, setPleased] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const first = (user?.name ?? '').trim().split(/\s+/)[0]

  const send = (text: string) => {
    if (!text.trim() || chat.streaming) return
    setInput('')
    void chat.send(text)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chat.history, chat.streamingContent])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  // A note's button asks Kelvin directly.
  const sendRef = useRef(send)
  sendRef.current = send
  useEffect(() => {
    const onAsk = (e: Event) => {
      const m = (e as CustomEvent<{ message?: string }>).detail?.message
      if (m) { setOpen(true); sendRef.current(m) }
    }
    const onOpen = () => setOpen(o => !o)
    window.addEventListener('kelvin:ask', onAsk)
    window.addEventListener('kelvin:open', onOpen)
    return () => { window.removeEventListener('kelvin:ask', onAsk); window.removeEventListener('kelvin:open', onOpen) }
  }, [])

  const confirm = async (card: ActionCardData) => {
    await chat.confirm(card)
    setPleased(true)
    setTimeout(() => setPleased(false), 2400)
  }
  const mood: Mood = chat.streaming ? 'thinking' : pleased ? 'pleased' : 'idle'

  return (
    <>
      <button
        type="button"
        className={`kvp-corner${open ? ' is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Kelvin' : 'Ask Kelvin'}
        aria-expanded={open}
      >
        <KelvinFace size={48} mood={mood} follow="near" />
      </button>

      <section className={`kvp-panel${open ? ' is-open' : ''}`} aria-label="Kelvin" aria-hidden={!open} inert={!open}>
        <header className="kvp-head">
          <KelvinFace size={32} mood={mood} />
          <div className="kvp-head-text">
            <h2>Kelvin</h2>
            <p>{settings?.name ? `${settings.name}'s assistant` : 'Your service assistant'}</p>
          </div>
          <button type="button" className="kvp-icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="kvp-thread" aria-live="polite">
          {chat.history.length === 0 && !chat.streaming && (
            <div className="kvp-hello">
              <p className="kvp-hello-line">Hi{first ? ` ${first}` : ''}. I can book a visit, move one, or help with a quote.</p>
              <p className="kvp-hello-sub">Nothing changes until you confirm.</p>
              <div className="kvp-starters">
                {STARTERS.map(s => <button key={s} type="button" className="kvp-key" onClick={() => send(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {chat.history.map((t, i) => t.hidden ? null : t.action
            ? <Card key={t.action.id} card={t.action} onConfirm={confirm} onCancel={chat.cancel} />
            : <Bubble key={i} turn={t} />)}
          {chat.streaming && chat.streamingContent && <Bubble turn={{ role: 'assistant', content: chat.streamingContent }} />}
          {chat.streaming && (chat.statusMsg || !chat.streamingContent) && (
            <p className="kvp-status" role="status"><span className="kvp-dots" aria-hidden="true"><i /><i /><i /></span>{chat.statusMsg || 'Kelvin is thinking…'}</p>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="kvp-ask" onSubmit={e => { e.preventDefault(); send(input) }}>
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Ask Kelvin…"
            aria-label="Message Kelvin"
          />
          <button type="submit" className="kvp-send" disabled={!input.trim() || chat.streaming} aria-label="Send"><ArrowUp size={18} /></button>
        </form>
      </section>
    </>
  )
}

function Bubble({ turn }: { turn: Turn }) {
  return (
    <div className={`kvp-bubble is-${turn.role}`}>
      {turn.role === 'user' ? turn.content : renderMarkdown(turn.content)}
    </div>
  )
}

function Card({ card, onConfirm, onCancel }: { card: ActionCardData; onConfirm: (c: ActionCardData) => void; onCancel: (c: ActionCardData) => void }) {
  return (
    <div className={`kvp-card is-${card.state}`} role="group" aria-label={card.title}>
      <p className="kvp-card-title">{card.title}</p>
      <ul className="kvp-card-lines">{card.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {card.state === 'pending' && (
        <>
          <p className="kvp-card-note"><ShieldCheck size={14} aria-hidden="true" /> Nothing changes until you confirm</p>
          <div className="kvp-card-actions">
            <button type="button" className="kvp-btn is-primary" onClick={() => onConfirm(card)}>Confirm</button>
            <button type="button" className="kvp-btn" onClick={() => onCancel(card)}>Cancel</button>
          </div>
        </>
      )}
      {card.state === 'running' && <p className="kvp-card-status" role="status"><Loader2 size={14} className="kvp-spin" aria-hidden="true" /> Working on it…</p>}
      {(card.state === 'done' || card.state === 'failed') && (
        <p className={`kvp-card-status is-${card.state}`} role="status">
          {card.state === 'done' ? <CheckCircle2 size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}
          <span>{card.result}</span>
        </p>
      )}
      {card.state === 'cancelled' && <p className="kvp-card-status" role="status">Cancelled. Nothing was changed.</p>}
    </div>
  )
}
