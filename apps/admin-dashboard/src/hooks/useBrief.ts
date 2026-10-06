import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export type BriefSeverity = 'urgent' | 'important' | 'info'

export interface BriefFact {
  id: string
  severity: BriefSeverity
  title: string
  detail: string
  /** The assistant's one line on why it matters; absent when AI was not used. */
  why?: string
  money?: boolean
  items?: Array<{ id: string; label: string; meta?: string }>
  href?: string
  action?: { tool: string; args: Record<string, string>; label: string }
}

export interface Brief {
  date: string
  timezone: string
  generatedAt: string
  headline: string
  usedAi: boolean
  facts: BriefFact[]
  yesterday: { date: string; jobsCompleted: number; jobsCancelled: number; collected?: number }
  failedChecks: string[]
}

const KEY = ['dashboard', 'brief']

/** Today's brief. The server caches it for 15 minutes, so refetching on live events is cheap. */
export function useBrief(enabled = true) {
  return useQuery<Brief>({
    queryKey: KEY,
    queryFn: async () => (await api.get('/analytics/brief')).data,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}

/** Rebuilds the brief now instead of waiting for the cache. */
export function useRefreshBrief() {
  return useMutation({
    mutationFn: async () => (await api.get<Brief>('/analytics/brief', { params: { refresh: true } })).data,
    onSuccess: (brief) => queryClient.setQueryData(KEY, brief),
  })
}
