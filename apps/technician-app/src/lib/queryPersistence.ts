/**
 * queryPersistence.ts — MMKV-backed React Query cache persistence.
 *
 * Why: TanStack Query keeps its cache in memory. On cold start the cache is
 * empty → every screen flashes a loading spinner until the first fetch lands.
 * By persisting the cache to MMKV (fast, synchronous key/value store) we can
 * hydrate instantly on launch and show last-known-good data immediately, with
 * refetches happening silently in the background (stale-while-revalidate).
 *
 * Architecture note:
 *  react-native-mmkv 3.x requires the New Architecture (TurboModules).
 *  app.json already has `"newArchEnabled": true`, so once you rebuild the
 *  native binary (`expo run:android` / `expo run:ios`) this will work fully.
 *
 *  Until then (old binary), MMKV instantiation throws at module load time and
 *  crashes the entire import chain (queryClient → useNotifications → _layout).
 *  We catch that with a dynamic require + try/catch and fall back to a no-op
 *  storage — the app works normally, just without the cold-start optimisation.
 *
 * Data lifecycle:
 *  - Only successful queries are dehydrated
 *  - Persisted blob older than MAX_AGE_MS is discarded
 *  - Writes are throttled to every 2 s to avoid storage churn on chatty
 *    updates (e.g. the 8 s thread-detail poll)
 */

import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

// ── Safe storage abstraction ─────────────────────────────────────────────────

type SimpleStorage = {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
}

/** No-op fallback used when MMKV can't be instantiated (old arch binary). */
const noopStorage: SimpleStorage = {
  getString: () => undefined,
  set: () => {},
  delete: () => {},
}

function createStorage(): SimpleStorage {
  try {
    // Use a dynamic require so the static import doesn't execute at module
    // evaluation time — this lets us catch the TurboModules error safely.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
    const instance = new MMKV({ id: 'techapp-query-cache' })
    if (__DEV__) console.log('[QueryCache] MMKV storage initialised ✓')
    return instance
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[QueryCache] MMKV unavailable — persistence disabled.\n' +
          'To enable, rebuild the native binary:\n' +
          '  expo run:android  OR  expo run:ios\n' +
          '(app.json already has "newArchEnabled": true)\n',
        (err as Error)?.message,
      )
    }
    return noopStorage
  }
}

const storage = createStorage()

// ── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'rq-cache-v1'
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 h — don't resurrect truly stale data
const THROTTLE_MS = 2000

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronously load the persisted cache and hydrate the client.
 * Call before rendering so screens see data on the first frame.
 * Safe to call even when storage is the no-op fallback.
 */
export function hydrateQueryClient(client: QueryClient): void {
  try {
    const raw = storage.getString(CACHE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw) as { savedAt: number; state: unknown }
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      storage.delete(CACHE_KEY)
      return
    }

    hydrate(client, parsed.state as any)
  } catch (err) {
    // Corrupt blob — clear and carry on
    storage.delete(CACHE_KEY)
    if (__DEV__) console.warn('[QueryCache] Hydrate failed, cleared:', err)
  }
}

/**
 * Subscribe to cache changes and throttle-persist them.
 * Returns an unsubscribe function.
 * Safe to call even when storage is the no-op fallback.
 */
export function setupQueryPersistence(client: QueryClient): () => void {
  let pending: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    pending = null
    try {
      const state = dehydrate(client, {
        // Only persist stable, successful queries — errors/mutations are skipped
        shouldDehydrateQuery: (q) => q.state.status === 'success',
      })
      storage.set(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), state }),
      )
    } catch (err) {
      if (__DEV__) console.warn('[QueryCache] Persist failed:', err)
    }
  }

  const unsubscribe = client.getQueryCache().subscribe(() => {
    if (pending) return
    pending = setTimeout(flush, THROTTLE_MS)
  })

  return () => {
    unsubscribe()
    if (pending) {
      clearTimeout(pending)
      pending = null
    }
  }
}

/**
 * Clear the persisted cache — call on logout so the next user doesn't see
 * the previous technician's data.
 */
export function clearPersistedQueryCache(): void {
  try {
    storage.delete(CACHE_KEY)
  } catch {
    /* ignore */
  }
}
