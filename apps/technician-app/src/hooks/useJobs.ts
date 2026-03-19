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
 * Get jobs assigned to current technician
 */
export function useMyJobs(filters: JobFilters = {}) {
  const { user, isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.jobs({ ...filters, assignedToId: user?.id }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.id) params.set('assignedToId', user.id)
      if (filters.status) params.set('status', filters.status)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit ?? 50))
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.search) params.set('search', filters.search)

      const res = await api.get<PaginatedResponse<Job>>(`/jobs/jobs?${params.toString()}`)
      return res.data
    },
    enabled: isAuthenticated && !!user?.id,
  })
}

/**
 * Get single job detail
 */
export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: queryKeys.jobDetail(jobId),
    queryFn: async () => {
      const res = await api.get<Job>(`/jobs/jobs/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
  })
}

/**
 * Get job statistics
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
  })
}

/**
 * Transition job status
 */
export function useUpdateJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, status, note }: { jobId: string; status: JobStatus; note?: string }) => {
      const res = await api.patch(`/jobs/jobs/${jobId}/status`, { status, note })
      return res.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.jobDetail(vars.jobId) })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: queryKeys.jobStats })
    },
  })
}

/**
 * Update job fields (notes, internal notes, etc.)
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
