import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, animate, m, useDragControls, useMotionValue } from 'motion/react'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import { isBusy, nextToSpeak, overlayOpen, SpokenStore } from './speech'
import type { KelvinItem } from './types'
import { Placement, snap, type Side } from './placement'

const SHOW_MS = 6000
const SIZE = 60
const EDGE = 16
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const xFor = (side: Side) => (side === 'left' ? EDGE : window.innerWidth - SIZE - EDGE - 8)
const yDefault = () => window.innerHeight - SIZE - 24
const hopKey = (userId: string) => `kelvin:hop:${userId}`

/** Page modals: whatever sits on top at the centre of the screen, and its parents. A modal's
 *  backdrop or dialog is always there; most lack aria-modal, so fixed full-screen layers count too. */
function modalOpen(): boolean {
  const chain: HTMLElement[] = []
  for (let e = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2) as HTMLElement | null; e && e !== document.body; e = e.parentElement) chain.push(e)
  return overlayOpen(chain.map(e => ({
    ariaModal: e.getAttribute('aria-modal') === 'true', role: e.getAttribute('role') ?? '',
    position: getComputedStyle(e).position, rect: e.getBoundingClientRect(),
    kelvin: !!e.closest('.kv-panel, .kv-corner'),
  })), { width: window.innerWidth, height: window.innerHeight })
}
const pageOf = (path: string) => (path === '/' ? 'dashboard' : path.split('/')[1] || 'dashboard')

/** Kelvin's place on every page: his face, his ring, and a short bubble when something needs you. */
export default function KelvinCorner() {
  const k = useKelvin()
  const { pathname } = useLocation()
  const [bubble, setBubble] = useState<KelvinItem | null>(null)
  const [hover, setHover] = useState(false)
  const [hop, setHop] = useState(false)
  // Where he lives: a side edge and a height, remembered per person. Dragging or throwing him
  // springs him to the nearer edge with a little squash as he lands.
  const x = useMotionValue(xFor(k.side))
  const y = useMotionValue(Placement.load(k.userId).y ?? yDefault())
  const scaleX = useMotionValue(1)
  const scaleY = useMotionValue(1)
  const drag = useDragControls()
  const dragged = useRef(false)
  useEffect(() => {
    const fit = () => { x.set(xFor(k.side)); y.set(Math.min(y.get(), window.innerHeight - SIZE - 24)) }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [k.side]) // eslint-disable-line react-hooks/exhaustive-deps

  const land = (vx: number, vy: number) => {
    const to = snap({ x: x.get(), y: y.get(), vx: vx / 60, vy: vy / 60 }, { width: window.innerWidth, height: window.innerHeight }, SIZE)
    k.setSide(to.side)
    Placement.save(k.userId, { side: to.side, y: to.y })
    if (reduceMotion()) { x.set(xFor(to.side)); y.set(to.y); return }
    const spring = { type: 'spring' as const, stiffness: 380, damping: 24 }
    animate(x, xFor(to.side), { ...spring, velocity: vx })
    animate(y, to.y, { ...spring, velocity: vy })
    animate(scaleX, [1, 1.16, 0.94, 1], { duration: 0.55, times: [0, 0.35, 0.7, 1] })
    animate(scaleY, [1, 0.86, 1.06, 1], { duration: 0.55, times: [0, 0.35, 0.7, 1] })
  }
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Decide every 5 s and on every feed change.
  useEffect(() => {
    if (!k.feed || k.panelOpen || bubble) return
    const tick = () => {
      const prefs = k.feed!.prefs
      const next = nextToSpeak({
        items: k.feed!.items, now: Date.now(), page: pageOf(pathname),
        visible: document.visibilityState === 'visible',
        busy: isBusy(document.activeElement as HTMLElement | null, modalOpen()),
        mode: prefs ? prefs.speakMode : null,
        quietUntil: prefs?.quietUntil ? Date.parse(prefs.quietUntil) : null,
        lastSpokeAt: SpokenStore.lastSpokeAt(k.userId),
        spoken: SpokenStore.load(k.userId),
      })
      if (!next) return
      SpokenStore.setLastSpokeAt(k.userId, Date.now())
      k.markSpoken(next)
      setBubble(next)
      const today = new Date().toDateString()
      try {
        if (localStorage.getItem(hopKey(k.userId)) !== today) { localStorage.setItem(hopKey(k.userId), today); setHop(true); setTimeout(() => setHop(false), 800) }
      } catch { /* no hop without storage */ }
      k.lookAtItem(next.id) // eyes turn to its note if it is on this page
    }
    tick()
    const t = setInterval(tick, 5000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick) }
  }, [k.feed, k.panelOpen, bubble, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bubble || hover) return
    hideTimer.current = setTimeout(() => setBubble(null), SHOW_MS)
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [bubble, hover])

  const open = (message?: string) => { setBubble(null); k.openPanel(message) }

  const left = k.side === 'left'
  return (
    <m.div
      className={`kv-corner is-${k.side}`}
      style={{ x, y }}
      drag
      dragListener={false}
      dragControls={drag}
      dragMomentum={false}
      dragElastic={0.12}
      onDragStart={() => { dragged.current = true; setBubble(null) }}
      onDragEnd={(_, info) => { land(info.velocity.x, info.velocity.y); setTimeout(() => { dragged.current = false }, 0) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div aria-live="polite" className="kv-bubble-region">
        <AnimatePresence>
          {bubble && (
            <m.div
              key={bubble.id}
              className={`kv-bubble is-${bubble.urgency}`}
              style={{ originX: left ? 0 : 1, originY: 1 }}
              initial={{ opacity: 0, scale: 0.5, x: left ? -12 : 12 }}
              animate={{ opacity: 1, scale: 1, x: 0, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.14 } }}
            >
              {bubble.urgency === 'urgent' && <span className="kv-bubble-tag">Urgent</span>}
              <button type="button" className="kv-bubble-text" onClick={() => open(bubble.fixes[0]?.request)}>{bubble.title}</button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {!k.panelOpen && (
        <m.button
          layoutId="kelvin-face"
          type="button"
          className={`kv-corner-btn${hop ? ' kv-hop' : ''}`}
          style={{ scaleX, scaleY }}
          onPointerDown={e => drag.start(e)}
          onClick={() => { if (!dragged.current) open() }}
          aria-label="Open Kelvin (⌘K). Drag to move him."
          transition={{ duration: 0.32 }}
        >
          <KelvinFace size={48} mood={k.mood} lookAt={k.lookTarget} follow="near" />
        </m.button>
      )}
    </m.div>
  )
}
