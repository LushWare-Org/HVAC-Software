/**
 * Status labels for the portal's tables and filters: a small ring or symbol that shows how far
 * a visit, quote or invoice has got, plus the word. One place, so rows and filters always match.
 */
import './rowTable.css'

const RING = 37.7 // circumference of r=6

interface Meta { label: string; share: number | 'dash'; filled?: boolean; glyph: string }

export const STATUS_META: Record<string, Meta> = {
  PENDING:        { label: 'Pending',        share: 'dash', glyph: '' },
  SCHEDULED:      { label: 'Scheduled',      share: 0.25, glyph: '' },
  EN_ROUTE:       { label: 'En route',       share: 0.5, glyph: '' },
  ON_SITE:        { label: 'On site',        share: 0.75, glyph: '' },
  IN_PROGRESS:    { label: 'In progress',    share: 1, glyph: 'M6.8 5.4v5.2l4-2.6z' },
  ON_HOLD:        { label: 'On hold',        share: 1, glyph: 'M6.2 5.6v4.8M9.8 5.6v4.8' },
  COMPLETED:      { label: 'Completed',      share: 1, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  INVOICED:       { label: 'Invoiced',       share: 1, glyph: 'M5.6 6.4h4.8M5.6 9.6h3' },
  PAID:           { label: 'Paid',           share: 1, filled: true, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  CANCELLED:      { label: 'Cancelled',      share: 1, glyph: 'M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4' },
  // Quotes and invoices
  DRAFT:          { label: 'Draft',          share: 'dash', glyph: '' },
  SENT:           { label: 'Waiting for you', share: 0.5, glyph: '' },
  VIEWED:         { label: 'Viewed',         share: 0.75, glyph: '' },
  ACCEPTED:       { label: 'Accepted',       share: 1, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  DECLINED:       { label: 'Declined',       share: 1, glyph: 'M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4' },
  CONVERTED:      { label: 'Converted',      share: 1, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  EXPIRED:        { label: 'Expired',        share: 1, glyph: 'M8 5.2v3.2l2 1.2' },
  PARTIALLY_PAID: { label: 'Part paid',      share: 0.5, glyph: '' },
  OVERDUE:        { label: 'Overdue',        share: 1, glyph: 'M8 5.2v3.4M8 10.6v.1' },
  VOID:           { label: 'Void',           share: 1, glyph: 'M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4' },
}

export const OPEN_JOB_STATUSES = ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'ON_HOLD']
export const DONE_JOB_STATUSES = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED']

export function statusWord(status: string): string {
  return STATUS_META[status]?.label ?? status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

/** `label` replaces the word when a table names a status differently (an invoice that is SENT is "Unpaid"). */
export function StatusLabel({ status, bare = false, label }: { status: string; bare?: boolean; label?: string }) {
  const key = String(status || '').toUpperCase()
  const m = STATUS_META[key] ?? { label: statusWord(key), share: 1, glyph: '' }
  const dash = m.share === 'dash' ? '2.2 2.2' : `${(RING * m.share).toFixed(1)} ${RING}`
  return (
    <span className={`jl jl-status jl-s-${key}${bare ? ' is-bare' : ''}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" className="jl-track" fill={m.filled ? 'currentColor' : 'none'} strokeWidth="1.8" />
        <circle cx="8" cy="8" r="6" className="jl-arc" fill="none" strokeWidth="1.8" strokeDasharray={dash} transform="rotate(-90 8 8)" />
        {m.glyph && <path d={m.glyph} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={m.filled ? 'jl-glyph-on' : 'jl-glyph'} />}
      </svg>
      {label ?? m.label}
    </span>
  )
}
