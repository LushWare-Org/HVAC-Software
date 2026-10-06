import * as jwt from 'jsonwebtoken';
import { signAction, verifyAction, ActionTokenError } from './action-token';
import { toolsFor, findTool } from './registry';
import { confirmAction } from './action-runner';
import { WRITE_TOOLS, when } from './tools/write-tools';
import { ToolRefusal, type AgentContext } from './types';

process.env.JWT_SECRET = 'test-secret';

const ctx: AgentContext = { companyId: 'co-1', userId: 'u-1', role: 'office_manager', email: 'a@b.c', timezone: 'Asia/Dubai', token: 'jwt' };
const tool = (name: string) => WRITE_TOOLS.find((t) => t.name === name)!;

/** A ServiceHttp stand-in: answers by "METHOD service path". */
function fakeHttp(routes: Record<string, unknown>) {
  const calls: Array<{ method: string; service: string; path: string; body?: unknown }> = [];
  const answer = (method: string) => async (service: string, path: string, body?: unknown) => {
    calls.push({ method, service, path, body });
    const key = `${method} ${service} ${path}`;
    if (!(key in routes)) throw new Error(`unexpected ${key}`);
    const v = routes[key];
    if (v instanceof Error) throw v;
    return v;
  };
  return { http: { get: answer('GET'), post: answer('POST'), patch: answer('PATCH') } as any, calls };
}

const job = (over: Record<string, unknown> = {}) => ({
  id: 'j-1', jobNumber: 'JOB-2026-0412', title: 'AC not cooling', customerName: 'Sara Perera', status: 'SCHEDULED',
  scheduledStart: '2026-10-07T05:00:00.000Z', scheduledEnd: '2026-10-07T06:30:00.000Z',
  assignedToName: null, crewUserIds: [], serviceLatitude: '25.197', serviceLongitude: '55.274', ...over,
});

describe('action tokens', () => {
  const action = { tool: 'cancel_job', args: { jobId: 'j-1', reason: 'Customer away' }, title: 'Cancel JOB-1', lines: ['x'] };

  it('round-trips for the same person and company', () => {
    const { token, id } = signAction(action, ctx);
    expect(verifyAction(token, ctx)).toEqual({ ...action, id });
  });

  it('refuses a token issued to someone else or another company', () => {
    const { token } = signAction(action, ctx);
    expect(() => verifyAction(token, { ...ctx, userId: 'u-2' })).toThrow('belongs to someone else');
    expect(() => verifyAction(token, { ...ctx, companyId: 'co-2' })).toThrow(ActionTokenError);
  });

  it('refuses a tampered token, and a sign-in token signed with the raw secret', () => {
    const { token } = signAction(action, ctx);
    expect(() => verifyAction(token.slice(0, -2) + 'xx', ctx)).toThrow('not valid');
    const login = jwt.sign({ ...action, sub: 'u-1', cid: 'co-1' }, 'test-secret', { audience: 'ai-action' });
    expect(() => verifyAction(login, ctx)).toThrow('not valid');
  });

  it('expires after 10 minutes', () => {
    jest.useFakeTimers({ now: new Date('2026-10-05T10:00:00Z') });
    const { token } = signAction(action, ctx);
    jest.setSystemTime(new Date('2026-10-05T10:11:00Z'));
    expect(() => verifyAction(token, ctx)).toThrow('expired');
    jest.useRealTimers();
  });
});

describe('tool access', () => {
  const names = (bot: 'admin' | 'customer', role: string) => toolsFor(bot, role).map((t) => t.name);

  it('gives customers only customer tools, never staff ones', () => {
    const n = names('customer', 'customer');
    expect(n).toEqual(expect.arrayContaining(['get_my_jobs', 'get_my_next_appointment', 'get_my_invoices', 'get_my_equipment']));
    for (const staffTool of ['find_jobs', 'reschedule_job', 'cancel_job', 'send_invoice', 'assign_technician']) expect(n).not.toContain(staffTool);
  });

  it('gives dispatchers job actions but not money', () => {
    const n = names('admin', 'dispatcher');
    expect(n).toEqual(expect.arrayContaining(['reschedule_job', 'assign_technician', 'cancel_job', 'find_jobs']));
    expect(n).not.toContain('send_invoice');
    expect(n).not.toContain('get_revenue_summary');
  });

  it('gives office managers every action', () => {
    expect(names('admin', 'office_manager')).toEqual(expect.arrayContaining(['reschedule_job', 'assign_technician', 'cancel_job', 'send_invoice']));
  });

  it('gives technicians no admin tools at all', () => {
    expect(names('admin', 'technician')).toEqual([]);
    expect(findTool('cancel_job', 'admin', 'TECHNICIAN')).toBeUndefined();
  });
});

