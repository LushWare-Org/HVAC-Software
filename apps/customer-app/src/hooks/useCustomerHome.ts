import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Invoice, Job, PaginatedResponse, Quote } from '@/types/api'

/** Work that is still live for the customer — anything not finished or dropped. */
const CLOSED_JOB_STATUSES = ['COMPLETED', 'CANCELLED', 'INVOICED', 'PAID']
const OPEN_INVOICE_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE']
const PENDING_QUOTE_STATUSES = ['SENT', 'VIEWED']

/**
 * Home's data, from the same endpoints the web portal's dashboard uses, so the
 * numbers match what the customer already sees on the web.
 *
 * Counts deliberately describe what EXISTS rather than a narrow time window: an
 * earlier version counted only jobs scheduled in the future, which rendered "0"
 * for a customer with seven real jobs simply because they were all in the past.
 * A screen whose job is to prove the stack works must not look empty when there
 * is data.
 */
export function useCustomerHome() {
  const { user } = useAuth()
  const customerId = user?.customerId

  const jobsQuery = useQuery<PaginatedResponse<Job>>({
    // 'dashboard' prefix so a job_changed socket event invalidates this too.
    queryKey: ['dashboard', 'jobs', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/jobs?customerId=${customerId}&limit=50`)
      return data
    },
    enabled: Boolean(customerId),
  })

  const invoicesQuery = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['dashboard', 'invoices', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices?customerId=${customerId}&limit=50`)
      return data
    },
    enabled: Boolean(customerId),
  })

  const quotesQuery = useQuery<PaginatedResponse<Quote>>({
    queryKey: ['dashboard', 'quotes', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/quotes?customerId=${customerId}&limit=50`)
      return data
    },
    enabled: Boolean(customerId),
  })

  const jobs = jobsQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []
  const quotes = quotesQuery.data?.data ?? []

  // Most recent first, whether or not a job was ever scheduled.
  const recentJobs = [...jobs]
    .sort((a, b) => {
      const at = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0
      const bt = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0
      return bt - at
    })
    .slice(0, 5)

  return {
    activeJobs: jobs.filter((j) => !CLOSED_JOB_STATUSES.includes(j.status)).length,
    totalJobs: jobs.length,
    openInvoices: invoices.filter((i) => OPEN_INVOICE_STATUSES.includes(i.status)).length,
    pendingQuotes: quotes.filter((q) => PENDING_QUOTE_STATUSES.includes(q.status)).length,
    recentJobs,
    isLoading: jobsQuery.isLoading || invoicesQuery.isLoading || quotesQuery.isLoading,
    isError: jobsQuery.isError || invoicesQuery.isError || quotesQuery.isError,
    refetch: () => {
      void jobsQuery.refetch()
      void invoicesQuery.refetch()
      void quotesQuery.refetch()
    },
  }
}
