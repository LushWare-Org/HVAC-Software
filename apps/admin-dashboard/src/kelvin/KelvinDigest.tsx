import { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { ChevronRight, X } from 'lucide-react'
import { KelvinContextForPages } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import { ago } from './desk'
import type { KelvinItem } from './types'

type Page = 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance' | 'inventory'
const GROUP: Record<KelvinItem['kind'], string> = {
  BRIEF: 'Brief', LATE: 'Schedule', TECH_OFF: 'Schedule', GAP: 'Schedule', EMERGENCY_UNASSIGNED: 'Schedule', RESCHEDULE_REQUEST: 'Schedule',
  NOTICE: 'Notice', ROUTINE: 'Routine', OVERDUE: 'Money', LOW_STOCK: 'Parts', SUGGESTION: 'Idea',
}
const source = (i: KelvinItem) =>
  i.kind === 'BRIEF' ? "Kelvin's morning brief" : i.kind === 'ROUTINE' ? 'One of your routines' : `Found by Kelvin${ago(i.createdAt) ? `, ${ago(i.createdAt)}` : ''}`

/** The reason types itself out the first time a note is opened. Decided once, when it mounts. */
function Typed({ text, animate }: { text: string; animate: boolean }) {
  const [on] = useState(animate)
  const [n, setN] = useState(on ? 0 : text.length)
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setN(v => { if (v >= text.length) { clearInterval(t); return v } return v + 2 }), 22)
    return () => clearInterval(t)
  }, [on, text])
  return <>{text.slice(0, n)}{n < text.length && <span className="kv-caret" aria-hidden="true" />}</>
}

function useCountUp(target: number, run: boolean) {
  const [v, setV] = useState(run ? Math.max(0, target - 3) : target)
  useEffect(() => {
    if (!run) { setV(target); return }
    if (v >= target) { setV(target); return }
    const t = setTimeout(() => setV(x => x + 1), 140)
    return () => clearTimeout(t)
  }, [v, target, run])
  return v
}

