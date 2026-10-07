import { RunOnce } from './run-once';

describe('RunOnce', () => {
  afterEach(() => { RunOnce.useClientForTests(undefined); delete process.env.REDIS_URL; RunOnce.resetForTests(); });

  it('without Redis, remembers in memory', async () => {
    expect(await RunOnce.claim('a')).toBe(true);
    expect(await RunOnce.claim('a')).toBe(false);
  });

  it('with Redis, Redis decides', async () => {
    process.env.REDIS_URL = 'redis://x';
    const seen = new Set<string>();
    RunOnce.useClientForTests({ set: async (k: string) => (seen.has(k) ? null : (seen.add(k), 'OK')) });
    expect(await RunOnce.claim('b')).toBe(true);
    expect(await RunOnce.claim('b')).toBe(false);
  });

  it('when Redis is configured but failing, refuses rather than risk running twice', async () => {
    process.env.REDIS_URL = 'redis://x';
    RunOnce.useClientForTests({ set: async () => { throw new Error('down'); } });
    expect(await RunOnce.claim('c')).toBe('unavailable');
  });
});
