/**
 * useCustomerPortal.ts — TanStack Query hooks for the Customer Portal
 * All endpoints are scoped to the authenticated customer's data.
 */
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type {
  CustomerProfile, Job, Invoice, Quote,
  PaymentIntent,
  PaginatedResponse,
  DispatchAssignment,
  Technician,
  MessageThread,
  Notification,
  Review, ReviewType, CompanyReviewStats,
} from '../types/api'

// ─── Query Key Factories ────────────────────────────────────────────────────
const keys = {
  profile: () => ['customer', 'profile'] as const,
  jobs: (filters?: Record<string, any>) => ['customer', 'jobs', filters] as const,
  job: (id: string) => ['customer', 'job', id] as const,
  invoices: (filters?: Record<string, any>) => ['customer', 'invoices', filters] as const,
  invoice: (id: string) => ['customer', 'invoice', id] as const,
  quotes: (filters?: Record<string, any>) => ['customer', 'quotes', filters] as const,
  quote: (id: string) => ['customer', 'quote', id] as const,
  jobAssignments: (jobId: string) => ['customer', 'job-assignments', jobId] as const,
  technician: (id: string) => ['customer', 'technician', id] as const,
  threads: () => ['customer', 'threads'] as const,
  thread: (id: string) => ['customer', 'thread', id] as const,
  notifications: () => ['customer', 'notifications'] as const,
  bookings: () => ['customer', 'bookings'] as const,
}

// ─── Customer Profile ────────────────────────────────────────────────────────
export function useCustomerProfile() {
  return useQuery<CustomerProfile>({
    queryKey: keys.profile(),
    queryFn: async () => {
      const { data } = await api.get('/crm/customers/me')
      return data
    },
    retry: (failureCount, error: any) => {
      // Don't retry 404/403
      if ([403, 404].includes(error?.response?.status)) return false
      return failureCount < 1
    },
  })
}

export function useUpdateCustomerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CustomerProfile>) => {
      const { data } = await api.patch('/crm/customers/me', dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.profile() }),
  })
}

// ─── Jobs ────────────────────────────────────────────────────────────────────
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

export function useJobTechnicianNames(jobs: Array<Pick<Job, 'id' | 'assignedToName'>>) {
  const queries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ['customer', 'job-technician-name', job.id, job.assignedToName ?? ''],
      queryFn: async () => {
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
          return job.assignedToName ?? null
        }

        if (latestAssignment?.technicianName) {
          return latestAssignment.technicianName
        }

        try {
          const { data: technician } = await api.get(`/scheduling/technicians/${technicianId}`)
          return technician?.name ?? latestAssignment?.technicianName ?? job.assignedToName ?? null
        } catch {
          return latestAssignment?.technicianName ?? job.assignedToName ?? null
        }
      },
      enabled: !!job.id,
      staleTime: 30 * 1000,
    })),
  })

  return jobs.reduce<Record<string, string | null>>((acc, job, index) => {
    acc[job.id] = queries[index]?.data ?? job.assignedToName ?? null
    return acc
  }, {})
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

// ─── Bookings (Service Requests) ────────────────────────────────────────────
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

// ─── Invoices ─────────────────────────────────────────────────────────────────
export function useMyInvoices(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  const { user } = useAuth()
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: keys.invoices(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.customerId) params.set('customerId', user.customerId)
      if (filters?.status) params.set('status', filters.status)
      params.set('page', String(filters?.page ?? 1))
      params.set('limit', String(filters?.limit ?? 50))
      const { data: raw } = await api.get(`/finance/invoices?${params}`)
      if (raw?.meta) return raw
      return {
        data: raw?.data ?? [],
        meta: {
          total: raw?.total ?? 0,
          page: raw?.page ?? Number(filters?.page ?? 1),
          limit: raw?.limit ?? Number(filters?.limit ?? 50),
          totalPages: raw?.totalPages ?? 1,
        },
      } as PaginatedResponse<Invoice>
    },
    enabled: !!user?.customerId,
  })
}

