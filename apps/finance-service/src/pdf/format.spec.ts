import { formatMoneySrv, formatDateSrv } from './format';

describe('formatMoneySrv', () => {
  it('formats USD', () => expect(formatMoneySrv(1250, 'USD')).toBe('$1,250.00'));
  it('formats LKR', () => expect(formatMoneySrv(125000, 'LKR')).toMatch(/Rs\.?\s?125,000\.00/));
  it('accepts Decimal-as-string', () => expect(formatMoneySrv('99.5', 'USD')).toBe('$99.50'));
  it('accepts Prisma Decimal-like objects', () =>
    expect(formatMoneySrv({ toString: () => '42.1' } as never, 'USD')).toBe('$42.10'));
  it('falls back to USD on unknown code', () => expect(formatMoneySrv(10, 'XXINVALID')).toBe('$10.00'));
  it('treats null as zero', () => expect(formatMoneySrv(null, 'USD')).toBe('$0.00'));
});

describe('formatDateSrv', () => {
  it('renders in Asia/Colombo', () => {
    // 2026-07-05T20:00:00Z is already 2026-07-06 in Colombo (UTC+5:30)
    expect(formatDateSrv(new Date('2026-07-05T20:00:00Z'), 'Asia/Colombo')).toContain('July 6, 2026');
  });
  it('renders in America/New_York', () => {
    expect(formatDateSrv(new Date('2026-07-05T20:00:00Z'), 'America/New_York')).toContain('July 5, 2026');
  });
  it('returns em-dash for null', () => {
    expect(formatDateSrv(null, 'Asia/Colombo')).toBe('—');
  });
});
