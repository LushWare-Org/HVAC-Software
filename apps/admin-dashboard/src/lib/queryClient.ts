/**
 * queryClient.ts — TanStack Query v5 client configuration
 *
 * Defaults chosen for a CRM dashboard:
 *  - staleTime 60 s  → data is "fresh" for 1 minute, avoids refetch on tab focus
 *  - gcTime    5 min → cache kept for 5 minutes after last subscriber unmounts
 *  - retry 1         → one retry on network failure (avoids hammering on 4xx)
 *  - refetchOnWindowFocus false → don't surprise users with data refreshes
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,          // 1 minute
      gcTime:    5 * 60 * 1000,      // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