export function useMyQuotes(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  const { user } = useAuth()
  return useQuery<PaginatedResponse<Quote>>({
    queryKey: keys.quotes(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (user?.customerId) params.set('customerId', user.customerId)
      if (filters?.status) params.set('status', filters.status)
      params.set('page', String(filters?.page ?? 1))
      params.set('limit', String(filters?.limit ?? 50))
      const { data: raw } = await api.get(`/finance/quotes?${params}`)
      if (raw?.meta) return raw
      return {
        data: raw?.data ?? [],
        meta: {
          total: raw?.total ?? 0,
          page: raw?.page ?? Number(filters?.page ?? 1),
          limit: raw?.limit ?? Number(filters?.limit ?? 50),
          totalPages: raw?.totalPages ?? 1,
        },
      } as PaginatedResponse<Quote>
    },
    enabled: !!user?.customerId,
  })
}

export function useJobInvoices(jobId: string | null) {
  return useQuery<Invoice[]>({
    queryKey: ['customer', 'job-invoices', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices?jobId=${jobId}&limit=50`)
      return data?.data ?? []
    },
    enabled: !!jobId,
  })
}

export function useJobQuotes(jobId: string | null) {
  return useQuery<Quote[]>({
    queryKey: ['customer', 'job-quotes', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/quotes?jobId=${jobId}&limit=50`)
      return data?.data ?? []
    },
    enabled: !!jobId,
  })
}

export function useMyInvoice(invoiceId: string | null) {
  return useQuery<Invoice>({
    queryKey: keys.invoice(invoiceId!),
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices/${invoiceId}`)
      return data
    },
    enabled: !!invoiceId,
  })
}

export function useMyQuote(quoteId: string | null) {
  return useQuery<Quote>({
    queryKey: keys.quote(quoteId!),
    queryFn: async () => {
      const { data } = await api.get(`/finance/quotes/${quoteId}`)
      return data
    },
    enabled: !!quoteId,
  })
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post(`/finance/invoices/${invoiceId}/payment-intent`)
      return data as PaymentIntent
    },
  })
}

export function useAcceptMyQuote() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data } = await api.post(`/finance/quotes/${quoteId}/approve`, {
        approvedByName: user?.name ?? 'Customer',
        approvedByEmail: user?.email ?? 'customer@portal.local',
      })
      return data as Quote
    },
    onSuccess: (_data, quoteId) => {
      qc.invalidateQueries({ queryKey: ['customer', 'quotes'] })
      qc.invalidateQueries({ queryKey: keys.quote(quoteId) })
    },
  })
}

export function useDeclineMyQuote() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason?: string }) => {
      const { data } = await api.post(`/finance/quotes/${quoteId}/decline`, {
        declinedByName: user?.name ?? 'Customer',
        declinedByEmail: user?.email ?? 'customer@portal.local',
        reason,
      })
      return data as Quote
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customer', 'quotes'] })
      qc.invalidateQueries({ queryKey: keys.quote(vars.quoteId) })
    },
  })
}

export function useApproveMyInvoice() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post(`/finance/invoices/${invoiceId}/approve`)
      return data as Invoice
    },
    onSuccess: (_data, invoiceId) => {
      qc.invalidateQueries({ queryKey: ['customer', 'invoices'] })
      qc.invalidateQueries({ queryKey: keys.invoice(invoiceId) })
    },
  })
}

export function useDeclineMyInvoice() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason?: string }) => {
      const { data } = await api.post(`/finance/invoices/${invoiceId}/decline`, { reason })
      return data as Invoice
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customer', 'invoices'] })
      qc.invalidateQueries({ queryKey: keys.invoice(vars.invoiceId) })
    },
  })
}

// ─── In-app messaging + notifications ──────────────────────────────────────
export function useMyThreads() {
  return useQuery<PaginatedResponse<MessageThread>>({
    queryKey: keys.threads(),
    queryFn: async () => {
      const { data } = await api.get('/comms/messaging/threads', { params: { page: 1, limit: 100 } })
      return {
        data: data?.data ?? [],
        meta: {
          total: data?.total ?? 0,
          page: data?.page ?? 1,
          limit: data?.limit ?? 100,
          totalPages: Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 100))),
        },
      }
    },
    staleTime: 15 * 1000,
  })
}

/** Total unread count across all threads — drives the red dot on the sidebar Messages item. */
export function useUnreadMyThreadsCount(): number {
  const { data } = useMyThreads()
  return useMemo(
    () => (data?.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [data],
  )
}

export function useMyThread(threadId: string | null) {
  return useQuery<MessageThread>({
    queryKey: keys.thread(threadId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/comms/messaging/threads/${threadId}`)
      return data
    },
    enabled: !!threadId,
  })
}

