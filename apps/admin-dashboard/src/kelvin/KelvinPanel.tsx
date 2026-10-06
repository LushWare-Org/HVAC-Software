import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { X, Send } from 'lucide-react'
import { queryClient } from '../lib/queryClient'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import ActionCard from './ActionCard'
import { confirmCard, streamChat, type ActionCardData } from './chatStream'
import { renderMarkdown } from './markdown'
import { endOfLocalDay } from './speech'

interface Turn { role: 'user' | 'assistant'; content: string; action?: ActionCardData; hidden?: boolean }
const REFRESH_AFTER_ACTION = [['jobs'], ['scheduling'], ['finance'], ['invoices'], ['dashboard'], ['kelvin']]

export default function KelvinPanel() {
  const k = useKelvin()
  const [history, setHistory] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [live, setLive] = useState('')
  const [status, setStatus] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [history, live])

  // Focus in on open, back to where the person was on close.
  useEffect(() => {
    if (k.panelOpen) { returnFocus.current = document.activeElement as HTMLElement; setTimeout(() => inputRef.current?.focus(), 50) }
    else returnFocus.current?.focus?.()
  }, [k.panelOpen])

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return
    setHistory(h => [...h, { role: 'user', content: message }])
    setInput(''); setStreaming(true); setLive(''); setStatus('')
    try {
      const { text: reply, cards } = await streamChat({
        message,
        history: history.filter(t => !t.action).map(({ role, content }) => ({ role, content })),
        context: k.page,
        onStatus: setStatus,
        onChunk: setLive,
      })
      setHistory(h => [...h,
        ...(reply || !cards.length ? [{ role: 'assistant' as const, content: reply }] : []),
        ...cards.map(action => ({ role: 'assistant' as const, content: '', action }))])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: "I couldn't reach my tools just now. Try again in a moment." }])
    } finally {
      setStreaming(false); setLive(''); setStatus('')
    }
  }, [streaming, history, k.page])

  // A fix or an "ask Kelvin" elsewhere arrives as a pending message.
  useEffect(() => {
    if (!k.panelOpen) return
    const p = k.takePending()
    if (p) void send(p)
  }, [k.panelOpen, k.pending]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, patch: Partial<ActionCardData>) =>
    setHistory(h => h.map(t => (t.action?.id === id ? { ...t, action: { ...t.action, ...patch } } : t)))

  const confirm = useCallback(async (card: ActionCardData) => {
    update(card.id, { state: 'running' })
    const { ok, message } = await confirmCard(card.token)
    update(card.id, { state: ok ? 'done' : 'failed', result: message })
    k.flashMood(ok ? 'pleased' : 'urgent')
    setHistory(h => [...h, { role: 'assistant', content: ok ? `The person confirmed. ${message}` : `The person confirmed but it failed. ${message}`, hidden: true }])
    if (ok) REFRESH_AFTER_ACTION.forEach(queryKey => queryClient.invalidateQueries({ queryKey }))
  }, [k])
  const cancel = useCallback((card: ActionCardData) => {
    update(card.id, { state: 'cancelled' })
    setHistory(h => [...h, { role: 'assistant', content: `The person pressed Cancel on "${card.title}". Nothing was changed.`, hidden: true }])
  }, [])

  const needs = (k.feed?.items ?? []).filter(i => i.urgency !== 'quiet').length
  const quietUntil = k.feed?.prefs?.quietUntil
  const quiet = !!quietUntil && Date.parse(quietUntil) > Date.now()

  return (
    <AnimatePresence>
      {k.panelOpen && (
        <m.aside
          className={`kv-panel is-${k.side}`}
          role="dialog"
          aria-label="Kelvin"
          initial={{ x: k.side === 'left' ? -48 : 48, opacity: 0, scale: 0.97 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: k.side === 'left' ? -48 : 48, opacity: 0, scale: 0.97, transition: { duration: 0.16 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <header className="kv-panel-head">
            <m.span layoutId="kelvin-face" transition={{ duration: 0.32 }}><KelvinFace size={48} mood={streaming ? 'thinking' : k.mood} /></m.span>
            <div className="kv-panel-who">
              <strong>Kelvin</strong>
              <span>{streaming ? 'Working on it…' : needs ? 'Keeping an eye on your day' : 'All quiet. Ask me anything'}</span>
            </div>
            <div className="kv-gauge" aria-label={`${needs} need you`}>
              <strong>{needs}</strong>
              <span>{needs === 1 ? 'needs you' : 'need you'}</span>
            </div>
            <button type="button" className="kv-icon-btn" onClick={k.closePanel} aria-label="Close Kelvin"><X size={18} /></button>
          </header>
          {k.page && <p className="kv-ctx">On {k.page.label}{k.page.record ? `, ${k.page.record.label}` : ''}</p>}

          <div className="kv-thread" aria-live="polite">
            {history.length === 0 && !streaming && (
              <p className="kv-hello">{needs ? `${needs === 1 ? 'One thing needs' : `${needs} things need`} you. Ask me about ${needs === 1 ? 'it' : 'them'}, or tell me what to do.` : "Tell me what to do, or ask me anything about today."}</p>
            )}
            {history.map((t, i) => t.hidden ? null : (
              <m.div
                key={t.action?.id ?? i}
                className={t.action ? 'kv-turn' : `kv-msg is-${t.role}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                {t.action
                  ? <ActionCard card={t.action} onConfirm={confirm} onCancel={cancel} />
                  : t.role === 'user' ? t.content : renderMarkdown(t.content)}
              </m.div>
            ))}
            {streaming && live && <div className="kv-msg is-assistant">{renderMarkdown(live)}</div>}
            {streaming && (status || !live) && <p className="kv-status"><span className="kv-dots" aria-hidden="true"><i /><i /><i /></span>{status || 'Thinking'}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="kv-keys">
            {['Create a job', "Who's free now?", "What's late?", 'What needs me?'].map(s => (
              <button key={s} type="button" className="kv-key" onClick={() => send(s)} disabled={streaming}>{s}</button>
            ))}
          </div>
          <form className="kv-ask" onSubmit={e => { e.preventDefault(); void send(input) }}>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              placeholder="Tell Kelvin what to do…"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) } }}
            />
            <button type="submit" className="kv-send" disabled={!input.trim() || streaming} aria-label="Send"><Send size={16} /></button>
          </form>
          <footer className="kv-panel-foot">
            {quiet
              ? <button type="button" className="kv-link" onClick={() => k.setPrefs({ quietUntil: null })}>Quiet until tomorrow · Talk again</button>
              : <button type="button" className="kv-link" onClick={() => k.setPrefs({ quietUntil: endOfLocalDay(new Date()).toISOString() })}>Quiet for today</button>}
          </footer>
        </m.aside>
      )}
    </AnimatePresence>
  )
}
