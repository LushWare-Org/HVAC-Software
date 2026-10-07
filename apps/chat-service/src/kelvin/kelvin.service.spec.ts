import { KelvinService, resetSuggestionsForTests } from './kelvin.service';
import { setKelvinQueueForTests } from './kelvin-events';
import type { AgentContext } from '../agent/types';

const ctx = (role = 'dispatcher'): AgentContext => ({ companyId: 'co', userId: 'u', role, email: 'a@b.c', token: 'jwt' });

/** Answers by "service path"; an Error value makes that source fail; 'hang' never answers. */
function http(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const answer = (method: string) => async (service: string, path: string, body?: any) => {
    calls.push(`${method} ${service} ${path}`);
    const v = routes[`${service} ${path}`];
    if (v === 'hang') return new Promise(() => {});
    if (v instanceof Error) throw v;
    if (v === undefined) throw new Error(`unexpected ${service} ${path}`);
    return typeof v === 'function' ? (v as any)(body) : v;
  };
  return { client: { get: answer('GET'), post: answer('POST'), put: answer('PUT') } as any, calls };
}

const ok = {
  'analytics /brief': { date: '2026-10-06', generatedAt: '2026-10-06T03:00:00Z', facts: [{ id: 'f1', severity: 'urgent', title: 'Brief fact', detail: 'd' }] },
  'scheduling /dispatch/disruptions': { generatedAt: '2026-10-06T05:00:00Z', disruptions: [{ kind: 'LATE_START', jobId: 'j1', jobNumber: 'JOB-1', technicianId: 't1', technicianName: 'Kasun', delayMins: 40, detail: 'Late', options: [] }] },
  'scheduling /dispatch/gaps': { timezone: 'UTC', gaps: [] },
  'jobs /jobs': { data: [] },
  'jobs /reschedule/inbox': { data: [] },
  'comms /notifications': { data: [] },
  'analytics /kelvin/routines': { data: [] },
  'inventory /alerts/low-stock': [],
  'finance /invoices': { data: [] },
  'analytics /recommendations': [],
  'analytics /kelvin/state': { spoken: ['late:j1:LATE_START:urgent'], seen: [], dismissed: ['brief:2026-10-06:f1'] },
  'analytics /kelvin/prefs': { speakMode: 'URGENT_ONLY', quietUntil: null },
};

