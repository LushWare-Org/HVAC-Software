/** Minutes a zone is ahead of UTC at a moment (Asia/Colombo -> 330). 0 for an unknown zone. */
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? '';
    const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!m) return 0;
    const mins = Number(m[2]) * 60 + Number(m[3]);
    return m[1] === '-' ? -mins : mins;
  } catch {
    return 0;
  }
}

/** "2026-10-06" for the local calendar day of `now` in a zone. */
export function localDate(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * [start, end) in UTC of a local calendar day, `addDays` away from today in
 * that zone. "Today" for a Dubai company starts at 20:00 UTC the day before.
 */
export function localDayRange(timeZone: string, now: Date, addDays = 0): { start: Date; end: Date; date: string } {
  const [y, m, d] = localDate(timeZone, now).split('-').map(Number);
  const at = (dayShift: number) => {
    const utcMidnight = Date.UTC(y, m - 1, d + addDays + dayShift);
    return new Date(utcMidnight - zoneOffsetMinutes(timeZone, new Date(utcMidnight)) * 60_000);
  };
  const start = at(0);
  return { start, end: at(1), date: localDate(timeZone, new Date(start.getTime() + 60_000)) };
}
