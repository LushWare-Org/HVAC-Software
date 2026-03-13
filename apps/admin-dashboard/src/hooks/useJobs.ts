/**
 * useJobs.ts — Hooks for the Jobs page
 * Routes → nginx /api/jobs/ → job-service :3002
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Job, JobStats, PaginatedResponse } from '../types/api'

// ─── Job stat cards ────────────────────────────────────────────────────────────

export function useJobStats() {
  return useQuery<JobStats>({
    queryKey: ['jobs', 'stats'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs/stats')
      const raw = res.data
      // Backend returns { byStatus: [{status,count}], scheduledToday }
      // Transform to flat JobStats
      const byStatus: Record<string, number> = {}
      if (Array.isArray(raw.byStatus)) {
        for (const s of raw.byStatus) byStatus[s.status] = s.count ?? 0
      }
      return {
        pending: byStatus.PENDING ?? 0,
        scheduled: byStatus.SCHEDULED ?? 0,
        inProgress: (byStatus.EN_ROUTE ?? 0) + (byStatus.ON_SITE ?? 0),
        completed: byStatus.COMPLETED ?? 0,
        invoiced: byStatus.INVOICED ?? 0,
        cancelled: byStatus.CANCELLED ?? 0,
        totalToday: raw.scheduledToday ?? 0,
        completedToday: byStatus.COMPLETED ?? 0,
        revenue: 0,
      } satisfies JobStats
    },
    staleTime: 60 * 1000,
  })
}

// ─── Job list ─────────────────────────────────────────────────────────────────

interface JobFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  jobTypeId?: string
  assignedToId?: string
  customerId?: string
}

export function useJobs(filters: JobFilters = {}) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['jobs', 'list', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      // Pass status filter as-is (already UPPER_CASE from frontend)
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.jobTypeId && filters.jobTypeId !== 'all') params.jobTypeId = filters.jobTypeId
      if (filters.assignedToId && filters.assignedToId !== 'all') params.assignedToId = filters.assignedToId
      if (filters.customerId) params.customerId = filters.customerId
      const res = await api.get('/jobs/jobs', { params })
      const raw = res.data
      // Backend returns { data, meta: { total, page, limit, totalPages } }
      if (raw.meta) {
        return { data: raw.data, ...raw.meta } as PaginatedResponse<Job>
      }
      return raw
    },
  })
}

// ─── Single job ────────────────────────────────────────────────────────────────

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ['jobs', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/jobs/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

// ─── Create / Update / Status change ──────────────────────────────────────────

export function useCreateJob() {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/jobs/jobs', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useUpdateJobStatus() {
  return useMutation({
    mutationFn: async ({ id, status, statusNote }: { id: string; status: string; statusNote?: string }) => {
      const res = await api.patch(`/jobs/jobs/${id}`, {
        status: status.toUpperCase(),
        statusNote,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

// ─── Job types (for filter dropdown) ──────────────────────────────────────────

export function useJobTypes() {
  return useQuery<{ id: string; name: string; trade: string }[]>({
    queryKey: ['job-types'],
    queryFn: async () => {
      const res = await api.get('/jobs/trade/job-types')
      return res.data
    },
    staleTime: 10 * 60 * 1000, // job types rarely change
  })
}
