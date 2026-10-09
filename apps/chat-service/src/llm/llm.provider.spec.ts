import { LLMProvider, type LlmEvent } from './llm.provider';

type Chunk = Record<string, unknown>;
/** A fake OpenAI-style client: each create() call takes the next script (chunks, or an error to throw). */
function fakeClient(scripts: Array<Chunk[] | Error>) {
  const calls: any[] = [];
  return {
    calls,
    chat: { completions: { create: jest.fn(async (body: any) => {
      calls.push(body);
      const next = scripts.shift();
      if (next instanceof Error) throw next;
      return (async function* () { for (const c of next ?? []) yield c; })();
    }) } },
  };
}
const text = (t: string): Chunk => ({ choices: [{ delta: { content: t } }] });
const usage = (i: number, o: number): Chunk => ({ choices: [], usage: { prompt_tokens: i, completion_tokens: o } });
const rateLimited = (code?: string) => Object.assign(new Error('429'), { status: 429, ...(code && { code }) });

const waits: number[] = [];
class TestProvider extends LLMProvider {
  constructor(private readonly fakes: Record<string, ReturnType<typeof fakeClient>>) { super(); }
  protected makeClient(route: { provider: string }) { return this.fakes[route.provider] as any; }
  protected wait(ms: number) { waits.push(ms); return Promise.resolve(); }
}
beforeEach(() => { waits.length = 0; });

async function run(p: LLMProvider, tools?: any[]) {
  const out: LlmEvent[] = [];
  for await (const ev of p.stream(p.modelData, [{ role: 'user', content: 'hi' }], tools)) out.push(ev);
  return out;
}

