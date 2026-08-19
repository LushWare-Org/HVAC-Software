import { QueryClient } from '@tanstack/react-query'
import { hydrateQueryClient, persistQueryClient } from './queryPersistence'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * 60 * 1000,
      // Paint cached data on mount, refetch behind it (stale-while-revalidate).
      refetchOnMount: true,
      // Native has no window focus — AppState in _layout.tsx covers foregrounding.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      placeholderData: (prev: unknown) => prev,
    },
    mutations: { retry: false },
  },
})

// Hydrate at module-evaluation time, before any screen renders.
hydrateQueryClient(queryClient)

// Persist on every settled query; writes are throttled inside persistQueryClient.
queryClient.getQueryCache().subscribe(() => persistQueryClient(queryClient))

export const queryKeys = {
  profile: ['profile'] as const,
  dashboard: ['dashboard'] as const,
  jobs: (filters?: Record<string, unknown>) => ['jobs', filters] as const,
  jobDetail: (id: string) => ['jobs', 'detail', id] as const,
  quotes: (filters?: Record<string, unknown>) => ['quotes', filters] as const,
  invoices: (filters?: Record<string, unknown>) => ['invoices', filters] as const,
  threads: (filters?: Record<string, unknown>) => ['threads', filters] as const,
  notifications: ['notifications'] as const,
} as const
