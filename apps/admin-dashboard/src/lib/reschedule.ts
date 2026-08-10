/**
 * Reschedule vocabulary — local mirror of `packages/types/src/reschedule.ts`.
 *
 * The frontends deliberately do not depend on `@tscrm/types` (see the
 * `featureEnabled` mirror in `lib/format.ts` for the same pattern), so the small
 * amount of shared vocabulary the UI needs is duplicated here instead.
 *
 * **Keep in sync with `packages/types/src/reschedule.ts`** — the backend
 * validates against that file, so a divergence here produces slots the API
 * rejects. Only the window bounds and the timezone helper actually matter for
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

/** Reasons staff may give. The customer-side list lives in the portal. */
export const STAFF_REASONS = [
  'PARTS_DELAY',
  'TECH_UNAVAILABLE',
  'WEATHER',
  'EMERGENCY_BUMP',
  'CAPACITY',
  'OTHER',
] as const

export const RESCHEDULE_REASON_LABELS: Record<string, string> = {
  PARTS_DELAY: 'Parts delay',
  TECH_UNAVAILABLE: 'Technician unavailable',
  WEATHER: 'Weather',
  EMERGENCY_BUMP: 'Bumped by an emergency job',
  CAPACITY: 'No capacity that day',
  CUSTOMER_UNAVAILABLE: "Customer wasn't available",
  ACCESS_ISSUE: 'Access to the property',
  OTHER: 'Other',
}

/** Job statuses on which staff may open a reschedule request. */
export const STAFF_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD', 'EN_ROUTE']

/**
 * Resolve "this calendar date, at this hour, in this timezone" to a UTC instant.
 *
 * Build a provisional instant by pretending the wall-clock time is UTC, ask Intl
 * what that instant actually reads as in the target zone, and correct by the
 * difference. Measuring the offset at the instant in question rather than
 * assuming one is what makes this correct across DST boundaries.
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

/**
 * Build a concrete UTC interval from a calendar date plus a named window.
 * Spans the whole window on purpose — "Tuesday morning" means 8–12, and the
 * calendar should record what the customer actually agreed to.
 */
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

/** "Tue, Aug 12 · Morning (8:00 AM – 12:00 PM)", or an exact range if unwindowed. */
export function formatSlot(startAt: string, endAt: string, window?: string | null): string {
  const s = new Date(startAt)
  const e = new Date(endAt)
  const day = s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const win = window && window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[window as RescheduleWindowKey]
    : null
  return win ? `${day} · ${win.label} (${t(s)} – ${t(e)})` : `${day} · ${t(s)} – ${t(e)}`
}
