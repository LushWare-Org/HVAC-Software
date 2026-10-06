/** Where Kelvin lives on screen: a side edge and a height. Pure, so the rules are testable. */
export type Side = 'left' | 'right'
export interface Place { side: Side; y: number | null }

const TOP = 96 // below the top bar
const BOTTOM_GAP = 24
const THROW = 8 // how far a flick carries him, in frames of travel

/** Where he lands after a drag: the nearer side to where he was heading, at that height, kept on screen. */
export function snap(
  at: { x: number; y: number; vx: number; vy: number },
  viewport: { width: number; height: number },
  size: number,
): { side: Side; y: number } {
  const px = at.x + at.vx * THROW
  const py = at.y + at.vy * THROW
  const side: Side = px + size / 2 < viewport.width / 2 ? 'left' : 'right'
  const y = Math.min(Math.max(py, TOP), viewport.height - size - BOTTOM_GAP)
  return { side, y: Math.round(y) }
}

const KEY = (userId: string) => `kelvin:place:${userId}`

/** Each person's spot for Kelvin, kept in this browser. */
export const Placement = {
  load(userId: string): Place {
    try {
      const v = JSON.parse(localStorage.getItem(KEY(userId)) ?? 'null')
      if ((v?.side === 'left' || v?.side === 'right') && (v.y === null || Number.isFinite(v.y))) return { side: v.side, y: v.y }
    } catch { /* fall through to the default */ }
    return { side: 'right', y: null }
  },
  save(userId: string, p: Place): void {
    try { localStorage.setItem(KEY(userId), JSON.stringify(p)) } catch { /* he just forgets */ }
  },
}