export function useSendMyThreadMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { data } = await api.post(`/comms/messaging/threads/${threadId}/messages`, { body })
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.thread(vars.threadId) })
      qc.invalidateQueries({ queryKey: keys.threads() })
      qc.invalidateQueries({ queryKey: keys.notifications() })
    },
  })
}

export function useMarkMyThreadRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data } = await api.patch(`/comms/messaging/threads/${threadId}/read`)
      return data
    },
    onSuccess: (_data, threadId) => {
      qc.invalidateQueries({ queryKey: keys.thread(threadId) })
      qc.invalidateQueries({ queryKey: keys.threads() })
    },
  })
}

export function useMyNotifications(limit = 30) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: [...keys.notifications(), limit],
    queryFn: async () => {
      const { data } = await api.get('/comms/notifications', { params: { page: 1, limit } })
      return {
        data: data?.data ?? [],
        meta: {
          total: data?.total ?? 0,
          page: data?.page ?? 1,
          limit: data?.limit ?? limit,
          totalPages: Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? limit))),
        },
      }
    },
    staleTime: 20 * 1000,
  })
}

export function useMarkMyNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/comms/notifications/${id}/read`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications() })
    },
  })
}

export function useMarkAllMyNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/comms/notifications/read-all')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications() })
    },
  })
}

export function useCreateMyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      customerId?: string
      customerName?: string
      subject?: string
      jobId?: string
    }) => {
      const { data: res } = await api.post('/comms/messaging/threads', data)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.threads() })
    },
  })
}

export function useDeleteMyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data } = await api.delete(`/comms/messaging/threads/${threadId}`)
      return data as { deleted: boolean; id: string }
    },
    onSuccess: (_data, threadId) => {
      // Optimistically remove from thread list
      qc.setQueriesData<PaginatedResponse<MessageThread>>(
        { queryKey: keys.threads(), exact: false },
        (old) =>
          old
            ? { ...old, data: old.data.filter((t) => t.id !== threadId) }
            : old,
      )
      qc.removeQueries({ queryKey: keys.thread(threadId) })
    },
  })
}

// ─── Dashboard aggregations ──────────────────────────────────────────────────
export function useCustomerDashboard() {
  const { user } = useAuth()
  const customerId = user?.customerId

  // Fetch jobs
  const jobsQuery = useQuery<PaginatedResponse<Job>>({
    queryKey: ['customer', 'dashboard', 'jobs', customerId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (customerId) params.set('customerId', customerId)
      params.set('limit', '50')
      const { data } = await api.get(`/jobs/jobs?${params}`)
      return data
    },
    enabled: !!customerId,
  })

  // Fetch invoices
  const invoicesQuery = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['customer', 'dashboard', 'invoices', customerId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (customerId) params.set('customerId', customerId)
      params.set('limit', '50')
      const { data } = await api.get(`/finance/invoices?${params}`)
      return data
    },
    enabled: !!customerId,
  })

  const jobs = jobsQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []

  const now = new Date()
  const upcomingJobs = jobs.filter(j =>
    ['SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'PENDING'].includes(j.status)
  )
  const completedJobs = jobs.filter(j => ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status))
  const pendingInvoices = invoices.filter(i => ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(i.status))

  const totalSpent = invoices
    .filter(i => ['PAID', 'PARTIALLY_PAID'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.amountPaid), 0)

  const outstandingBalance = pendingInvoices
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)

  // Next appointment: nearest scheduled job in the future
  const nextAppointment = upcomingJobs
    .filter(j => j.scheduledStart && new Date(j.scheduledStart) >= now)
    .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime())[0]

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return {
    isLoading: jobsQuery.isLoading || invoicesQuery.isLoading,
    isError: jobsQuery.isError || invoicesQuery.isError,
    data: {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      upcomingJobs: upcomingJobs.length,
      pendingInvoices: pendingInvoices.length,
      totalSpent,
      outstandingBalance,
      nextAppointment,
      recentJobs,
      pendingInvoiceItems: pendingInvoices.slice(0, 3),
    },
  }
}

// ─── My Equipment ────────────────────────────────────────────────────────────
export function useMyEquipment() {
  const { user } = useAuth()
  return useQuery<import('../types/api').CustomerEquipment[]>({
    queryKey: ['customer', 'equipment', user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/customers/${user!.customerId}/equipment`)
      return data
    },
    enabled: !!user?.customerId,
  })
}

