import type IORedis from 'ioredis';

export type AiGuardDecision = { allowed: true } | { allowed: false; reason: string };

/** Asked before any model is called. A denied call costs nothing and returns null. */
export type AiGuard = (ctx: { task: string; companyId?: string }) => Promise<AiGuardDecision>;

/** Redis key analytics-service sets when a company has used its monthly AI budget. */
export function aiBlockKey(companyId: string): string {
  return `ai:block:${companyId}`;
}

export interface AiGuardOptions {
  /** Shared Redis, where the monthly budget block lives. Omit to skip that check. */
  redis?: Pick<IORedis, 'get'>;
  /** Whether AI is switched on for a company (features.ai). Cached here for 5 minutes. */
  isEnabled?: (companyId: string) => Promise<boolean>;
  cacheMs?: number;
  /** Longest a lookup may take before the guard gives up on it and allows the call. Default 1.5s. */
  lookupTimeoutMs?: number;
  now?: () => number;
}

class LookupTimeout extends Error {}

/** A Redis client with no retry limit queues commands forever while disconnected; never wait that long. */
function withLimit<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new LookupTimeout()), ms); }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Two checks, cheapest first: the company's AI switch, then the monthly
 * budget block. Fails open on any lookup error, because a Redis or database
 * blip should not switch AI off for everyone; the budget is a guard rail, not
 * a billing system. A lookup slower than lookupTimeoutMs counts as an error,
 * because an unreachable Redis otherwise holds every AI call open forever.
 * Calls without a company (system jobs) are always allowed.
 */
export function createAiGuard(opts: AiGuardOptions): AiGuard {
  const cacheMs = opts.cacheMs ?? 5 * 60_000;
  const limit = opts.lookupTimeoutMs ?? 1_500;
  const now = opts.now ?? Date.now;
  const enabledCache = new Map<string, { value: boolean; until: number }>();

  return async ({ companyId }) => {
    if (!companyId) return { allowed: true };

    if (opts.isEnabled) {
      let enabled = true;
      const hit = enabledCache.get(companyId);
      if (hit && hit.until > now()) {
        enabled = hit.value;
      } else {
        try {
          enabled = await withLimit(opts.isEnabled(companyId), limit);
          enabledCache.set(companyId, { value: enabled, until: now() + cacheMs });
        } catch { /* fail open */ }
      }
      if (!enabled) return { allowed: false, reason: 'AI is switched off for this company' };
    }

    if (opts.redis) {
      try {
        const blocked = await withLimit(opts.redis.get(aiBlockKey(companyId)), limit);
        if (blocked) return { allowed: false, reason: blocked };
      } catch { /* fail open */ }
    }

    return { allowed: true };
  };
}