const ENV = { ...process.env };
afterEach(() => { process.env = { ...ENV }; });
function keys(env: Record<string, string | undefined>) {
  for (const k of ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GEMINI_MODEL_CHAT', 'CHAT_LLM_PROVIDER', 'LLM_MAX_RETRY_WAIT_MS', 'LLM_RATE_RETRIES']) delete process.env[k];
  Object.assign(process.env, env);
}

describe('LLMProvider', () => {
  it('uses Gemini when its key is set, on its own model, and says who answered', async () => {
    keys({ GEMINI_API_KEY: 'g' });
    const gemini = fakeClient([[text('Hello'), usage(10, 2)]]);
    const out = await run(new TestProvider({ gemini }), [{ type: 'function', function: { name: 't', parameters: {} } }]);
    expect(out).toEqual([{ type: 'text', text: 'Hello' }, { type: 'usage', inputTokens: 10, outputTokens: 2, provider: 'gemini', model: 'gemini-3.8-flash' }]);
    expect(gemini.calls[0].model).toBe('gemini-3.8-flash');
    expect(gemini.calls[0]).not.toHaveProperty('parallel_tool_calls');
  });

  it('a rate limit is retried once, then the next provider answers', async () => {
    keys({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o', GEMINI_MODEL_CHAT: 'gemini-3.8-flash' });
    const gemini = fakeClient([rateLimited(), rateLimited()]);
    const openai = fakeClient([[text('From OpenAI')]]);
    const out = await run(new TestProvider({ gemini, openai }));
    expect(gemini.calls).toHaveLength(2);
    expect(openai.calls[0].model).toBe('gpt-4o');
    expect(out[0]).toEqual({ type: 'text', text: 'From OpenAI' });
  });

  it('no credits is not retried: it moves straight on', async () => {
    keys({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o', CHAT_LLM_PROVIDER: 'openai' });
    const openai = fakeClient([rateLimited('insufficient_quota')]);
    const gemini = fakeClient([[text('Gemini here')]]);
    const out = await run(new TestProvider({ gemini, openai }));
    expect(openai.calls).toHaveLength(1);
    expect(out[0]).toEqual({ type: 'text', text: 'Gemini here' });
  });

  it('never switches provider halfway through a reply', async () => {
    keys({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' });
    const broken = (async function* () { yield text('Half'); throw rateLimited(); })();
    const gemini = { calls: [], chat: { completions: { create: jest.fn(async () => broken) } } } as any;
    const openai = fakeClient([[text('should not run')]]);
    const p = new TestProvider({ gemini, openai });
    const seen: LlmEvent[] = [];
    await expect((async () => { for await (const ev of p.stream(p.modelData, [])) seen.push(ev); })()).rejects.toThrow('429');
    expect(seen).toEqual([{ type: 'text', text: 'Half' }]);
    expect(openai.calls).toHaveLength(0);
  });

  it('a tool call without an id still comes through, and only the first call counts', async () => {
    keys({ GEMINI_API_KEY: 'g' });
    const gemini = fakeClient([[
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'find_jobs', arguments: '{"sea' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'rch":"x"}' } }] } }] },
      { choices: [{ delta: { tool_calls: [{ index: 1, id: 'c2', function: { name: 'other', arguments: '{}' } }] } }] },
    ]]);
    const out = await run(new TestProvider({ gemini }));
    const tool = out.find((e) => e.type === 'tool') as Extract<LlmEvent, { type: 'tool' }>;
    expect(tool.call).toMatchObject({ name: 'find_jobs', args: '{"search":"x"}' });
    expect(tool.call.id).toBeTruthy();
  });

  it('a provider that rejects the request hands over to the next one', async () => {
    keys({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o', GEMINI_MODEL_CHAT: 'gemini-3.8-flash' });
    const gemini = fakeClient([Object.assign(new Error('400 unsupported'), { status: 400 })]);
    const openai = fakeClient([[text('OpenAI took it')]]);
    const out = await run(new TestProvider({ gemini, openai }));
    expect(gemini.calls).toHaveLength(1);
    expect(out[0]).toEqual({ type: 'text', text: 'OpenAI took it' });
  });

  it('waits as long as the provider asks, up to the cap; patient runs can retry more', async () => {
    keys({ GEMINI_API_KEY: 'g', GEMINI_MODEL_CHAT: 'gemini-3.8-flash' });
    const asked = Object.assign(new Error('429 Please retry in 41.2s.'), { status: 429 });
    await expect(run(new TestProvider({ gemini: fakeClient([asked, asked]) }))).rejects.toThrow('429');
    expect(waits).toEqual([8000]); // live chats: at most 8 s, one retry

    keys({ GEMINI_API_KEY: 'g', GEMINI_MODEL_CHAT: 'gemini-3.8-flash', LLM_MAX_RETRY_WAIT_MS: '65000', LLM_RATE_RETRIES: '3' });
    const out = await run(new TestProvider({ gemini: fakeClient([asked, asked, [text('ok')]]) }));
    expect(waits.slice(1)).toEqual([41200, 41200]);
    expect(out[0]).toEqual({ type: 'text', text: 'ok' });
  });

  it('a model whose daily quota is used up hands over to the next Gemini model at once', async () => {
    keys({ GEMINI_API_KEY: 'g' });
    const daily = Object.assign(new Error('429 Quota exceeded for metric: generate_content_free_tier_requests, quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier'), { status: 429 });
    const gemini = fakeClient([daily, [text('Lite here')]]);
    const out = await run(new TestProvider({ gemini }));
    expect(gemini.calls.map((c) => c.model)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    expect(waits).toEqual([]);
    expect(out).toContainEqual({ type: 'text', text: 'Lite here' });
  });

  it('skips a model whose daily quota is used up, for an hour', async () => {
    keys({ GEMINI_API_KEY: 'g' });
    const daily = Object.assign(new Error('429 GenerateRequestsPerDayPerProjectPerModel-FreeTier'), { status: 429 });
    const gemini = fakeClient([daily, [text('one')], [text('two')]]);
    const p = new TestProvider({ gemini });
    await run(p);
    await run(p);
    expect(gemini.calls.map((c) => c.model)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite']);
  });

  it('GEMINI_MODEL_CHAT can list the models to try, in order', async () => {
    keys({ GEMINI_API_KEY: 'g', GEMINI_MODEL_CHAT: 'gemini-x, gemini-y' });
    const gemini = fakeClient([Object.assign(new Error('503'), { status: 503 }), [text('y')]]);
    await run(new TestProvider({ gemini }));
    expect(gemini.calls.map((c) => c.model)).toEqual(['gemini-x', 'gemini-y']);
  });

  it("keeps Gemini's thought signature with a tool call, and never sends it to OpenAI", async () => {
    keys({ GEMINI_API_KEY: 'g' });
    const sig = { google: { thought_signature: 'abc' } };
    const gemini = fakeClient([[{ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', extra_content: sig, function: { name: 'list_technicians', arguments: '{}' } }] } }] }]]);
    const out = await run(new TestProvider({ gemini }));
    expect(out).toContainEqual({ type: 'tool', call: { id: 'c1', name: 'list_technicians', args: '{}', extra: sig } });

    keys({ OPENAI_API_KEY: 'o' });
    const openai = fakeClient([[text('ok')]]);
    const p = new TestProvider({ openai });
    const history: any[] = [{ role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'x', arguments: '{}' }, extra_content: sig }] }];
    for await (const _ of p.stream(p.modelData, history)) { /* drain */ }
    expect(openai.calls[0].messages[0].tool_calls[0]).not.toHaveProperty('extra_content');
    expect(history[0].tool_calls[0].extra_content).toEqual(sig); // the conversation itself is untouched
  });

  it('says plainly when no AI key is set', async () => {
    keys({});
    await expect(run(new TestProvider({}))).rejects.toThrow('No AI key');
  });
});
