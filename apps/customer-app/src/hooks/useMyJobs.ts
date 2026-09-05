import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { BookServiceInput, Job, PaginatedResponse } from '@/types/api'

/**
 * All queries live under the ['jobs'] / ['dashboard'] prefixes so a job_changed
 * socket event (see realtimeEvents) refreshes them with no extra wiring.
 */

export function useMyJobs() {
  const { user } = useAuth()
  const customerId = user?.customerId

  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['jobs', 'list', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/jobs?customerId=${customerId}&limit=100`)
      return data
    },
    enabled: Boolean(customerId),
  })
}

export function useMyJob(jobId: string | undefined) {
  return useQuery<Job>({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/jobs/${jobId}`)
      return data
    },
    enabled: Boolean(jobId),
  })
}

/** Invalidate everything a job change could affect, in one place. */
function useJobInvalidation() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['jobs'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useBookService() {
  const { user } = useAuth()
  const invalidate = useJobInvalidation()

  return useMutation({
    mutationFn: async (input: BookServiceInput) => {
      // Mirrors the portal's job-request payload. The 'portal-request' tag is
      // part of that contract — staff use it to spot customer-raised jobs — and
      // 'mobile-app' distinguishes where this one came from.
      const { data } = await api.post('/jobs/jobs', {
        customerId: user?.customerId,
        customerName: user?.name,
        customerEmail: user?.email,
        title: input.title,
        description: input.description || undefined,
        serviceAddress: input.serviceAddress,
        serviceLatitude: input.serviceLatitude,
        serviceLongitude: input.serviceLongitude,
        priority: 'NORMAL',
        tags: ['portal-request', 'mobile-app'],
        scheduledStart: input.preferredStart,
        equipmentId: input.equipmentId || undefined,
      })
      return data as Job
    },
    onSuccess: invalidate,
  })
}

export function useCancelJob() {
  const invalidate = useJobInvalidation()

  return useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: string; reason?: string }) => {
      const { data } = await api.patch(`/jobs/jobs/${jobId}`, {
        status: 'CANCELLED',
        cancellationReason: reason || undefined,
      })
      return data as Job
    },
    onSuccess: invalidate,
  })
}

/** Direct time change — only valid while a job is PENDING and unassigned. */
export function useUpdatePreferredTime() {
  const invalidate = useJobInvalidation()

  return useMutation({
    mutationFn: async ({
      jobId, preferredStart, preferredEnd,
    }: { jobId: string; preferredStart: string; preferredEnd: string }) => {
      const { data } = await api.patch(`/jobs/jobs/${jobId}/preferred-time`, {
        preferredStart,
        preferredEnd,
      })
      return data as Job
    },
    onSuccess: invalidate,
  })
}

/**
 * Negotiated reschedule — used once dispatch has scheduled the job.
 *
 * The backend takes a mode plus proposed slots, not a single start/end: the
 * customer proposes times and a dispatcher accepts or counters. reasonCode is
 * a required enum (job-service validates with @IsEnum), and customers may only
 * send the customer-side reasons.
 */
export const CUSTOMER_RESCHEDULE_REASONS = [
  { code: 'CUSTOMER_UNAVAILABLE', label: 'I am not available' },
  { code: 'ACCESS_ISSUE', label: 'Access problem at the property' },
  { code: 'OTHER', label: 'Another reason' },
] as const

export type CustomerRescheduleReason = (typeof CUSTOMER_RESCHEDULE_REASONS)[number]['code']

export function useRequestReschedule() {
  const invalidate = useJobInvalidation()

  return useMutation({
    mutationFn: async ({
      jobId, startAt, endAt, reasonCode, reason,
    }: {
      jobId: string
      startAt: string
      endAt: string
      reasonCode: CustomerRescheduleReason
      reason?: string
    }) => {
      const { data } = await api.post(`/jobs/reschedule/jobs/${jobId}`, {
        mode: 'PROPOSE_SLOTS',
        reasonCode,
        reason: reason || undefined,
        slots: [{ startAt, endAt }],
      })
      return data
    },
    onSuccess: invalidate,
  })
}
