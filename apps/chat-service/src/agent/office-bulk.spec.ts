import { AGENT_TOOLS } from './registry';
import { BULK_TOOLS } from './tools/office-bulk';
import { runPlan, type PlanArgs } from './plan/plan';
import type { AgentContext } from './types';

process.env.JWT_SECRET = 'test-secret';
const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'office_manager', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => BULK_TOOLS.find((t) => t.name === n)!;

function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, body: x });
    const v = routes[key];
    if (typeof v === 'function') return v(x);
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: `Not found: ${key}` } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH'), put: h('PUT'), delete: h('DELETE') } as any, calls };
}

const at = (h: number) => `2026-10-08T${String(h).padStart(2, '0')}:00:00.000Z`;
const job = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `j-${n}`, jobNumber: `JOB-${n}`, title: 'AC service', customerId: `c-${n}`, customerName: `Customer ${n}`,
  status: 'SCHEDULED', scheduledStart: at(8 + n), scheduledEnd: at(9 + n), assignedToId: null, crewUserIds: [], ...extra,
});
const techs = { data: [
  { id: 't-n', userId: 'u-n', name: 'Nuwan Silva', isActive: true },
  { id: 't-k', userId: 'u-k', name: 'Kasun Fernando', isActive: true },
  { id: 't-a', userId: 'u-a', name: 'Amal Perera', isActive: true },
] };
const cand = (id: string, score: number, conflicts: unknown[] = []) => ({ technician: techs.data.find((t) => t.id === id), score, conflicts });