describe('reschedule_job preview', () => {
  it('keeps the job length and shows the change in company time', async () => {
    const { http } = fakeHttp({ 'GET jobs /jobs/j-1': job({ assignedToName: 'Nuwan Silva' }) });
    const p = await tool('reschedule_job').preview!({ jobId: 'j-1', start: '2026-10-08T09:00:00+04:00' }, ctx, http);
    expect(p.title).toBe('Reschedule JOB-2026-0412');
    expect(p.lines).toEqual([
      'JOB-2026-0412: AC not cooling, Sara Perera',
      `From: ${when('2026-10-07T05:00:00.000Z', ctx)}`,
      expect.stringMatching(/^To: Thu 8 Oct, 9:00 am until 10:30 am$/i),
      'Nuwan Silva sees the new time in the technician app.',
    ]);
    expect(p.args).toEqual({ jobId: 'j-1', start: '2026-10-08T05:00:00.000Z', end: '2026-10-08T06:30:00.000Z' });
  });

  it('refuses a finished job and an unreadable time', async () => {
    const done = fakeHttp({ 'GET jobs /jobs/j-1': job({ status: 'COMPLETED' }) });
    await expect(tool('reschedule_job').preview!({ jobId: 'j-1', start: '2026-10-08T09:00:00+04:00' }, ctx, done.http)).rejects.toThrow('completed');
    const open = fakeHttp({ 'GET jobs /jobs/j-1': job() });
    await expect(tool('reschedule_job').preview!({ jobId: 'j-1', start: 'next tuesday-ish' }, ctx, open.http)).rejects.toBeInstanceOf(ToolRefusal);
  });

  it('runs as a plain job update', async () => {
    const { http, calls } = fakeHttp({ 'PATCH jobs /jobs/j-1': { jobNumber: 'JOB-2026-0412' } });
    await tool('reschedule_job').run({ jobId: 'j-1', start: 'S', end: 'E' }, ctx, http);
    expect(calls).toEqual([{ method: 'PATCH', service: 'jobs', path: '/jobs/j-1', body: { scheduledStart: 'S', scheduledEnd: 'E' } }]);
  });
});

describe('assign_technician', () => {
  const techs = { data: [{ id: 't-1', name: 'Kasun Fernando', isActive: true }, { id: 't-2', name: 'Old Hand', isActive: false }] };

  it('resolves the job location and time into the confirmed arguments', async () => {
    const { http } = fakeHttp({ 'GET jobs /jobs/j-1': job(), 'GET scheduling /technicians': techs });
    const p = await tool('assign_technician').preview!({ jobId: 'j-1', technicianId: 't-1' }, ctx, http);
    expect(p.title).toBe('Assign Kasun Fernando to JOB-2026-0412');
    expect(p.args).toMatchObject({ jobId: 'j-1', technicianId: 't-1', lat: 25.197, lng: 55.274, start: '2026-10-07T05:00:00.000Z', end: '2026-10-07T06:30:00.000Z' });
  });

  it('refuses a job that already has a technician, an inactive technician, or no time', async () => {
    const taken = fakeHttp({ 'GET jobs /jobs/j-1': job({ assignedToName: 'Nuwan Silva' }) });
    await expect(tool('assign_technician').preview!({ jobId: 'j-1', technicianId: 't-1' }, ctx, taken.http)).rejects.toThrow('already assigned to Nuwan Silva');
    const inactive = fakeHttp({ 'GET jobs /jobs/j-1': job(), 'GET scheduling /technicians': techs });
    await expect(tool('assign_technician').preview!({ jobId: 'j-1', technicianId: 't-2' }, ctx, inactive.http)).rejects.toThrow('inactive');
    const untimed = fakeHttp({ 'GET jobs /jobs/j-1': job({ scheduledStart: null, scheduledEnd: null }), 'GET scheduling /technicians': techs });
    await expect(tool('assign_technician').preview!({ jobId: 'j-1', technicianId: 't-1' }, ctx, untimed.http)).rejects.toThrow('no time yet');
  });

  it('makes the same two writes the Scheduling board makes', async () => {
    const { http, calls } = fakeHttp({ 'POST scheduling /dispatch/assign/manual': {}, 'PATCH jobs /jobs/j-1': {} });
    await tool('assign_technician').run({ jobId: 'j-1', technicianId: 't-1', start: 'S', end: 'E', lat: 1, lng: 2 }, ctx, http);
    expect(calls.map((c) => `${c.method} ${c.path}`).sort()).toEqual(['PATCH /jobs/j-1', 'POST /dispatch/assign/manual']);
    expect(calls.find((c) => c.method === 'POST')!.body).toMatchObject({ jobId: 'j-1', technicianId: 't-1', jobLatitude: 1, jobLongitude: 2, scheduledStart: 'S' });
  });
});

