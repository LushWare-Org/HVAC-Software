/**
 * Company-aware display formatters.
 *
 * Module-level state is set once by CompanyContext after login. Plain
 * functions (not hooks) so PDF builders and non-component helpers can
 * format money/dates too. Defaults keep everything rendering in USD /
 * Eastern time until settings load (brief first paint only).
 */

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
export function formatMoneyCompact(value: number | string | null | undefined): string {
  const n = toNumber(value)
  const symbol = formatMoney(0, { decimals: 0 }).replace(/[\d.,\s]/g, '') || '$'
  if (Math.abs(n) < 1000) return `${symbol}${Math.round(n)}`
  if (Math.abs(n) < 1_000_000) return `${symbol}${(n / 1000).toFixed(1)}k`
  return `${symbol}${(n / 1_000_000).toFixed(1)}M`
}

/** Date (default "Jul 6, 2026") rendered in the tenant's timezone. */
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
