/**
 * useBanditDashboard.ts — React Query hooks for the Bandit Observability Dashboard.
 *
 * All hooks attempt the bandit API via two paths:
 *   1. /analytics/bandit-api/<endpoint>   (nginx proxy → Flask bandit API on :8766)
 *   2. /bandit-api/<endpoint>             (direct dev fallback)
 *
 * If both fail, they return safe empty defaults so the dashboard renders
 * gracefully without data rather than crashing.
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type {
  BanditAgent,
  BanditSummary,
  BanditRewardPoint,
  BanditActionRow,
  BanditExplorationData,
  BanditRevenueImpact,
  BanditContextRow,
  BanditRegret,
} from '../types/api'

// ─── API helper ───────────────────────────────────────────────────────────────

// Vite's SPA fallback returns 200 + HTML for unknown paths, so we must
// validate the response looks like real JSON data before using it.
function isJsonData<T>(data: unknown, fallback: T): data is T {
  if (Array.isArray(fallback)) return Array.isArray(data)
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

async function getBanditEndpoint<T>(
  path: string,
  params: Record<string, string | number | undefined> | undefined,
  fallback: T,
): Promise<T> {
  const cleanParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
    : undefined

  // Try via analytics-service proxy first (production path)
  try {
    const res = await axios.get(`/analytics/bandit-api${path}`, { params: cleanParams })
    if (isJsonData(res.data, fallback)) return res.data
  } catch { /* fall through */ }

  // Fall back to direct standalone server (dev path)
  try {
    const res = await axios.get(`/bandit-api${path}`, { params: cleanParams })
    if (isJsonData(res.data, fallback)) return res.data
  } catch { /* fall through */ }

  return fallback
}

// ─── Empty defaults ───────────────────────────────────────────────────────────

const EMPTY_SUMMARY: BanditSummary = {
  avg_reward: 0,
  exploration_rate: 0,
  top_action: null,
  revenue_uplift: 0,
  sample_size: 0,
}

const EMPTY_EXPLORATION: BanditExplorationData = {
  overall_rate: 0,
  explored: 0,
  exploited: 0,
  total: 0,
  trend: [],
}

const EMPTY_REVENUE_IMPACT: BanditRevenueImpact = {
  avg_uplift: 0,
  total_uplift: 0,
  sample_size: 0,
  trend: [],
}

const EMPTY_REGRET: BanditRegret = {
  total_regret: 0,
  avg_regret: 0,
  sample_size: 0,
  regret_by_agent: {},
  trend: [],
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Dashboard header KPI cards — avg reward, exploration rate, top action, uplift. */
export function useBanditSummary(agent?: BanditAgent) {
  return useQuery<BanditSummary>({
    queryKey: ['bandit', 'summary', agent],
    queryFn: () =>
      getBanditEndpoint<BanditSummary>('/bandit/summary', { agent }, EMPTY_SUMMARY),
    refetchInterval: 30_000,
  })
}

/** Learning curve — average reward grouped by day. */
export function useBanditRewardTrend(agent?: BanditAgent, days = 30) {
  return useQuery<BanditRewardPoint[]>({
    queryKey: ['bandit', 'reward-trend', agent, days],
    queryFn: () =>
      getBanditEndpoint<BanditRewardPoint[]>('/bandit/reward-trend', { agent, days }, []),
    refetchInterval: 30_000,
  })
}

/** Action frequency distribution for the pie/bar chart. */
export function useBanditActions(agent?: BanditAgent) {
  return useQuery<BanditActionRow[]>({
    queryKey: ['bandit', 'actions', agent],
    queryFn: () =>
      getBanditEndpoint<BanditActionRow[]>('/bandit/actions', { agent }, []),
    refetchInterval: 30_000,
  })
}

/** Exploration vs exploitation ratio (aggregate + daily trend). */
export function useBanditExploration(agent?: BanditAgent, days = 30) {
  return useQuery<BanditExplorationData>({
    queryKey: ['bandit', 'exploration', agent, days],
    queryFn: () =>
      getBanditEndpoint<BanditExplorationData>(
        '/bandit/exploration',
        { agent, days },
        EMPTY_EXPLORATION,
      ),
    refetchInterval: 30_000,
  })
}

/** Revenue uplift: actual_revenue − baseline_revenue. */
export function useBanditRevenueImpact(agent?: BanditAgent, days = 30) {
  return useQuery<BanditRevenueImpact>({
    queryKey: ['bandit', 'revenue-impact', agent, days],
    queryFn: () =>
      getBanditEndpoint<BanditRevenueImpact>(
        '/bandit/revenue-impact',
        { agent, days },
        EMPTY_REVENUE_IMPACT,
      ),
    refetchInterval: 30_000,
  })
}

/** Per (state_key, action) average reward — the learned policy table. */
export function useBanditContextPerformance(agent?: BanditAgent) {
  return useQuery<BanditContextRow[]>({
    queryKey: ['bandit', 'context-performance', agent],
    queryFn: () =>
      getBanditEndpoint<BanditContextRow[]>('/bandit/context-performance', { agent }, []),
    refetchInterval: 60_000,
  })
}

/** Regret analysis — opportunity cost vs empirical oracle. */
export function useBanditRegret(agent?: BanditAgent) {
  return useQuery<BanditRegret>({
    queryKey: ['bandit', 'regret', agent],
    queryFn: () =>
      getBanditEndpoint<BanditRegret>('/bandit/regret', { agent }, EMPTY_REGRET),
    refetchInterval: 60_000,
  })
}
