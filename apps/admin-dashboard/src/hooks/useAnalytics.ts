/**
 * useAnalytics.ts — Hooks for the Analytics page charts and leaderboard
 * Routes → nginx /api/analytics/ → analytics-service :3006
 *
 * IMPORTANT: Analytics endpoints require the analytics-service to be deployed on Cloud Run.
 * If the service is not running, queries will fail gracefully with empty/default data.
 */

import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  DashboardKpis,
  RevenueSeries,
  JobsByStatus,
  TechLeaderboard,
  CustomerAcquisition,
  RevenueByCategory,
  RevenueAgentSummary,
  RevenueAgentTrendPoint,
  RevenueAgentLog,
  Recommendation,
} from '../types/api'

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
}

function asRecord<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  return isPlainObject(value) ? (value as T) : fallback
}

// ─── Default/fallback demo data ───────────────────────────────────────────────
// Shown when analytics-service is not available (graceful degradation with demo data)

const DEFAULT_KPI: DashboardKpis = {
  revenue: { label: 'Revenue', value: 45320, formattedValue: '$45,320', trend: 12, trendLabel: 'vs prior period', unit: 'USD' },
  jobsCompleted: { label: 'Jobs Completed', value: 24, formattedValue: '24', trend: 8 },
  activeCustomers: { label: 'Active Customers', value: 127, formattedValue: '127' },
  avgRating: { label: 'Average Rating', value: 4.7, formattedValue: '4.7', unit: '/5' },
  outstandingInvoices: { label: 'Outstanding Invoices', value: 8, formattedValue: '8' },
  leadConversionRate: { label: 'Conversion Rate', value: 0.32, formattedValue: '32%' },
  periodLabel: 'This Period (Demo Data)',
}

// Demo revenue series data
const DEMO_REVENUE_SERIES: RevenueSeries[] = [
  { period: '2026-01', revenue: 8500, invoiceCount: 4, jobCount: 3 },
  { period: '2026-02', revenue: 12300, invoiceCount: 6, jobCount: 5 },
  { period: '2026-03', revenue: 9800, invoiceCount: 5, jobCount: 4 },
  { period: '2026-04', revenue: 15200, invoiceCount: 7, jobCount: 6 },
  { period: '2026-05', revenue: 11500, invoiceCount: 5, jobCount: 4 },
  { period: '2026-06', revenue: 18000, invoiceCount: 8, jobCount: 7 },
]

// Demo job status data
const DEMO_JOB_STATUS: JobsByStatus[] = [
  { status: 'COMPLETED', count: 24 },
  { status: 'SCHEDULED', count: 8 },
  { status: 'IN_PROGRESS', count: 3 },
  { status: 'INVOICED', count: 18 },
  { status: 'PAID', count: 15 },
  { status: 'PENDING', count: 2 },
]

// Demo customer acquisition data
const DEMO_CUSTOMER_ACQUISITION: CustomerAcquisition[] = [
  { period: '2026-01', newCustomers: 4, returningCustomers: 12 },
  { period: '2026-02', newCustomers: 6, returningCustomers: 18 },
  { period: '2026-03', newCustomers: 3, returningCustomers: 14 },
  { period: '2026-04', newCustomers: 8, returningCustomers: 22 },
  { period: '2026-05', newCustomers: 5, returningCustomers: 16 },
  { period: '2026-06', newCustomers: 9, returningCustomers: 28 },
]

// Demo technician leaderboard
const DEMO_LEADERBOARD: TechLeaderboard[] = [
  { technicianId: '1', technicianName: 'Mike Johnson', jobsCompleted: 42, totalRevenue: 8500, avgRating: 4.9, completionRate: 0.98 },
  { technicianId: '2', technicianName: 'Sarah Williams', jobsCompleted: 38, totalRevenue: 7800, avgRating: 4.8, completionRate: 0.96 },
  { technicianId: '3', technicianName: 'Tom Martinez', jobsCompleted: 35, totalRevenue: 7200, avgRating: 4.7, completionRate: 0.94 },
  { technicianId: '4', technicianName: 'Lisa Anderson', jobsCompleted: 32, totalRevenue: 6500, avgRating: 4.6, completionRate: 0.92 },
  { technicianId: '5', technicianName: 'David Smith', jobsCompleted: 28, totalRevenue: 5800, avgRating: 4.5, completionRate: 0.90 },
]

