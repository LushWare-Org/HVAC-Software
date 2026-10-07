import { AGENT_TOOLS, findTool } from '../registry';
import { signAction } from '../action-token';
import { confirmAction } from '../action-runner';
import { setKelvinQueueForTests } from '../../kelvin/kelvin-events';
import type { AgentContext, AgentTool } from '../types';
import { PROPOSE_PLAN } from './propose-plan';
import { RunOnce } from './run-once';

process.env.JWT_SECRET = 'test-secret';
const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'office_manager', email: 'e', timezone: 'UTC', token: 'jwt' };
const ran: string[] = [];
const fakes: AgentTool[] = [
  {
    name: 'c_one', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'],
    preview: async () => ({ title: 'Do one', lines: [] }),
    run: async () => { ran.push('one'); return { summary: 'Did one', jobId: 'j-1' }; },
    reverse: () => ({ tool: 'c_undo', args: {}, title: 'Undo one' }),
  },
  {
    name: 'c_two', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'],
    preview: async () => ({ title: 'Do two', lines: [] }),
    run: async () => { ran.push('two'); return { summary: 'Did two' }; },
  },
  {
    name: 'c_undo', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'], internal: true,
    preview: async () => ({ title: 'Undo one', lines: [] }),
    run: async () => { ran.push('undo'); return { summary: 'Undid one' }; },
  },
];
beforeAll(() => AGENT_TOOLS.push(...fakes));
afterAll(() => AGENT_TOOLS.splice(AGENT_TOOLS.length - fakes.length, fakes.length));
beforeEach(() => { ran.length = 0; RunOnce.resetForTests(); });
afterEach(() => setKelvinQueueForTests(null));

const http: any = {};

describe('propose_plan and confirm', () => {
  it('is offered to office roles of Kelvin companies, and previews into one card with steps', async () => {
    expect(findTool('propose_plan', 'admin', 'dispatcher')?.kelvinOnly).toBe(true);
    const p = await PROPOSE_PLAN.preview!({ summary: 'Both', steps: [{ tool: 'c_one', args: {} }, { tool: 'c_two', args: {} }] }, ctx, http);
    expect(p.title).toBe('Both');
    expect(p.steps?.map((s) => s.title)).toEqual(['Do one', 'Do two']);
  });

  it('confirm runs a plan, honours unticked steps, logs one line, and offers undo', async () => {
    const add = jest.fn(async (..._a: any[]) => ({}));
    setKelvinQueueForTests({ add } as any);
    const p = await PROPOSE_PLAN.preview!({ summary: 'Both', steps: [{ tool: 'c_one', args: {} }, { tool: 'c_two', args: {} }] }, ctx, http);
    const { token } = signAction({ tool: 'propose_plan', args: p.args!, title: p.title, lines: p.lines }, ctx);
    const out = await confirmAction(token, ctx, 'admin', [2]);
    expect(ran).toEqual(['one']);
    expect(out.ok).toBe(true);
    expect(out.steps?.map((s) => s.status)).toEqual(['done', 'skipped']);
    expect(out.undo?.lines).toEqual(['Undo one']);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[0][1]).toMatchObject({ type: 'ACTION_DONE', action: 'propose_plan', summary: 'Did one' });
    // Kelvin learns what this person unticks.
    expect(add.mock.calls[1][1]).toMatchObject({ type: 'STEP_SKIPPED', action: 'c_two', summary: 'Do two' });
  });

  it('a card can only be confirmed once', async () => {
    const { token } = signAction({ tool: 'c_two', args: {}, title: 'Do two', lines: [] }, ctx);
    expect((await confirmAction(token, ctx, 'admin')).ok).toBe(true);
    const again = await confirmAction(token, ctx, 'admin');
    expect(again).toMatchObject({ ok: false, message: 'Already done.' });
    expect(ran).toEqual(['two']);
  });

  it('a single action that can be reversed also offers undo, and the undo runs', async () => {
    const { token } = signAction({ tool: 'c_one', args: {}, title: 'Do one', lines: [] }, ctx);
    const out = await confirmAction(token, ctx, 'admin');
    expect(out.undo?.title).toBe('Undo one');
    const undone = await confirmAction(out.undo!.token, ctx, 'admin');
    expect(undone.ok).toBe(true);
    expect(ran).toEqual(['one', 'undo']);
  });
});
