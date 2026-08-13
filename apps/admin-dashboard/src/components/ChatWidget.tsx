import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  'How much revenue did we make this month?',
  'How do I approve a pending technician?',
  'Show me overdue invoices',
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
          Authorization: `Bearer ${localStorage.getItem('tscrm_token') ?? ''}`,
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

            {history.map((turn, i) => (
              <Bubble key={i} turn={turn} />
            ))}

            {streaming && streamingContent && (
              <Bubble turn={{ role: 'assistant', content: streamingContent }} streaming />
            )}

            {streaming && (statusMsg || !streamingContent) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t3)', fontSize: 12, fontStyle: 'italic' }}>
                <Loader2 size={12} className="spin" /> {statusMsg || 'Thinking…'}
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
          if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 3, padding: '1px 4px', fontSize: 12 }}>{p.slice(1, -1)}</code>
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
