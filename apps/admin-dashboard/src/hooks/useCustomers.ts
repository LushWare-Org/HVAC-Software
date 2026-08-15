/**
 * useCustomers.ts — Hooks for CRM customers, leads, and agreements
 * Routes → nginx /api/crm/ → crm-service :3001
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Customer, CustomerStatusSummary, Lead, PaginatedResponse } from '../types/api'

// ─── Customers ────────────────────────────────────────────────────────────────

interface CustomerFilters {
  page?: number
  limit?: number
  search?: string
  type?: string
  isActive?: boolean
  tags?: string[]
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  /** Restricts to customers matching an AI Revenue Recommendation segment (currently only 'retention_risk'). */
  riskSegment?: string
}

async function fetchCustomers(filters: CustomerFilters): Promise<PaginatedResponse<Customer>> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  }
  if (filters.search) params.search = filters.search
  if (filters.type && filters.type !== 'All Types') params.type = filters.type.toUpperCase()
  if (filters.isActive !== undefined) params.isActive = filters.isActive
  if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',')
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortDir) params.sortDir = filters.sortDir
  if (filters.riskSegment) params.riskSegment = filters.riskSegment
  const res = await api.get('/crm/customers', { params })
  const raw = res.data
  // Normalize: backend returns { data, meta: {...} }, frontend expects flat shape
  if (raw.meta) {
    return { data: raw.data, ...raw.meta }
  }
  return raw
}

async function fetchCustomerTags(): Promise<string[]> {
  const res = await api.get('/crm/customers/tags')
  // Filter out system-generated tags (e.g. iot:offline:*, portal-signup)
  return (res.data as string[]).filter(
    t => !t.startsWith('iot:') && t !== 'portal-signup'
  )
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await api.get(`/crm/customers/${id}`)
  return res.data
}

async function fetchCustomerStatusSummary(id: string): Promise<CustomerStatusSummary> {
  const res = await api.get(`/crm/customers/${id}/status-summary`)
  return res.data
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', filters],
    queryFn: () => fetchCustomers(filters),
  })
}

export function useCustomerTags() {
  return useQuery<string[]>({
    queryKey: ['customer-tags'],
    queryFn: fetchCustomerTags,
  })
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  })
}

export function useCustomerStatusSummary(id?: string | null) {
  return useQuery<CustomerStatusSummary>({
    queryKey: ['customers', id, 'status-summary'],
    queryFn: () => fetchCustomerStatusSummary(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

/**
 * Warm the queries Customers.tsx mounts with. The filter object must match
 * the page's initial state exactly (page 1, 10/page, createdAt desc) or the
 * query hash won't line up and the prefetch is wasted.
 */
export function prefetchCustomersPage(): Promise<unknown> {
  const initialFilters: CustomerFilters = {
    page: 1, limit: 10,
    search: undefined, type: undefined, isActive: undefined, tags: undefined,
    sortBy: 'createdAt', sortDir: 'desc',
  }
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['customers', initialFilters], queryFn: () => fetchCustomers(initialFilters) }),
    queryClient.prefetchQuery({ queryKey: ['customer-tags'], queryFn: fetchCustomerTags }),
  ])
}

/** Warm one customer's detail + status summary — called on row hover so the sidebar opens instantly. */
export function prefetchCustomerDetail(id: string): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['customers', id], queryFn: () => fetchCustomer(id) }),
    queryClient.prefetchQuery({ queryKey: ['customers', id, 'status-summary'], queryFn: () => fetchCustomerStatusSummary(id), staleTime: 60 * 1000 }),
  ])
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const res = await api.post('/crm/customers', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const res = await api.put(`/crm/customers/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-tags'] })
    },
  })
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useResendWelcomeEmail() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.post(`/crm/auth/customers/${customerId}/resend-welcome-email`)
      return res.data as { success: boolean; message: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useExecuteFollowup() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.post(`/crm/customers/${customerId}/followup`)
      return res.data as { queued: boolean; action?: string; reason?: string }
    },
  })
}

export function useExecuteRetention() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.post(`/crm/customers/${customerId}/retention`)
      return res.data as { queued: boolean; reason?: string }
    },
  })
}

export function useExecuteUpsell() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.post(`/crm/upsell/customers/${customerId}/recommendations`)
      return res.data as { status: string }
    },
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'status-summary'] })
    },
  })
}

export function useExecuteRevenueAgent() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.post(`/crm/customers/${customerId}/revenue`)
      return res.data
    },
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'status-summary'] })
    },
  })
}

// ─── Leads ────────────────────────────────────────────────────────────────────

interface LeadFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'All Status') params.status = filters.status.toUpperCase().replace(' ', '_')
      const res = await api.get('/crm/leads', { params })
      return res.data
    },
  })
}

export function useCreateLead() {
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await api.post('/crm/leads', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ─── Auth: email check + provisioning ─────────────────────────────────────────

/**
 * Real-time email check before provisioning.
 * GET /crm/auth/check-email?email=...
 * Returns { exists: boolean, role?, name? }
 */
export function useCheckEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.get<{ exists: boolean; role?: string; name?: string }>(
        '/crm/auth/check-email',
        { params: { email } },
      )
      return res.data
    },
  })
}

/**
 * Admin provisions a customer account when creating a lead.
 * POST /crm/auth/provision-lead
 * Creates CompanyUser + Customer + Lead, sends welcome email with temp password.
 */
export function useProvisionLeadAccount() {
  return useMutation({
    mutationFn: async (data: {
      firstName: string
      lastName: string
      email: string
      phone?: string
      source?: string
      serviceInterest?: string
    }) => {
      const res = await api.post('/crm/auth/provision-lead', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ─── Update lead (status transitions, field updates) ──────────────────────────

export function useUpdateLead() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const res = await api.patch(`/crm/leads/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteLead() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/leads/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ─── Agreements (Bookings in CRM service) ─────────────────────────────────────

interface Agreement {
  id: string
  customerId: string
  customerName?: string
  value?: number
  status: string
  nextServiceDate?: string
  renewalDate?: string
}

interface AgreementFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: {
      serviceType: string
      preferredDate: string
      description?: string
      alternateDate?: string
      customerId?: string
      guestName?: string
      guestEmail?: string
      guestPhone?: string
      notes?: string
    }) => {
      const res = await api.post('/crm/bookings', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      // Bookings feed the Dashboard's upcoming-appointments panel and the
      // customer status-summary (last-service / cadence signals).
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'appointments'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useAgreements(filters: AgreementFilters = {}) {
  return useQuery<PaginatedResponse<Agreement>>({
    queryKey: ['agreements', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'All Status') params.status = filters.status.toUpperCase()
      const res = await api.get('/crm/bookings', { params })
      const raw = res.data
      // Normalize: backend returns { data, meta: {...} }
      if (raw.meta) {
        return { data: raw.data, ...raw.meta }
      }
      // Handle raw array (safety)
      if (Array.isArray(raw)) {
        return { data: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 }
      }
      return raw
    },
  })
}
