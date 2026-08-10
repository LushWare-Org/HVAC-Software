import { CalendarClock } from 'lucide-react'
import type { RescheduleStateValue } from '../../types/api'

/**
 * Reads the same `Job.rescheduleState` column as the admin badge, worded from
 * the customer's side. Amber means we are waiting on them — which is
 * `AWAITING_CUSTOMER` here, the mirror of the admin's `AWAITING_ADMIN`.
 *
 * Returns null when there is no open request, so it is safe to place
 * unconditionally on any job row.
 */
const META: Record<RescheduleStateValue, { label: string; short: string; color: string; bg: string }> = {
  AWAITING_CUSTOMER: {
    label: 'Pick a time', short: 'Pick a time',
    color: '#B45309', bg: 'rgba(217,119,6,0.12)',
  },
  AWAITING_ADMIN: {
    label: 'Reschedule requested', short: 'Requested',
    color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)',
  },
  READY_TO_APPLY: {
    label: 'Confirming your time', short: 'Confirming',
    color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)',
  },
}

export default function RescheduleBadge({ state, size = 'md' }: {
  state?: RescheduleStateValue | null
  size?: 'sm' | 'md'
}) {
  if (!state) return null
  const meta = META[state]
  if (!meta) return null

  return (
    <span
      title={meta.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: size === 'sm' ? 9.5 : 10.5, fontWeight: 700,
        color: meta.color, background: meta.bg,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <CalendarClock size={size === 'sm' ? 9 : 10} />
      {size === 'sm' ? meta.short : meta.label}
    </span>
  )
}
