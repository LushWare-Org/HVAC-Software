/** Pure rules for visit reminders and confirmation: when each is due, and whether a visit is confirmed. */

export const DEFAULT_SOON_HOURS = 3;
export const DEFAULT_EVE_HOUR = 18;

/** A local calendar date (YYYY-MM-DD) in an IANA zone. */
export function localDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function addDays(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "This calendar date at this hour in this zone" as a UTC instant, correct across daylight-saving changes. */
export function zonedToUtc(dateISO: string, hour: number, tz: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const provisional = Date.UTC(y, m - 1, d, hour, 0, 0);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(provisional)).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  const asShown = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return new Date(provisional + (provisional - asShown));
}

export interface ReminderJob {
  scheduledStart: Date | null;
  timeMode?: string | null;
  windowStart?: Date | null;
  remindedEveFor?: Date | null;
  remindedSoonFor?: Date | null;
  /** When the customer was last told about the booking. */
  notifiedAt?: Date | null;
}

/** The time a visit is aimed at: the start of the arrival window, else the booked time. */
export function visitStart(j: Pick<ReminderJob, 'scheduledStart' | 'timeMode' | 'windowStart'>): Date | null {
  return j.timeMode === 'WINDOW' && j.windowStart ? j.windowStart : j.scheduledStart;
}

const HOUR = 3_600_000;
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getTime() === b.getTime();

/**
 * Which reminder, if any, is due now.
 *  EVE:  from 18:00 (company time) the day before, but only if the visit is still 12+ hours away.
 *  SOON: from a few hours before the visit, as long as it has not started.
 * Each is sent once per start time, so a moved visit earns fresh reminders. Nothing goes out
 * right after a booking message (3 hours for EVE, 1 hour for SOON), so the customer is not
 * messaged twice in a row.
 */
export function reminderDue(
  j: ReminderJob, now: Date, tz: string, cfg: { soonHours?: number; eveHour?: number } = {},
): 'EVE' | 'SOON' | null {
  const start = visitStart(j);
  if (!start || start.getTime() <= now.getTime()) return null;
  const soonHours = cfg.soonHours ?? DEFAULT_SOON_HOURS;
  const ahead = start.getTime() - now.getTime();
  const sinceNotice = j.notifiedAt ? now.getTime() - j.notifiedAt.getTime() : Infinity;

  const eveAt = zonedToUtc(addDays(localDate(start, tz), -1), cfg.eveHour ?? DEFAULT_EVE_HOUR, tz);
  if (now >= eveAt && ahead >= 12 * HOUR && !same(j.remindedEveFor, start) && sinceNotice >= 3 * HOUR) return 'EVE';

  if (ahead <= soonHours * HOUR && ahead >= 20 * 60_000 && !same(j.remindedSoonFor, start) && sinceNotice >= HOUR) return 'SOON';
  return null;
}

/** The customer confirmed the time the visit has now. A moved visit is unconfirmed again. */
export function isConfirmed(j: { scheduledStart?: Date | null; confirmedFor?: Date | null }): boolean {
  return same(j.scheduledStart, j.confirmedFor);
}
