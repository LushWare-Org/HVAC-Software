import { ChatService, contextPrompt, utcOffset, type ChatEvent } from './chat.service';
import { toolsFor } from '../agent/registry';
import { WRITE_TOOLS } from '../agent/tools/write-tools';
import { READ_TOOLS } from '../agent/tools/read-tools';
import { verifyAction } from '../agent/action-token';
import type { LlmEvent } from '../llm/llm.provider';

process.env.JWT_SECRET = 'test-secret';
delete process.env.REDIS_URL;

const httpGet = jest.fn();
jest.mock('../agent/service-http', () => {
  const actual = jest.requireActual('../agent/service-http');
  return { ...actual, ServiceHttp: jest.fn().mockImplementation(() => ({ get: httpGet, post: jest.fn(), patch: jest.fn() })) };
});

const ctx = () => ({ companyId: 'co-1', userId: 'u-1', role: 'office_manager', email: 'a@b.c', token: 'jwt' });

/** An LLM that plays one scripted round per call to stream(). */
function scriptedLlm(rounds: LlmEvent[][]) {
  const seen: any[][] = [];
  return {
    modelData: 'gpt-4o',
    seen,
    stream: jest.fn(async function* (_model: string, messages: any[]) {
      seen.push(JSON.parse(JSON.stringify(messages)));
      for (const ev of rounds.shift() ?? []) yield ev;
    }),
  };
}

async function collect(it: AsyncIterable<ChatEvent>) {
  const out: ChatEvent[] = [];
  for await (const ev of it) out.push(ev);
  return out;
}

const prompts = { forBot: () => 'You are the assistant.' };

describe('ChatService', () => {
  beforeEach(() => {
    httpGet.mockReset();
    httpGet.mockImplementation(async (_svc: string, path: string) => (path === '/company/settings' ? { timezone: 'Asia/Dubai', features: {} } : {}));
  });

  it('answers plainly when no tool is needed', async () => {
    const llm = scriptedLlm([[{ type: 'text', text: 'Hello' }, { type: 'usage', inputTokens: 10, outputTokens: 2 }]]);
    const out = await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'hi', history: [] }, 'admin', ctx()));
    expect(out).toEqual([{ type: 'chunk', text: 'Hello' }]);
    expect(llm.seen[0][0].content).toContain('Asia/Dubai (UTC+04:00)');
  });

  it('runs a read tool and feeds the result back to the model', async () => {
    const find = READ_TOOLS.find((t) => t.name === 'find_jobs')!;
    jest.spyOn(find, 'run').mockResolvedValueOnce([{ id: 'j-1', jobNumber: 'JOB-1' }]);
    const llm = scriptedLlm([
      [{ type: 'tool', call: { id: 'c1', name: 'find_jobs', args: '{"search":"JOB-1"}' } }],
      [{ type: 'text', text: 'Found JOB-1.' }],
    ]);
    const out = await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'find JOB-1', history: [] }, 'admin', ctx()));
    expect(out).toEqual([{ type: 'status', text: 'Looking up jobs…' }, { type: 'chunk', text: 'Found JOB-1.' }]);
    expect(llm.seen[1].at(-1)).toEqual({ role: 'tool', tool_call_id: 'c1', content: JSON.stringify([{ id: 'j-1', jobNumber: 'JOB-1' }]) });
  });

  it('turns a write tool into a signed confirmation card and changes nothing', async () => {
    const cancel = WRITE_TOOLS.find((t) => t.name === 'cancel_job')!;
    jest.spyOn(cancel, 'preview').mockResolvedValueOnce({ title: 'Cancel JOB-1', lines: ['Reason: away'], args: { jobId: 'j-1', reason: 'away' } });
    const run = jest.spyOn(cancel, 'run');
    const llm = scriptedLlm([
      [{ type: 'tool', call: { id: 'c1', name: 'cancel_job', args: '{"jobId":"j-1","reason":"away"}' } }],
      [{ type: 'text', text: 'Press Confirm to cancel it.' }],
    ]);

    const out = await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'cancel JOB-1', history: [] }, 'admin', ctx()));

    const card = out.find((e) => e.type === 'action') as Extract<ChatEvent, { type: 'action' }>;
    expect(card.action).toMatchObject({ title: 'Cancel JOB-1', lines: ['Reason: away'] });
    expect(verifyAction(card.action.token, ctx())).toMatchObject({ tool: 'cancel_job', args: { jobId: 'j-1', reason: 'away' } });
    expect(run).not.toHaveBeenCalled();
    expect(JSON.parse(llm.seen[1].at(-1).content)).toMatchObject({ status: 'awaiting_confirmation' });
  });

  it('passes a refusal back to the model to explain', async () => {
    const cancel = WRITE_TOOLS.find((t) => t.name === 'cancel_job')!;
    const { ToolRefusal } = jest.requireActual('../agent/types');
    jest.spyOn(cancel, 'preview').mockRejectedValueOnce(new ToolRefusal('Nuwan is on the way. Call them before cancelling.'));
    const llm = scriptedLlm([[{ type: 'tool', call: { id: 'c1', name: 'cancel_job', args: '{}' } }], [{ type: 'text', text: 'ok' }]]);
    await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'cancel', history: [] }, 'admin', ctx()));
    expect(JSON.parse(llm.seen[1].at(-1).content)).toEqual({ refused: 'Nuwan is on the way. Call them before cancelling.' });
  });

  it('refuses a tool the role may not use, even if the model asks for it', async () => {
    const llm = scriptedLlm([[{ type: 'tool', call: { id: 'c1', name: 'send_invoice', args: '{}' } }], [{ type: 'text', text: 'ok' }]]);
    await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'x', history: [] }, 'admin', { ...ctx(), role: 'dispatcher' }));
    expect(JSON.parse(llm.seen[1].at(-1).content)).toEqual({ error: 'send_invoice is not available to you.' });
  });

  it('says so, without calling the model, when AI is switched off for the company', async () => {
    httpGet.mockResolvedValue({ timezone: 'UTC', features: { ai: false } });
    const llm = scriptedLlm([]);
    const out = await collect(new ChatService(llm as any, prompts as any).streamResponse({ message: 'hi', history: [] }, 'admin', ctx()));
    expect(out[0]).toMatchObject({ type: 'chunk', text: expect.stringContaining('switched off') });
    expect(llm.stream).not.toHaveBeenCalled();
  });
});

describe('context prompt', () => {
  it('states the local time and offset, and the action rules only for people who can act', () => {
    const now = new Date('2026-10-05T10:00:00Z');
    const staff = contextPrompt({ ...ctx(), timezone: 'Asia/Colombo' }, toolsFor('admin', 'office_manager'), now);
    expect(staff).toContain('UTC+05:30');
    expect(staff).toContain('2026-10-05T09:00:00+05:30');
    expect(staff).toContain('Never say it is done');
    const customer = contextPrompt({ ...ctx(), role: 'customer' }, toolsFor('customer', 'customer'), now);
    expect(customer).toContain('book_service');
    const noActions = contextPrompt({ ...ctx(), role: 'technician' }, toolsFor('admin', 'technician'), now);
    expect(noActions).not.toContain('Taking actions');
  });

  it('falls back to UTC for an unknown zone', () => {
    expect(utcOffset('Not/AZone')).toBe('+00:00');
    expect(utcOffset('UTC')).toBe('+00:00');
  });
});
