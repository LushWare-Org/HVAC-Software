/**
 * useAnalytics.ts — Hooks for the Analytics page charts and leaderboard
 * Routes → nginx /api/analytics/ → analytics-service :3006
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
} from '../types/api'

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

// ─── KPI summary ──────────────────────────────────────────────────────────────

export function useAnalyticsKpis(from?: string, to?: string) {
  return useQuery<DashboardKpis>({
    queryKey: ['analytics', 'kpis', from, to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/dashboard/kpis', { params })
      return res.data
    },
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
      const params: Record<string, string> = { granularity }
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/revenue/series', { params })
      return res.data
    },
  })
}

// ─── Jobs by status (for pie chart) ───────────────────────────────────────────

export function useJobsByStatus(from?: string, to?: string) {
  return useQuery<JobsByStatus[]>({
    queryKey: ['analytics', 'jobs-by-status', from, to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/jobs-analytics/by-status', { params })
      return res.data
    },
  })
}

// ─── Technician leaderboard ────────────────────────────────────────────────────

export function useTechLeaderboard(limit = 20, from?: string, to?: string) {
  return useQuery<TechLeaderboard[]>({
    queryKey: ['analytics', 'tech-leaderboard', limit, from, to],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit }
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/technician-metrics/leaderboard', { params })
      return res.data
    },
  })
}

// ─── Customer acquisition ──────────────────────────────────────────────────────

export function useCustomerAcquisition(from?: string, to?: string) {
  return useQuery<CustomerAcquisition[]>({
    queryKey: ['analytics', 'customer-acquisition', from, to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/customer-analytics/acquisition-sources', { params })
      return res.data
    },
  })
}

// ─── Revenue by category ───────────────────────────────────────────────────────

export function useRevenueByCategory(from?: string, to?: string) {
  return useQuery<RevenueByCategory[]>({
    queryKey: ['analytics', 'revenue-by-category', from, to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await api.get('/analytics/revenue/by-category', { params })
      return res.data
    },
  })
}
