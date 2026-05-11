/**
 * Display helpers for the admin dashboard.
 *
 * Single source of truth for the dashboard's number / status formatting so
 * pages don't reinvent magic divisions or status-case heuristics.
 *
 * Money model (verified end-to-end against analytics-service queries on
 * 2026-05-08): every monetary number returned by the backend — Job revenue,
 * Invoice.total, Payment.amount, dashboard KPI revenue — is in **dollars**
 * (Prisma Decimal(10,2) → string → parseFloat → number). NEVER cents.
 */

/** "$45,320.00" — 2-decimal dollar formatter. Use for invoices, payments, expenses. */
export function formatDollars(value: number | string | null | undefined, opts: { decimals?: number } = {}): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (!Number.isFinite(n)) return '$0.00'
  const decimals = opts.decimals ?? 2
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

/** "$45.3k" — compact dollar formatter for charts. Input is dollars. */
export function formatRevenueK(dollars: number | string | null | undefined, decimals = 1): string {
  const n = typeof dollars === 'string' ? parseFloat(dollars) : (dollars ?? 0)
  if (!Number.isFinite(n)) return '$0'
  if (Math.abs(n) < 1000) return `$${Math.round(n)}`
  if (Math.abs(n) < 1_000_000) return `$${(n / 1000).toFixed(decimals)}k`
  return `$${(n / 1_000_000).toFixed(decimals)}M`
}

/** Numeric value (no $) in $k for chart axes / data points. Input is dollars. */
export function dollarsToK(dollars: number | string | null | undefined, decimals = 1): number {
  const n = typeof dollars === 'string' ? parseFloat(dollars) : (dollars ?? 0)
  if (!Number.isFinite(n)) return 0
  const factor = 10 ** decimals
  return Math.round((n / 1000) * factor) / factor
}

/**
 * "EN_ROUTE" → "En route". Use for badge text and status display.
 * Backend is the source of truth for status casing — always UPPER_SNAKE_CASE
 * (e.g. PENDING, EN_ROUTE, ON_SITE, PARTIALLY_PAID). This helper produces a
 * human-readable label without reintroducing lowercase keys at the data layer.
 */
export function humanizeStatus(value: string | null | undefined): string {
  if (!value) return '—'
  const lower = value.replace(/_/g, ' ').toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** Normalize an arbitrary backend status string to UPPER_SNAKE_CASE for map lookups. */
export function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toUpperCase()
}
