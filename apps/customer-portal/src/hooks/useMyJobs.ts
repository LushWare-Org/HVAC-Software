/**
 * useMyJobs — Job-page hooks for the customer portal.
 *
 * Split out of the original 811-line `useCustomerPortal.ts` god-hook. All
 * exports here are scoped to "jobs the current customer can see"; the
 * server-side guard in job-service enforces customer-id filtering.
 */
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { keys } from './keys'
import type {
  Job, PaginatedResponse, DispatchAssignment, Technician,
} from '../types/api'

export function useMyJobs(filters?: {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}) {
  const { user } = useAuth()
  return useQuery<PaginatedResponse<Job>>({
    queryKey: keys.jobs(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.customerId) params.set('customerId', user.customerId)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters?.dateTo) params.set('dateTo', filters.dateTo)
      params.set('page', String(filters?.page ?? 1))
      params.set('limit', String(filters?.limit ?? 50))
      const { data } = await api.get(`/jobs/jobs?${params}`)
      return data
    },
    enabled: !!user?.customerId,
  })
}

export function useMyJob(jobId: string | null) {
  return useQuery<Job>({
    queryKey: keys.job(jobId!),
    queryFn: async () => {
      const { data } = await api.get(`/jobs/jobs/${jobId}`)
      return data
    },
    enabled: !!jobId,
  })
}

export function useJobAssignments(jobId: string | null) {
  return useQuery<{ data: DispatchAssignment[] }>({
    queryKey: keys.jobAssignments(jobId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/scheduling/dispatch/assignments/job/${jobId}`)
      return { data: Array.isArray(data?.data) ? data.data : [] }
    },
    enabled: !!jobId,
  })
}

export function useTechnician(technicianId: string | null) {
  return useQuery<Technician>({
    queryKey: keys.technician(technicianId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/scheduling/technicians/${technicianId}`)
      return data
    },
    enabled: !!technicianId,
  })
}

export interface JobTechnician { name: string | null; avatarUrl: string | null }

/**
 * Resolves the technician actually on each job — name *and* photo.
 *
 * A job row only carries `assignedToName`; the photo lives on the technician
 * record, so this walks assignments → technician. Showing the customer a face
 * for whoever is coming to their house is the point, so the avatar is fetched
 * even when the assignment already supplies a name.
 */
export function useJobTechnicians(jobs: Array<Pick<Job, 'id' | 'assignedToName'>>) {
  const queries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ['customer', 'job-technician', job.id, job.assignedToName ?? ''],
      queryFn: async (): Promise<JobTechnician> => {
        const { data: assignmentResponse } = await api.get(`/scheduling/dispatch/assignments/job/${job.id}`)
        const assignments = Array.isArray(assignmentResponse?.data) ? assignmentResponse.data : []
        const latestAssignment = assignments
          .slice()
          .sort((left: DispatchAssignment, right: DispatchAssignment) => {
            const leftTime = new Date(left.updatedAt ?? left.assignedAt ?? 0).getTime()
            const rightTime = new Date(right.updatedAt ?? right.assignedAt ?? 0).getTime()
            return rightTime - leftTime
          })[0]

        const technicianId = latestAssignment?.technicianId
        if (!technicianId) {
          return { name: job.assignedToName ?? null, avatarUrl: null }
        }

        try {
          const { data: technician } = await api.get(`/scheduling/technicians/${technicianId}`)
          return {
            name: technician?.name ?? latestAssignment?.technicianName ?? job.assignedToName ?? null,
            avatarUrl: technician?.avatarUrl ?? null,
          }
        } catch {
          return {
            name: latestAssignment?.technicianName ?? job.assignedToName ?? null,
            avatarUrl: null,
          }
        }
      },
      enabled: !!job.id,
      staleTime: 30 * 1000,
    })),
  })

  return jobs.reduce<Record<string, JobTechnician>>((acc, job, index) => {
    const data = queries[index]?.data
    acc[job.id] = {
      name: data?.name ?? job.assignedToName ?? null,
      avatarUrl: data?.avatarUrl ?? null,
    }
    return acc
  }, {})
}

