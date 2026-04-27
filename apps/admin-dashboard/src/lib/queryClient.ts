/**
 * queryClient.ts — TanStack Query v5 client + localStorage persistence.
 *
 * Why these defaults matter for perceived speed:
 *   - `placeholderData: (prev) => prev` is the single most important flag —
 *     when filters change or a page re-mounts, the UI keeps showing the last
 *     known data instead of flashing a spinner. The refetch still happens in
 *     the background; the user just doesn't see the flicker.
 *   - `staleTime: 60s` keeps a query fresh long enough to survive route
 *     navigation without re-hitting the network. CRM data doesn't churn so
 *     fast that a one-minute stale window misleads anyone.
 *   - `gcTime: 30 min` means when you leave a page and come back within
 *     half an hour the data is still there — instant render.
 *   - `structuralSharing: true` (default) + `placeholderData` together give
 *     us "stale-while-revalidate" semantics: old data on screen, fresh data
 *     swaps in silently once the network call completes.
 *   - `refetchOnWindowFocus: false` — CRM tabs are long-lived; we don't want
 *     focus events to trigger dozens of refetches across all subscribed hooks.
 *   - `refetchOnReconnect: true` — on network recovery, pull fresh data once.
 *
 * Persistence:
 *   A lightweight localStorage layer saves the query cache, throttled, so
 *   a hard refresh or next-day re-open renders instantly with whatever was
 *   cached. Writes are throttled to 2s to avoid hammering storage on busy
 *   screens (e.g. the dispatch board firing 5+ invalidations per minute).
 */

import { QueryClient, type QueryCache } from '@tanstack/react-query'

const STORAGE_KEY = 'tscrm_query_cache_v1'
// How old a cached snapshot can be before we discard it on rehydrate. Anything
// older than this and we'd rather fetch fresh than show stale prices/invoices.
const MAX_CACHE_AGE_MS = 30 * 60 * 1000          // 30 minutes
// Flush interval — write the full cache snapshot at most every 2s.
const PERSIST_FLUSH_MS = 2000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Core staleness / cache sizing
      staleTime:   60 * 1000,                    // 1 minute "fresh"
      gcTime:      30 * 60 * 1000,               // 30 minutes retained after unmount

      // Keep showing prior data while background refetching — no spinner flash
      placeholderData: (prev: unknown) => prev,

      // Network behaviour
      retry:                 1,
      refetchOnWindowFocus:  false,              // CRMs stay open all day — don't spam
      refetchOnReconnect:    true,               // but do refresh on reconnect
      refetchOnMount:        'always',           // mount triggers a background refetch
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
    // Probe — private mode + some embedded webviews throw here
    window.localStorage.setItem('__probe__', '1')
    window.localStorage.removeItem('__probe__')
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Rehydrate query cache from localStorage if a recent snapshot exists.
 * Called synchronously at module load so the first render already has data.
 */
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
    // Corrupt blob — nuke and carry on.
    try { ls.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }
}

/**
 * Subscribe to cache changes and flush to localStorage at most once per
 * PERSIST_FLUSH_MS. Uses a trailing-edge timer so a burst of invalidations
 * results in exactly one write.
 */
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
      // Quota exceeded / serialization error — drop snapshot silently. Losing
      // the persisted cache is not fatal; the app still works.
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

// Run on module load — synchronous so React's first render sees the data.
hydrate()
installPersister()
