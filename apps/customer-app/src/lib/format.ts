/** Display helpers shared across screens. */

/** "EN_ROUTE" → "En route". Backend statuses are always UPPER_SNAKE_CASE. */
export function humanizeStatus(value: string | null | undefined): string {
  if (!value) return '—'
  const lower = value.replace(/_/g, ' ').toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** "Aug 19, 2026" — or a plain hint when a job was never scheduled. */
export function formatDate(iso?: string | null, fallback = 'Not scheduled'): string {
  if (!iso) return fallback
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Aug 19, 2026 · 9:00 AM" for a scheduled appointment. */
export function formatDateTime(iso?: string | null, fallback = 'Not scheduled'): string {
  if (!iso) return fallback
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return fallback
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}

/** "Morning 8:00 AM – 12:00 PM" for a visit booked as an arrival window; '' when there is none. */
export function formatWindow(start?: string | null, end?: string | null): string {
  if (!start || !end) return ''
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return ''
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const h = a.getHours()
  const name = h === 8 ? 'Morning' : h === 12 ? 'Afternoon' : h === 16 ? 'Evening' : ''
  return `${name ? `${name} ` : ''}${t(a)} – ${t(b)}`
}

/** The visit's date plus its time, or its arrival window when the customer booked one. */
export function formatVisit(job: {
  scheduledStart?: string | null
  timeMode?: string | null
  windowStart?: string | null
  windowEnd?: string | null
}, fallback = 'Not scheduled'): string {
  if (!job.scheduledStart) return fallback
  if (job.timeMode === 'WINDOW' && job.windowStart && job.windowEnd) {
    return `${formatDate(job.scheduledStart)} · ${formatWindow(job.windowStart, job.windowEnd)}`
  }
  return formatDateTime(job.scheduledStart, fallback)
}

/** Tenant currency is not resolved in the app yet; show the code the record carries. */
export function formatMoney(
  value: string | number | null | undefined,
  currency?: string | null,
): string {
  const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  if (!Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${currency ?? ''} ${n.toFixed(2)}`.trim()
  }
}
