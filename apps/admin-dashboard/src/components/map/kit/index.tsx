/**
 * Map building blocks shared by the scheduling maps. Pages describe WHAT is on the map
 * (pins, lines, popups); this picks Leaflet or Google Maps to draw it.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { bearing, metresBetween, techPinHtml, TECH_PIN, type TechPinInput } from '../../../lib/maps/pins'
import { LeafletBaseMap, LeafletLine, LeafletPin } from './LeafletKit'
import { GoogleBaseMap, GoogleLine, GooglePin } from './GoogleKit'
import { useMapEngine, type MapEngine } from './provider'
import type { BaseMapProps, LatLng, LineProps, PinProps } from './types'

export type { LatLng, BaseMapProps, PinProps, LineProps } from './types'

const EngineCtx = createContext<MapEngine>('leaflet')

export function BaseMap(props: BaseMapProps) {
  const engine = useMapEngine()
  return (
    <EngineCtx.Provider value={engine}>
      {engine === 'google' ? <GoogleBaseMap {...props} /> : <LeafletBaseMap {...props} />}
    </EngineCtx.Provider>
  )
}

export function Pin(props: PinProps) {
  return useContext(EngineCtx) === 'google' ? <GooglePin {...props} /> : <LeafletPin {...props} />
}

export function Line(props: LineProps) {
  return useContext(EngineCtx) === 'google' ? <GoogleLine {...props} /> : <LeafletLine {...props} />
}

// ─── A technician that glides to each new GPS fix ────────────────────────────

/** Moves from the last shown spot to a new one over `ms`, easing in and out. Jumps when far away or not moving. */
function useGlide(target: LatLng, glide: boolean, ms = 2600): LatLng {
  const [pos, setPos] = useState<LatLng>(target)
  const shown = useRef<LatLng>(target)
  const raf = useRef(0)

  useEffect(() => {
    const from = shown.current
    const dist = metresBetween(from, target)
    // Under 3 m is GPS wobble; over 3 km is a re-sync after the tab sat in the background. Neither should slide.
    if (!glide || dist < 3 || dist > 3000 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target; setPos(target); return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      const next: LatLng = [from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e]
      shown.current = next; setPos(next)
      if (k < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target[0], target[1], glide]) // eslint-disable-line react-hooks/exhaustive-deps
  return pos
}

export interface TechPinProps extends Omit<TechPinInput, 'moving' | 'heading'> {
  position: LatLng
  speedKmh?: number
  headingDeg?: number | null
  zIndex?: number
  popup?: React.ReactNode
  popupWidth?: number
}

/** Round-photo technician pin. While they drive it slides between fixes and points the way they are heading. */
export function TechPin({ position, speedKmh, headingDeg, zIndex, popup, popupWidth, ...pin }: TechPinProps) {
  const moving = (speedKmh ?? 0) > 3 && !pin.stale
  const pos = useGlide(position, moving)
  const last = useRef<LatLng>(position)
  const heading = useRef<number | null>(headingDeg ?? null)

  // Heading from the device when it reports one, otherwise from the direction of the last real movement.
  if (headingDeg != null) heading.current = headingDeg
  else if (metresBetween(last.current, position) > 10) { heading.current = bearing(last.current, position); last.current = position }

  return (
    <Pin
      position={pos}
      html={techPinHtml({ ...pin, moving, heading: heading.current })}
      width={TECH_PIN.width} height={TECH_PIN.height} anchor={[TECH_PIN.anchorX, TECH_PIN.anchorY]}
      zIndex={zIndex ?? 500} popup={popup} popupWidth={popupWidth}
    />
  )
}
