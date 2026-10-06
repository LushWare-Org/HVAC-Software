import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { queryClient } from '../lib/queryClient'
import { ASK_ASSISTANT_EVENT } from '../lib/assistant'
import { renderMarkdown } from '../kelvin/markdown'
import { confirmCard, streamChat, type ActionCardData } from '../kelvin/chatStream'

interface Turn {
  role: 'user' | 'assistant'
  content: string
  /** Set on a card turn; card turns are shown but never sent back as history. */
  action?: ActionCardData
  /** Sent to the assistant as context but not shown (the card already shows it). */
  hidden?: boolean
}

/** Pages a confirmed action can change, refreshed so they show it straight away. */
const REFRESH_AFTER_ACTION = [['jobs'], ['scheduling'], ['finance'], ['invoices'], ['dashboard']]

const STARTER_PROMPTS = [
  'What jobs are scheduled for tomorrow?',
  'Send a reminder for the oldest overdue invoice',
  'How do I approve a pending technician?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingContent])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return

    const userTurn: Turn = { role: 'user', content: message }
    setHistory(h => [...h, userTurn])
    setInput('')
    setStreaming(true)
    setStreamingContent('')
    setStatusMsg('')

    abortRef.current = new AbortController()

    try {
      const { text: assembled, cards } = await streamChat({
        message,
        history: history.filter(t => !t.action).map(({ role, content }) => ({ role, content })),
        signal: abortRef.current.signal,
        onStatus: setStatusMsg,
        onChunk: setStreamingContent,
      })
      setHistory(h => [
        ...h,
        ...(assembled || !cards.length ? [{ role: 'assistant' as const, content: assembled }] : []),
        ...cards.map(action => ({ role: 'assistant' as const, content: '', action })),
      ])
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setHistory(h => [...h, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setStatusMsg('')
    }
  }, [streaming, history])

  // "Ask the assistant" elsewhere in the app opens the chat with a request already sent.
  const sendRef = useRef(send)
  sendRef.current = send
  useEffect(() => {
    const onAsk = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message
      if (!message) return
      setOpen(true)
      sendRef.current(message)
    }
    window.addEventListener(ASK_ASSISTANT_EVENT, onAsk)
    return () => window.removeEventListener(ASK_ASSISTANT_EVENT, onAsk)
  }, [])

  const updateCard = (id: string, patch: Partial<ActionCardData>) =>
    setHistory(h => h.map(t => (t.action?.id === id ? { ...t, action: { ...t.action, ...patch } } : t)))

  const confirmAction = useCallback(async (card: ActionCardData) => {
    updateCard(card.id, { state: 'running' })
    const { ok, message } = await confirmCard(card.token)
    updateCard(card.id, { state: ok ? 'done' : 'failed', result: message })
    // Tell the assistant what happened, so its next answer starts from the truth.
    setHistory(h => [...h, { role: 'assistant', content: ok ? `The person confirmed. ${message}` : `The person confirmed but it failed. ${message}`, hidden: true }])
    if (ok) REFRESH_AFTER_ACTION.forEach(queryKey => queryClient.invalidateQueries({ queryKey }))
  }, [])

  const cancelAction = useCallback((card: ActionCardData) => {
    updateCard(card.id, { state: 'cancelled' })
    setHistory(h => [...h, { role: 'assistant', content: `The person pressed Cancel on "${card.title}". Nothing was changed.`, hidden: true }])
  }, [])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 56, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--blue)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title="AI Assistant"
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 118, right: 24, zIndex: 999,
          width: 380, height: 520, borderRadius: 16,
          background: 'var(--bg-card)', border: '1px solid var(--bd)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--bd)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-surface)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>HVACtor.ai Assistant</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Ask me anything about your business</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 && !streaming && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', margin: 0 }}>Try asking:</p>
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: 'var(--bg-surface)', border: '1px solid var(--bd)',
                      color: 'var(--t2)', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {history.map((turn, i) => turn.hidden ? null : turn.action
              ? <ActionCard key={turn.action.id} card={turn.action} onConfirm={confirmAction} onCancel={cancelAction} />
              : <Bubble key={i} turn={turn} />
            )}

            {streaming && streamingContent && (
              <Bubble turn={{ role: 'assistant', content: streamingContent }} streaming />
            )}

            {streaming && (statusMsg || !streamingContent) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t3)', fontSize: 12, fontStyle: 'italic' }}>
                <Loader2 size={12} className="animate-spin" /> {statusMsg || 'Thinking…'}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--bd)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question…"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1px solid var(--bd)', borderRadius: 8,
                padding: '8px 10px', fontSize: 13, color: 'var(--t1)',
                background: 'var(--bg-surface)', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: !input.trim() || streaming ? 'var(--bd)' : 'var(--blue)',
                color: '#fff', cursor: !input.trim() || streaming ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Bubble({ turn, streaming }: { turn: Turn; streaming?: boolean }) {
  const isUser = turn.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '8px 12px', borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        fontSize: 13, lineHeight: 1.6, color: isUser ? '#fff' : 'var(--t1)',
        background: isUser ? 'var(--blue)' : 'var(--bg-surface)',
        border: isUser ? 'none' : '1px solid var(--bd)',
        wordBreak: 'break-word',
      }}>
        {isUser ? turn.content : renderMarkdown(turn.content)}
        {streaming && <span style={{ opacity: 0.4 }}>▍</span>}
      </div>
    </div>
  )
}

function ActionCard({ card, onConfirm, onCancel }: {
  card: ActionCardData
  onConfirm: (card: ActionCardData) => void
  onCancel: (card: ActionCardData) => void
}) {
  const btn = { minHeight: 40, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as const
  return (
    <div role="group" aria-label={card.title} style={{
      border: '1px solid var(--bd)', borderRadius: 12, padding: 12, background: 'var(--bg-card)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)' }}>
        <ShieldCheck size={14} aria-hidden="true" /> Nothing changes until you confirm
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{card.title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {card.lines.map((l, i) => <li key={i} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{l}</li>)}
      </ul>
      {card.state === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => onConfirm(card)} style={{ ...btn, border: 'none', background: 'var(--blue)', color: '#fff' }}>Confirm</button>
          <button type="button" onClick={() => onCancel(card)} style={{ ...btn, border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)' }}>Cancel</button>
        </div>
      )}
      {card.state === 'running' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)' }}>
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Working…
        </div>
      )}
      {(card.state === 'done' || card.state === 'failed') && (
        <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: card.state === 'done' ? 'var(--green)' : 'var(--red)' }}>
          {card.state === 'done' ? <CheckCircle2 size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />}
          <span>{card.result}</span>
        </div>
      )}
      {card.state === 'cancelled' && (
        <div role="status" style={{ fontSize: 13, color: 'var(--t3)' }}>Cancelled. Nothing was changed.</div>
      )}
    </div>
  )
}
