import { createRedisConnection } from '@tscrm/queue';

/**
 * A confirmed card runs once, even if it is clicked twice or confirmed from two
 * tabs. Redis when available (shared by every instance), else this instance's
 * memory. Claims last 15 minutes, longer than any card's lifetime.
 */
const TTL_S = 15 * 60;
const mem = new Map<string, number>();
type Setter = { set: (...a: any[]) => Promise<unknown> };
let redis: Setter | null | undefined;

/** A connection that fails fast instead of queueing while Redis is down. */
function client(): Setter {
  if (redis) return redis;
  const c = createRedisConnection();
  (c as any).options.enableOfflineQueue = false;
  (c as any).options.maxRetriesPerRequest = 1;
  redis = c as unknown as Setter;
  return redis;
}

function inMemory(id: string): boolean {
  const now = Date.now();
  for (const [k, until] of mem) if (until < now) mem.delete(k);
  if (mem.has(id)) return false;
  mem.set(id, now + TTL_S * 1000);
  return true;
}

export const RunOnce = {
  /** true: first time, go ahead. false: already ran. 'unavailable': Redis is set up but not answering, so don't risk running twice. */
  async claim(id: string): Promise<boolean | 'unavailable'> {
    if (!process.env.REDIS_URL) return inMemory(id);
    try {
      let timer: NodeJS.Timeout | undefined;
      const answer = await Promise.race([
        client().set(`ai:ran:${id}`, '1', 'EX', TTL_S, 'NX'),
        new Promise<'timeout'>((r) => { timer = setTimeout(() => r('timeout'), 1500); }),
      ]);
      clearTimeout(timer);
      if (answer === 'timeout') return 'unavailable';
      return answer === 'OK';
    } catch {
      return 'unavailable';
    }
  },
  useClientForTests(c: Setter | undefined) {
    redis = c;
  },
  resetForTests() {
    mem.clear();
  },
};
