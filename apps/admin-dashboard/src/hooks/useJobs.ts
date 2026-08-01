/**
 * useJobs.ts — Hooks for the Jobs page
 * Routes → nginx /api/jobs/ → job-service :3002
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Job, JobStats, PaginatedResponse } from '../types/api'

// ─── Job stat cards ────────────────────────────────────────────────────────────

async function fetchJobStats(): Promise<JobStats> {
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
}

export function useJobStats() {
  return useQuery<JobStats>({
    queryKey: ['jobs', 'stats'],
    queryFn: fetchJobStats,
    staleTime: 60 * 1000,
  })
}

// ─── Job list ─────────────────────────────────────────────────────────────────

export interface JobFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  jobTypeId?: string
  assignedToId?: string
  customerId?: string
  projectId?: string
  houseId?: string
}

async function fetchJobsList(filters: JobFilters): Promise<PaginatedResponse<Job>> {
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
  if (filters.projectId) params.projectId = filters.projectId
  if (filters.houseId) params.houseId = filters.houseId
  const res = await api.get('/jobs/jobs', { params })
  const raw = res.data
  // Backend returns { data, meta: { total, page, limit, totalPages } }
  if (raw.meta) {
    return { data: raw.data, ...raw.meta } as PaginatedResponse<Job>
  }
  return raw
}

export function useJobs(filters: JobFilters = {}) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['jobs', 'list', filters],
    queryFn: () => fetchJobsList(filters),
  })
}

/**
 * Warm the queries Jobs.tsx mounts with (stat cards + the default
 * 200-job list). Keys match the page's initial state exactly.
 */
export function prefetchJobsPage(): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['jobs', 'stats'], queryFn: fetchJobStats, staleTime: 60 * 1000 }),
    queryClient.prefetchQuery({
      queryKey: ['jobs', 'list', { limit: 200, search: undefined }],
      queryFn: () => fetchJobsList({ limit: 200 }),
    }),
  ])
}

/** Warm an arbitrary jobs-list filter combination (used by the Scheduling prefetch). */
export function prefetchJobs(filters: JobFilters): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['jobs', 'list', filters],
    queryFn: () => fetchJobsList(filters),
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

/**
 * Jobs render in more places than the Jobs page: the Dashboard's recent-jobs
 * table and KPI strip, and each project's linked-jobs list. Every job
 * mutation must refresh all of them or edits look like they "didn't take"
 * until a manual refresh.
 */
function invalidateJobViews() {
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
}

export function useCreateJob() {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/jobs/jobs', data)
      return res.data
    },
    onSuccess: () => {
      invalidateJobViews()
    },
  })
}

export function useUpdateJobStatus() {
  return useMutation({
    mutationFn: async ({ id, status, statusNote, cancellationReason }: { id: string; status: string; statusNote?: string; cancellationReason?: string }) => {
      const res = await api.patch(`/jobs/jobs/${id}`, {
        status: status.toUpperCase(),
        statusNote,
        cancellationReason,
      })
      return res.data
    },
    onSuccess: () => {
      invalidateJobViews()
    },
  })
}

export function useUpdateJobFields() {
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; hasPartShortage?: boolean; partShortageNote?: string; [key: string]: unknown }) => {
      const res = await api.patch(`/jobs/jobs/${id}`, fields)
      return res.data
    },
    onSuccess: () => {
      invalidateJobViews()
    },
  })
}

export function useUpdateJobTags() {
  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const res = await api.patch(`/jobs/jobs/${id}`, { tags })
      return res.data
    },
    onSuccess: () => {
      invalidateJobViews()
    },
  })
}

export function useDeleteJob() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/jobs/${id}`)
    },
    onSuccess: () => {
      invalidateJobViews()
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

export function useJobTemplates(jobTypeId: string | null) {
  return useQuery<any[]>({
    queryKey: ['job-templates', jobTypeId],
    queryFn: async () => {
      const res = await api.get(`/jobs/trade/job-types/${jobTypeId}/templates`)
      return res.data
    },
    enabled: !!jobTypeId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Work Orders (checklist / tasks / line items) ─────────────────────────────

export interface WorkOrderTask {
  id: string            // this is WorkOrderTaskCompletion.id — used as taskCompletionId
  taskName: string
  description?: string
  taskOrder: number
  isRequired: boolean
  isAdHoc?: boolean
  photoRequired?: boolean
  safetyNote?: string
  estimatedMins?: number
  isCompleted: boolean
  completedAt?: string
  notes?: string
  photoUrl?: string
}

export interface WorkOrderLineItem {
  id: string
  description: string
  category: string
  quantity: number
  unitPrice: number | string
  taxable: boolean
  total: number | string
}

export interface WorkOrder {
  id: string
  jobId: string
  technicianId?: string
  technicianName?: string
  status: string
  checkedInAt?: string
  checkedOutAt?: string
  notes?: string
  tasks: WorkOrderTask[]
  lineItems: WorkOrderLineItem[]
  createdAt: string
  updatedAt: string
}

// Normalize the API response: backend returns `taskCompletions`, frontend uses `tasks`
function normalizeWorkOrder(raw: any): WorkOrder {
  return {
    ...raw,
    tasks: (raw.taskCompletions ?? raw.tasks ?? []).map((tc: any) => ({
      id: tc.id,
      taskName: tc.taskName,
      taskOrder: tc.taskOrder ?? 0,
      isRequired: tc.isRequired ?? false,
      isAdHoc: tc.isAdHoc ?? false,
      isCompleted: tc.isCompleted ?? false,
      completedAt: tc.completedAt ?? undefined,
      notes: tc.notes ?? undefined,
      photoUrl: tc.photoUrl ?? undefined,
    })),
  }
}

export function useWorkOrdersByJob(jobId: string | undefined) {
  return useQuery<WorkOrder[]>({
    queryKey: ['work-orders', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/work-orders/by-job/${jobId}`)
      const raw: any[] = Array.isArray(res.data) ? res.data : []
      return raw.map(normalizeWorkOrder)
    },
    enabled: !!jobId,
  })
}

export function useCreateWorkOrder() {
  return useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      const res = await api.post('/jobs/work-orders', { jobId })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', data.jobId] })
    },
  })
}

// taskCompletionId = the WorkOrderTaskCompletion.id (the `id` field on each task object)
export function useUpdateWorkOrderTask() {
  return useMutation({
    mutationFn: async ({
      workOrderId,
      taskCompletionId,
      isCompleted,
      notes,
    }: {
      workOrderId: string
      taskCompletionId: string
      isCompleted: boolean
      notes?: string
    }) => {
      const res = await api.patch(
        `/jobs/work-orders/${workOrderId}/tasks/${taskCompletionId}`,
        { isCompleted, ...(notes !== undefined && { notes }) },
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useAddWorkOrderTask() {
  return useMutation({
    mutationFn: async ({
      workOrderId,
      taskName,
      isRequired,
    }: {
      workOrderId: string
      taskName: string
      isRequired?: boolean
    }) => {
      const res = await api.post(`/jobs/work-orders/${workOrderId}/tasks`, { taskName, isRequired })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}