describe('cancel_job and send_invoice', () => {
  it('will not cancel while the technician is on the way', async () => {
    const { http } = fakeHttp({ 'GET jobs /jobs/j-1': job({ status: 'EN_ROUTE', assignedToName: 'Nuwan Silva' }) });
    await expect(tool('cancel_job').preview!({ jobId: 'j-1', reason: 'x' }, ctx, http)).rejects.toThrow('Nuwan Silva is on the way');
  });

  it('cancels through the status endpoint with the reason', async () => {
    const { http, calls } = fakeHttp({ 'PATCH jobs /jobs/j-1/status': {} });
    await tool('cancel_job').run({ jobId: 'j-1', reason: 'Customer travelling' }, ctx, http);
    expect(calls[0].body).toEqual({ status: 'CANCELLED', cancellationReason: 'Customer travelling' });
  });

  it('previews an invoice reminder, and refuses void, paid or no email', async () => {
    const inv = { id: 'i-1', invoiceNumber: 'INV-0042', customerName: 'Sara Perera', customerEmail: 'sara@example.com', status: 'OVERDUE', balanceDue: '450.00', currency: 'USD', sentAt: '2026-09-20T08:00:00Z', dueDate: '2026-09-30T00:00:00Z' };
    const ok = fakeHttp({ 'GET finance /invoices/i-1': inv });
    const p = await tool('send_invoice').preview!({ invoiceId: 'i-1' }, ctx, ok.http);
    expect(p.title).toBe('Send a reminder for INV-0042');
    expect(p.lines[0]).toBe('To: Sara Perera <sara@example.com>');
    expect(p.lines[1]).toMatch(/^Balance due: \$450\.00, due /);

    for (const [over, msg] of [[{ status: 'VOID' }, 'void'], [{ status: 'PAID' }, 'already paid'], [{ customerEmail: null }, 'no email']] as const) {
      const h = fakeHttp({ 'GET finance /invoices/i-1': { ...inv, ...over } });
      await expect(tool('send_invoice').preview!({ invoiceId: 'i-1' }, ctx, h.http)).rejects.toThrow(msg);
    }
  });
});

describe('confirmAction', () => {
  afterEach(() => jest.restoreAllMocks());

  it('runs the confirmed action as the person, tagged with the action id', async () => {
    const cancel = findTool('cancel_job', 'admin', 'office_manager')!;
    const run = jest.spyOn(cancel, 'run').mockResolvedValue({ done: true });
    const { token, id } = signAction({ tool: 'cancel_job', args: { jobId: 'j-1', reason: 'r' }, title: 'Cancel JOB-1', lines: [] }, ctx);

    const out = await confirmAction(token, ctx, 'admin');

    expect(out).toEqual({ ok: true, message: 'Done: Cancel JOB-1.', actionId: id });
    expect(run).toHaveBeenCalledWith({ jobId: 'j-1', reason: 'r' }, ctx, expect.anything());
    expect((run.mock.calls[0][2] as any).aiAction).toBe(id);
  });

  it('re-checks the role at confirm time', async () => {
    const { token } = signAction({ tool: 'send_invoice', args: { invoiceId: 'i-1' }, title: 'Send INV-1', lines: [] }, ctx);
    const out = await confirmAction(token, { ...ctx, role: 'dispatcher' }, 'admin');
    expect(out).toMatchObject({ ok: false, message: 'You are not allowed to do that.' });
  });

  it('reports a service refusal in plain words', async () => {
    const cancel = findTool('cancel_job', 'admin', 'office_manager')!;
    jest.spyOn(cancel, 'run').mockRejectedValue({ response: { status: 400, data: { message: 'Invalid status transition' } } });
    const { token } = signAction({ tool: 'cancel_job', args: {}, title: 'Cancel JOB-1', lines: [] }, ctx);
    expect(await confirmAction(token, ctx, 'admin')).toMatchObject({ ok: false, message: 'Could not cancel JOB-1: Invalid status transition' });
  });

  it('rejects an expired or foreign token without running anything', async () => {
    const { token } = signAction({ tool: 'cancel_job', args: {}, title: 'Cancel', lines: [] }, { ...ctx, userId: 'someone-else' });
    expect(await confirmAction(token, ctx, 'admin')).toEqual({ ok: false, message: 'This confirmation belongs to someone else.' });
  });
});