// Demo revenue by category
const DEMO_REVENUE_CATEGORY: RevenueByCategory[] = [
  { category: 'HVAC Maintenance', total: 42000, percentage: 0.35 },
  { category: 'Plumbing Repairs', total: 33600, percentage: 0.28 },
  { category: 'Electrical Work', total: 26400, percentage: 0.22 },
  { category: 'Other Services', total: 18000, percentage: 0.15 },
]

// ─── Service health gate ──────────────────────────────────────────────────────
// Periodically pings /api/analytics/health so the UI can show a "degraded"
// banner when the service is unreachable. Per-query try/catch + demo data
// remain the chart-level safety net; this is the user-visible indicator.

export interface AnalyticsServiceHealth {
  available: boolean
  status: 'ok' | 'degraded' | 'unknown'
  service?: string
  checkedAt: number
  error?: string
}

export function useAnalyticsServiceHealth(intervalMs = 60_000) {
  return useQuery<AnalyticsServiceHealth>({
    queryKey: ['analytics', 'service-health'],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/health', { timeout: 4_000 })
        const ok = res.status >= 200 && res.status < 300 && res.data?.status === 'ok'
        return {
          available: ok,
          status: ok ? 'ok' : 'degraded',
          service: res.data?.service,
          checkedAt: Date.now(),
        }
      } catch (error) {
        return {
          available: false,
          status: 'degraded',
          checkedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
    staleTime: intervalMs,
    retry: false,
  })
}

// ─── KPI summary ──────────────────────────────────────────────────────────────

export function useAnalyticsKpis(from?: string, to?: string) {
  return useQuery<DashboardKpis>({
    queryKey: ['analytics', 'kpis', from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/dashboard/kpis', { params })
        console.log('[Analytics] KPI data loaded:', res.data)
        return res.data
      } catch (error) {
        console.warn('[Analytics] Failed to fetch KPIs, using defaults:', error)
        return DEFAULT_KPI
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ─── Revenue series ────────────────────────────────────────────────────────────

export function useRevenueSeries(
  granularity: Granularity = 'month',
  from?: string,
  to?: string,
) {
  return useQuery<RevenueSeries[]>({
    queryKey: ['analytics', 'revenue-series', granularity, from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string> = { granularity }
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/revenue/series', { params })
        console.log(`[Analytics] Revenue series (${granularity}) loaded:`, res.data)
        return asArray<RevenueSeries>(res.data, DEMO_REVENUE_SERIES)
      } catch (error) {
        console.warn(`[Analytics] Failed to fetch revenue series (${granularity}), using demo data:`, error)
        return DEMO_REVENUE_SERIES
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ─── Jobs by status (for pie chart) ───────────────────────────────────────────

export function useJobsByStatus(from?: string, to?: string) {
  return useQuery<JobsByStatus[]>({
    queryKey: ['analytics', 'jobs-by-status', from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/jobs-analytics/by-status', { params })
        console.log('[Analytics] Jobs by status loaded:', res.data)
        return asArray<JobsByStatus>(res.data, DEMO_JOB_STATUS)
      } catch (error) {
        console.warn('[Analytics] Failed to fetch jobs by status, using demo data:', error)
        return DEMO_JOB_STATUS
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ─── Technician leaderboard ────────────────────────────────────────────────────

export function useTechLeaderboard(limit = 20, from?: string, to?: string) {
  return useQuery<TechLeaderboard[]>({
    queryKey: ['analytics', 'tech-leaderboard', limit, from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string | number> = { limit }
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/technician-metrics/leaderboard', { params })
        console.log('[Analytics] Technician leaderboard loaded:', res.data)
        return asArray<TechLeaderboard>(res.data, DEMO_LEADERBOARD)
      } catch (error) {
        console.warn('[Analytics] Failed to fetch technician leaderboard, using demo data:', error)
        return DEMO_LEADERBOARD.slice(0, limit)
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// ─── Customer acquisition ──────────────────────────────────────────────────────

export function useCustomerAcquisition(from?: string, to?: string) {
  return useQuery<CustomerAcquisition[]>({
    queryKey: ['analytics', 'customer-acquisition', from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/customer-analytics/acquisition-sources', { params })
        console.log('[Analytics] Customer acquisition loaded:', res.data)
        return asArray<CustomerAcquisition>(res.data, DEMO_CUSTOMER_ACQUISITION)
      } catch (error) {
        console.warn('[Analytics] Failed to fetch customer acquisition, using demo data:', error)
        return DEMO_CUSTOMER_ACQUISITION
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ─── Revenue by category ───────────────────────────────────────────────────────

export function useRevenueByCategory(from?: string, to?: string) {
  return useQuery<RevenueByCategory[]>({
    queryKey: ['analytics', 'revenue-by-category', from, to],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (from) params.from = from
        if (to) params.to = to
        const res = await api.get('/analytics/revenue/by-category', { params })
        console.log('[Analytics] Revenue by category loaded:', res.data)
        return asArray<RevenueByCategory>(res.data, DEMO_REVENUE_CATEGORY)
      } catch (error) {
        console.warn('[Analytics] Failed to fetch revenue by category, using demo data:', error)
        return DEMO_REVENUE_CATEGORY
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

async function getRevenueAgentEndpoint<T>(path: string, params: Record<string, string | number> | undefined, fallback: T): Promise<T> {
  try {
    const res = await api.get(`/analytics/revenue-agent${path}`, { params })
    console.log(`[Analytics] Revenue agent ${path} loaded:`, res.data)
    if (Array.isArray(fallback)) {
      return asArray(res.data, fallback) as T
    }
    return asRecord(res.data, fallback as Extract<T, Record<string, unknown>>)
  } catch (error) {
    console.warn(`[Analytics] Failed to fetch revenue agent ${path}, using defaults:`, error)
    return fallback
  }
}

const EMPTY_AGENT_SUMMARY: RevenueAgentSummary = {
  revenue_accuracy: 0,
  revenue_mean_error: 0,
  demand_accuracy: 0,
  utilization_accuracy: 0,
  action_success_rate: 0,
  pricing_impact: 0,
  sample_size: 0,
}

export function useRevenueAgentSummary() {
  return useQuery<RevenueAgentSummary>({
    queryKey: ['analytics', 'revenue-agent', 'summary'],
    queryFn: () => getRevenueAgentEndpoint<RevenueAgentSummary>('/summary', undefined, EMPTY_AGENT_SUMMARY),
    refetchInterval: 30000,
  })
}

export function useRevenueAgentTrends(limit = 14) {
  return useQuery<RevenueAgentTrendPoint[]>({
    queryKey: ['analytics', 'revenue-agent', 'trends', limit],
    queryFn: () => getRevenueAgentEndpoint<RevenueAgentTrendPoint[]>('/trends', { limit }, []),
    refetchInterval: 30000,
  })
}

export function useRevenueAgentLogs(limit = 10) {
  return useQuery<RevenueAgentLog[]>({
    queryKey: ['analytics', 'revenue-agent', 'logs', limit],
    queryFn: () => getRevenueAgentEndpoint<RevenueAgentLog[]>('/logs', { limit }, []),
    refetchInterval: 30000,
  })
}

// ─── AI Revenue Recommendations ───────────────────────────────────────────────

export function useRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: ['analytics', 'recommendations'],
    queryFn: async () => {
      try {
        const res = await api.get('/analytics/recommendations')
        console.log('[Analytics] Recommendations loaded:', res.data)
        return asArray<Recommendation>(res.data, [])
      } catch (error) {
        console.warn('[Analytics] Failed to fetch recommendations:', error)
        return []
      }
    },
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
