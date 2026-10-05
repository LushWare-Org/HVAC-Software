import { aiBlockKey } from '@tscrm/ai';
import { AiUsageService, summarize, type UsageGroup } from './ai-usage.service';
import {
  budgetReachedReason, monthKey, monthRange, monthStartUtc, nextMonthStartUtc, resolveBudgetUsd, secondsUntilMonthEnd,
} from './budget';

const NOW = new Date('2026-10-20T12:00:00.000Z');

describe('budget helpers', () => {
  it('works in UTC months', () => {
    expect(monthStartUtc(NOW).toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(nextMonthStartUtc(new Date('2026-12-31T23:00:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(secondsUntilMonthEnd(NOW)).toBe(11.5 * 24 * 3600);
    expect(monthKey(NOW)).toBe('2026-10');
  });

  it('parses a month or rejects it', () => {
    expect(monthRange('2026-02')).toEqual({ start: new Date('2026-02-01T00:00:00Z'), end: new Date('2026-03-01T00:00:00Z') });
    expect(monthRange('2026-13')).toBeNull();
    expect(monthRange('Oct 2026')).toBeNull();
  });

  it('uses the company budget, then the env default, then $25', () => {
    expect(resolveBudgetUsd({ aiMonthlyBudgetUsd: 40 }, {})).toBe(40);
    expect(resolveBudgetUsd({ aiMonthlyBudgetUsd: 0 }, { AI_DEFAULT_MONTHLY_BUDGET_USD: '10' })).toBe(10);
    expect(resolveBudgetUsd({ aiMonthlyBudgetUsd: 'lots' }, {})).toBe(25);
    expect(resolveBudgetUsd(null, {})).toBe(25);
  });

  it('says when AI comes back', () => {
    expect(budgetReachedReason(25, NOW)).toBe('Monthly AI budget of $25 reached. AI resumes Nov 1.');
  });
});

function makePrisma(spent: number, features: unknown = {}) {
  return {
    aiUsage: {
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue({ _sum: { costUsd: spent } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ features }]),
  };
}
const makeRedis = () => ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue('OK'), del: jest.fn().mockResolvedValue(1) });

const event = {
  at: '2026-10-20T11:59:00.000Z', service: 'crm-service', task: 'upsell', companyId: 'c1', ok: true,
  provider: 'openai' as const, model: 'gpt-4o-mini', attempts: 1, latencyMs: 812.4,
  usage: { inputTokens: 455, outputTokens: 102 }, costUsd: 0.000129,
};

describe('AiUsageService', () => {
  it('stores a call with its tokens, cost and time', async () => {
    const prisma = makePrisma(1);
    await new AiUsageService(prisma as any, makeRedis()).record(event);
    expect(prisma.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'c1', service: 'crm-service', task: 'upsell', ok: true, model: 'gpt-4o-mini',
        latencyMs: 812, inputTokens: 455, outputTokens: 102, costUsd: 0.000129, skipped: null,
        createdAt: new Date(event.at),
      }),
    });
  });

  it('does not re-check the budget for free calls (skipped or failed)', async () => {
    const prisma = makePrisma(100);
    const redis = makeRedis();
    await new AiUsageService(prisma as any, redis).record({ ...event, ok: false, costUsd: undefined, skipped: 'AI is switched off for this company' });
    expect(prisma.aiUsage.aggregate).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('blocks the company until month end once spend reaches the budget', async () => {
    const redis = makeRedis();
    const svc = new AiUsageService(makePrisma(25.01, { aiMonthlyBudgetUsd: 25 }) as any, redis);
    const res = await svc.enforceBudget('c1', NOW);
    expect(res).toEqual({ budgetUsd: 25, spentUsd: 25.01, blocked: true });
    expect(redis.set).toHaveBeenCalledWith(aiBlockKey('c1'), 'Monthly AI budget of $25 reached. AI resumes Nov 1.', 'EX', 11.5 * 24 * 3600);
  });

  it('clears the block when spend is under budget, so a raised budget applies right away', async () => {
    const redis = makeRedis();
    await new AiUsageService(makePrisma(3, { aiMonthlyBudgetUsd: 50 }) as any, redis).enforceBudget('c1', NOW);
    expect(redis.del).toHaveBeenCalledWith(aiBlockKey('c1'));
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('still records usage when Redis is down', async () => {
    const redis = makeRedis();
    redis.set.mockRejectedValue(new Error('redis down'));
    const prisma = makePrisma(99);
    await expect(new AiUsageService(prisma as any, redis).record(event)).resolves.toBeUndefined();
    expect(prisma.aiUsage.create).toHaveBeenCalled();
  });

  it('returns null for a malformed month', async () => {
    expect(await new AiUsageService(makePrisma(0) as any, makeRedis()).summary('c1', 'nope')).toBeNull();
  });
});

describe('summarize', () => {
  const g = (task: string, ok: boolean, n: number, cost: number, model = 'gpt-4o-mini', latency = 1000): UsageGroup => ({
    task, provider: 'openai', model, ok,
    _count: { _all: n }, _sum: { costUsd: cost, inputTokens: 100 * n, outputTokens: 10 * n }, _avg: { latencyMs: latency },
  });

  it('adds up totals, per task and per model, counting skipped calls separately', () => {
    const s = summarize('2026-10', 25, null, [
      g('upsell', true, 3, 0.003),
      g('upsell', false, 1, 0, 'gpt-4o-mini'),
      g('equipment-scan', true, 2, 0.02, 'gpt-4o', 3000),
    ], [{ task: 'upsell', _count: { _all: 4 } }]);

    expect(s.totals).toEqual({ calls: 10, ok: 5, failed: 1, skipped: 4, costUsd: 0.023, inputTokens: 600, outputTokens: 60 });
    expect(s.spentUsd).toBe(0.023);
    expect(s.byTask[0]).toMatchObject({ task: 'equipment-scan', calls: 2, costUsd: 0.02, avgLatencyMs: 3000 });
    expect(s.byTask[1]).toMatchObject({ task: 'upsell', calls: 8, ok: 3, failed: 1, skipped: 4, avgLatencyMs: 1000 });
    expect(s.byModel).toEqual([
      { provider: 'openai', model: 'gpt-4o', calls: 2, costUsd: 0.02 },
      { provider: 'openai', model: 'gpt-4o-mini', calls: 3, costUsd: 0.003 },
    ]);
  });

  it('reports an empty month cleanly', () => {
    const s = summarize('2026-10', 25, 'Monthly AI budget of $25 reached. AI resumes Nov 1.', [], []);
    expect(s).toMatchObject({ spentUsd: 0, blocked: expect.stringContaining('budget'), byTask: [], byModel: [] });
  });
});
