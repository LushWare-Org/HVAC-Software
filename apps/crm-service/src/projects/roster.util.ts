/**
 * Effective-roster resolution — the single source of truth for "who is on
 * this project on this date". Pure function so crm endpoints, tests, and any
 * future consumers agree exactly.
 *
 * Rule (spec 2026-07-04):
 *   - non-ACTIVE project → [] (pausing/closing instantly frees the crew)
 *   - override row exists → its techUserIds ([] when isOff)
 *   - else date within [startDate, targetEndDate] (null bound = open) AND
 *     weekday ∈ workingDays → baseTeamUserIds
 *   - else []
 */

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface RosterProjectShape {
  status: string;
  startDate: Date | string | null;
  targetEndDate: Date | string | null;
  workingDays: string[];
  baseTeamUserIds: string[];
}

export interface RosterOverrideShape {
  techUserIds: string[];
  isOff: boolean;
}

/** YYYY-MM-DD of a Date/ISO string, in UTC (dates are calendar dates, not instants). */
export function toDateStr(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** Weekday code (SUN..SAT) for a YYYY-MM-DD calendar date. */
export function weekdayOf(dateStr: string): Weekday {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return WEEKDAYS[day];
}

export function isValidDateStr(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return !Number.isNaN(new Date(`${dateStr}T00:00:00Z`).getTime());
}

export function effectiveRoster(
  project: RosterProjectShape,
  dateStr: string,
  override?: RosterOverrideShape | null,
): string[] {
  if (project.status !== 'ACTIVE') return [];

  if (override) return override.isOff ? [] : override.techUserIds;

  if (project.startDate && dateStr < toDateStr(project.startDate)) return [];
  if (project.targetEndDate && dateStr > toDateStr(project.targetEndDate)) return [];
  if (!project.workingDays.includes(weekdayOf(dateStr))) return [];

  return project.baseTeamUserIds;
}
