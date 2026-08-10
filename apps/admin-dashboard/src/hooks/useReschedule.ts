import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { RescheduleRequest, RescheduleInboxRow, RescheduleStats } from '../types/api'

/**
 * Applying a reschedule changes a job's time, status and technician at once, so
 * every job-shaped view has to refetch — the same set useJobs.ts invalidates,
 * plus the reschedule caches themselves.
 */
function invalidateRescheduleViews() {
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['reschedule'] })
}

export function useRescheduleHistory(jobId?: string) {
  return useQuery({
    queryKey: ['reschedule', 'job', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<RescheduleRequest[]>(`/jobs/reschedule/jobs/${jobId}`)
      return res.data
    },
  })
}

export function useRescheduleInbox(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['reschedule', 'inbox', page, limit],
    queryFn: async () => {
      const res = await api.get<{ data: RescheduleInboxRow[]; meta: { total: number; totalPages: number } }>(
        '/jobs/reschedule/inbox', { params: { page, limit } })
      return res.data
    },
    // Shared work — a dispatcher should not be staring at a queue another
    // dispatcher cleared five minutes ago.
    refetchInterval: 60_000,
  })
}

export function useRescheduleStats(from?: string, to?: string) {
  return useQuery({
    queryKey: ['reschedule', 'stats', from, to],
    queryFn: async () => {
      const res = await api.get<RescheduleStats>('/jobs/reschedule/stats', { params: { from, to } })
      return res.data
    },
  })
}

export interface SlotInput { startAt: string; endAt: string; window?: string }

export function useOpenReschedule() {
  return useMutation({
    mutationFn: async (vars: {
      jobId: string
      mode: 'PROPOSE_SLOTS' | 'OPEN_ASK'
      reasonCode: string
      reason?: string
      slots?: SlotInput[]
    }) => {
      const { jobId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/jobs/${jobId}`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useRespondReschedule() {
  return useMutation({
    mutationFn: async (vars: {
      requestId: string
      action: 'PICK' | 'COUNTER' | 'DECLINE'
      pickedSlotId?: string
      reasonCode?: string
      slots?: SlotInput[]
      note?: string
    }) => {
      const { requestId, ...body } = vars
      const res = await api.post(`/jobs/reschedule/${requestId}/respond`, body)
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useApplyReschedule() {
  return useMutation({
    mutationFn: async (vars: { requestId: string; confirmEnRoute?: boolean }) => {
      const res = await api.post(`/jobs/reschedule/${vars.requestId}/apply`, {
        confirmEnRoute: vars.confirmEnRoute,
      })
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}

export function useCancelReschedule() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.post(`/jobs/reschedule/${requestId}/cancel`, {})
      return res.data as RescheduleRequest
    },
    onSuccess: invalidateRescheduleViews,
  })
}
