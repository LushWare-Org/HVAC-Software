import { QueryClient } from '@tanstack/react-query'
import { hydrateQueryClient } from './queryPersistence'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 s — short enough that a newly assigned job appears quickly,
      // long enough to avoid hammering APIs on every re-render.
      staleTime: 30_000,

      // Keep cache 30 min in memory (covers offline / backgrounded app).
      // MMKV-persisted cache carries data further across cold starts.
      gcTime: 30 * 60 * 1000,

      // Show cached data instantly on screen mount. If it's stale, React
      // Query refetches in the background (stale-while-revalidate) — the
      // user sees data on frame 1 rather than a spinner.
      refetchOnMount: true,

      // Mobile: don't use window focus (use AppState in _layout.tsx instead)
      refetchOnWindowFocus: false,

      // Network reconnect triggers a refetch
      refetchOnReconnect: true,

      retry: (failureCount, error: any) => {
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },

      // Keep previous data visible while a new query resolves (no blank flash)
      placeholderData: (prev: unknown) => prev,
    },
    mutations: {
      retry: false,
    },
  },
})

// ── Hydrate from MMKV immediately ─────────────────────────────────────────────
// This runs once at module evaluation time (before any screen renders) so the
// cache is pre-populated with last-known-good data on cold start.
hydrateQueryClient(queryClient)

// ── Query key factory ─────────────────────────────────────────────────────────

export const queryKeys = {
  // Auth
  profile:    ['profile']    as const,
  techProfile: ['techProfile'] as const,

  // Jobs
  jobs:      (filters?: Record<string, unknown>) => ['jobs', filters] as const,
  jobDetail: (id: string) => ['jobs', 'detail', id] as const,
  jobStats:  ['jobs', 'stats'] as const,

  // Work Orders
  workOrders:      (jobId: string) => ['workOrders', jobId] as const,
  workOrderDetail: (id: string)    => ['workOrders', 'detail', id] as const,

  // Scheduling
  myAssignments:   (filters?: Record<string, unknown>) => ['assignments', 'mine', filters] as const,
  assignmentDetail:(id: string) => ['assignments', 'detail', id] as const,

  // Price Book
  priceBook: (filters?: Record<string, unknown>) => ['priceBook', filters] as const,

  // Customer
  customer: (id: string) => ['customers', id] as const,

  // Finance
  expenses:      (filters?: Record<string, unknown>) => ['expenses', filters] as const,
  expenseDetail: (id: string) => ['expenses', 'detail', id] as const,

  // Comms
  notifications: (filters?: object) => ['notifications', filters] as const,
  threads:       (filters?: object) => ['threads', filters]       as const,
  threadDetail:  (id: string)       => ['threads', 'detail', id]  as const,

  // Analytics
  myMetrics: (techId: string) => ['metrics', techId] as const,

  // Inventory
  inventoryLocations: ['inventory', 'locations'] as const,
  vanStock:           (locationId: string) => ['inventory', 'vanStock', locationId] as const,
  inventoryMovements: (filters?: Record<string, unknown>) => ['inventory', 'movements', filters] as const,
} as const