export function useSaveMyEquipment() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      equipment: Array<{
        type?: string
        brand?: string
        model?: string
        serialNo?: string
        installDate?: string
        warrantyEnd?: string
        notes?: string
      }>,
    ) => {
      const { data } = await api.put(`/crm/customers/${user!.customerId}/equipment`, { equipment })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'equipment', user?.customerId] })
      qc.invalidateQueries({ queryKey: ['customer', 'profile'] })
    },
  })
}

// ─── User profile (CompanyUser record) ───────────────────────────────────────
export function useMyUserProfile() {
  return useQuery({
    queryKey: ['customer', 'user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/crm/users/me')
      return data
    },
  })
}

export function useUpdateUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { name?: string; phone?: string }) => {
      const { data } = await api.patch('/crm/users/me', dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'user-profile'] }),
  })
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
// Customers can rate individual jobs (one review per job, upserted) and the
// company overall. Both feed the admin dashboard's Reviews section and the
// technician's rating in scheduling's smart-assign scoring.

export function useMyReviews() {
  const { user } = useAuth()
  return useQuery<Review[]>({
    queryKey: ['customer', 'reviews', user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/customer/${user!.customerId}`)
      return Array.isArray(data) ? data : data?.data ?? []
    },
    enabled: !!user?.customerId,
  })
}

export function useJobReview(jobId: string | null) {
  const { user } = useAuth()
  return useQuery<Review | null>({
    queryKey: ['customer', 'job-review', jobId, user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/job/${jobId}`)
      const arr: Review[] = Array.isArray(data) ? data : data?.data ?? []
      // Return only THIS customer's review for the job (server already filters
      // for CUSTOMER role, but this makes client code straightforward).
      return arr.find((r) => r.customerId === user?.customerId) ?? null
    },
    enabled: !!jobId && !!user?.customerId,
  })
}

export function useCompanyReviewStats() {
  return useQuery<CompanyReviewStats>({
    queryKey: ['customer', 'review-stats', 'company'],
    queryFn: async () => {
      const { data } = await api.get('/crm/reviews/stats/company')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: {
      type:           ReviewType
      rating:         number
      comment?:       string
      jobId?:         string
      technicianId?:  string
      technicianName?: string
    }) => {
      const { data } = await api.post('/crm/reviews', dto)
      return data as Review
    },
    onSuccess: (_rev, vars) => {
      qc.invalidateQueries({ queryKey: ['customer', 'reviews'] })
      qc.invalidateQueries({ queryKey: ['customer', 'review-stats'] })
      if (vars.jobId) {
        qc.invalidateQueries({ queryKey: ['customer', 'job-review', vars.jobId] })
      }
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (dto: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/crm/auth/change-password', dto)
      return data
    },
  })
}
