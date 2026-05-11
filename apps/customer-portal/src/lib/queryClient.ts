/**
 * queryClient.ts — TanStack Query v5 client + localStorage persistence.
 *
 * Mirrors the admin-dashboard config: stale-while-revalidate (placeholderData
 * keeps the prior data on screen during refetch — no spinner flash on filter
 * change), generous gcTime so route navigation doesn't re-fetch, persistence
 * to localStorage so a hard refresh / next-day re-open paints instantly with
 * cached data while a background refetch runs.
 *
 * Why this matters for the customer portal:
 *   The portal is a low-traffic-per-customer surface (a customer might check
 *   one invoice once a month) so we want every revisit to feel instant. Cache
 *   persistence is the single biggest perceived-perf win for that pattern.
 */

import { QueryClient, type QueryCache } from '@tanstack/react-query'

const STORAGE_KEY = 'cp_query_cache_v1'
// How old a cached snapshot can be before discard on rehydrate. Anything older
// and we'd rather fetch fresh than risk showing a stale invoice balance.
const MAX_CACHE_AGE_MS = 30 * 60 * 1000          // 30 minutes
// Throttle persistence writes — busy screens (Messages with WS) burst many
// invalidations; coalesce them into one write.
const PERSIST_FLUSH_MS = 2000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep last data on screen while refetching — no spinner flash.
      placeholderData: (prev: unknown) => prev,
      staleTime: 60 * 1000,                  // 1 minute "fresh"
      gcTime:    30 * 60 * 1000,             // 30 minutes retained after unmount
      retry: 1,
      refetchOnWindowFocus: false,           // mobile-web sessions toggle focus a lot
      refetchOnReconnect:   true,
      refetchOnMount:       'always',
    },
    mutations: {
      retry: 0,
    },
  },
})

// ── Persistence ──────────────────────────────────────────────────────────────

type PersistedShape = {
  savedAt: number
  queries: Array<{
    queryKey:   readonly unknown[]
    queryHash:  string
    state:      unknown
  }>
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    window.localStorage.setItem('__cp_probe__', '1')
    window.localStorage.removeItem('__cp_probe__')
    return window.localStorage
  } catch {
    return null
  }
}

function hydrate(): void {
  const ls = safeLocalStorage()
  if (!ls) return
  const raw = ls.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as PersistedShape
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_CACHE_AGE_MS) {
      ls.removeItem(STORAGE_KEY)
      return
    }
    const cache = queryClient.getQueryCache()
    for (const q of parsed.queries ?? []) {
      cache.build(queryClient, { queryKey: q.queryKey as any, queryHash: q.queryHash }, q.state as any)
    }
  } catch {
    try { ls.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }
}

function installPersister(): void {
  const ls = safeLocalStorage()
  if (!ls) return
  const cache: QueryCache = queryClient.getQueryCache()
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    timer = null
    try {
      const snapshot: PersistedShape = {
        savedAt: Date.now(),
        queries: cache.getAll().map((q) => ({
          queryKey:  q.queryKey,
          queryHash: q.queryHash,
          state:     q.state,
        })),
      }
      ls.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      // Quota / serialization fail — drop snapshot silently.
    }
  }

  cache.subscribe(() => {
    if (timer != null) return
    timer = setTimeout(flush, PERSIST_FLUSH_MS)
  })
}

export function clearPersistedQueryCache(): void {
  const ls = safeLocalStorage()
  if (!ls) return
  try { ls.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  queryClient.clear()
}

hydrate()
installPersister()
