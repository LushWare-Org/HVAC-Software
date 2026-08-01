/**
 * useMyProjects.ts — Customer's own projects (read-only portal view).
 * Routes → /api/crm/projects/mine (JWT-scoped by customerId server-side).
 * Progress and payment summaries come from projectId-filtered job/finance
 * queries, matching the admin roll-up rule (Decimal strings → Number()).
 */
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export interface MyProject {
  id: string
  name: string
  description?: string | null
  category?: string | null
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  startDate?: string | null
  targetEndDate?: string | null
  siteAddress?: string | null
}

export interface MyProjectJob {
  id: string
  title: string
  status: string
  scheduledStart?: string | null
}

export interface MyProjectMoney {
  invoiced: number
  paid: number
  outstanding: number
}

export interface MyProjectQuote {
  id: string
  quoteNumber?: string
  status: string
  total: number
  createdAt: string
}

export function useMyProjects() {
  const { isAuthenticated } = useAuth()
  return useQuery<MyProject[]>({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await api.get('/crm/projects/mine')
      return res.data ?? []
    },
    enabled: isAuthenticated,
    // Shorter than the app default (60s) and refetches on focus, unlike most
    // portal queries — this one gates whether the "My Projects" nav tab exists
    // at all, so a customer just linked to a project should see it appear the
    // moment they switch back to an already-open tab, not up to a minute later.
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMyProjectJobs(projectId: string | null) {
  return useQuery<MyProjectJob[]>({
    queryKey: ['my-projects', projectId, 'jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { projectId, limit: 100 } })
      return (res.data?.data ?? []) as MyProjectJob[]
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })
}

export function useMyProjectQuotes(projectId: string | null) {
  return useQuery<MyProjectQuote[]>({
    queryKey: ['my-projects', projectId, 'quotes'],
    queryFn: async () => {
      const res = await api.get('/finance/quotes', { params: { projectId, limit: 50 } })
      const rows: any[] = res.data?.data ?? res.data?.items ?? []
      return rows.map(q => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        total: Number(q.total ?? 0),
        createdAt: q.createdAt,
      }))
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })
}

export function useMyProjectMoney(projectId: string | null) {
  return useQuery<MyProjectMoney>({
    queryKey: ['my-projects', projectId, 'money'],
    queryFn: async () => {
      const res = await api.get('/finance/invoices', { params: { projectId, limit: 100 } })
      const rows: any[] = res.data?.data ?? res.data?.items ?? []
      const live = rows.filter(i => i.status !== 'VOID')
      const invoiced = live.reduce((s, i) => s + Number(i.total ?? 0), 0)
      const paid = live.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.total ?? 0), 0)
      return { invoiced, paid, outstanding: invoiced - paid }
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })
}
