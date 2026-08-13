/**
 * useMyReschedule — reschedule hooks for the customer portal.
 *
 * job-service enforces customer-id scoping server-side on every one of these
 * routes, so a customer can only ever see or act on their own jobs.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { keys } from './keys'
import type { RescheduleRequest } from '../types/api'

export interface SlotInput { startAt: string; endAt: string; window?: string }

/**
 * Responding changes the job's rescheduleState, which every job list renders,
 * so the job caches have to refetch alongside the reschedule cache itself.
 * Keys come from the central factory — inventing keys here would silently
 * invalidate nothing.
 */
function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['customer', 'jobs'] })
    qc.invalidateQueries({ queryKey: ['customer', 'job'] })
    qc.invalidateQueries({ queryKey: ['customer', 'reschedule'] })
    qc.invalidateQueries({ queryKey: ['customer', 'notifications'] })
  }
}

export function useMyRescheduleHistory(jobId?: string) {
  return useQuery({
    queryKey: keys.reschedule(jobId ?? ''),
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<RescheduleRequest[]>(`/jobs/reschedule/jobs/${jobId}`)
      return res.data
    },
  })
}

export function useRequestReschedule() {
  const invalidate = useInvalidate()
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
    onSuccess: invalidate,
  })
}

export function useRespondToReschedule() {
  const invalidate = useInvalidate()
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
    onSuccess: invalidate,
  })
}

export function useCancelMyReschedule() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const res = await api.post(`/jobs/reschedule/${requestId}/cancel`, {})
      return res.data as RescheduleRequest
    },
    onSuccess: invalidate,
  })
}
