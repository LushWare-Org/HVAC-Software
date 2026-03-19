import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 30,         // 30 minutes cache
      retry: (failureCount, error: any) => {
        // Don't retry auth errors or not-found
        if (error?.response?.status === 401) return false
        if (error?.response?.status === 403) return false
        if (error?.response?.status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,     // mobile: refetch on app foreground instead
    },
    mutations: {
      retry: false,
    },
  },
})

// Query key factory for consistent invalidation
export const queryKeys = {
  // Auth
  profile: ['profile'] as const,
  techProfile: ['techProfile'] as const,

  // Jobs
  jobs: (filters?: Record<string, unknown>) => ['jobs', filters] as const,
  jobDetail: (id: string) => ['jobs', 'detail', id] as const,
  jobStats: ['jobs', 'stats'] as const,

  // Work Orders
  workOrders: (jobId: string) => ['workOrders', jobId] as const,
  workOrderDetail: (id: string) => ['workOrders', 'detail', id] as const,

  // Scheduling
  myAssignments: (filters?: Record<string, unknown>) => ['assignments', 'mine', filters] as const,
  assignmentDetail: (id: string) => ['assignments', 'detail', id] as const,

  // Price Book
  priceBook: (filters?: Record<string, unknown>) => ['priceBook', filters] as const,

  // Customer
  customer: (id: string) => ['customers', id] as const,

  // Finance
  expenses: (filters?: Record<string, unknown>) => ['expenses', filters] as const,
  expenseDetail: (id: string) => ['expenses', 'detail', id] as const,

  // Comms
  notifications: (filters?: object) => ['notifications', filters] as const,
  threads: (filters?: object) => ['threads', filters] as const,
  threadDetail: (id: string) => ['threads', 'detail', id] as const,

  // Analytics
  myMetrics: (techId: string) => ['metrics', techId] as const,
} as const
