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

// ── Tenant currency state (set once by useCompanySettings after login) ──────
let activeCurrency = 'USD'
let activeTimezone = 'America/New_York'

export function setActiveCompanyFormat(opts: { currency: string; timezone: string }): void {
  activeCurrency = opts.currency || 'USD'
  activeTimezone = opts.timezone || 'America/New_York'
}

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** "$1,250.00" | "Rs 125,000.00" — tenant-currency money formatter. */
export function formatMoney(
  value: number | string | null | undefined,
  opts: { decimals?: number } = {},
): string {
  const decimals = opts.decimals ?? 2
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: activeCurrency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(toNumber(value))
  } catch {
    return `$${toNumber(value).toFixed(decimals)}`
  }
}

/** "$45.3k" / "Rs 45.3k" for compact chart/stat labels. */
export function formatMoneyCompact(value: number | string | null | undefined, decimals = 1): string {
  const n = toNumber(value)
  const symbol = formatMoney(0, { decimals: 0 }).replace(/[\d.,\s]/g, '') || '$'
  if (Math.abs(n) < 1000) return `${symbol}${Math.round(n)}`
  if (Math.abs(n) < 1_000_000) return `${symbol}${(n / 1000).toFixed(decimals)}k`
  return `${symbol}${(n / 1_000_000).toFixed(decimals)}M`
}

/** Date rendered in the tenant's timezone (default "Jul 6, 2026"). */
export function formatDateTz(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: activeTimezone,
    ...opts,
  }).format(date)
}

/** Missing key = enabled; only explicit false disables (mirrors @tscrm/types). */
export function featureEnabled(features: Record<string, unknown> | undefined | null, key: string): boolean {
  if (!features || typeof features !== 'object') return true
  return features[key] !== false
}

/** "$45,320.00" — 2-decimal money formatter (currency-aware; name kept for back-compat). */
export function formatDollars(value: number | string | null | undefined, opts: { decimals?: number } = {}): string {
  return formatMoney(value, opts)
}

/** "$45.3k" — compact money formatter for charts (currency-aware). Input is major units. */
export function formatRevenueK(dollars: number | string | null | undefined, decimals = 1): string {
  return formatMoneyCompact(dollars, decimals)
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
