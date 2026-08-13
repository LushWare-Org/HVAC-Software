/**
 * Tests for the shared slot/timezone helpers in `@tscrm/types`.
 *
 * These live here rather than in `packages/types` because that package has no
 * test toolchain (no jest, no ts-jest — only tsc), and adding one for a single
 * file would mean a lockfile change. job-service is the consumer whose
 * correctness actually depends on these: it validates and applies the intervals
 * they produce, writing them straight onto a customer's appointment.
 *
 * If `packages/types` ever gains jest, move this file there unchanged.
 */
import { slotFromWindow, zonedHourToUtc, RESCHEDULE_WINDOWS } from '@tscrm/types';

describe('zonedHourToUtc', () => {
  it('resolves a standard-time hour in a negative-offset zone', () => {
    // 2026-01-14 08:00 in Chicago (CST, UTC-6) === 14:00 UTC
    expect(zonedHourToUtc('2026-01-14', 8, 'America/Chicago').toISOString())
      .toBe('2026-01-14T14:00:00.000Z');
  });

  it('resolves a daylight-time hour in the same zone', () => {
    // 2026-07-14 08:00 in Chicago (CDT, UTC-5) === 13:00 UTC.
    // Differing from the winter case above is the whole point: the offset is
    // measured at the instant, not assumed.
    expect(zonedHourToUtc('2026-07-14', 8, 'America/Chicago').toISOString())
      .toBe('2026-07-14T13:00:00.000Z');
  });

  it('resolves a positive half-hour-offset zone', () => {
    // 2026-07-14 08:00 in Colombo (UTC+5:30) === 02:30 UTC
    expect(zonedHourToUtc('2026-07-14', 8, 'Asia/Colombo').toISOString())
      .toBe('2026-07-14T02:30:00.000Z');
  });

  it('resolves UTC itself to the same wall clock', () => {
    expect(zonedHourToUtc('2026-07-14', 8, 'UTC').toISOString())
      .toBe('2026-07-14T08:00:00.000Z');
  });
});

describe('slotFromWindow', () => {
  it('spans the whole window rather than a point in time', () => {
    const slot = slotFromWindow('2026-07-14', 'morning', 'America/Chicago');
    expect(slot.startAt.toISOString()).toBe('2026-07-14T13:00:00.000Z');
    expect(slot.endAt.toISOString()).toBe('2026-07-14T17:00:00.000Z');
    expect(slot.window).toBe('morning');
  });

  it('produces a forward-going interval for every declared window', () => {
    for (const key of Object.keys(RESCHEDULE_WINDOWS) as (keyof typeof RESCHEDULE_WINDOWS)[]) {
      const slot = slotFromWindow('2026-07-14', key, 'America/Chicago');
      expect(slot.endAt.getTime()).toBeGreaterThan(slot.startAt.getTime());
    }
  });

  it('keeps windows in the same order they are declared', () => {
    const morning = slotFromWindow('2026-07-14', 'morning', 'America/Chicago');
    const afternoon = slotFromWindow('2026-07-14', 'afternoon', 'America/Chicago');
    const evening = slotFromWindow('2026-07-14', 'evening', 'America/Chicago');
    expect(morning.endAt.getTime()).toBeLessThanOrEqual(afternoon.startAt.getTime());
    expect(afternoon.endAt.getTime()).toBeLessThanOrEqual(evening.startAt.getTime());
  });
});
