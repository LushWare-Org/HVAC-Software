/**
 * useDashboard.ts — Hooks for dashboard KPIs, recent jobs, and appointments
 * Routes → nginx /api/analytics/ → analytics-service :3006
 *           nginx /api/jobs/      → job-service :3002
 *           nginx /api/scheduling/ → scheduling-service :3003
 */

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { DashboardKpis, PaginatedResponse, Job, Appointment } from '../types/api'

// ─── KPI cards ────────────────────────────────────────────────────────────────

export function useDashboardKpis(from?: string, to?: string) {
  return useQuery<DashboardKpis>({
    queryKey: ['dashboard', 'kpis', from, to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/dashboard/kpis', { params })
      return res.data
    },
    staleTime: 2 * 60 * 1000, // refresh KPIs every 2 minutes
  })
}

// ─── Recent Jobs (latest 10) ───────────────────────────────────────────────────

export function useRecentJobs(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['dashboard', 'recent-jobs', page, limit],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { page, limit } })
      return res.data
    },
  })
}

// ─── Upcoming Appointments (next 10) ──────────────────────────────────────────
// Uses CRM bookings (confirmed/pending) as the appointment source.
// The scheduling service has no /appointments endpoint.

export function useUpcomingAppointments(limit = 10) {
  return useQuery<PaginatedResponse<Appointment>>({
    queryKey: ['dashboard', 'appointments', limit],
    queryFn: async () => {
      const res = await api.get('/crm/bookings')
      const raw = res.data
      const items = Array.isArray(raw) ? raw : (raw?.data ?? [])
      const total = raw?.meta?.total ?? raw?.total ?? items.length
      return { data: items.slice(0, limit), total, page: 1, limit, totalPages: 1 }
    },
  })
}
