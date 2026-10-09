import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, X } from 'lucide-react'
import api from '../lib/api'
import { keys } from '../hooks/keys'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import KelvinFace from './KelvinFace'
import { askKelvin } from './KelvinChat'

interface Fix { label: string; request?: string; href?: string }
interface Note { id: string; urgency: 'urgent' | 'soon'; title: string; why?: string; fixes: Fix[] }

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Notes the customer dismissed stay dismissed on this device. Storage can be blocked; then they just come back. */
function useDismissed(userId?: string) {
  const key = `kvp:dismissed:${userId ?? ''}`
  const [ids, setIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
  })
  const dismiss = (id: string) => {
    const next = [...ids, id].slice(-100)
    setIds(next)
    window.dispatchEvent(new Event('kvp:dismissed'))
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* private window */ }
  }
  return { ids, dismiss }
}

/** The reason types itself out the first time a note is opened. Decided once, when it mounts. */
function Typed({ text, animate }: { text: string; animate: boolean }) {
  const [on] = useState(animate)
  const [n, setN] = useState(on ? 0 : text.length)
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(t); return v } return v + 2 }), 22)
    return () => clearInterval(t)
  }, [on, text])
  return <>{text.slice(0, n)}{n < text.length && <span className="kvp-caret" aria-hidden="true" />}</>
}

/** Count that ticks up the first time the card appears. */
function useCountUp(target: number) {
  const [v, setV] = useState(() => (reduced() ? target : Math.max(0, target - 3)))
  useEffect(() => {
    if (v >= target) { if (v !== target) setV(target); return }
    const t = setTimeout(() => setV(x => x + 1), 140)
    return () => clearTimeout(t)
  }, [v, target])
  return v
}

