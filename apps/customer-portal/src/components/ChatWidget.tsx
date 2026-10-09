import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { useAssistantChat, type ActionCardData, type Turn } from '../kelvin/useAssistantChat'
import { renderMarkdown } from '../kelvin/markdown'

const STARTER_PROMPTS = [
  'My AC is not cooling. Can someone come out?',
  'When is my next appointment?',
  'I need to move my next visit',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { history, streaming, streamingContent, statusMsg, send: ask, confirm: confirmAction, cancel: cancelAction } = useAssistantChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const send = (text: string) => { if (text.trim() && !streaming) { setInput(''); void ask(text) } }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingContent])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%',
          background: '#2563eb', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title="Help & Assistant"
      >
        {open ? <X size={20} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 24, zIndex: 999,
          width: 360, height: 500, borderRadius: 16,
          background: '#fff', border: '1px solid #e5e7eb',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f9fafb',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>T&S Help</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Ask about your account or how to use the portal</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 && !streaming && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>How can I help you today?</p>
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      background: '#f3f4f6', border: '1px solid #e5e7eb',
                      color: '#374151', cursor: 'pointer', textAlign: 'left',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> {statusMsg || 'Thinking…'}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a question…"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1px solid #d1d5db', borderRadius: 8,
                padding: '8px 10px', fontSize: 13, color: '#111827',
                background: '#fff', outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.4, maxHeight: 80, overflowY: 'auto',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: !input.trim() || streaming ? '#d1d5db' : '#2563eb',
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
        maxWidth: '80%', padding: '8px 12px',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        fontSize: 13, lineHeight: 1.6,
        color: isUser ? '#fff' : '#111827',
        background: isUser ? '#2563eb' : '#f3f4f6',
        border: isUser ? 'none' : '1px solid #e5e7eb',
        wordBreak: 'break-word',
      }}>
        {isUser ? turn.content : renderMarkdown(turn.content)}
        {streaming && <span style={{ opacity: 0.5 }}>▍</span>}
      </div>
    </div>
  )
}

/** Matches this panel's own light palette. */
function ActionCard({ card, onConfirm, onCancel }: {
  card: ActionCardData
  onConfirm: (card: ActionCardData) => void
  onCancel: (card: ActionCardData) => void
}) {
  const btn = { minHeight: 44, padding: '0 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const
  return (
    <div role="group" aria-label={card.title} style={{
      border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
        <ShieldCheck size={14} aria-hidden="true" /> Nothing is sent until you confirm
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{card.title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {card.lines.map((l, i) => <li key={i} style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>{l}</li>)}
      </ul>
      {card.state === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => onConfirm(card)} style={{ ...btn, border: 'none', background: '#2563eb', color: '#fff' }}>Confirm</button>
          <button type="button" onClick={() => onCancel(card)} style={{ ...btn, border: '1px solid #d1d5db', background: '#fff', color: '#374151' }}>Cancel</button>
        </div>
      )}
      {card.state === 'running' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4b5563' }}>
          <Loader2 size={14} aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }} /> Sending…
        </div>
      )}
      {(card.state === 'done' || card.state === 'failed') && (
        <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: card.state === 'done' ? '#059669' : '#dc2626' }}>
          {card.state === 'done' ? <CheckCircle2 size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />}
          <span>{card.result}</span>
        </div>
      )}
      {card.state === 'cancelled' && (
        <div role="status" style={{ fontSize: 13, color: '#6b7280' }}>Cancelled. Nothing was sent.</div>
      )}
    </div>
  )
}

