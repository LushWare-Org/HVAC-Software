/**
 * useAnalytics.ts — Hooks for the Analytics page charts and leaderboard
 * Routes → nginx /api/analytics/ → analytics-service :3006
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
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

async function getRevenueAgentEndpoint<T>(path: string, params: Record<string, string | number> | undefined, fallback: T): Promise<T> {
  try {
    const res = await api.get(`/analytics/revenue-agent${path}`, { params })
    return res.data
  } catch {
    try {
      const res = await axios.get(`/revenue-agent-api/analytics${path}`, { params })
      return res.data
    } catch {
      return fallback
    }
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
      const res = await api.get('/analytics/recommendations')
      return res.data
    },
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
  })
}