/**
 * Names only — a thin projection of useJobTechnicians. Same query keys, so
 * mounting both costs one set of requests, not two.
 */
export function useJobTechnicianNames(jobs: Array<Pick<Job, 'id' | 'assignedToName'>>) {
  const techs = useJobTechnicians(jobs)
  return Object.fromEntries(
    Object.entries(techs).map(([jobId, t]) => [jobId, t.name]),
  ) as Record<string, string | null>
}

/**
 * Change the time you asked for, on a booking nobody has committed to yet.
 *
 * Distinct from the reschedule negotiation: while a job is PENDING and
 * unassigned there is nothing to negotiate — the time is only the customer's own
 * stated preference. job-service rejects this with a pointer to reschedule the
 * moment a technician is assigned or the job is scheduled.
 */
export function useUpdatePreferredTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      jobId: string
      preferredStart: string
      preferredEnd?: string
      window?: string
      note?: string
    }) => {
      const { jobId, ...body } = vars
      const { data } = await api.patch(`/jobs/jobs/${jobId}/preferred-time`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['customer', 'job'] })
      qc.invalidateQueries({ queryKey: ['customer-dashboard'] })
    },
  })
}

export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: string; reason: string }) => {
      const { data } = await api.patch(`/jobs/jobs/${jobId}`, {
        status: 'CANCELLED',
        statusNote: reason,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'jobs'] })
    },
  })
}

// ─── Bookings & Service Requests ────────────────────────────────────────────

export function useBookService() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (dto: {
      serviceType: string
      description?: string
      preferredDate: string
      alternateDate?: string
      notes?: string
      urgency?: string
      serviceAddress?: string
      serviceLatitude?: number
      serviceLongitude?: number
    }) => {
      const { urgency, serviceAddress, serviceLatitude, serviceLongitude, ...bookingDto } = dto
      const bookingNotes = [
        bookingDto.notes,
        urgency ? `Urgency: ${urgency}` : undefined,
        serviceAddress ? `Address: ${serviceAddress}` : undefined,
        Number.isFinite(serviceLatitude) && Number.isFinite(serviceLongitude)
          ? `GPS: ${serviceLatitude},${serviceLongitude}`
          : undefined,
      ].filter(Boolean).join('\n')

      const { data } = await api.post('/crm/bookings', {
        ...bookingDto,
        notes: bookingNotes || undefined,
        customerId: user?.customerId,
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'jobs'] })
    },
  })
}

export function useSubmitJobRequest() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (dto: {
      title: string
      description?: string
      serviceAddress: string
      serviceLatitude?: number
      serviceLongitude?: number
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
      notes?: string
      tags?: string[]
      scheduledStart?: string
      /** Booking from "My Projects" / "My Property" — job-service verifies this project/component is actually theirs. */
      projectId?: string
      houseId?: string
      componentId?: string
    }) => {
      if (!user?.customerId) throw new Error('Customer account is not linked')

      const payload = {
        customerId: user.customerId,
        customerName: user.name,
        customerPhone: user.phone,
        customerEmail: user.email,
        title: dto.title,
        description: dto.description,
        serviceAddress: dto.serviceAddress,
        serviceLatitude: dto.serviceLatitude,
        serviceLongitude: dto.serviceLongitude,
        priority: dto.priority ?? 'NORMAL',
        notes: dto.notes,
        tags: dto.tags ?? ['portal-request'],
        scheduledStart: dto.scheduledStart,
        projectId: dto.projectId,
        houseId: dto.houseId,
        componentId: dto.componentId,
      }

      const { data } = await api.post('/jobs/jobs', payload)
      return data as Job
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'jobs'] })
      qc.invalidateQueries({ queryKey: ['customer', 'dashboard', 'jobs'] })
    },
  })
}
