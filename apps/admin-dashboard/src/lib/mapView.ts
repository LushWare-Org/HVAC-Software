/**
 * Remembered map view — where the user last panned and zoomed to.
 *
 * Switching pages unmounts a Leaflet map, so without this the dispatcher lands
 * back on the auto-fitted whole-fleet view and has to zoom in again every time.
 *
 * sessionStorage rather than a module variable so the view also survives a
 * reload, and rather than localStorage so a fresh session still opens on the
 * auto-fit rather than restoring a view from last week that may contain nothing.
 *
 * Every accessor is wrapped: private windows and blocked site data both throw on
 * sessionStorage. A map that opens auto-fitted is a fine outcome; a crash is not.
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

  return {
    read() {
      try {
        const raw = sessionStorage.getItem(storageKey)
        if (!raw) return null
        const v = JSON.parse(raw) as MapView
        const ok =
          Array.isArray(v?.center) &&
          v.center.length === 2 &&
          v.center.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
          typeof v.zoom === 'number' &&
          Number.isFinite(v.zoom)
        return ok ? v : null
      } catch {
        return null
      }
    },

    write(v: MapView) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(v))
      } catch {
        // Quota or blocked storage. Remembering the view is a nicety, never a
        // reason to interrupt what the user was doing.
      }
    },

    clear() {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        /* nothing to do */
      }
    },
  }
}
