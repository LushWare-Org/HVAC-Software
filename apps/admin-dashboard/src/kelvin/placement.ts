/** Where Kelvin lives on screen: any edge, and how far along it. Pure, so the rules are testable. */
export type Side = 'left' | 'right'
export type Edge = 'left' | 'right' | 'top' | 'bottom'
/** `at` is the height on the left/right edges and the distance from the left on the top/bottom edges. */
export interface Place { edge: Edge; at: number | null }

export const TOP = 96 // below the top bar
const BOTTOM_GAP = 24
export const EDGE = 16
const RIGHT_GAP = 8 // clear of the scrollbar
const THROW = 8 // how far a flick carries him, in frames of travel

export interface Viewport { width: number; height: number }

/** His top-left corner when he sits at this place. */
export function pointFor(p: Place, vp: Viewport, size: number): { x: number; y: number } {
  const maxX = vp.width - size - EDGE - RIGHT_GAP
  const maxY = vp.height - size - BOTTOM_GAP
  const along = (lo: number, hi: number, fallback: number) => Math.min(Math.max(p.at ?? fallback, lo), Math.max(lo, hi))
  switch (p.edge) {
    case 'left': return { x: EDGE, y: along(TOP, maxY, maxY) }
    case 'right': return { x: maxX, y: along(TOP, maxY, maxY) }
    case 'top': return { x: along(EDGE, maxX, maxX), y: TOP }
    case 'bottom': return { x: along(EDGE, maxX, maxX), y: maxY }
  }
}

/** Which side his panel opens on: the half of the screen he is in. */
export function panelSide(p: Place, vp: Viewport, size: number): Side {
  if (p.edge === 'left' || p.edge === 'right') return p.edge
  return pointFor(p, vp, size).x + size / 2 < vp.width / 2 ? 'left' : 'right'
}

/** Where he lands after a drag: the nearest edge to where he was heading, at that spot along it, kept on screen. */
export function snap(
  at: { x: number; y: number; vx: number; vy: number },
  viewport: Viewport,
  size: number,
): Place {
  const px = at.x + at.vx * THROW
  const py = at.y + at.vy * THROW
  const gaps: Array<[Edge, number]> = [
    ['left', px],
    ['right', viewport.width - (px + size)],
    ['top', py - TOP],
    ['bottom', viewport.height - (py + size)],
  ]
  const edge = gaps.reduce((a, b) => (b[1] < a[1] ? b : a))[0]
  const p = pointFor({ edge, at: edge === 'left' || edge === 'right' ? py : px }, viewport, size)
  return { edge, at: Math.round(edge === 'left' || edge === 'right' ? p.y : p.x) }
}

const KEY = (userId: string) => `kelvin:place:${userId}`
const EDGES: Edge[] = ['left', 'right', 'top', 'bottom']

/** Each person's spot for Kelvin, kept in this browser. */
export const Placement = {
  load(userId: string): Place {
    try {
      const v = JSON.parse(localStorage.getItem(KEY(userId)) ?? 'null')
      if (EDGES.includes(v?.edge) && (v.at === null || Number.isFinite(v.at))) return { edge: v.edge, at: v.at }
      // Saved before he could sit on the top or bottom: { side, y }.
      if ((v?.side === 'left' || v?.side === 'right') && (v.y === null || Number.isFinite(v.y))) return { edge: v.side, at: v.y }
    } catch { /* fall through to the default */ }
    return { edge: 'right', at: null }
  },
  save(userId: string, p: Place): void {
    try { localStorage.setItem(KEY(userId), JSON.stringify(p)) } catch { /* he just forgets */ }
  },
}
