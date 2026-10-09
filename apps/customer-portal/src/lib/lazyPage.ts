import { lazy, type ComponentType } from 'react'

const KEY = 'page-reload-once'

/**
 * lazy() that survives a missing code chunk. After a new release (or the dev
 * server re-bundling), an old page can ask for a file that no longer exists;
 * instead of a blank screen, reload once to pick up the current files.
 */
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load()
      try { sessionStorage.removeItem(KEY) } catch { /* fine */ }
      return mod
    } catch (err) {
      let reloaded = false
      try { reloaded = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1') } catch { /* no storage: don't loop */ reloaded = true }
      if (!reloaded) {
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // the page is reloading
      }
      throw err
    }
  })
}
