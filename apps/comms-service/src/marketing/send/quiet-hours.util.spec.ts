import { DateTime } from 'luxon';
import { resolveTimezone, canSendNow, nextSendableTime } from './quiet-hours.util';

describe('resolveTimezone', () => {
  it('resolves a known zip to the correct IANA timezone', () => {
    expect(resolveTimezone('90210')).toBe('America/Los_Angeles');
    expect(resolveTimezone('10001')).toBe('America/New_York');
  });

  it('falls back to state map when zip is unrecognised', () => {
    expect(resolveTimezone('00000', 'CA')).toBe('America/Los_Angeles');
  });

  it('falls back to America/New_York when both zip and state are absent', () => {
    expect(resolveTimezone(null, null)).toBe('America/New_York');
    expect(resolveTimezone(undefined, undefined)).toBe('America/New_York');
  });

  it('is case-insensitive for state code', () => {
    expect(resolveTimezone(null, 'ca')).toBe('America/Los_Angeles');
  });
});

describe('canSendNow', () => {
  const makeTime = (tz: string, hour: number, minute = 0) =>
    DateTime.fromObject({ year: 2026, month: 5, day: 12, hour, minute }, { zone: tz });

  it('returns true at 08:00 local (window starts inclusive)', () => {
    const now = makeTime('America/New_York', 8, 0);
    expect(canSendNow('10001', undefined, now)).toBe(true);
  });

  it('returns false at 07:59 local (before window)', () => {
    const now = makeTime('America/New_York', 7, 59);
    expect(canSendNow('10001', undefined, now)).toBe(false);
  });

  it('returns false at 21:00 local (window ends exclusive)', () => {
    const now = makeTime('America/New_York', 21, 0);
    expect(canSendNow('10001', undefined, now)).toBe(false);
  });

  it('returns true at 20:59 local (last minute of window)', () => {
    const now = makeTime('America/New_York', 20, 59);
    expect(canSendNow('10001', undefined, now)).toBe(true);
  });

  it('defaults to America/New_York when zip and state are missing', () => {
    const now = makeTime('America/New_York', 10, 0);
    expect(canSendNow(null, null, now)).toBe(true);
  });
});

describe('nextSendableTime', () => {
  const makeTime = (tz: string, hour: number) =>
    DateTime.fromObject({ year: 2026, month: 5, day: 12, hour, minute: 30 }, { zone: tz });

  it('returns 08:00 same day when current hour is before 08:00', () => {
    const now = makeTime('America/Los_Angeles', 6);
    const next = nextSendableTime('90210', undefined, now);
    expect(next.hour).toBe(8);
    expect(next.minute).toBe(0);
    expect(next.day).toBe(12);
  });

  it('returns 08:00 next day when current hour is 21:00 or later', () => {
    const now = makeTime('America/Los_Angeles', 22);
    const next = nextSendableTime('90210', undefined, now);
    expect(next.hour).toBe(8);
    expect(next.day).toBe(13);
  });
});
