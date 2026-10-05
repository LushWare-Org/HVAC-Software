import { AiGateway, parseJson, type AiCallRecord } from './gateway';
import { AiTimeoutError, isRetryable } from './errors';
import type { AiProviderName, ProviderAdapter, ProviderCall, ProviderResult } from './types';

type Step = string | Error;

/** A provider that plays back scripted replies or errors, and records calls. */
function fake(name: AiProviderName, steps: Step[], configured = true) {
  const calls: ProviderCall[] = [];
  const adapter: ProviderAdapter = {
    name,
    isConfigured: () => configured,
    async generate(call: ProviderCall): Promise<ProviderResult> {
      calls.push(call);
      const step = steps.shift();
      if (step === undefined) throw new Error('no scripted reply');
      if (step instanceof Error) throw step;
      return { text: step, usage: { inputTokens: 10, outputTokens: 5 } };
    },
  };
  return { adapter, calls };
}

const httpError = (status: number, message = 'boom') => Object.assign(new Error(message), { status });
const isPick = (v: unknown): v is { pick: string } => !!v && typeof (v as any).pick === 'string';
const logger = () => ({ log: jest.fn(), warn: jest.fn() });

const request = (over: Partial<Parameters<AiGateway['generateJson']>[0]> = {}) => ({
  task: 'upsell',
  companyId: 'co-1',
  system: 'Return JSON.',
  prompt: 'Pick one.',
  routes: [{ provider: 'gemini' as const, model: 'g-flash' }, { provider: 'openai' as const, model: 'o-mini' }],
  validate: isPick,
  ...over,
});

const noSleep = () => Promise.resolve();

