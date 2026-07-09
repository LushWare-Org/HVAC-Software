/**
 * Currency/timezone-aware formatters for server-rendered documents (PDFs).
 * Money stays plain decimals end-to-end; these are display-only.
 */

export function formatMoneySrv(
  val: number | string | { toString(): string } | null | undefined,
  currency: string,
): string {
  const n = typeof val === 'number' ? val : parseFloat((val ?? 0).toString());
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  }
}

export function formatDateSrv(d: Date | string | null | undefined, timezone: string): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(date);
}
