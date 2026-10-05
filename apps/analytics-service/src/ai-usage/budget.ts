/** Used when a company has no aiMonthlyBudgetUsd of its own. */
export const FALLBACK_MONTHLY_BUDGET_USD = 25;

/** First instant of the UTC month containing `now`. */
export function monthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** First instant of the next UTC month. */
export function nextMonthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** Seconds until the month rolls over, at least one. */
export function secondsUntilMonthEnd(now: Date): number {
  return Math.max(1, Math.ceil((nextMonthStartUtc(now).getTime() - now.getTime()) / 1000));
}

/** "2026-10" -> [start, end) of that UTC month, or null when malformed. */
export function monthRange(month: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) return null;
  const start = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return { start, end: nextMonthStartUtc(start) };
}

/** "2026-10" for the UTC month containing `now`. */
export function monthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * A company's monthly AI budget in USD: features.aiMonthlyBudgetUsd when it is
 * a positive number, else AI_DEFAULT_MONTHLY_BUDGET_USD, else $25. To switch AI
 * off entirely use features.ai = false instead.
 */
export function resolveBudgetUsd(features: unknown, env: NodeJS.ProcessEnv = process.env): number {
  const own = features && typeof features === 'object' ? (features as Record<string, unknown>).aiMonthlyBudgetUsd : undefined;
  if (typeof own === 'number' && own > 0) return own;
  const fromEnv = Number(env.AI_DEFAULT_MONTHLY_BUDGET_USD);
  return fromEnv > 0 ? fromEnv : FALLBACK_MONTHLY_BUDGET_USD;
}

/** What the guard shows when a company is blocked. */
export function budgetReachedReason(budgetUsd: number, now: Date): string {
  const resumes = nextMonthStartUtc(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `Monthly AI budget of $${budgetUsd} reached. AI resumes ${resumes}.`;
}
