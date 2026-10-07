import { AGENT_TOOLS } from '../registry';
import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import { verifyAction } from '../action-token';
import { previewPlan, runPlan } from './plan';

process.env.JWT_SECRET = 'test-secret';
const ctx = (role = 'office_manager'): AgentContext => ({ companyId: 'co', userId: 'u', role, email: 'e@x.c', timezone: 'UTC', token: 'jwt' });
const http: any = {};
const log: string[] = [];
const state = { jobStatus: 'SCHEDULED' };

// Fake tools: a customer, a job for that customer, a money step, an undo step.
const fakes: AgentTool[] = [
  {
    name: 't_customer', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'],
    preview: async (a) => ({ title: `Create customer ${a.name}`, lines: [`Name: ${a.name}`] }),
    provides: (a) => ({ customerId: '@pending', customerName: a.name }),
    run: async (a) => { log.push(`customer ${a.name}`); return { customerId: 'c-1', customerName: a.name, summary: `Created ${a.name}` }; },
    reverse: (_a, r) => ({ tool: 't_undo', args: { what: `customer ${r.customerId}` }, title: `Remove ${r.customerName}` }),
  },
  {
    name: 't_job', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'],
    preview: async (a, _c, _h, scope) => {
      const who = typeof a.customerId === 'string' && a.customerId.startsWith('@') ? scope?.pending(a.customerId)?.customerName : a.customerId;
      if (!who) throw new ToolRefusal('That customer was not found.');
      if (a.fail === 'preview') throw new ToolRefusal('Kasun is not free then.');
      return { title: `Create a job for ${who}`, lines: ['Job: AC'] };
    },
    run: async (a) => { if (a.fail === 'run') throw new ToolRefusal('The job service said no.'); log.push(`job for ${a.customerId}`); return { jobId: 'j-1', summary: 'Created JOB-1' }; },
    reverse: (_a, r) => ({ tool: 't_undo', args: { what: `job ${r.jobId}` }, title: 'Cancel JOB-1' }),
  },
  {
    name: 't_send', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'], roles: ['office_manager'],
    sends: () => 'Emailed to the customer',
    preview: async () => ({ title: 'Send quote Q-1', lines: [] }),
    run: async () => { log.push('sent'); return { summary: 'Sent Q-1' }; },
  },
  {
    name: 't_undo', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'], internal: true,
    preview: async (a) => { if (state.jobStatus !== 'SCHEDULED') throw new ToolRefusal('JOB-1 is already en route.'); return { title: `Undo ${a.what}`, lines: [] }; },
    run: async (a) => { log.push(`undo ${a.what}`); return { summary: `Undid ${a.what}` }; },
  },
];

beforeAll(() => AGENT_TOOLS.push(...fakes));
afterAll(() => AGENT_TOOLS.splice(AGENT_TOOLS.length - fakes.length, fakes.length));
beforeEach(() => { log.length = 0; state.jobStatus = 'SCHEDULED'; });

const plan = (...steps: Array<[string, Record<string, unknown>]>) => ({ summary: 'New customer and job', steps: steps.map(([tool, args]) => ({ tool, args })) });

