/**
 * MMKV-backed React Query cache persistence.
 *
 * Why: TanStack Query's cache is in-memory, so on cold start every screen
 * would flash a spinner. Persisting to MMKV lets us hydrate before the first
 * render and paint last-known-good data immediately, refetching behind it.
 *
 * react-native-mmkv 3.x needs the New Architecture. app.json sets
 * newArchEnabled, but an older installed binary would throw at module load and
 * take the whole import chain down — hence the dynamic require + no-op fallback.
 */
import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

const CACHE_KEY = 'customer-query-cache'
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const WRITE_THROTTLE_MS = 2_000

type SimpleStorage = {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
}

const noopStorage: SimpleStorage = {
  getString: () => undefined,
  set: () => {},
  delete: () => {},
}

function createStorage(): SimpleStorage {
  try {
    // Dynamic require so the import does not execute at module-evaluation time —
    // that lets us catch the TurboModules error on an old-architecture binary.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
    return new MMKV({ id: 'customerapp-query-cache' }) as unknown as SimpleStorage
  } catch {
    return noopStorage
  }
}

const storage = createStorage()

export function hydrateQueryClient(client: QueryClient): void {
  try {
    const raw = storage.getString(CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { savedAt: number; state: unknown }
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      storage.delete(CACHE_KEY)
      return
    }
    hydrate(client, parsed.state)
  } catch {
    storage.delete(CACHE_KEY)
  }
}

let lastWrite = 0
export function persistQueryClient(client: QueryClient): void {
  const now = Date.now()
  if (now - lastWrite < WRITE_THROTTLE_MS) return
  lastWrite = now
  try {
    const state = dehydrate(client, {
      shouldDehydrateQuery: (q) => q.state.status === 'success',
    })
    storage.set(CACHE_KEY, JSON.stringify({ savedAt: now, state }))
  } catch {
    // Persistence is an optimisation; never let it break the app.
  }
}

export function clearPersistedQueryCache(): void {
  storage.delete(CACHE_KEY)
}
