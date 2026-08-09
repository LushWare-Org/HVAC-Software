/**
 * useFinance.ts — Hooks for the Finance page (invoices, quotes, expenses)
 * Routes → nginx /api/finance/ → finance-service :3004
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Invoice, Quote, Expense, PaginatedResponse } from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Prisma serialises Decimal as string — convert to display number */
export function decimalToNumber(val: string | number | undefined | null): number {
  if (val === null || val === undefined || val === '') return 0
  return Number(val)
}

// ─── Finance KPIs (reuse analytics endpoint) ──────────────────────────────────

export function useFinanceKpis() {
  return useQuery({
    queryKey: ['finance', 'kpis'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard/kpis')
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

interface InvoiceFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  customerId?: string
}

export function useInvoice(id: string | undefined) {
  return useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await api.get(`/finance/invoices/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useQuote(id: string | undefined) {
  return useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await api.get(`/finance/quotes/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status.toUpperCase()
      }
      if (filters.customerId) params.customerId = filters.customerId
      const res = await api.get('/finance/invoices', { params })
      return res.data
    },
  })
}

export function useCreateInvoice() {
  return useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      const res = await api.post('/finance/invoices', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

interface QuoteFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  customerId?: string
  /** Restricts to SENT/VIEWED quotes older than 7 days — matches the "Pending Quotes at Risk" AI recommendation. Overrides `status` when true. */
  pendingAging?: boolean
}

export function useQuotes(filters: QuoteFilters = {}) {
  return useQuery<PaginatedResponse<Quote>>({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.pendingAging) {
        params.pendingAging = true
      } else if (filters.status && filters.status !== 'all') {
        params.status = filters.status.toUpperCase()
      }
      if (filters.customerId) params.customerId = filters.customerId
      const res = await api.get('/finance/quotes', { params })
      return res.data
    },
  })
}

export function useCreateQuote() {
  return useMutation({
    mutationFn: async (data: Partial<Quote>) => {
      const res = await api.post('/finance/quotes', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuote() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Quote> }) => {
      const res = await api.patch(`/finance/quotes/${id}`, data)
      return res.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.setQueryData(['quote', id], data)
    },
  })
}

/** PATCH /finance/quotes/:id/send — change status to SENT and send to customer */
export function useSendQuote() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/finance/quotes/${id}/send`)
      return res.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.setQueryData(['quote', id], data)
    },
  })
}

/** POST /finance/quotes/:id/approve — customer acceptance */
export function useApproveQuote() {
  return useMutation({
    mutationFn: async ({ id, approvedByName, approvedByEmail }: {
      id: string
      approvedByName?: string
      approvedByEmail?: string
    }) => {
      const res = await api.post(`/finance/quotes/${id}/approve`, {
        approvedByName,
        approvedByEmail,
      })
      return res.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.setQueryData(['quote', id], data)
    },
  })
}

/** POST /finance/quotes/:id/convert — convert approved quote to invoice */
export function useConvertQuote() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/finance/quotes/${id}/convert`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// ─── Invoices (additional mutations) ──────────────────────────────────────────

export function useUpdateInvoice() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Invoice> }) => {
      const res = await api.patch(`/finance/invoices/${id}`, data)
      return res.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', id], data)
    },
  })
}

/** PATCH /finance/invoices/:id/send — mark SENT and email to customer */
export function useSendInvoice() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/finance/invoices/${id}/send`)
      return res.data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', id], data)
    },
  })
}

/** POST /finance/invoices/:id/payments — record a payment against an invoice */
export function useRecordPayment() {
  return useMutation({
    mutationFn: async ({ invoiceId, amount, method, notes }: {
      invoiceId: string
      amount: number
      method?: string
      notes?: string
    }) => {
      const res = await api.post(`/finance/invoices/${invoiceId}/payments`, {
        amount: Number(amount),
        method,
        notes,
      })
      return res.data
    },
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })
}

/** PATCH /finance/invoices/:id/void — void an invoice */
export function useVoidInvoice() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.patch(`/finance/invoices/${id}/void`, { reason })
      return res.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', id], data)
    },
  })
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

interface ExpenseFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status.toUpperCase()
      }
      const res = await api.get('/finance/expenses', { params })
      return res.data
    },
  })
}

export function useCreateExpense() {
  return useMutation({
    mutationFn: async (data: Partial<Expense>) => {
      const res = await api.post('/finance/expenses', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
    },
  })
}

export function useUpdateExpense() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      const res = await api.patch(`/finance/expenses/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
    },
  })
}

export function useDeleteExpense() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/finance/expenses/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance', 'kpis'] })
    },
  })
}

// ─── QuickBooks hooks ─────────────────────────────────────────────────────────

export interface QBStatus {
  connected: boolean
  realmId?: string
  expiresAt?: string
}

export function useQBStatus() {
  return useQuery<QBStatus>({
    queryKey: ['quickbooks', 'status'],
    queryFn: async () => {
      const res = await api.get('/finance/quickbooks/status')
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useQBAuthUrl() {
  return useMutation({
    mutationFn: async (): Promise<{ authUrl: string }> => {
      const res = await api.get('/finance/quickbooks/auth-url')
      return res.data
    },
  })
}

export function useQBDisconnect() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/finance/quickbooks/disconnect')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quickbooks', 'status'] })
    },
  })
}

export function useQBSyncInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await api.post(`/finance/quickbooks/sync/invoice/${invoiceId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