describe('previewPlan', () => {
  it('a later step can use what an earlier step will create', async () => {
    const p = await previewPlan(plan(['t_customer', { name: 'R&R' }], ['t_job', { customerId: '@1.customerId' }]), ctx(), http, 'admin');
    expect(p.title).toBe('New customer and job');
    expect(p.steps.map((s) => [s.n, s.title, s.dependsOn])).toEqual([[1, 'Create customer R&R', []], [2, 'Create a job for R&R', [1]]]);
    expect(p.args.steps[1]).toMatchObject({ tool: 't_job', args: { customerId: '@1.customerId' }, dependsOn: [1] });
  });

  it('marks what will be sent to a customer', async () => {
    const p = await previewPlan(plan(['t_send', {}]), ctx(), http, 'admin');
    expect(p.steps[0].sends).toBe('Emailed to the customer');
  });

  it('names the step that will not work, and makes no card', async () => {
    await expect(previewPlan(plan(['t_customer', { name: 'R&R' }], ['t_job', { customerId: '@1.customerId', fail: 'preview' }]), ctx(), http, 'admin'))
      .rejects.toThrow('Step 2: Kasun is not free then.');
  });

  it('refuses steps the person may not do, unknown or internal steps, and forward references', async () => {
    await expect(previewPlan(plan(['t_send', {}]), ctx('dispatcher'), http, 'admin')).rejects.toThrow('Step 1:');
    await expect(previewPlan(plan(['nope', {}]), ctx(), http, 'admin')).rejects.toThrow('Step 1:');
    await expect(previewPlan(plan(['t_undo', { what: 'x' }]), ctx(), http, 'admin')).rejects.toThrow('Step 1:');
    await expect(previewPlan(plan(['t_job', { customerId: '@2.customerId' }], ['t_customer', { name: 'R' }]), ctx(), http, 'admin')).rejects.toThrow('Step 1');
  });

  it('limits: 25 steps, one new customer, no nested plans', async () => {
    const many = plan(...Array.from({ length: 26 }, () => ['t_send', {}] as [string, Record<string, unknown>]));
    await expect(previewPlan(many, ctx(), http, 'admin')).rejects.toThrow('25');
    await expect(previewPlan(plan(['create_customer', { name: 'A' }], ['create_customer', { name: 'B' }]), ctx(), http, 'admin')).rejects.toThrow('one new customer');
    await expect(previewPlan(plan(['propose_plan', {}]), ctx(), http, 'admin')).rejects.toThrow('Step 1');
  });
});

describe('bulk plans (lenient)', () => {
  it('leaves out a step that will not work, with its reason, and numbers the rest', async () => {
    const p = await previewPlan({
      summary: 'Fill tomorrow',
      steps: [
        { tool: 't_job', args: { customerId: 'A' }, label: 'JOB-1' },
        { tool: 't_job', args: { customerId: 'B', fail: 'preview' }, label: 'JOB-2' },
        { tool: 't_job', args: { customerId: 'C' }, label: 'JOB-3' },
      ],
    }, ctx(), http, 'admin', { lenient: true });
    expect(p.steps.map((s) => [s.n, s.title])).toEqual([[1, 'Create a job for A'], [2, 'Create a job for C']]);
    expect(p.notes).toEqual(['Left out JOB-2: Kasun is not free then.']);
  });

  it('refuses when nothing is left, and never allows references', async () => {
    await expect(previewPlan({ steps: [{ tool: 't_job', args: { customerId: 'B', fail: 'preview' }, label: 'JOB-2' }] }, ctx(), http, 'admin', { lenient: true }))
      .rejects.toThrow('JOB-2: Kasun is not free then.');
    await expect(previewPlan(plan(['t_customer', { name: 'R' }], ['t_job', { customerId: '@1.customerId' }]), ctx(), http, 'admin', { lenient: true }))
      .rejects.toThrow('refer');
  });

  it('keeps the order when steps are checked at the same time', async () => {
    const steps = Array.from({ length: 12 }, (_, i) => ({ tool: 't_job', args: { customerId: `C${i}` } }));
    const p = await previewPlan({ steps }, ctx(), http, 'admin', { lenient: true });
    expect(p.steps.map((s) => s.title)).toEqual(steps.map((s) => `Create a job for ${s.args.customerId}`));
  });
});

describe('references are checked against what a step really provides', () => {
  it('a field the earlier step does not provide is refused at preview', async () => {
    await expect(previewPlan(plan(['t_customer', { name: 'R&R' }], ['t_job', { customerId: '@1.quoteId' }]), ctx(), http, 'admin')).rejects.toThrow('Step 2');
  });
});