function useNarrow() {
  const q = '(max-width: 760px)'
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(q)
    if (!mq) return
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

function Detail({ item, typeIt, onDone }: { item: KelvinItem; typeIt: boolean; onDone?: () => void }) {
  const k = useContext(KelvinContextForPages)!
  useEffect(() => { onDone?.() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="kv-dg-in">
      {item.why && <div className="kv-dg-block"><span className="kv-dg-label"><KelvinFace size={20} mood={item.urgency === 'urgent' ? 'urgent' : 'news'} />Why Kelvin flagged it</span><p>{typeIt ? <Typed text={item.why} animate /> : item.why}</p></div>}
      <div className="kv-dg-foot-row">
        <span className="kv-dg-src"><span className="kv-dg-src-dot" aria-hidden="true" />{source(item)}</span>
        <span className="kv-dg-acts">
          {item.fixes.map((f, n) => <button key={f.request} type="button" className={`ops-btn ops-btn-sm${n === 0 ? ' ops-btn-primary' : ''}`} onClick={e => { e.stopPropagation(); k.applyFix(item, f) }}>{f.label}</button>)}
          <button type="button" className="kv-dg-dismiss" onClick={e => { e.stopPropagation(); k.dismiss(item) }}>Dismiss</button>
        </span>
      </div>
    </div>
  )
}

/**
 * Kelvin's notes as a digest: a card per note, two columns, every title in view.
 * Hover a card to peek at it; press its arrow (or the card) to keep it open, press again to close.
 * On page load the card "scans" and the count ticks up. An urgent new finding pops up by
 * Kelvin for a few seconds, then docks into the digest.
 */
export default function KelvinDigest({ page, limit = 12 }: { page: Page; limit?: number }) {
  const k = useContext(KelvinContextForPages)
  const calm = useReducedMotion()
  const all = (k?.enabled ? k.feed?.items ?? [] : []).filter(i => i.urgency !== 'quiet' && i.kind !== 'SUGGESTION' && (page === 'dashboard' || i.anchor?.page === page))
  const items = all.slice(0, limit)
  const urgent = items.filter(i => i.urgency === 'urgent')
  const [chosen, setChosen] = useState<Record<string, boolean>>({})
  const isPinned = (i: KelvinItem) => chosen[i.id] ?? urgent.slice(0, 2).some(u => u.id === i.id)
  // Hover peek is driven here, not by CSS :hover, so it can wait for the layout to settle
  // after a card opens or closes (cards sliding under a still pointer must not pop open).
  const [peekId, setPeekId] = useState<string | null>(null)
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const quietUntil = useRef(0)
  const narrow = useNarrow()
  const typed = useRef<Set<string>>(new Set())
  const known = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const ids = items.map(i => i.id).join()

  useEffect(() => { if (k && items.length) k.markSeen(items.map(i => i.id)) }, [ids]) // eslint-disable-line react-hooks/exhaustive-deps
  // Anything that was not here before is new: urgent ones pop up, the rest just get a ring.
  useEffect(() => {
    const before = known.current
    known.current = new Set(items.map(i => i.id))
    if (!before) return
    const added = items.filter(i => !before.has(i.id) && !i.seen)
    if (!added.length) return
    setFresh(new Set(added.map(i => i.id)))
    const hot = added.find(i => i.urgency === 'urgent')
    if (hot && !calm) setToast(hot.id)
    const t = setTimeout(() => setFresh(new Set()), 1400)
    return () => clearTimeout(t)
  }, [ids]) // eslint-disable-line react-hooks/exhaustive-deps

  const count = useCountUp(all.length, !calm)
  if (!k?.enabled || !items.length) return null

  const enter = (id: string) => {
    clearTimeout(peekTimer.current)
    peekTimer.current = setTimeout(() => { if (Date.now() >= quietUntil.current) setPeekId(id) }, 160)
  }
  const leave = (id: string) => { clearTimeout(peekTimer.current); setPeekId(p => (p === id ? null : p)) }
  const press = (item: KelvinItem) => {
    clearTimeout(peekTimer.current)
    setPeekId(null)
    quietUntil.current = Date.now() + 450
    setChosen(c => ({ ...c, [item.id]: !isPinned(item) }))
  }
  const toastItem = toast ? items.find(i => i.id === toast) ?? null : null

  return (
    <>
      <m.section className="kv-dg" aria-label="Notes from Kelvin" initial={calm ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
        <header className="kv-dg-head">
          <KelvinFace size={20} mood={urgent.length ? 'urgent' : 'news'} />
          <h2>Kelvin has <span className="kv-dg-num">{count}</span> {all.length === 1 ? 'thing' : 'things'} for you</h2>
          {urgent.length > 0 && <span className="kv-item-tag">{urgent.length} urgent</span>}
          <span className="kv-dg-sp" />
          <Link className="kv-link" to="/kelvin">Open his desk</Link>
          {!calm && <span className="kv-dg-scan" aria-hidden="true" />}
        </header>
        <div className="kv-dg-list">
          {(narrow ? [items.map((it, n) => [it, n] as const)] : [0, 1].map(c => items.map((it, n) => [it, n] as const).filter(([, n]) => n % 2 === c))).map((col, c) => (
            <div key={c} className="kv-dg-col">
              <AnimatePresence initial>
                {col.map(([item, n]) => {
                  const pinned = isPinned(item)
                  const peeking = peekId === item.id && !pinned
                  const hot = item.urgency === 'urgent'
                  return (
                    <m.div
                      key={item.id}
                      className={`kv-dg-row${pinned ? ' is-open' : ''}${hot ? ' is-urgent' : ''}${peeking ? ' is-peek' : ''}`}
                      data-kelvin-item={item.id}
                      initial={calm ? false : { opacity: 0, filter: 'blur(5px)', x: -8 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                      exit={calm ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden', transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: calm ? 0 : Math.min(n, 8) * 0.12 }}
                      onMouseEnter={() => { k.lookAtItem(item.id); enter(item.id) }}
                      onMouseLeave={() => leave(item.id)}
                      onFocus={e => { if ((e.target as HTMLElement).matches(':focus-visible')) setPeekId(item.id) }}
                      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) leave(item.id) }}
                    >
                      {fresh.has(item.id) && !calm && <m.span className="kv-dg-ping" aria-hidden="true" initial={{ opacity: 0.9 }} animate={{ opacity: 0, scale: 1.03 }} transition={{ duration: 1.1, ease: 'easeOut' }} />}
                      <button type="button" className="kv-dg-line" aria-expanded={pinned} onClick={() => press(item)}>
                        <span className={`kv-dg-face${hot ? ' is-hot' : ''}`} aria-hidden="true"><KelvinFace size={20} mood={hot ? 'urgent' : 'news'} /></span>
                        <span className="kv-dg-text">
                          <span className="kv-dg-title">{item.title}</span>
                          <span className="kv-dg-meta">{GROUP[item.kind]} · {source(item)}</span>
                        </span>
                        {hot && <span className="kv-dg-tag is-hot">Urgent</span>}
                        <m.span className="kv-dg-chev" animate={{ rotate: pinned ? 90 : 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} title={pinned ? 'Close' : 'Keep open'}><ChevronRight size={15} aria-hidden="true" /></m.span>
                      </button>

                      {/* Kept open: slides the cards below it down. */}
                      <AnimatePresence initial={false}>
                        {pinned && (
                          <m.div
                            key="more" className="kv-dg-more"
                            initial={calm ? false : { height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.24, delay: 0.06 } } }}
                            exit={calm ? { opacity: 0 } : { height: 0, opacity: 0, transition: { height: { duration: 0.26, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.14 } } }}
                          >
                            <Detail item={item} typeIt={!calm && !typed.current.has(item.id)} onDone={() => typed.current.add(item.id)} />
                          </m.div>
                        )}
                      </AnimatePresence>

                      {/* Hover or keyboard focus: floats over the cards below without moving them. */}
                      <AnimatePresence>
                        {peeking && (
                          <m.div
                            key="peek" className="kv-dg-peek"
                            initial={calm ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.12 } }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Detail item={item} typeIt={false} />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {all.length > limit && <Link className="kv-link kv-dg-more-link" to="/kelvin">{all.length - limit} more on Kelvin's desk</Link>}
      </m.section>
      <ArrivalToast item={toastItem} onGone={() => setToast(null)} />
    </>
  )
}

/** An urgent new finding: up by Kelvin for four seconds with its fixes, then it docks into the digest. */
function ArrivalToast({ item, onGone }: { item: KelvinItem | null; onGone: () => void }) {
  const k = useContext(KelvinContextForPages)
  const [hover, setHover] = useState(false)
  useEffect(() => {
    if (!item || hover) return
    const t = setTimeout(onGone, 4000)
    return () => clearTimeout(t)
  }, [item?.id, hover]) // eslint-disable-line react-hooks/exhaustive-deps
  if (typeof document === 'undefined' || !k) return null
  const rect = document.querySelector('.kv-corner-btn')?.getBoundingClientRect()
  const left = rect ? Math.min(Math.max(12, rect.right - 320), window.innerWidth - 332) : window.innerWidth - 332
  const bottom = rect ? Math.max(12, window.innerHeight - rect.top + 12) : 96
  return createPortal(
    <AnimatePresence>
      {item && (
        <m.div
          key={item.id}
          className="kv-dg-toast" role="status" style={{ left, bottom }}
          initial={{ opacity: 0, y: 18, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.25, x: -160, y: -220, transition: { duration: 0.45, ease: [0.5, 0, 0.8, 0.4] } }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        >
          <div className="kv-dg-toast-top"><span className="kv-item-tag">Urgent</span><span className="kv-dg-sp" /><button type="button" className="kv-dg-x" aria-label="Close" onClick={onGone}><X size={14} /></button></div>
          <p className="kv-item-title">{item.title}</p>
          {item.why && <p className="kv-item-why">{item.why}</p>}
          <div className="kv-item-fixes">
            {item.fixes.map((f, n) => <button key={f.request} type="button" className={`ops-btn ops-btn-sm${n === 0 ? ' ops-btn-primary' : ''}`} onClick={() => { k.applyFix(item, f); onGone() }}>{f.label}</button>)}
          </div>
          <span className="kv-dg-drain" aria-hidden="true"><i style={{ animationPlayState: hover ? 'paused' : 'running' }} /></span>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
