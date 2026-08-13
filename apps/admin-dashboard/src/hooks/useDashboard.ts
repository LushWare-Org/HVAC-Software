/**
 * useDashboard.ts — Hooks for dashboard KPIs, recent jobs, and appointments
 * Routes → nginx /api/analytics/ → analytics-service :3006
 *           nginx /api/jobs/      → job-service :3002
 *           nginx /api/scheduling/ → scheduling-service :3003
 *
 * Fetchers are module-level (not inline in useQuery) so `prefetchDashboard`
 * can warm the exact same query keys before the page is ever visited —
 * that's what makes the Dashboard render instantly on click.
 */

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { DashboardKpis, PaginatedResponse, Job, Appointment } from '../types/api'

// ─── Fetchers (shared by hooks + prefetch) ────────────────────────────────────

async function fetchKpis(from?: string, to?: string): Promise<DashboardKpis> {
  const params: Record<string, string> = {}
  if (from) params.from = from
  if (to) params.to = to
  const res = await api.get('/analytics/dashboard/kpis', { params })
  return res.data
}

async function fetchRecentJobs(page: number, limit: number): Promise<PaginatedResponse<Job>> {
  const res = await api.get('/jobs/jobs', { params: { page, limit } })
  return res.data
}

async function fetchAppointments(limit: number): Promise<PaginatedResponse<Appointment>> {
  // Server-side bound (sorted by preferredDate asc) — fetching every booking
  // ever made grows unbounded over a tenant's lifetime.
  const res = await api.get('/crm/bookings', { params: { limit: Math.max(limit, 50) } })
  const raw = res.data
  const items = Array.isArray(raw) ? raw : (raw?.data ?? [])
  const total = raw?.meta?.total ?? raw?.total ?? items.length
  return { data: items.slice(0, limit), total, page: 1, limit, totalPages: 1 }
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

export function useDashboardKpis(from?: string, to?: string) {
  return useQuery<DashboardKpis>({
    queryKey: ['dashboard', 'kpis', from, to],
    queryFn: () => fetchKpis(from, to),
    staleTime: 2 * 60 * 1000, // refresh KPIs every 2 minutes
  })
}

// ─── Recent Jobs (latest 10) ───────────────────────────────────────────────────

export function useRecentJobs(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<Job>>({
    queryKey: ['dashboard', 'recent-jobs', page, limit],
    queryFn: () => fetchRecentJobs(page, limit),
  })
}

// ─── Upcoming Appointments (next 10) ──────────────────────────────────────────
// Uses CRM bookings (confirmed/pending) as the appointment source.
// The scheduling service has no /appointments endpoint.

export function useUpcomingAppointments(limit = 10) {
  return useQuery<PaginatedResponse<Appointment>>({
    queryKey: ['dashboard', 'appointments', limit],
    queryFn: () => fetchAppointments(limit),
  })
}

// ─── Prefetch ─────────────────────────────────────────────────────────────────

/**
 * Warm every query Dashboard.tsx mounts with, using identical query keys.
 * Called at idle after login and on sidebar hover — respects staleTime,
 * so repeated calls are free.
 */
export function prefetchDashboard(): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['dashboard', 'kpis', undefined, undefined], queryFn: () => fetchKpis(), staleTime: 2 * 60 * 1000 }),
    queryClient.prefetchQuery({ queryKey: ['dashboard', 'recent-jobs', 1, 10], queryFn: () => fetchRecentJobs(1, 10) }),
    queryClient.prefetchQuery({ queryKey: ['dashboard', 'appointments', 4], queryFn: () => fetchAppointments(4) }),
  ])
}
