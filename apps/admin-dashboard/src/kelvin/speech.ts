import type { KelvinItem, SpeakMode } from './types'

export const GAP_MS = 10 * 60 * 1000

/** Whether Kelvin should speak now, and about what. Pure, so every rule is testable. */
export function nextToSpeak(input: {
  items: KelvinItem[]
  now: number
  busy: boolean
  /** document.visibilityState === 'visible': a hidden tab must not use up the bubble. */
  visible: boolean
  page: string
  /** null when the person's settings could not be read: stay quiet rather than guess. */
  mode: SpeakMode | null
  quietUntil: number | null
  lastSpokeAt: number | null
  spoken: Set<string>
}): KelvinItem | null {
  const { items, now, busy, visible, page, mode, quietUntil, lastSpokeAt, spoken } = input
  if (busy || !visible || mode === null || mode === 'NEVER') return null
  if (quietUntil !== null && now < quietUntil) return null
  const candidates = items.filter(i =>
    (i.urgency === 'urgent' || (i.urgency === 'soon' && mode === 'ALL')) &&
    !i.spoken && !spoken.has(i.id) &&
    !(i.expiresAt && Date.parse(i.expiresAt) <= now) &&
    (i.kind !== 'BRIEF' || (page === 'dashboard' && !briefSpokenToday(i, items, spoken))))
  const urgent = candidates.find(i => i.urgency === 'urgent')
  if (urgent) return urgent
  if (lastSpokeAt !== null && now - lastSpokeAt < GAP_MS) return null
  return candidates[0] ?? null
}

/** The brief speaks once a day: any of today's brief items already spoken counts, however it was reordered. */
function briefSpokenToday(item: KelvinItem, items: KelvinItem[], spoken: Set<string>): boolean {
  const day = item.id.split(':').slice(0, 2).join(':') + ':' // "brief:2026-10-06:"
  return items.some(i => i.kind === 'BRIEF' && i.spoken && i.id.startsWith(day)) || [...spoken].some(id => id.startsWith(day))
}

/** Something modal is open: aria-modal, a dialog role, or any fixed layer covering most of the screen (most page modals lack aria-modal). */
export function overlayOpen(
  elements: Array<{ ariaModal: boolean; role: string; position: string; rect: { width: number; height: number }; kelvin: boolean }>,
  viewport: { width: number; height: number },
): boolean {
  return elements.some(e => !e.kelvin && (
    e.ariaModal || e.role === 'dialog' || e.role === 'alertdialog' ||
    (e.position === 'fixed' && e.rect.width >= viewport.width * 0.8 && e.rect.height >= viewport.height * 0.8)))
}

export function isBusy(active: { tagName: string; isContentEditable?: boolean } | null, modalOpen: boolean): boolean {
  if (modalOpen) return true
  if (!active) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable === true
}

export function endOfLocalDay(now: Date): Date {
  const d = new Date(now)
  d.setHours(24, 0, 0, 0)
  return d
}

const KEY = (userId: string) => `kelvin:spoken:${userId}`
const LAST_KEY = (userId: string) => `kelvin:last-spoke:${userId}`
const MAX = 300

/** What this browser already said, shared by every open tab through localStorage. */
export const SpokenStore = {
  load(userId: string): Set<string> {
    try {
      const raw = localStorage.getItem(KEY(userId))
      const list = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(list) ? list.filter((x: unknown) => typeof x === 'string') : [])
    } catch {
      return new Set()
    }
  },
  add(userId: string, id: string): void {
    try {
      const list = [...SpokenStore.load(userId)].filter(x => x !== id)
      list.push(id)
      localStorage.setItem(KEY(userId), JSON.stringify(list.slice(-MAX)))
    } catch { /* storage blocked: the server log still prevents repeats */ }
  },
  /** The 10-minute gap is shared by every tab and survives reloads. */
  lastSpokeAt(userId: string): number | null {
    try {
      const v = Number(localStorage.getItem(LAST_KEY(userId)))
      return Number.isFinite(v) && v > 0 ? v : null
    } catch {
      return null
    }
  },
  setLastSpokeAt(userId: string, at: number): void {
    try { localStorage.setItem(LAST_KEY(userId), String(at)) } catch { /* in-tab ref still applies */ }
  },
}
