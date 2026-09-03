import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { CrewMember, CrewCandidate } from '../types/api'

/**
 * Changing a crew moves the lead, and the lead is the technician name shown on
 * every job-shaped view, so the same caches useJobs invalidates have to go too.
 */
function invalidateCrewViews() {
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  queryClient.invalidateQueries({ queryKey: ['scheduling'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['crew'] })
}

/** The technicians currently on a job, lead first. */
export function useCrew(jobId?: string) {
  return useQuery({
    queryKey: ['crew', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<{ data: CrewMember[]; count: number }>(
        `/scheduling/dispatch/jobs/${jobId}/crew`,
      )
      return res.data.data
    },
  })
}

/**
 * Ranked technicians who could join, with their conflicts.
 *
 * Disabled until both ends of the window are known: the server needs them to
 * detect overlaps and returns 400 without them.
 */
export function useCrewCandidates(jobId?: string, start?: string, end?: string, limit = 10) {
  return useQuery({
    queryKey: ['crew', 'candidates', jobId, start, end, limit],
    enabled: !!jobId && !!start && !!end,
    queryFn: async () => {
      const res = await api.get<{ data: CrewCandidate[] }>(
        '/scheduling/dispatch/candidates',
        { params: { jobId, start, end, limit } },
      )
      return res.data.data
    },
    // Another dispatcher may book one of these technicians while this panel sits
    // open, so the ranking should not go stale for long.
    staleTime: 30_000,
  })
}

/**
 * Replaces the whole crew. The dispatcher edits a list and confirms it, so the
 * API takes that list rather than a diff nobody computed.
 */
export function useSetCrew() {
  return useMutation({
    mutationFn: async (vars: {
      jobId: string
      technicianIds: string[]
      leadTechnicianId: string
    }) => {
      const { jobId, ...body } = vars
      const res = await api.patch<{ data: CrewMember[] }>(
        `/scheduling/dispatch/jobs/${jobId}/crew`,
        body,
      )
      return res.data.data
    },
    onSuccess: invalidateCrewViews,
  })
}

/** Hands the lead to another member of the crew. */
export function useSetLead() {
  return useMutation({
    mutationFn: async (vars: { jobId: string; technicianId: string }) => {
      const res = await api.patch<{ data: CrewMember[] }>(
        `/scheduling/dispatch/jobs/${vars.jobId}/lead`,
        { technicianId: vars.technicianId },
      )
      return res.data.data
    },
    onSuccess: invalidateCrewViews,
  })
}