describe('runPlan', () => {
  const twoSteps = async () => (await previewPlan(plan(['t_customer', { name: 'R&R' }], ['t_job', { customerId: '@1.customerId' }]), ctx(), http, 'admin')).args;

  it('runs in order, passing results forward, and returns an undo in reverse order', async () => {
    const r = await runPlan(await twoSteps(), ctx(), http, 'admin', []);
    expect(log).toEqual(['customer R&R', 'job for c-1']);
    expect(r.ok).toBe(true);
    expect(r.steps.map((s) => s.status)).toEqual(['done', 'done']);
    const undo = verifyAction(r.undo!.token, ctx());
    expect((undo.args as any).steps.map((s: any) => s.args.what)).toEqual(['job j-1', 'customer c-1']);
    expect(r.undo!.lines).toEqual(['Cancel JOB-1', 'Remove R&R']);
  });

  it('skipping a step skips the steps that need it', async () => {
    const r = await runPlan(await twoSteps(), ctx(), http, 'admin', [1]);
    expect(log).toEqual([]);
    expect(r.steps.map((s) => s.status)).toEqual(['skipped', 'skipped']);
    expect(r.ok).toBe(false);
  });

  it('stops at the first failure; earlier steps stay done and later ones do not run', async () => {
    const args = (await previewPlan(plan(['t_customer', { name: 'R&R' }], ['t_job', { customerId: '@1.customerId', fail: 'run' }], ['t_send', {}]), ctx(), http, 'admin')).args;
    const r = await runPlan(args, ctx(), http, 'admin', []);
    expect(r.steps.map((s) => [s.status, s.message])).toEqual([['done', 'Created R&R'], ['failed', 'The job service said no.'], ['not_run', undefined]]);
    expect(r.ok).toBe(false);
    expect((verifyAction(r.undo!.token, ctx()).args as any).steps).toHaveLength(1); // only the customer can be undone
  });

  it('re-checks each step just before running it', async () => {
    const args = (await previewPlan(plan(['t_customer', { name: 'R&R' }]), ctx(), http, 'admin')).args;
    args.steps[0].args = { name: 'R&R' };
    const fake = fakes[0];
    const spy = jest.spyOn(fake, 'preview');
    await runPlan(args, ctx(), http, 'admin', []);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('refuses to run a step whose money or time changed since the card was shown', async () => {
    const priced: AgentTool = {
      name: 't_priced', description: '', parameters: { type: 'object', properties: {} }, kind: 'write', bots: ['admin'],
      preview: async () => ({ title: 'Quote', lines: [], args: { total: state.jobStatus === 'SCHEDULED' ? 100 : 120 } }),
      signature: (a) => ({ total: a.total }),
      run: async () => { log.push('priced'); return {}; },
    };
    AGENT_TOOLS.push(priced);
    try {
      const args = (await previewPlan(plan(['t_priced', {}]), ctx(), http, 'admin')).args;
      state.jobStatus = 'PRICE_CHANGED';
      const r = await runPlan(args, ctx(), http, 'admin', []);
      expect(r.steps[0]).toMatchObject({ status: 'failed', message: expect.stringContaining('changed since you saw the card') });
      expect(log).toEqual([]);
    } finally {
      AGENT_TOOLS.pop();
    }
  });

  it('sent steps cannot be undone and are listed as such', async () => {
    const args = (await previewPlan(plan(['t_send', {}]), ctx(), http, 'admin')).args;
    const r = await runPlan(args, ctx(), http, 'admin', []);
    expect(r.undo).toBeUndefined();
    expect(r.cantUnsend).toEqual(['Send quote Q-1']);
  });

  it('a role change between preview and confirm is caught', async () => {
    const args = (await previewPlan(plan(['t_send', {}]), ctx(), http, 'admin')).args;
    const r = await runPlan(args, ctx('dispatcher'), http, 'admin', []);
    expect(r.steps[0]).toMatchObject({ status: 'failed' });
    expect(log).toEqual([]);
  });

  it('undo runs internal steps, and refuses when things moved on', async () => {
    const done = await runPlan(await twoSteps(), ctx(), http, 'admin', []);
    const undoArgs = verifyAction(done.undo!.token, ctx()).args as any;
    state.jobStatus = 'EN_ROUTE';
    const refused = await runPlan(undoArgs, ctx(), http, 'admin', []);
    expect(refused.steps[0]).toMatchObject({ status: 'failed', message: 'JOB-1 is already en route.' });
    state.jobStatus = 'SCHEDULED';
    log.length = 0;
    const ok = await runPlan(undoArgs, ctx(), http, 'admin', []);
    expect(log).toEqual(['undo job j-1', 'undo customer c-1']);
    expect(ok.undo).toBeUndefined();
  });
});
