/**
 * The labels used for a job's status and priority, everywhere on the Jobs page:
 * in the rows, in the filter menus, in the summaries. One place, so they always match.
 *
 * Status: a small ring or symbol that shows how far the job has got, plus the word.
 * Priority: a five-segment level meter filled to the level, plus the word (PriorityLabel is the one place to restyle it).
 * Colours come from the theme variables, so light, dark and black all work.
 */
import './jobsTable.css'

const RING = 37.7 // circumference of r=6

interface StatusMeta { label: string; share: number | 'dash'; filled?: boolean; glyph: string }

export const STATUS_META: Record<string, StatusMeta> = {
  PENDING:     { label: 'Pending',     share: 'dash', glyph: '' },
  SCHEDULED:   { label: 'Scheduled',   share: 0.25, glyph: '' },
  EN_ROUTE:    { label: 'En route',    share: 0.5, glyph: '' },
  ON_SITE:     { label: 'On site',     share: 0.75, glyph: '' },
  IN_PROGRESS: { label: 'In progress', share: 1, glyph: 'M6.8 5.4v5.2l4-2.6z' },
  ON_HOLD:     { label: 'On hold',     share: 1, glyph: 'M6.2 5.6v4.8M9.8 5.6v4.8' },
  COMPLETED:   { label: 'Completed',   share: 1, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  INVOICED:    { label: 'Invoiced',    share: 1, glyph: 'M5.6 6.4h4.8M5.6 9.6h3' },
  PAID:        { label: 'Paid',        share: 1, filled: true, glyph: 'M5.3 8.2l1.9 1.9 3.5-4' },
  CANCELLED:   { label: 'Cancelled',   share: 1, glyph: 'M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4' },
}

export const OPEN_STATUSES = ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'ON_HOLD']
export const DONE_STATUSES = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED']

export function statusWord(status: string): string {
  return STATUS_META[status]?.label ?? status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

export function StatusLabel({ status, bare = false }: { status: string; bare?: boolean }) {
  const m = STATUS_META[status] ?? { label: statusWord(status), share: 1, glyph: '' }
  const dash = m.share === 'dash' ? '2.2 2.2' : `${(RING * m.share).toFixed(1)} ${RING}`
  return (
    <span className={`jl jl-status jl-s-${status}${bare ? ' is-bare' : ''}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" className="jl-track" fill={m.filled ? 'currentColor' : 'none'} strokeWidth="1.8" />
        <circle cx="8" cy="8" r="6" className="jl-arc" fill="none" strokeWidth="1.8" strokeDasharray={dash} transform="rotate(-90 8 8)" />
        {m.glyph && <path d={m.glyph} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={m.filled ? 'jl-glyph-on' : 'jl-glyph'} />}
      </svg>
      {m.label}
    </span>
  )
}

interface PriorityMeta { label: string; level: number }

export const PRIORITY_META: Record<string, PriorityMeta> = {
  EMERGENCY: { label: 'Emergency', level: 5 },
  URGENT:    { label: 'Urgent',    level: 4 },
  HIGH:      { label: 'High',      level: 3 },
  NORMAL:    { label: 'Normal',    level: 2 },
  LOW:       { label: 'Low',       level: 1 },
}
export const PRIORITIES = ['EMERGENCY', 'URGENT', 'HIGH', 'NORMAL', 'LOW']
export const PRIORITY_RANK: Record<string, number> = { EMERGENCY: 0, URGENT: 1, HIGH: 2, NORMAL: 3, LOW: 4 }

export function priorityWord(priority: string): string {
  return PRIORITY_META[priority]?.label ?? priority.toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

/** The priority label. Restyle here and every table and filter follows. */
export function PriorityLabel({ priority }: { priority?: string | null }) {
  const key = (priority ?? 'NORMAL').toUpperCase()
  const m = PRIORITY_META[key] ?? { label: priorityWord(key), level: 2 }
  return (
    <span className={`jl jl-pri jl-p-${key}`}>
      <span className="jl-meter" aria-hidden="true">
        {[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= m.level ? 'on' : ''} />)}
      </span>
      {m.label}
    </span>
  )
}
