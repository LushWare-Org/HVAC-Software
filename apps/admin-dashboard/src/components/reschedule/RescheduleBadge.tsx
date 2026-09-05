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
    color: 'var(--amber)', bg: 'color-mix(in srgb, var(--amber) 15%, transparent)',
  },
  AWAITING_CUSTOMER: {
    label: 'Reschedule · awaiting customer', short: 'Reschedule',
    color: 'var(--blue)', bg: 'color-mix(in srgb, var(--blue) 15%, transparent)',
  },
  READY_TO_APPLY: {
    label: 'Ready to apply', short: 'Ready',
    color: 'var(--green)', bg: 'color-mix(in srgb, var(--green) 15%, transparent)',
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
