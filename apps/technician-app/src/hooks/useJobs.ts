import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Job, JobStats, JobStatus, PaginatedResponse, CustomFieldValue } from '@/types/api'

interface JobFilters {
  status?: string
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  search?: string
}

/**
 * Get jobs assigned to the current technician.
 *
 * Polls every 20 seconds so newly admin-assigned jobs appear quickly.
 * AppState listener in _layout.tsx triggers an immediate refetch when the
 * app comes to foreground (so returning from background shows fresh data).
 */
export function useMyJobs(filters: JobFilters = {}) {
  const { user, isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.jobs({ ...filters, assignedToId: user?.id }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.id)         params.set('assignedToId', user.id)
      if (filters.status)   params.set('status', filters.status)
      if (filters.page)     params.set('page', String(filters.page))
      if (filters.limit)    params.set('limit', String(filters.limit ?? 50))
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo)   params.set('dateTo', filters.dateTo)
      if (filters.search)   params.set('search', filters.search)

      const res = await api.get<PaginatedResponse<Job>>(`/jobs/jobs?${params.toString()}`)
      return res.data
    },
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 20_000,
    staleTime: 15_000,
  })
}

/**
 * Get single job detail (used in job/[id].tsx)
 */
export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: queryKeys.jobDetail(jobId),
    queryFn: async () => {
      const res = await api.get<Job>(`/jobs/jobs/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

/**
 * Job statistics summary
 */
export function useJobStats() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.jobStats,
    queryFn: async () => {
      const res = await api.get<JobStats>('/jobs/jobs/stats')
      return res.data
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

/**
 * Transition job status (SCHEDULED → EN_ROUTE → ON_SITE → COMPLETED)
 * Optimistically updates the job list so the UI reacts instantly.
 */
export function useUpdateJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, status, note }: { jobId: string; status: JobStatus; note?: string }) => {
      const res = await api.patch(`/jobs/jobs/${jobId}/status`, { status, note })
      return res.data as Job
    },
    onMutate: async ({ jobId, status }) => {
      // Cancel outgoing fetches so optimistic update isn't overwritten
      await qc.cancelQueries({ queryKey: queryKeys.jobDetail(jobId) })
      const prev = qc.getQueryData<Job>(queryKeys.jobDetail(jobId))
      if (prev) {
        qc.setQueryData<Job>(queryKeys.jobDetail(jobId), { ...prev, status })
      }
      return { prev, jobId }
    },
    onSuccess: (data, vars) => {
      qc.setQueryData(queryKeys.jobDetail(vars.jobId), data)
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: queryKeys.jobStats })
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.jobDetail(ctx.jobId), ctx.prev)
    },
  })
}

/**
 * Update arbitrary job fields (notes, internal notes)
 */
export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: string; data: Partial<Job> }) => {
      const res = await api.patch(`/jobs/jobs/${jobId}`, data)
      return res.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.jobDetail(vars.jobId) })
    },
  })
}

/**
 * Update custom field values for a job
 */
export function useUpdateCustomFields() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, fields }: { jobId: string; fields: Array<{ fieldDefId: string; value: unknown }> }) => {
      const res = await api.patch(`/jobs/jobs/${jobId}/custom-fields`, { fields })
      return res.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.jobDetail(vars.jobId) })
    },
  })
}
