/**
 * System Activity data layer — the super-admin-only, cross-tenant monitoring
 * feed. Spec: docs/superpowers/specs/2026-08-15-super-admin-activity-monitoring-design.md
 */
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export interface ActivityLogEntry {
  id: string
  companyId: string | null
  companyName: string
  service: string
  method: string
  path: string
  actorUserId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  description: string
  status: 'SUCCESS' | 'FAILURE'
  statusCode: number
  durationMs: number
  requestSummary?: Record<string, unknown>
  responseSummary?: Record<string, unknown>
  errorMessage?: string
  createdAt: string
}

export interface ActivityLogFilters {
  companyId?: string
  service?: string
  action?: string
  status?: 'SUCCESS' | 'FAILURE'
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface ActivityLogPage {
  items: ActivityLogEntry[]
  total: number
  page: number
  limit: number
}

export function useActivityLog(filters: ActivityLogFilters) {
  return useQuery<ActivityLogPage>({
    queryKey: ['activity-log', filters],
    queryFn: async () => {
      const res = await api.get('/comms/activity-log', { params: filters })
      return res.data
    },
    staleTime: 15_000,
  })
}

export interface ActivityCompany {
  companyId: string
  companyName: string
}

export function useActivityCompanies() {
  return useQuery<ActivityCompany[]>({
    queryKey: ['activity-log-companies'],
    queryFn: async () => {
      const res = await api.get('/comms/activity-log/companies')
      return res.data
    },
    staleTime: 60_000,
  })
}

/** Every service this platform's activity log ever tags an event with. */
export const ALL_SERVICES = [
  'crm', 'jobs', 'scheduling', 'finance', 'comms', 'analytics', 'inventory', 'churn',
] as const

/** Display label per service — used everywhere a service tag is rendered. */
export const SERVICE_LABELS: Record<string, string> = {
  crm: 'CRM',
  jobs: 'Jobs',
  scheduling: 'Scheduling',
  finance: 'Finance',
  comms: 'Comms',
  analytics: 'Analytics',
  inventory: 'Inventory',
  churn: 'Churn ML',
}
