import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import gpsClient from '@/lib/gpsClient'
import { queryKeys } from '@/lib/queryClient'
import type { DispatchAssignment, AssignmentStatus, GpsPayload } from '@/types/api'
import { useTechnicianProfile } from './useProfile'

/**
 * Get my active assignments (technician schedule).
 *
 * Polls every 20 seconds so newly admin-assigned jobs appear quickly without
 * requiring a manual pull-to-refresh. AppState foreground invalidation in
 * _layout.tsx provides instant refresh when the app comes to foreground.
 */
export function useMyAssignments(statusFilter?: string) {
  const { data: techProfile } = useTechnicianProfile()
  const techId = techProfile?.id

  return useQuery({
    queryKey: queryKeys.myAssignments({ techId, status: statusFilter }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get<{ data: DispatchAssignment[] }>(
        `/scheduling/dispatch/assignments/technician/${techId}?${params.toString()}`,
      )
      return (res.data.data ?? res.data) as DispatchAssignment[]
    },
    enabled: !!techId,
    // Poll every 20s — catches admin-assigned jobs without manual refresh
    refetchInterval: 20_000,
    staleTime: 15_000,
  })
}

/**
 * Get assignment detail by ID
 */
export function useAssignmentDetail(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.assignmentDetail(assignmentId),
    queryFn: async () => {
      const res = await api.get<DispatchAssignment>(`/scheduling/dispatch/assignments/${assignmentId}`)
      return res.data
    },
    enabled: !!assignmentId,
  })
}

/**
 * Get all assignments for a specific job
 */
export function useJobAssignments(jobId: string) {
  return useQuery({
    queryKey: ['assignments', 'job', jobId],
    queryFn: async () => {
      const res = await api.get<{ data: DispatchAssignment[] }>(
        `/scheduling/dispatch/assignments/job/${jobId}`,
      )
      return (res.data.data ?? res.data) as DispatchAssignment[]
    },
    enabled: !!jobId,
    refetchInterval: 20_000,
    staleTime: 15_000,
  })
}

/**
 * Transition an assignment status (EN_ROUTE → ON_SITE → COMPLETED)
 */
export function useUpdateAssignmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      assignmentId,
      status,
      notes,
    }: {
      assignmentId: string
      status: AssignmentStatus
      notes?: string
    }) => {
      const res = await api.patch(`/scheduling/dispatch/assignments/${assignmentId}/status`, {
        status,
        notes,
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Send a GPS location update to the scheduling service.
 *
 * Uses a dedicated axios instance with a 5s timeout (not the main 15s) so a
 * slow scheduling endpoint doesn't stall the app's API queue or spam warnings.
 * Failures are best-effort — the next interval tick will try again.
 */
export function useSendGps() {
  return useMutation({
    mutationFn: async (payload: GpsPayload) => {
      const res = await gpsClient.post('/scheduling/gps', payload)
      return res.data
    },
    // Silent — GPS is a background heartbeat; callers shouldn't react to errors
    onError: () => {},
  })
}
