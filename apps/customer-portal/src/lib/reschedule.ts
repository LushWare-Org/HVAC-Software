/**
 * Reschedule vocabulary — local mirror of `packages/types/src/reschedule.ts`.
 *
 * The portal deliberately does not depend on `@tscrm/types` (same reasoning as
 * the `featureEnabled` mirror in `lib/format.ts`), so the small amount of shared
 * vocabulary the UI needs lives here.
 *
 * **Keep in sync with `packages/types/src/reschedule.ts`** — job-service
 * validates against that file, so a divergence here produces slots the API
 * rejects. Only the window bounds and the timezone helper matter for
 * correctness; the labels are presentation.
 */

export type RescheduleWindowKey = 'morning' | 'afternoon' | 'evening'

export const RESCHEDULE_WINDOWS: Record<
  RescheduleWindowKey,
  { label: string; range: string; startHour: number; endHour: number }
> = {
  morning: { label: 'Morning', range: '8:00 AM – 12:00 PM', startHour: 8, endHour: 12 },
  afternoon: { label: 'Afternoon', range: '12:00 – 4:00 PM', startHour: 12, endHour: 16 },
  evening: { label: 'Evening', range: '4:00 – 7:00 PM', startHour: 16, endHour: 19 },
}

/** Reasons a customer may give. The staff list lives in the admin dashboard. */
export const CUSTOMER_REASONS = ['CUSTOMER_UNAVAILABLE', 'ACCESS_ISSUE', 'OTHER'] as const

export const CUSTOMER_REASON_LABELS: Record<string, string> = {
  CUSTOMER_UNAVAILABLE: "I'm not available then",
  ACCESS_ISSUE: "There's an access problem at the property",
  OTHER: 'Something else',
}

/** Job statuses on which a customer may ask to reschedule. */
export const CUSTOMER_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD']

/**
 * Resolve "this calendar date, at this hour, in this timezone" to a UTC instant.
 * Measuring the zone offset at the instant in question — rather than assuming
 * one — is what keeps this correct across DST boundaries.
 */
export function zonedHourToUtc(dateISO: string, hour: number, timeZone: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number)
  const provisional = Date.UTC(y, m - 1, d, hour, 0, 0)

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(provisional))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>

  const shownHour = parts.hour === 24 ? 0 : parts.hour
  const asShown = Date.UTC(parts.year, parts.month - 1, parts.day, shownHour, parts.minute, parts.second)

  return new Date(provisional + (provisional - asShown))
}

/** A window slot spans the whole window — "Tuesday morning" means 8–12. */
export function slotFromWindow(
  dateISO: string,
  windowKey: RescheduleWindowKey,
  timeZone: string,
): { startAt: Date; endAt: Date; window: RescheduleWindowKey } {
  const win = RESCHEDULE_WINDOWS[windowKey]
  return {
    startAt: zonedHourToUtc(dateISO, win.startHour, timeZone),
    endAt: zonedHourToUtc(dateISO, win.endHour, timeZone),
    window: windowKey,
  }
}

/** "Tuesday, Aug 12 · Morning (8:00 AM – 12:00 PM)" — friendlier than the admin form. */
export function formatSlot(startAt: string, endAt: string, window?: string | null): string {
  const s = new Date(startAt)
  const e = new Date(endAt)
  const day = s.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const win = window && window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[window as RescheduleWindowKey]
    : null
  return win ? `${day} · ${win.label} (${t(s)} – ${t(e)})` : `${day} · ${t(s)} – ${t(e)}`
}

/** Local-date formatting for a date input — toISOString() shifts the day west of UTC. */
export function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