describe('AiGateway', () => {
  it('returns the first model that answers with valid JSON', async () => {
    const g = fake('gemini', ['{"pick":"a"}']);
    const o = fake('openai', []);
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: logger(), env: {}, sleep: noSleep });
    const res = await gw.generateJson(request());
    expect(res).toMatchObject({ data: { pick: 'a' }, provider: 'gemini', model: 'g-flash', attempts: 1 });
    expect(o.calls).toHaveLength(0);
  });

  it('retries a busy model once, then succeeds on it', async () => {
    const g = fake('gemini', [httpError(503, 'high demand'), '{"pick":"b"}']);
    const sleep = jest.fn(noSleep);
    const gw = new AiGateway({ providers: [g.adapter, fake('openai', []).adapter], logger: logger(), env: {}, sleep });
    const res = await gw.generateJson(request());
    expect(res).toMatchObject({ data: { pick: 'b' }, provider: 'gemini', attempts: 2 });
    expect(sleep).toHaveBeenCalledWith(750);
  });

  it('falls back to the next provider when one stays busy', async () => {
    const g = fake('gemini', [httpError(503), httpError(503)]);
    const o = fake('openai', ['{"pick":"c"}']);
    const log = logger();
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: log, env: {}, sleep: noSleep });
    const res = await gw.generateJson(request());
    expect(res).toMatchObject({ data: { pick: 'c' }, provider: 'openai', model: 'o-mini', attempts: 3 });
    expect(log.log.mock.calls[0][0]).toMatch(/upsell ok via openai\/o-mini.*after: gemini\/g-flash: 503/);
  });

  it('does not retry errors that will not change, like an unknown model', async () => {
    const g = fake('gemini', [httpError(404, 'model not found')]);
    const o = fake('openai', ['{"pick":"d"}']);
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: logger(), env: {}, sleep: noSleep });
    const res = await gw.generateJson(request());
    expect(g.calls).toHaveLength(1);
    expect(res?.provider).toBe('openai');
  });

  it('skips providers without an API key', async () => {
    const g = fake('gemini', [], false);
    const o = fake('openai', ['{"pick":"e"}']);
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: logger(), env: {}, sleep: noSleep });
    expect((await gw.generateJson(request()))?.provider).toBe('openai');
    expect(g.calls).toHaveLength(0);
  });

  it('moves on when a reply is not JSON or has the wrong shape', async () => {
    const g = fake('gemini', ['sorry, I cannot']);
    const o = fake('openai', ['{"choice":"wrong key"}']);
    const log = logger();
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: log, env: {}, sleep: noSleep });
    expect(await gw.generateJson(request())).toBeNull();
    expect(log.warn.mock.calls[0][0]).toMatch(/not JSON.*unexpected response shape/);
  });

  it('returns null and reports every reason when all routes fail', async () => {
    const g = fake('gemini', [new AiTimeoutError(20000), new AiTimeoutError(20000)]);
    const o = fake('openai', [httpError(401, 'bad key')]);
    const log = logger();
    const records: AiCallRecord[] = [];
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: log, env: {}, sleep: noSleep, onCall: (r) => records.push(r) });
    expect(await gw.generateJson(request())).toBeNull();
    expect(log.warn.mock.calls[0][0]).toMatch(/upsell failed after 3 attempt\(s\).*company=co-1.*timed out.*401 bad key/);
    expect(records).toEqual([expect.objectContaining({ task: 'upsell', companyId: 'co-1', ok: false, attempts: 3 })]);
  });

  it('records usage for a successful call', async () => {
    const records: AiCallRecord[] = [];
    const gw = new AiGateway({ providers: [fake('gemini', ['{"pick":"f"}']).adapter], logger: logger(), env: {}, onCall: (r) => records.push(r) });
    await gw.generateJson(request());
    expect(records[0]).toMatchObject({ ok: true, provider: 'gemini', model: 'g-flash', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  it('lets AI_ROUTE_<TASK> replace the routes without a deploy', async () => {
    const g = fake('gemini', []);
    const o = fake('openai', ['{"pick":"g"}']);
    const env = { AI_ROUTE_EQUIPMENT_SCAN: 'openai:gpt-big, nonsense, gemini:' };
    const gw = new AiGateway({ providers: [g.adapter, o.adapter], logger: logger(), env, sleep: noSleep });
    const res = await gw.generateJson(request({ task: 'equipment-scan' }));
    expect(res).toMatchObject({ provider: 'openai', model: 'gpt-big' });
    expect(gw.resolveRoutes({ task: 'equipment-scan', routes: [] })).toEqual([{ provider: 'openai', model: 'gpt-big' }]);
  });

  it('keeps the caller routes when the override is empty or invalid, and drops duplicates', () => {
    const gw = new AiGateway({ providers: [], logger: logger(), env: { AI_ROUTE_UPSELL: 'bogus' } });
    const routes = [{ provider: 'gemini' as const, model: 'a' }, { provider: 'gemini' as const, model: 'a' }];
    expect(gw.resolveRoutes({ task: 'upsell', routes })).toEqual([{ provider: 'gemini', model: 'a' }]);
  });

  it('passes images, temperature and the default timeout through to the provider', async () => {
    const g = fake('gemini', ['{"pick":"h"}']);
    const gw = new AiGateway({ providers: [g.adapter], logger: logger(), env: {} });
    await gw.generateJson(request({ images: [{ mimeType: 'image/png', base64: 'AAA' }], temperature: 0.2 }));
    expect(g.calls[0]).toMatchObject({ images: [{ mimeType: 'image/png', base64: 'AAA' }], temperature: 0.2, timeoutMs: 20000 });
  });

  it('never lets a usage hook failure break the call', async () => {
    const gw = new AiGateway({ providers: [fake('gemini', ['{"pick":"i"}']).adapter], logger: logger(), env: {}, onCall: () => { throw new Error('db down'); } });
    expect((await gw.generateJson(request()))?.data).toEqual({ pick: 'i' });
  });
});

describe('parseJson', () => {
  it('reads plain and fenced JSON, and rejects prose', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(parseJson('not json')).toBeUndefined();
    expect(parseJson('   ')).toBeUndefined();
  });
});

describe('isRetryable', () => {
  it.each([
    [httpError(429), true], [httpError(503), true], [httpError(504), true], [new AiTimeoutError(1), true],
    [new Error('{"error":{"code":503,"message":"busy"}}'), true], [new Error('socket hang up'), true],
    [httpError(400), false], [httpError(401), false], [httpError(404), false],
    [new Error('{"error":{"code":404,"message":"no model"}}'), false],
  ])('%s -> %s', (err, expected) => {
    expect(isRetryable(err)).toBe(expected);
  });
});
