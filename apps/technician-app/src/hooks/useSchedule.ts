import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import type { DispatchAssignment, AssignmentStatus, GpsPayload } from '@/types/api'
import { useTechnicianProfile } from './useProfile'

/**
 * Get my assignments (technician's schedule)
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
      return res.data.data ?? res.data
    },
    enabled: !!techId,
  })
}

/**
 * Get assignment detail
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
 * Get assignments for a specific job
 */
export function useJobAssignments(jobId: string) {
  return useQuery({
    queryKey: ['assignments', 'job', jobId],
    queryFn: async () => {
      const res = await api.get<{ data: DispatchAssignment[] }>(
        `/scheduling/dispatch/assignments/job/${jobId}`,
      )
      return res.data.data ?? res.data
    },
    enabled: !!jobId,
  })
}

/**
 * Update assignment status (EN_ROUTE, ON_SITE, COMPLETED)
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
 * Send GPS location update
 */
export function useSendGps() {
  return useMutation({
    mutationFn: async (payload: GpsPayload) => {
      const res = await api.post('/scheduling/gps', payload)
      return res.data
    },
  })
}
