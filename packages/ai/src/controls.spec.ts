jest.mock('@tscrm/queue', () => ({ QueueName: { AI_USAGE: 'ai-usage' }, createQueue: jest.fn() }));

import { AiGateway, type AiCallRecord } from './gateway';
import { createAiGuard, aiBlockKey } from './guard';
import { estimateCostUsd } from './pricing';
import { createQueueUsageRecorder } from './usage';
import type { ProviderAdapter } from './types';

const isObj = (v: unknown): v is object => !!v && typeof v === 'object';
const okProvider = (): ProviderAdapter & { generate: jest.Mock } => ({
  name: 'openai',
  isConfigured: () => true,
  generate: jest.fn().mockResolvedValue({ text: '{"ok":true}', usage: { inputTokens: 1_000, outputTokens: 500 } }),
});
const req = (companyId?: string) => ({
  task: 'upsell', companyId, system: 's', prompt: 'p',
  routes: [{ provider: 'openai' as const, model: 'gpt-4o-mini' }], validate: isObj,
});
const silent = { log: jest.fn(), warn: jest.fn() };

describe('estimateCostUsd', () => {
  it('prices by the most specific model prefix', () => {
    // gpt-4o-mini: 1000 * 0.15/M + 500 * 0.6/M
    expect(estimateCostUsd('openai', 'gpt-4o-mini', { inputTokens: 1000, outputTokens: 500 })).toBe(0.00045);
    expect(estimateCostUsd('openai', 'gpt-4o', { inputTokens: 1000, outputTokens: 500 })).toBe(0.0075);
    expect(estimateCostUsd('gemini', 'gemini-3.8-flash', { inputTokens: 1000 })).toBe(0.0003);
  });

  it('returns null without token counts or for an unknown model', () => {
    expect(estimateCostUsd('openai', 'gpt-4o', undefined)).toBeNull();
    expect(estimateCostUsd('openai', 'o9-secret', { inputTokens: 5 })).toBeNull();
  });
});

describe('createAiGuard', () => {
  it('allows calls with no company (system jobs)', async () => {
    const guard = createAiGuard({ isEnabled: async () => false });
    expect(await guard({ task: 't' })).toEqual({ allowed: true });
  });

  it('denies a company whose AI switch is off, and caches the answer', async () => {
    const isEnabled = jest.fn().mockResolvedValue(false);
    const guard = createAiGuard({ isEnabled });
    expect(await guard({ task: 't', companyId: 'c1' })).toEqual({ allowed: false, reason: 'AI is switched off for this company' });
    await guard({ task: 't', companyId: 'c1' });
    expect(isEnabled).toHaveBeenCalledTimes(1);
  });

  it('re-reads the switch after the cache expires', async () => {
    let t = 0;
    const isEnabled = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const guard = createAiGuard({ isEnabled, cacheMs: 1000, now: () => t });
    expect((await guard({ task: 't', companyId: 'c1' })).allowed).toBe(false);
    t = 1001;
    expect((await guard({ task: 't', companyId: 'c1' })).allowed).toBe(true);
  });

  it('denies with the stored reason when the monthly budget block is set', async () => {
    const redis = { get: jest.fn(async (k: string) => (k === aiBlockKey('c1') ? 'Monthly AI budget of $20 reached' : null)) };
    const guard = createAiGuard({ redis });
    expect(await guard({ task: 't', companyId: 'c1' })).toEqual({ allowed: false, reason: 'Monthly AI budget of $20 reached' });
    expect(await guard({ task: 't', companyId: 'c2' })).toEqual({ allowed: true });
  });

  it('fails open when the switch or Redis lookup errors', async () => {
    const guard = createAiGuard({ isEnabled: async () => { throw new Error('db'); }, redis: { get: async () => { throw new Error('redis'); } } });
    expect(await guard({ task: 't', companyId: 'c1' })).toEqual({ allowed: true });
  });
});

describe('AiGateway with a guard and usage records', () => {
  it('skips the call entirely when the guard denies, and records why', async () => {
    const provider = okProvider();
    const records: AiCallRecord[] = [];
    const gw = new AiGateway({
      providers: [provider], logger: silent, env: {}, onCall: (r) => records.push(r),
      guard: async () => ({ allowed: false, reason: 'AI is switched off for this company' }),
    });
    expect(await gw.generateJson(req('c1'))).toBeNull();
    expect(provider.generate).not.toHaveBeenCalled();
    expect(records[0]).toMatchObject({ ok: false, attempts: 0, skipped: 'AI is switched off for this company', companyId: 'c1' });
  });

  it('proceeds when the guard itself throws', async () => {
    const gw = new AiGateway({ providers: [okProvider()], logger: silent, env: {}, guard: async () => { throw new Error('x'); } });
    expect(await gw.generateJson(req('c1'))).not.toBeNull();
  });

  it('records a timestamp and estimated cost on success, and the error on failure', async () => {
    const records: AiCallRecord[] = [];
    const ok = new AiGateway({ providers: [okProvider()], logger: silent, env: {}, onCall: (r) => records.push(r) });
    await ok.generateJson(req('c1'));
    expect(records[0]).toMatchObject({ ok: true, costUsd: 0.00045, model: 'gpt-4o-mini' });
    expect(new Date(records[0].at).toString()).not.toBe('Invalid Date');

    const broken = okProvider();
    broken.generate.mockRejectedValue(Object.assign(new Error('bad key'), { status: 401 }));
    const bad = new AiGateway({ providers: [broken], logger: silent, env: {}, onCall: (r) => records.push(r) });
    await bad.generateJson(req('c1'));
    expect(records[1]).toMatchObject({ ok: false, error: expect.stringContaining('401 bad key') });
  });
});

describe('createQueueUsageRecorder', () => {
  const record: AiCallRecord = { at: '2026-10-05T00:00:00.000Z', task: 'upsell', companyId: 'c1', ok: true, attempts: 1, latencyMs: 9 };

  it('adds each record to the queue tagged with the calling service', async () => {
    const queue = { add: jest.fn().mockResolvedValue({}) };
    createQueueUsageRecorder('crm-service', { queue })(record);
    expect(queue.add).toHaveBeenCalledWith('ai-call', { ...record, service: 'crm-service' });
  });

  it('never throws, and warns once, when the queue is unavailable', async () => {
    const logger = { log: jest.fn(), warn: jest.fn() };
    const queue = { add: jest.fn().mockRejectedValue(new Error('redis down')) };
    const record$ = createQueueUsageRecorder('crm-service', { queue, logger });
    expect(() => { record$(record); record$(record); }).not.toThrow();
    await new Promise((r) => setImmediate(r));
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
