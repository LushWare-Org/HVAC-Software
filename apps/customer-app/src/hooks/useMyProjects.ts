import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { MyProject, MyProjectJob, MyProjectMoney, MyProjectQuote } from '@/types/api'

export function useMyProjects() {
  const { isAuthenticated, user } = useAuth()
  return useQuery<MyProject[]>({
    queryKey: ['projects', 'list', user?.customerId],
    queryFn: async () => (await api.get('/crm/projects/mine')).data ?? [],
    enabled: isAuthenticated && Boolean(user?.customerId),
    staleTime: 15 * 1000,
  })
}

export function useMyProjectJobs(projectId: string | null) {
  return useQuery<MyProjectJob[]>({
    queryKey: ['projects', projectId, 'jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { projectId, limit: 100 } })
      return (res.data?.data ?? []) as MyProjectJob[]
    },
    enabled: Boolean(projectId),
    staleTime: 60 * 1000,
  })
}

export function useMyProjectQuotes(projectId: string | null) {
  return useQuery<MyProjectQuote[]>({
    queryKey: ['projects', projectId, 'quotes'],
    queryFn: async () => {
      const res = await api.get('/finance/quotes', { params: { projectId, limit: 50 } })
      const rows: any[] = res.data?.data ?? []
      return rows.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        total: Number(q.total ?? 0),
        createdAt: q.createdAt,
      }))
    },
    enabled: Boolean(projectId),
    staleTime: 60 * 1000,
  })
}

/** Rolls up invoice totals the same way the admin does: Decimal strings → Number(). */
export function useMyProjectMoney(projectId: string | null) {
  return useQuery<MyProjectMoney>({
    queryKey: ['projects', projectId, 'money'],
    queryFn: async () => {
      const res = await api.get('/finance/invoices', { params: { projectId, limit: 100 } })
      const rows: any[] = res.data?.data ?? []
      const live = rows.filter((i) => i.status !== 'VOID')
      const invoiced = live.reduce((s, i) => s + Number(i.total ?? 0), 0)
      const paid = live.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.total ?? 0), 0)
      return { invoiced, paid, outstanding: invoiced - paid }
    },
    enabled: Boolean(projectId),
    staleTime: 60 * 1000,
  })
}
