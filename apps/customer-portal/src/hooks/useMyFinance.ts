/**
 * useMyFinance — Invoice + Quote hooks for the customer portal.
 *
 * Split out of the original 811-line `useCustomerPortal.ts`. All endpoints
 * are filtered server-side by the customer's id (CUSTOMER role).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { keys } from './keys'
import type { Invoice, Quote, PaymentIntent, PaginatedResponse } from '../types/api'

export function useMyInvoices(filters?: {
  status?: string
  houseId?: string
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
      if (filters?.houseId) params.set('houseId', filters.houseId)
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
  houseId?: string
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
      if (filters?.houseId) params.set('houseId', filters.houseId)
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
