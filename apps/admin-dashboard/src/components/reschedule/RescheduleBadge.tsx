import { CalendarClock, AlertTriangle } from 'lucide-react'
import type { RescheduleStateValue } from '../../types/api'

/**
 * Status pill for an open reschedule.
 *
 * Reads only `Job.rescheduleState` — a field every job-shaped query already
 * returns — so this is safe to drop onto any surface without adding a fetch.
 * Returns null when there is no open request, so it can be placed
 * unconditionally.
 *
 * Amber always means "you are the holdup", which lets a dispatcher scan a list
 * and pick out their own work without reading labels. Red means nobody has
 * replied in over five days.
 */
const META: Record<RescheduleStateValue, { label: string; short: string; color: string; bg: string }> = {
  AWAITING_ADMIN: {
    label: 'Reschedule · needs reply', short: 'Needs reply',
    color: '#B45309', bg: 'rgba(217,119,6,0.12)',
  },
  AWAITING_CUSTOMER: {
    label: 'Reschedule · awaiting customer', short: 'Reschedule',
    color: '#1D4ED8', bg: 'rgba(37,99,235,0.12)',
  },
  READY_TO_APPLY: {
    label: 'Ready to apply', short: 'Ready',
    color: '#047857', bg: 'rgba(5,150,105,0.12)',
  },
}

export default function RescheduleBadge({
  state, isStale = false, size = 'md',
}: {
  state?: RescheduleStateValue | null
  isStale?: boolean
  size?: 'sm' | 'md'
}) {
  if (!state) return null
  const meta = META[state]
  if (!meta) return null

  const color = isStale ? '#B91C1C' : meta.color
  const bg = isStale ? 'rgba(220,38,38,0.12)' : meta.bg
  const Icon = isStale ? AlertTriangle : CalendarClock

  return (
    <span
      title={isStale ? `${meta.label} — no reply in over 5 days` : meta.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: size === 'sm' ? 9.5 : 10.5, fontWeight: 700,
        color, background: bg,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <Icon size={size === 'sm' ? 9 : 10} />
      {size === 'sm' ? meta.short : meta.label}
    </span>
  )
}
