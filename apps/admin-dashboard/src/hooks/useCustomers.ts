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
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.type && filters.type !== 'All Types') params.type = filters.type.toUpperCase()
      if (filters.isActive !== undefined) params.isActive = filters.isActive
      const res = await api.get('/crm/customers', { params })
      const raw = res.data
      // Normalize: backend returns { data, meta: {...} }, frontend expects flat shape
      if (raw.meta) {
        return { data: raw.data, ...raw.meta }
      }
      return raw
    },
  })
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: async () => {
      const res = await api.get(`/crm/customers/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCustomerStatusSummary(id?: string | null) {
  return useQuery<CustomerStatusSummary>({
    queryKey: ['customers', id, 'status-summary'],
    queryFn: async () => {
      const res = await api.get(`/crm/customers/${id}/status-summary`)
      return res.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
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
