/**
 * Remembered map view — where the user last panned and zoomed to.
 *
 * Switching pages unmounts a Leaflet map, so without this the dispatcher lands
 * back on the auto-fitted whole-fleet view and has to zoom in again every time.
 *
 * Kept in this tab (sessionStorage) and, for up to 12 hours, for every tab and
 * window (localStorage), so opening the board in a new tab lands where you were
 * working today, while a view from last week, which may show nothing, is not
 * brought back.
 *
 * Every accessor is wrapped: private windows and blocked site data both throw on
 * storage. A map that opens auto-fitted is a fine outcome; a crash is not.
 */

export interface MapView {
  center: [number, number]
  zoom: number
}

export interface MapViewStore {
  read(): MapView | null
  write(v: MapView): void
  clear(): void
}

export function createMapViewStore(key: string): MapViewStore {
  const storageKey = `tscrm.mapView.${key}`
  const valid = (v: unknown): v is MapView => {
    const m = v as MapView
    return Array.isArray(m?.center) && m.center.length === 2 && m.center.every((n) => typeof n === 'number' && Number.isFinite(n))
      && typeof m.zoom === 'number' && Number.isFinite(m.zoom)
  }

  return {
    read() {
      try {
        const here = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
        if (valid(here)) return { center: here.center, zoom: here.zoom }
      } catch { /* try the shared copy */ }
      try {
        const shared = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as (MapView & { at?: number }) | null
        if (valid(shared) && typeof shared.at === 'number' && Date.now() - shared.at < SHARED_FOR_MS) return { center: shared.center, zoom: shared.zoom }
      } catch { /* none */ }
      return null
    },

    write(v: MapView) {
      // Quota or blocked storage: remembering the view is a nicety, never a reason to interrupt.
      try { sessionStorage.setItem(storageKey, JSON.stringify(v)) } catch { /* ignore */ }
      try { localStorage.setItem(storageKey, JSON.stringify({ ...v, at: Date.now() })) } catch { /* ignore */ }
    },

    clear() {
      try { sessionStorage.removeItem(storageKey) } catch { /* nothing to do */ }
      try { localStorage.removeItem(storageKey) } catch { /* nothing to do */ }
    },
  }
}

/** How long a view carries over to new tabs and windows. */
const SHARED_FOR_MS = 12 * 60 * 60 * 1000
