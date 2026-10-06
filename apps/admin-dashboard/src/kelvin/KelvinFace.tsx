import { useEffect, useMemo, useRef, useState } from 'react'
import './kelvin.css'

export type Mood = 'idle' | 'thinking' | 'news' | 'urgent' | 'pleased' | 'asleep'

const MOOD_LABEL: Record<Mood, string> = {
  idle: 'Kelvin', thinking: 'Kelvin is working', news: 'Kelvin has something for you',
  urgent: 'Kelvin has something urgent', pleased: 'Kelvin finished', asleep: 'Kelvin is offline',
}
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The thermostat with eyes. One component everywhere; moods change the ring and
 * eyes, lookAt turns the eyes towards a point on screen (move 1), follow tracks
 * the pointer (move 5), progress fills the ring (move 4).
 */
export default function KelvinFace({ size = 48, mood = 'idle', lookAt = null, follow = false, progress, label }: {
  size?: 20 | 32 | 48 | 72
  mood?: Mood
  lookAt?: { x: number; y: number } | null
  follow?: 'near' | 'everywhere' | false
  progress?: number | null
  label?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const blinkDelay = useMemo(() => `${(4 + Math.random() * 3).toFixed(2)}s`, [])

  useEffect(() => {
    if (!follow || reduceMotion()) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const near = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 240
        setPointer(follow === 'everywhere' || near ? { x: e.clientX, y: e.clientY } : null)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); if (frame) cancelAnimationFrame(frame) }
  }, [follow])

  const target = lookAt ?? pointer
  let dx = 0, dy = 0
  if (target && ref.current && mood !== 'asleep' && !reduceMotion()) {
    const r = ref.current.getBoundingClientRect()
    const vx = target.x - (r.left + r.width / 2), vy = target.y - (r.top + r.height / 2)
    const len = Math.hypot(vx, vy) || 1
    const max = lookAt ? 3 : 2
    dx = (vx / len) * max * (size / 48)
    dy = (vy / len) * max * (size / 48)
  }

  const R = 46, C = 2 * Math.PI * R
  const showProgress = progress !== undefined
  return (
    <span
      ref={ref}
      className={`kv-face kv-${mood}`}
      style={{ ['--kv-size' as string]: `${size}px`, ['--kv-blink-delay' as string]: blinkDelay }}
      role="img"
      aria-label={label ?? MOOD_LABEL[mood]}
    >
      {/* His colour is colour temperature: cool daylight when calm, warming as things need you. */}
      <span className="kv-temp" aria-hidden="true" />
      {mood === 'urgent' && <span className="kv-ripple" aria-hidden="true" />}
      <svg className="kv-ring" viewBox="0 0 100 100" aria-hidden="true">
        {showProgress && (
          <circle
            className={`kv-ring-fill${progress === null ? ' is-indeterminate' : ''}`}
            cx="50" cy="50" r={R}
            strokeDasharray={C}
            strokeDashoffset={progress === null ? C * 0.7 : C * (1 - Math.max(0, Math.min(1, progress)))}
          />
        )}
      </svg>
      <span className="kv-dial" aria-hidden="true">
        <span className="kv-eyes" style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)` }}>
          <i className="kv-eye" /><i className="kv-eye" />
        </span>
      </span>
    </span>
  )
}

/** Small static mark for the sidebar. */
export function KelvinGlyph({ size = 18 }: { size?: number; strokeWidth?: number }) {
  return (
    <span className="kv-glyph" style={{ width: size, height: size }} aria-hidden="true">
      <i /><i />
    </span>
  )
}
