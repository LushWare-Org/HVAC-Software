import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Invoice, Job, PaginatedResponse } from '@/types/api'

const OPEN_INVOICE_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE']

/**
 * Home's data, from the same two endpoints the web portal's dashboard uses —
 * so the numbers match what the customer already sees on the web.
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

  const jobs = jobsQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []
  const now = Date.now()

  return {
    upcomingJobs: jobs.filter(
      (j) => j.scheduledStart && new Date(j.scheduledStart).getTime() >= now,
    ).length,
    openInvoices: invoices.filter((i) => OPEN_INVOICE_STATUSES.includes(i.status)).length,
    isLoading: jobsQuery.isLoading || invoicesQuery.isLoading,
    isError: jobsQuery.isError || invoicesQuery.isError,
    refetch: () => {
      void jobsQuery.refetch()
      void invoicesQuery.refetch()
    },
  }
}
