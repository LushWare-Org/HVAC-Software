import { useContext, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { KelvinContextForPages } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import { ago } from './desk'
import type { KelvinItem } from './types'

/** Short notes from Kelvin inside a page. New notes fly out of his corner to their place (move 2). */
export default function KelvinNotes({ page, limit = 3 }: { page: 'dashboard' | 'jobs' | 'scheduling'; limit?: number }) {
  const k = useContext(KelvinContextForPages)
  const all = (k?.enabled ? k.feed?.items ?? [] : []).filter(i => i.urgency !== 'quiet' && (page === 'dashboard' || i.anchor?.page === page))
  const items = all.slice(0, limit)
  const seenOnce = useRef(new Set<string>())
  useEffect(() => { if (k && items.length) k.markSeen(items.map(i => i.id)) }, [items.map(i => i.id).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k?.enabled || !items.length) return null

  return (
    <section className="kv-notes" aria-label="Notes from Kelvin">
      <AnimatePresence initial={false}>
        {items.map(item => {
          const isNew = !seenOnce.current.has(item.id)
          seenOnce.current.add(item.id)
          return <Note key={item.id} item={item} fly={isNew && !item.seen} />
        })}
      </AnimatePresence>
      {all.length > limit && <Link className="kv-link" to="/kelvin">{all.length - limit} more on Kelvin's desk</Link>}
    </section>
  )
}

function Note({ item, fly }: { item: KelvinItem; fly: boolean }) {
  const k = useContext(KelvinContextForPages)!
  const ref = useRef<HTMLDivElement>(null)
  // Start from the corner: offset is measured once, then animates to its place.
  const from = (() => {
    if (!fly || typeof window === 'undefined') return undefined
    const corner = document.querySelector('.kv-corner-btn')?.getBoundingClientRect()
    return corner ? { x: corner.left - 40, y: corner.top - 200 } : undefined
  })()
  return (
    <m.div
      ref={ref}
      layout
      className={`kv-note is-${item.urgency}`}
      data-kelvin-item={item.id}
      initial={from ? { opacity: 0, scale: 0.3, x: Math.min(from.x, 600), y: Math.min(from.y, 400) } : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      onMouseEnter={() => k.lookAtItem(item.id)}
    >
      <KelvinFace size={20} mood={item.urgency === 'urgent' ? 'urgent' : 'news'} />
      <div className="kv-note-body">
        {item.urgency === 'urgent' && <span className="kv-item-tag">Urgent</span>}
        <p className="kv-item-title">{item.title}</p>
        {item.why && <p className="kv-item-why">{item.why}</p>}
        <span className="kv-heatline" aria-hidden="true" />
        <p className="kv-by">{item.kind === 'BRIEF' ? "From Kelvin's morning brief" : `Found by Kelvin${ago(item.createdAt) ? `, ${ago(item.createdAt)}` : ''}`}</p>
        <div className="kv-item-fixes">
          {item.fixes.map(f => <button key={f.request} type="button" className="ops-btn ops-btn-sm" onClick={() => k.applyFix(item, f)}>{f.label}</button>)}
          <button type="button" className="kv-link" onClick={() => k.dismiss(item)}>Dismiss</button>
        </div>
      </div>
    </m.div>
  )
}
