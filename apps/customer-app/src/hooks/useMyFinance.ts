import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Invoice, PaginatedResponse, Quote } from '@/types/api'

/**
 * Keys sit under ['quotes'] / ['invoices'] / ['dashboard'] so the matching
 * socket events (quote_changed, invoice_changed) refresh them automatically.
 */

export function useMyQuotes() {
  const { user } = useAuth()
  const customerId = user?.customerId

  return useQuery<PaginatedResponse<Quote>>({
    queryKey: ['quotes', 'list', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/quotes?customerId=${customerId}&limit=100`)
      return data
    },
    enabled: Boolean(customerId),
  })
}

export function useMyQuote(quoteId: string | undefined) {
  return useQuery<Quote>({
    queryKey: ['quotes', 'detail', quoteId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/quotes/${quoteId}`)
      return data
    },
    enabled: Boolean(quoteId),
  })
}

export function useMyInvoices() {
  const { user } = useAuth()
  const customerId = user?.customerId

  return useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['invoices', 'list', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices?customerId=${customerId}&limit=100`)
      return data
    },
    enabled: Boolean(customerId),
  })
}

export function useMyInvoice(invoiceId: string | undefined) {
  return useQuery<Invoice>({
    queryKey: ['invoices', 'detail', invoiceId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices/${invoiceId}`)
      return data
    },
    enabled: Boolean(invoiceId),
  })
}

function useFinanceInvalidation() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['quotes'] })
    void qc.invalidateQueries({ queryKey: ['invoices'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

/**
 * finance-service records who decided, so the customer's name and email travel
 * with the decision — that is what appears on the quote's audit trail.
 */
export function useApproveQuote() {
  const { user } = useAuth()
  const invalidate = useFinanceInvalidation()

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data } = await api.post(`/finance/quotes/${quoteId}/approve`, {
        approvedByName: user?.name ?? 'Customer',
        approvedByEmail: user?.email ?? 'customer@portal.local',
      })
      return data as Quote
    },
    onSuccess: invalidate,
  })
}

export function useDeclineQuote() {
  const { user } = useAuth()
  const invalidate = useFinanceInvalidation()

  return useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason?: string }) => {
      const { data } = await api.post(`/finance/quotes/${quoteId}/decline`, {
        declinedByName: user?.name ?? 'Customer',
        declinedByEmail: user?.email ?? 'customer@portal.local',
        reason,
      })
      return data as Quote
    },
    onSuccess: invalidate,
  })
}

/** Acknowledging an invoice is not paying it — payment stays on the web for now. */
export function useApproveInvoice() {
  const invalidate = useFinanceInvalidation()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post(`/finance/invoices/${invoiceId}/approve`)
      return data as Invoice
    },
    onSuccess: invalidate,
  })
}

export function useDeclineInvoice() {
  const invalidate = useFinanceInvalidation()

  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason?: string }) => {
      const { data } = await api.post(`/finance/invoices/${invoiceId}/decline`, { reason })
      return data as Invoice
    },
    onSuccess: invalidate,
  })
}
