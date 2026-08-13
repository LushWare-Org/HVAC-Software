// ============================================================
// Rescheduling — shared vocabulary
//
// Imported by job-service (owns the negotiation), comms-service (delivers the
// notifications), and both frontends. Anything both sides of the wire must
// agree on lives here; anything app-specific (badge colours, copy) does not.
//
// Design: docs/superpowers/specs/2026-08-05-job-rescheduling-design.md
// ============================================================

/** Which side of the negotiation acted. */
export enum RescheduleActor {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

/** How a request was opened: with candidate slots, or as an open question. */
export enum RescheduleMode {
  PROPOSE_SLOTS = 'PROPOSE_SLOTS',
  OPEN_ASK = 'OPEN_ASK',
}

/** Lifecycle of one round of the negotiation. Counters append a new row. */
export enum RescheduleStatus {
  AWAITING_RESPONSE = 'AWAITING_RESPONSE',
  SLOT_PICKED = 'SLOT_PICKED',
  DECLINED = 'DECLINED',
  SUPERSEDED = 'SUPERSEDED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
}

/**
 * Denormalized onto Job — whose move it is. Null means no open request.
 * This is the column that lets every job list render a status badge with no
 * join and no extra query.
 */
export enum RescheduleState {
  AWAITING_CUSTOMER = 'AWAITING_CUSTOMER',
  AWAITING_ADMIN = 'AWAITING_ADMIN',
  READY_TO_APPLY = 'READY_TO_APPLY',
}

export enum RescheduleReason {
  PARTS_DELAY = 'PARTS_DELAY',
  TECH_UNAVAILABLE = 'TECH_UNAVAILABLE',
  WEATHER = 'WEATHER',
  EMERGENCY_BUMP = 'EMERGENCY_BUMP',
  CAPACITY = 'CAPACITY',
  CUSTOMER_UNAVAILABLE = 'CUSTOMER_UNAVAILABLE',
  ACCESS_ISSUE = 'ACCESS_ISSUE',
  OTHER = 'OTHER',
}

/**
 * Each side only ever sees its own reasons, plus OTHER. Required on both sides:
 * an optional analytics field is an empty analytics field.
 */
export const STAFF_REASONS: RescheduleReason[] = [
  RescheduleReason.PARTS_DELAY,
  RescheduleReason.TECH_UNAVAILABLE,
  RescheduleReason.WEATHER,
  RescheduleReason.EMERGENCY_BUMP,
  RescheduleReason.CAPACITY,
  RescheduleReason.OTHER,
];

export const CUSTOMER_REASONS: RescheduleReason[] = [
  RescheduleReason.CUSTOMER_UNAVAILABLE,
  RescheduleReason.ACCESS_ISSUE,
  RescheduleReason.OTHER,
];

export const RESCHEDULE_REASON_LABELS: Record<RescheduleReason, string> = {
  [RescheduleReason.PARTS_DELAY]: 'Parts delay',
  [RescheduleReason.TECH_UNAVAILABLE]: 'Technician unavailable',
  [RescheduleReason.WEATHER]: 'Weather',
  [RescheduleReason.EMERGENCY_BUMP]: 'Bumped by an emergency job',
  [RescheduleReason.CAPACITY]: 'No capacity that day',
  [RescheduleReason.CUSTOMER_UNAVAILABLE]: "I'm not available",
  [RescheduleReason.ACCESS_ISSUE]: 'Access to the property',
  [RescheduleReason.OTHER]: 'Other',
};

/**
 * Arrival windows. Matches WINDOWS in the customer portal's BookServiceModal so
 * a reschedule speaks the same language as the original booking.
 */
export const RESCHEDULE_WINDOWS = {
  morning: { label: 'Morning', range: '8:00 AM – 12:00 PM', startHour: 8, endHour: 12 },
  afternoon: { label: 'Afternoon', range: '12:00 – 4:00 PM', startHour: 12, endHour: 16 },
  evening: { label: 'Evening', range: '4:00 – 7:00 PM', startHour: 16, endHour: 19 },
} as const;

export type RescheduleWindowKey = keyof typeof RESCHEDULE_WINDOWS;

/** Job statuses on which each side may open a request. */
export const STAFF_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD', 'EN_ROUTE'] as const;
export const CUSTOMER_RESCHEDULABLE_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD'] as const;

/** Fallback appointment length when a job carries no estimatedDurationMins. */
export const DEFAULT_SLOT_DURATION_MINS = 120;

/**
 * Build a concrete UTC interval from a calendar date plus a named window.
 *
 * `dateISO` is a bare calendar date ("2026-08-12") as produced by a native date
 * input — it carries no timezone. The window's hours are interpreted in
 * `timeZone` (the company's timezone), so "Tuesday morning" means 8am where the
 * customer lives rather than 8am UTC.
 *
 * The interval spans the whole window on purpose. A customer who agreed to
 * "Tuesday morning" agreed to 8–12, not to 9:00 sharp, and the calendar should
 * say what they actually agreed to.
 */
export function slotFromWindow(
  dateISO: string,
  windowKey: RescheduleWindowKey,
  timeZone: string,
): { startAt: Date; endAt: Date; window: RescheduleWindowKey } {
  const win = RESCHEDULE_WINDOWS[windowKey];
  return {
    startAt: zonedHourToUtc(dateISO, win.startHour, timeZone),
    endAt: zonedHourToUtc(dateISO, win.endHour, timeZone),
    window: windowKey,
  };
}

/**
 * Resolve "this calendar date, at this hour, in this timezone" to a UTC instant.
 *
 * Done without a date library: build a provisional instant by pretending the
 * wall-clock time is UTC, ask Intl what that instant actually reads as in the
 * target zone, and correct by the difference. Measuring the offset at the
 * instant in question rather than assuming one is what makes this correct
 * across DST boundaries.
 */
export function zonedHourToUtc(dateISO: string, hour: number, timeZone: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const provisional = Date.UTC(y, m - 1, d, hour, 0, 0);

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt
      .formatToParts(new Date(provisional))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;

  // hour12:false renders midnight as 24 in some ICU versions.
  const shownHour = parts.hour === 24 ? 0 : parts.hour;
  const asShown = Date.UTC(parts.year, parts.month - 1, parts.day, shownHour, parts.minute, parts.second);

  return new Date(provisional + (provisional - asShown));
}
