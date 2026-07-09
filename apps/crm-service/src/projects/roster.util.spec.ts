import { effectiveRoster, weekdayOf } from './roster.util';

const base = {
  status: 'ACTIVE',
  startDate: new Date('2026-07-01T00:00:00Z'),
  targetEndDate: new Date('2026-09-30T00:00:00Z'),
  workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  baseTeamUserIds: ['u1', 'u2', 'u3'],
};

describe('weekdayOf', () => {
  it('maps calendar dates to weekday codes', () => {
    expect(weekdayOf('2026-07-06')).toBe('MON');
    expect(weekdayOf('2026-07-12')).toBe('SUN');
  });
});

describe('effectiveRoster', () => {
  it('returns base team on a default working day in range', () => {
    expect(effectiveRoster(base, '2026-07-08')).toEqual(['u1', 'u2', 'u3']); // WED
  });

  it('returns override crew when an override row exists', () => {
    expect(effectiveRoster(base, '2026-07-08', { techUserIds: ['u9'], isOff: false })).toEqual(['u9']);
  });

  it('returns empty for an isOff override', () => {
    expect(effectiveRoster(base, '2026-07-08', { techUserIds: ['u9'], isOff: true })).toEqual([]);
  });

  it('returns empty outside the project date range', () => {
    expect(effectiveRoster(base, '2026-06-30')).toEqual([]); // before start
    expect(effectiveRoster(base, '2026-10-01')).toEqual([]); // after end
  });

  it('returns empty on a non-working weekday', () => {
    expect(effectiveRoster(base, '2026-07-12')).toEqual([]); // SUN
  });

  it('returns empty for a non-ACTIVE project even with an override', () => {
    const paused = { ...base, status: 'ON_HOLD' };
    expect(effectiveRoster(paused, '2026-07-08')).toEqual([]);
    expect(effectiveRoster(paused, '2026-07-08', { techUserIds: ['u9'], isOff: false })).toEqual([]);
  });

  it('treats null date bounds as open-ended', () => {
    const open = { ...base, startDate: null, targetEndDate: null };
    expect(effectiveRoster(open, '2030-01-07')).toEqual(['u1', 'u2', 'u3']); // MON far future
  });
});