describe('fill_unassigned_jobs', () => {
  const jobs = [job(1), job(2), job(3, { assignedToId: 'u-n' }), job(4, { scheduledStart: null, scheduledEnd: null }), job(5, { status: 'COMPLETED' })];
  const routes = (extra: Record<string, any> = {}) => ({
    'GET jobs /jobs': (q: any) => (q.dateFrom === '2026-10-08T00:00:00+00:00' && q.dateTo === '2026-10-08T23:59:59+00:00' ? { data: jobs } : { data: [] }),
    'GET scheduling /technicians': techs,
    'GET scheduling /dispatch/availability': { data: [{ technicianId: 't-a', isAvailable: false }] },
    // Kasun scores highest everywhere; Amal is off; Nuwan clashes with job 2.
    'GET scheduling /dispatch/candidates': (q: any) => ({ data: [cand('t-k', 90), cand('t-a', 95), cand('t-n', 80, q.jobId === 'j-2' ? [{ jobNumber: 'JOB-9' }] : [])] }),
    ...Object.fromEntries(jobs.map((j) => [`GET jobs /jobs/${j.id}`, j])),
    ...extra,
  });

  it('gives each unassigned job to the best free technician, never someone off or clashing', async () => {
    const p = await tool('fill_unassigned_jobs').preview!({ date: '2026-10-08' }, ctx, http(routes()).client);
    expect(p.title).toBe('Assign 2 unassigned jobs, Thu 8 Oct');
    expect(p.steps!.map((s) => s.title)).toEqual(['Assign Kasun Fernando to JOB-1', 'Assign Kasun Fernando to JOB-2']);
    expect(p.notes).toEqual(expect.arrayContaining(['Left out JOB-4: it has no time yet. Give it a time first.']));
    expect(p.notes!.join(' ')).toMatch(/can't be undone/);
    expect((p.args as any).steps.map((s: any) => s.tool)).toEqual(['assign_technician', 'assign_technician']);
  });

  it('spreads the work: a technician already picked at the same time is not picked again', async () => {
    const same = [job(1), job(2, { scheduledStart: at(9), scheduledEnd: at(10) })];
    const p = await tool('fill_unassigned_jobs').preview!({ date: '2026-10-08' }, ctx, http(routes({
      'GET jobs /jobs': { data: same },
      'GET jobs /jobs/j-2': same[1],
      'GET scheduling /dispatch/candidates': { data: [cand('t-k', 90), cand('t-n', 80)] },
    })).client);
    expect(p.steps!.map((s) => s.title)).toEqual(['Assign Kasun Fernando to JOB-1', 'Assign Nuwan Silva to JOB-2']);
  });

  it("prefers the customer's usual technician when they are free, and says so", async () => {
    const one = [job(1)];
    const p = await tool('fill_unassigned_jobs').preview!({ date: '2026-10-08' }, ctx, http(routes({
      'GET jobs /jobs': (q: any) => (q.customerId === 'c-1'
        ? { data: [{ status: 'COMPLETED', assignedToId: 'u-n', assignedToName: 'Nuwan Silva' }, { status: 'PAID', assignedToId: 'u-n', assignedToName: 'Nuwan Silva' }] }
        : { data: one }),
    })).client);
    expect(p.steps!.map((s) => s.title)).toEqual(['Assign Nuwan Silva to JOB-1']);
    expect(p.notes).toContain('JOB-1 goes to Nuwan Silva, who usually looks after Customer 1.');
  });

  it('gives them all to one named technician', async () => {
    const p = await tool('fill_unassigned_jobs').preview!({ date: '2026-10-08', technician: 'nuwan' }, ctx, http(routes()).client);
    expect(p.steps!.map((s) => s.title)).toEqual(['Assign Nuwan Silva to JOB-1', 'Assign Nuwan Silva to JOB-2']);
  });

  it('says so when nothing is waiting', async () => {
    await expect(tool('fill_unassigned_jobs').preview!({ date: '2026-10-09' }, ctx, http(routes()).client)).rejects.toThrow('No unassigned jobs on Fri 9 Oct');
  });
});

describe('move_technician_day', () => {
  const nuwans = [job(1, { assignedToId: 'u-n' }), job(2, { assignedToId: 'u-n', status: 'ON_SITE' })];
  const routes = {
    'GET scheduling /technicians': techs,
    'GET jobs /jobs': (q: any) => (q.assignedToId === 'u-n' && q.dateFrom.startsWith('2026-10-08') ? { data: nuwans } : { data: [job(7, { assignedToId: 'u-n' })] }),
    'GET scheduling /dispatch/availability': { data: [] },
    'GET jobs /jobs/j-1': nuwans[0],
  };

  it("moves a technician's visits to another day at the same times, and each can be undone", async () => {
    const p = await tool('move_technician_day').preview!({ technician: 'Nuwan', from: '2026-10-08', to: '2026-10-09' }, ctx, http(routes).client);
    expect(p.title).toBe("Move Nuwan Silva's visits from Thu 8 Oct to Fri 9 Oct");
    const step = (p.args as any).steps[0];
    expect(step).toMatchObject({ tool: 'reschedule_job', args: { jobId: 'j-1', start: '2026-10-09T09:00:00.000Z', end: '2026-10-09T10:00:00.000Z' } });
    expect(p.notes).toEqual(expect.arrayContaining(['JOB-2 is already under way, so it stays.', 'Nuwan Silva already has 1 visit on Fri 9 Oct. Check the times don\'t clash.']));
  });

  it('warns when the technician is off on the new day', async () => {
    const p = await tool('move_technician_day').preview!({ technician: 'Nuwan', from: '2026-10-08', to: '2026-10-09' }, ctx,
      http({ ...routes, 'GET scheduling /dispatch/availability': { data: [{ technicianId: 't-n', isAvailable: false, shiftDate: '2026-10-09T00:00:00Z' }] } }).client);
    expect(p.notes).toContain('Nuwan Silva is marked off on Fri 9 Oct.');
  });
});

describe('hand_over_day', () => {
  const nuwans = [job(1, { assignedToId: 'u-n' }), job(2, { assignedToId: 'u-n' })];
  const crewOf = { data: [{ assignment: { isLead: true }, technician: { id: 't-n', name: 'Nuwan Silva' } }] };
  const routes = {
    'GET scheduling /technicians': techs,
    'GET jobs /jobs': { data: nuwans },
    'GET scheduling /dispatch/availability': { data: [] },
    'GET scheduling /dispatch/candidates': { data: [cand('t-n', 99), cand('t-k', 90), cand('t-a', 85)] },
    'GET jobs /jobs/j-1': nuwans[0], 'GET jobs /jobs/j-2': nuwans[1],
    'GET scheduling /dispatch/jobs/j-1/crew': crewOf, 'GET scheduling /dispatch/jobs/j-2/crew': crewOf,
  };

  it("gives a technician's day to one named person", async () => {
    const p = await tool('hand_over_day').preview!({ technician: 'Nuwan', date: '2026-10-08', to: 'Kasun' }, ctx, http(routes).client);
    expect(p.steps!.map((s) => s.title)).toEqual(['Give JOB-1 to Kasun Fernando', 'Give JOB-2 to Kasun Fernando']);
  });

  it('or to whoever is free, spread out, never back to the same technician', async () => {
    const p = await tool('hand_over_day').preview!({ technician: 'Nuwan', date: '2026-10-08' }, ctx, http(routes).client);
    expect(p.steps!.map((s) => s.title)).toEqual(['Give JOB-1 to Kasun Fernando', 'Give JOB-2 to Amal Perera']);
  });
});

describe('chase_overdue_invoices', () => {
  const inv = (n: number, dueDaysAgo: number, extra: Record<string, unknown> = {}) => ({
    id: `i-${n}`, invoiceNumber: `INV-${n}`, customerName: `Customer ${n}`, customerEmail: `c${n}@x.co`, status: 'OVERDUE',
    balanceDue: '100.00', currency: 'USD', sentAt: '2026-08-01T08:00:00Z', dueDate: new Date(Date.now() - dueDaysAgo * 86_400_000).toISOString(), ...extra,
  });
  const all = [inv(1, 45), inv(2, 10), inv(3, 60, { customerEmail: null })];
  const routes = { 'GET finance /invoices': { data: all }, ...Object.fromEntries(all.map((i) => [`GET finance /invoices/${i.id}`, i])) };

  it('sends reminders for invoices overdue at least N days, oldest first, each marked as sent', async () => {
    const p = await tool('chase_overdue_invoices').preview!({ minDaysOverdue: 30 }, ctx, http(routes).client);
    expect(p.steps!.map((s) => [s.title, s.sends])).toEqual([['Send a reminder for INV-1', 'Emailed to c1@x.co']]);
    expect(p.notes).toEqual(['Left out INV-3: Customer 3 has no email address on file.']);
  });
});

describe('message_day_customers', () => {
  it("messages each customer on a technician's day once", async () => {
    const jobs = [job(1, { assignedToId: 'u-n' }), job(2, { assignedToId: 'u-n', customerId: 'c-1', customerName: 'Customer 1' }), job(3, { assignedToId: 'u-n' })];
    const routes = { 'GET scheduling /technicians': techs, 'GET jobs /jobs': { data: jobs }, ...Object.fromEntries(jobs.map((j) => [`GET jobs /jobs/${j.id}`, j])) };
    const p = await tool('message_day_customers').preview!({ technician: 'Nuwan', date: '2026-10-08', message: 'Nuwan is running about 30 minutes late today.' }, ctx, http(routes).client);
    expect(p.steps!.map((s) => s.sends)).toEqual(['Message to Customer 1', 'Message to Customer 3']);
  });

  it('refuses an empty message', async () => {
    await expect(tool('message_day_customers').preview!({ date: '2026-10-08', message: ' ' }, ctx, http({}).client)).rejects.toThrow('What should the message say?');
  });
});

describe('a bulk card runs as a plan, with undo', () => {
  it('moving a day runs each move and offers to move them all back', async () => {
    const j = job(1, { assignedToId: 'u-n' });
    const h = http({
      'GET scheduling /technicians': techs, 'GET jobs /jobs': (q: any) => (q.dateFrom.startsWith('2026-10-08') ? { data: [j] } : { data: [] }),
      'GET scheduling /dispatch/availability': { data: [] }, 'GET jobs /jobs/j-1': j, 'PATCH jobs /jobs/j-1': { jobNumber: 'JOB-1' },
    });
    const p = await tool('move_technician_day').preview!({ technician: 'Nuwan', from: '2026-10-08', to: '2026-10-09' }, ctx, h.client);
    const out = await runPlan(p.args as unknown as PlanArgs, ctx, h.client, 'admin');
    expect(out.ok).toBe(true);
    expect(h.calls.find((c) => c.key === 'PATCH jobs /jobs/j-1')!.body).toEqual({ scheduledStart: '2026-10-09T09:00:00.000Z', scheduledEnd: '2026-10-09T10:00:00.000Z' });
    expect(out.undo?.lines).toEqual(['Move JOB-1 back to Thu 8 Oct, 9:00 am']);
  });

  it('bulk tools are registered for Kelvin only, with the right roles', () => {
    for (const t of BULK_TOOLS) expect(AGENT_TOOLS).toContain(t);
    expect(BULK_TOOLS.every((t) => t.kelvinOnly && t.kind === 'write')).toBe(true);
    expect(tool('chase_overdue_invoices').roles).not.toContain('dispatcher');
    expect(tool('fill_unassigned_jobs').roles).toContain('dispatcher');
  });
});