function Detail({ note, typeIt, onFix, onDismiss, onSeen }: { note: Note; typeIt: boolean; onFix: (f: Fix) => void; onDismiss: () => void; onSeen?: () => void }) {
  useEffect(() => { onSeen?.() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="kvp-dg-in">
      {note.why && (
        <div className="kvp-dg-block">
          <span className="kvp-dg-label"><KelvinFace size={20} mood={note.urgency === 'urgent' ? 'urgent' : 'news'} />Why Kelvin flagged it</span>
          <p>{typeIt ? <Typed text={note.why} animate /> : note.why}</p>
        </div>
      )}
      <div className="kvp-dg-foot-row">
        <span className="kvp-dg-src"><span className="kvp-dg-src-dot" aria-hidden="true" />Found by Kelvin</span>
        <span className="kvp-dg-acts">
          {note.fixes.map((f, n) => (
            <button key={f.label} type="button" className={`kvp-btn${n === 0 ? ' is-primary' : ''}`} onClick={e => { e.stopPropagation(); onFix(f) }}>{f.label}</button>
          ))}
          <button type="button" className="kvp-dg-dismiss" onClick={e => { e.stopPropagation(); onDismiss() }}>Dismiss</button>
        </span>
      </div>
    </div>
  )
}

/**
 * Kelvin's notes on the Dashboard as a digest: a card per note, two columns, every title in view.
 * Hover a card to peek at it; press its arrow (or the card) to keep it open, press again to close.
 * On load the header scans and the count ticks up. A new urgent note pops up by Kelvin for a few
 * seconds. Nothing shows when there is nothing to say.
 */
export default function KelvinNotes() {
  const { user } = useAuth()
  const { settings } = useCompany()
  const navigate = useNavigate()
  const on = settings?.features?.kelvin === true
  const { ids, dismiss } = useDismissed(user?.id)
  const q = useQuery<{ notes: Note[] }>({
    queryKey: keys.kelvinNotes(),
    queryFn: async () => (await api.get('/chat/kelvin/portal')).data,
    enabled: on,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
  const notes = (q.data?.notes ?? []).filter(n => !ids.includes(n.id))
  const urgent = notes.filter(n => n.urgency === 'urgent')
  const [chosen, setChosen] = useState<Record<string, boolean>>({})
  const isPinned = (n: Note) => chosen[n.id] ?? urgent.slice(0, 2).some(u => u.id === n.id)
  const [peekId, setPeekId] = useState<string | null>(null)
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const quietUntil = useRef(0)
  const typed = useRef<Set<string>>(new Set())
  const known = useRef<Set<string> | null>(null)
  const [toast, setToast] = useState<Note | null>(null)
  const count = useCountUp(notes.length)
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 760px)').matches)

  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 760px)')
    if (!mq) return
    const f = () => setNarrow(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  // A new urgent note after the first load pops up by Kelvin, then docks into the digest.
  const idKey = notes.map(n => n.id).join()
  useEffect(() => {
    const before = known.current
    known.current = new Set(notes.map(n => n.id))
    if (!before || reduced()) return
    const fresh = notes.find(n => n.urgency === 'urgent' && !before.has(n.id))
    if (fresh) setToast(fresh)
  }, [idKey]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  if (!on || !notes.length) return null

  const run = (f: Fix) => (f.href ? navigate(f.href) : f.request && askKelvin(f.request))
  const enter = (id: string) => {
    clearTimeout(peekTimer.current)
    peekTimer.current = setTimeout(() => { if (Date.now() >= quietUntil.current) setPeekId(id) }, 160)
  }
  const leave = (id: string) => { clearTimeout(peekTimer.current); setPeekId(p => (p === id ? null : p)) }
  const press = (n: Note) => {
    clearTimeout(peekTimer.current)
    setPeekId(null)
    quietUntil.current = Date.now() + 450
    setChosen(c => ({ ...c, [n.id]: !isPinned(n) }))
  }

  const indexed = notes.map((n, i) => [n, i] as const)
  const columns = narrow ? [indexed] : [0, 1].map(c => indexed.filter(([, i]) => i % 2 === c))

  return (
    <>
      <section className="kvp-dg" aria-label="From Kelvin">
        <header className="kvp-dg-head">
          <KelvinFace size={20} mood={urgent.length ? 'urgent' : 'news'} />
          <h2>Kelvin has <span className="kvp-dg-num">{count}</span> {notes.length === 1 ? 'thing' : 'things'} for you</h2>
          {urgent.length > 0 && <span className="kvp-dg-urgent">{urgent.length} urgent</span>}
          <span className="kvp-dg-scan" aria-hidden="true" />
        </header>
        <div className="kvp-dg-list">
          {columns.map((col, c) => (
            <div key={c} className="kvp-dg-col">
              {col.map(([n, i]) => {
                const pinned = isPinned(n)
                const peeking = peekId === n.id && !pinned
                const hot = n.urgency === 'urgent'
                return (
                  <article
                    key={n.id}
                    className={`kvp-dg-row${pinned ? ' is-open' : ''}${hot ? ' is-urgent' : ''}${peeking ? ' is-peek' : ''}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 120}ms` }}
                    onMouseEnter={() => enter(n.id)}
                    onMouseLeave={() => leave(n.id)}
                    onFocus={e => { if ((e.target as HTMLElement).matches(':focus-visible')) setPeekId(n.id) }}
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) leave(n.id) }}
                  >
                    <button type="button" className="kvp-dg-line" aria-expanded={pinned} onClick={() => press(n)}>
                      <span className={`kvp-dg-face${hot ? ' is-hot' : ''}`} aria-hidden="true"><KelvinFace size={20} mood={hot ? 'urgent' : 'news'} /></span>
                      <span className="kvp-dg-title">{n.title}</span>
                      {hot && <span className="kvp-dg-tag">Urgent</span>}
                      <span className="kvp-dg-chev" title={pinned ? 'Close' : 'Keep open'}><ChevronRight size={15} aria-hidden="true" /></span>
                    </button>
                    <div className="kvp-dg-more"><div>
                      {pinned && <Detail note={n} typeIt={!reduced() && !typed.current.has(n.id)} onFix={run} onDismiss={() => dismiss(n.id)} onSeen={() => typed.current.add(n.id)} />}
                    </div></div>
                    {peeking && <div className="kvp-dg-peek"><Detail note={n} typeIt={false} onFix={run} onDismiss={() => dismiss(n.id)} /></div>}
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      </section>
      {toast && createPortal(
        <div className="kvp-dg-toast" role="status">
          <div className="kvp-dg-toast-top"><span className="kvp-dg-urgent">Urgent</span><span style={{ flex: 1 }} /><button type="button" className="kvp-dg-x" aria-label="Close" onClick={() => setToast(null)}><X size={14} /></button></div>
          <p className="kvp-dg-toast-title">{toast.title}</p>
          {toast.why && <p className="kvp-dg-toast-why">{toast.why}</p>}
          <div className="kvp-dg-acts">
            {toast.fixes.map((f, n) => <button key={f.label} type="button" className={`kvp-btn${n === 0 ? ' is-primary' : ''}`} onClick={() => { run(f); setToast(null) }}>{f.label}</button>)}
          </div>
          <span className="kvp-dg-drain" aria-hidden="true"><i /></span>
        </div>,
        document.body,
      )}
    </>
  )
}
