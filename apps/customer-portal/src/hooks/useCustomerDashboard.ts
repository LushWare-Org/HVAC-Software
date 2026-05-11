/**
 * useCustomerDashboard — Aggregations for the portal Dashboard page.
 *
 * Split out of `useCustomerPortal.ts`. Two parallel queries (jobs +
 * invoices) feed a derived view: KPI counts, next appointment, recent jobs,
 * pending invoices preview. The two queries run in parallel via TanStack
 * Query so the dashboard paints as soon as both finish.
 */
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Job, Invoice, PaginatedResponse } from '../types/api'

export function useCustomerDashboard() {
  const { user } = useAuth()
  const customerId = user?.customerId

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
    ['SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'PENDING'].includes(j.status),
  )
  const completedJobs = jobs.filter(j => ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status))
  const pendingInvoices = invoices.filter(i => ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(i.status))

  const totalSpent = invoices
    .filter(i => ['PAID', 'PARTIALLY_PAID'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.amountPaid), 0)

  const outstandingBalance = pendingInvoices
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)

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
