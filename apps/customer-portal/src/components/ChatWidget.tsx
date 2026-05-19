import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  'Do I have any upcoming appointments?',
  'How do I pay an invoice?',
  'What equipment do you have for my property?',
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
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('cp_token') ?? ''}`,
        },
        body: JSON.stringify({ message, history }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Request failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assembled = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break

          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) { assembled = parsed.error; break }
            if (parsed.status) { setStatusMsg(parsed.status) }
            if (parsed.chunk) {
              assembled += parsed.chunk
              setStatusMsg('')
              setStreamingContent(assembled)
            }
          } catch {}
        }
      }

      setHistory(h => [...h, { role: 'assistant', content: assembled }])
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
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
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

            {history.map((turn, i) => (
              <Bubble key={i} turn={turn} />
            ))}

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

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  const inlineFormat = (s: string, key: string): React.ReactNode => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
          if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>
          if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: 'rgba(0,0,0,0.07)', borderRadius: 3, padding: '1px 4px', fontSize: 12 }}>{p.slice(1, -1)}</code>
          return p
        })}
      </span>
    )
  }

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)

    if (headingMatch) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 14, marginTop: i > 0 ? 8 : 0 }}>{inlineFormat(headingMatch[1], `h${i}`)}</div>)
    } else if (bulletMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ opacity: 0.5, flexShrink: 0 }}>•</span>
          <span>{inlineFormat(bulletMatch[1], `b${i}`)}</span>
        </div>
      )
    } else if (numberedMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span style={{ opacity: 0.6, flexShrink: 0 }}>{numberedMatch[1]}.</span>
          <span>{inlineFormat(numberedMatch[2], `n${i}`)}</span>
        </div>
      )
    } else if (line.trim() === '') {
      if (i > 0 && i < lines.length - 1) nodes.push(<div key={i} style={{ height: 6 }} />)
    } else {
      nodes.push(<div key={i}>{inlineFormat(line, `l${i}`)}</div>)
    }
  })

  return nodes
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