describe('KelvinService.feed', () => {
  afterEach(() => setKelvinQueueForTests(null));

  it('merges sources, drops dismissed items, marks spoken ones, returns prefs', async () => {
    const { client } = http(ok);
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.items.map((i) => [i.id, i.spoken])).toEqual([['late:j1:LATE_START:urgent', true]]);
    expect(feed.unavailable).toEqual([]);
    expect(feed.prefs).toEqual({ speakMode: 'URGENT_ONLY', quietUntil: null });
  });

  it('a failing or hanging source is reported, the others still answer', async () => {
    const { client } = http({ ...ok, 'scheduling /dispatch/gaps': new Error('down'), 'jobs /reschedule/inbox': 'hang' });
    const feed = await new KelvinService(() => client, 50).feed(ctx()); // 50 ms timeout, real timers
    expect(feed.unavailable.sort()).toEqual(['freed time', 'reschedule requests']);
    expect(feed.items.length).toBeGreaterThan(0);
  });

  it('all sources down: nothing to show, and every source named', async () => {
    const down = Object.fromEntries(Object.keys(ok).filter((k) => !k.startsWith('analytics /kelvin')).map((k) => [k, new Error('x')]));
    const { client } = http({ ...ok, ...down });
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.items).toEqual([]);
    expect(feed.unavailable).toHaveLength(7); // a dispatcher's sources: no money ones
  });

  it('money notes only for money roles; suggestions kept 10 minutes per company', async () => {
    resetSuggestionsForTests();
    const rec = [{ id: 'r1', title: 'Win back quiet customers', reason: 'No visit in 9 months.', priority: 'high', action: '/customers' }];
    const overdue = { data: [{ invoiceNumber: 'INV-1', balanceDue: '10', currency: 'USD', dueDate: '2026-09-01T00:00:00Z' }] };
    const dispatcher = http({ ...ok, 'finance /invoices': overdue, 'analytics /recommendations': rec });
    await new KelvinService(() => dispatcher.client).feed(ctx());
    expect(dispatcher.calls.some((c) => c.includes('finance') || c.includes('/recommendations'))).toBe(false);

    const boss = http({ ...ok, 'finance /invoices': overdue, 'analytics /recommendations': rec });
    const svc = new KelvinService(() => boss.client);
    const now = new Date('2026-10-06T05:00:00Z');
    const feed = await svc.feed(ctx('office_manager'), now);
    expect(feed.items.map((i) => i.kind)).toEqual(expect.arrayContaining(['OVERDUE', 'SUGGESTION']));
    await svc.feed(ctx('office_manager'), new Date(now.getTime() + 60_000));
    expect(boss.calls.filter((c) => c.includes('/recommendations'))).toHaveLength(1);
  });

  it('memory being down never breaks the feed, and never overrides "never pop up"', async () => {
    const { client } = http({ ...ok, 'analytics /kelvin/state': new Error('x'), 'analytics /kelvin/prefs': new Error('x') });
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.prefs).toBeNull();
    expect(feed.unavailable).toContain('your settings');
    expect(feed.items.map((i) => i.id)).toContain('brief:2026-10-06:f1');
  });

  it('answers repeat requests from a short per-person cache', async () => {
    const { client, calls } = http(ok);
    const svc = new KelvinService(() => client);
    const now = new Date('2026-10-06T05:00:00Z');
    await svc.feed(ctx(), now);
    const after1 = calls.length;
    await svc.feed(ctx(), new Date(now.getTime() + 3_000));
    expect(calls.length).toBe(after1);
    await svc.feed(ctx(), new Date(now.getTime() + 6_000));
    expect(calls.length).toBeGreaterThan(after1);
    await svc.feed({ ...ctx(), userId: 'someone-else' }, new Date(now.getTime() + 6_500));
    expect(calls.length).toBeGreaterThan(after1 * 2 - 1);
  });

  it('technician gets nothing and no source is called', async () => {
    const { client, calls } = http(ok);
    const feed = await new KelvinService(() => client).feed(ctx('technician'));
    expect(feed.items).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('records only client event types, with the person from the token', async () => {
    const add = jest.fn(async (..._args: any[]) => ({}));
    setKelvinQueueForTests({ add } as any);
    const svc = new KelvinService(() => http(ok).client);
    svc.recordClientEvent(ctx(), { type: 'SPOKE', itemId: 'gap:1', summary: 'Kasun is free' });
    svc.recordClientEvent(ctx(), { type: 'ACTION_DONE' as any, itemId: 'x' });
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][1]).toMatchObject({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1', summary: 'Kasun is free' });
  });
});

describe('KelvinService memory', () => {
  it('reads and removes memory as the person, office roles only', async () => {
    const calls: string[] = [];
    const client = {
      get: async (s: string, p: string) => { calls.push(`GET ${s} ${p}`); return { notes: [] }; },
      delete: async (s: string, p: string) => { calls.push(`DELETE ${s} ${p}`); return { ok: true }; },
    } as any;
    const svc = new KelvinService(() => client);
    await svc.mind(ctx());
    await svc.forgetNote(ctx(), 'n/1');
    await svc.removeRoutine(ctx(), 'r-1');
    expect(calls).toEqual(['GET analytics /kelvin/mind', 'DELETE analytics /kelvin/notes/n%2F1', 'DELETE analytics /kelvin/routines/r-1']);
    expect(() => svc.mind(ctx('technician'))).toThrow('office staff');
  });

  it('checks the tone', () => {
    const svc = new KelvinService(() => ({ put: async () => ({}) }) as any);
    expect(() => svc.setPrefs(ctx(), { tone: 'LOUD' as any })).toThrow('tone');
  });
});
