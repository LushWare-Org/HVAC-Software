const generateJson = jest.fn();
jest.mock('../ai/ai-gateway.factory', () => ({ createAnalyticsAiGateway: () => ({ generateJson }) }));

import { localDayRange, zoneOffsetMinutes } from './local-day';
import {
  lateJobs, overbookedTomorrow, overdueInvoices, pendingTechnicians, rankFacts, staleQuotes, stuckJobs, unassignedSoon,
  waitingLeads, yesterdayStats, type Fact, type FactContext, type Query,
} from './facts';
import { BriefService, applyAiOrder, isAiBrief, plainHeadline } from './brief.service';

const NOW = new Date('2026-10-06T06:00:00.000Z'); // 10:00 in Dubai
const ctx: FactContext = { companyId: 'co-1', now: NOW, timezone: 'Asia/Dubai', currency: 'USD' };

/** A query stub that returns `rows` and records the SQL and values it was given. */
function stub(rows: unknown[]) {
  const seen: Array<{ text: string; values: unknown[] }> = [];
  const q = (async (sql: any) => { seen.push({ text: sql.sql ?? sql.text ?? String(sql.strings?.join('?')), values: sql.values }); return rows; }) as Query;
  return { q, seen };
}

describe('local days', () => {
  it('starts "today" at local midnight, which for Dubai is 20:00 UTC the day before', () => {
    expect(localDayRange('Asia/Dubai', NOW)).toEqual({ start: new Date('2026-10-05T20:00:00Z'), end: new Date('2026-10-06T20:00:00Z'), date: '2026-10-06' });
    expect(localDayRange('Asia/Dubai', NOW, 1).date).toBe('2026-10-07');
    expect(localDayRange('Asia/Colombo', NOW, -1)).toMatchObject({ start: new Date('2026-10-04T18:30:00Z'), date: '2026-10-05' });
  });

  it('handles daylight saving and unknown zones', () => {
    expect(zoneOffsetMinutes('America/New_York', new Date('2026-07-01T12:00:00Z'))).toBe(-240);
    expect(zoneOffsetMinutes('America/New_York', new Date('2026-12-01T12:00:00Z'))).toBe(-300);
    expect(zoneOffsetMinutes('Not/AZone', NOW)).toBe(0);
  });
});

describe('fact checks', () => {
  it('late jobs: urgent, with minutes late and who has them, from today only', async () => {
    const { q, seen } = stub([
      { id: 'j1', jobNumber: 'JOB-1', customerName: 'Sara', assignedToName: 'Nuwan', scheduledStart: new Date('2026-10-06T05:20:00Z') },
      { id: 'j2', jobNumber: 'JOB-2', customerName: null, assignedToName: null, scheduledStart: new Date('2026-10-06T05:40:00Z') },
    ]);
    const [f] = await lateJobs(q, ctx);
    expect(f).toMatchObject({ id: 'late-jobs', severity: 'urgent', title: '2 jobs are running late' });
    expect(f.items).toEqual([
      { id: 'j1', label: 'JOB-1, Sara', meta: '40 min late, Nuwan' },
      { id: 'j2', label: 'JOB-2', meta: '20 min late, nobody assigned' },
    ]);
    expect(seen[0].values).toEqual(['co-1', new Date('2026-10-05T20:00:00Z'), new Date('2026-10-06T05:45:00Z')]);
  });

  it('returns nothing when the query finds nothing', async () => {
    for (const detect of [lateJobs, stuckJobs, unassignedSoon, overbookedTomorrow, overdueInvoices, staleQuotes, waitingLeads, pendingTechnicians]) {
      expect(await detect(stub([]).q, ctx)).toEqual([]);
    }
  });

  it('unassigned soon: urgent when one is within 24 hours', async () => {
    const [f] = await unassignedSoon(stub([
      { id: 'j1', jobNumber: 'JOB-1', customerName: 'Sara', scheduledStart: new Date('2026-10-06T10:00:00Z') },
      { id: 'j2', jobNumber: 'JOB-2', customerName: 'Ali', scheduledStart: new Date('2026-10-07T12:00:00Z') },
    ]).q, ctx);
    expect(f).toMatchObject({ severity: 'urgent', title: '2 jobs in the next 48 hours have nobody assigned', detail: '1 of them is within 24 hours.' });
    expect(f.items![0].meta).toBe('Tue 2:00 PM');
  });

  it('unassigned soon: names a single job and how soon it starts', async () => {
    const [f] = await unassignedSoon(stub([{ id: 'j1', jobNumber: 'JOB-1', customerName: 'Sara', scheduledStart: new Date('2026-10-06T11:00:00Z') }]).q, ctx);
    expect(f).toMatchObject({ title: 'JOB-1 has nobody assigned yet', detail: 'It starts in 5 hours.', severity: 'urgent' });
  });

  it('overbooked: names the technician and how far over', async () => {
    const [f] = await overbookedTomorrow(stub([{ name: 'Nuwan', max: 5, jobs: 7 }]).q, ctx);
    expect(f.title).toBe('Nuwan has 7 jobs tomorrow, 2 over the limit');
  });

  it('overdue invoices: money fact with totals, ages and a reminder for the oldest', async () => {
    const [f] = await overdueInvoices(stub([
      { id: 'i1', invoiceNumber: 'INV-1', customerName: 'Acme', balanceDue: '2598.00', dueDate: new Date('2026-07-01T00:00:00Z') },
      { id: 'i2', invoiceNumber: 'INV-2', customerName: 'Bo', balanceDue: '402.00', dueDate: new Date('2026-09-26T00:00:00Z') },
    ]).q, ctx);
    expect(f).toMatchObject({
      money: true, severity: 'important',
      title: '$3,000 is overdue on 2 invoices',
      detail: '1 of them is more than 60 days late.',
      action: { tool: 'send_invoice', args: { invoiceId: 'i1' }, label: 'Send a reminder for INV-1' },
    });
    expect(f.items![0].meta).toBe('$2,598, 97 days late');
  });

  it('stale quotes, waiting leads, stuck jobs and pending technicians read naturally', async () => {
    expect((await staleQuotes(stub([{ id: 'q', quoteNumber: 'Q-1', customerName: 'Sara', total: 1200, sentAt: new Date('2026-09-20T00:00:00Z') }]).q, ctx))[0])
      .toMatchObject({ title: '1 quote worth $1,200 has no answer after a week', money: true, severity: 'info' });
    expect((await waitingLeads(stub([{ id: 'l', firstName: 'Ravi', lastName: 'K', createdAt: new Date('2026-10-03T00:00:00Z') }]).q, ctx))[0].title)
      .toBe('1 new lead waiting over a day for contact');
    expect((await stuckJobs(stub([{ id: 'j', jobNumber: 'JOB-9', status: 'ON_SITE', assignedToName: 'Carlos', updatedAt: new Date('2026-08-01T00:00:00Z') }]).q, ctx))[0].title)
      .toBe('JOB-9 has been on site for over 12 hours');
    expect((await pendingTechnicians(stub([{ id: 'u1', name: 'Kasun' }, { id: 'u2', name: 'Amal' }]).q, ctx))[0].title)
      .toBe('2 technicians waiting for approval');
  });

  it('yesterday: counts completions, cancellations and money collected', async () => {
    let call = 0;
    const q = (async () => (call++ === 0 ? [{ completed: 6, cancelled: 1 }] : [{ collected: '1530.50' }])) as Query;
    expect(await yesterdayStats(q, ctx)).toEqual({ date: '2026-10-05', jobsCompleted: 6, jobsCancelled: 1, collected: 1530.5 });
  });
});

const fact = (id: string, severity: Fact['severity'], score: number, money = false): Fact => ({ id, severity, score, title: id, detail: '', money });

describe('ordering', () => {
  it('ranks urgent first, then by score', () => {
    expect(rankFacts([fact('a', 'info', 99), fact('b', 'important', 10), fact('c', 'urgent', 1), fact('d', 'important', 50)]).map((f) => f.id))
      .toEqual(['c', 'd', 'b', 'a']);
  });

  it('lets the AI reorder and annotate, but never hide or invent a fact', () => {
    const ranked = [fact('late', 'urgent', 100), fact('money', 'important', 50), fact('leads', 'important', 40)];
    const out = applyAiOrder(ranked, {
      headline: 'h',
      items: [{ id: 'money', why: 'Cash first.' }, { id: 'made-up', why: 'x' }, { id: 'money', why: 'again' }, { id: 'late', why: 'Call the customer.' }],
    });
    expect(out.map((f) => [f.id, f.why])).toEqual([['money', 'Cash first.'], ['late', 'Call the customer.'], ['leads', undefined]]);
  });

  it('checks the AI reply shape', () => {
    expect(isAiBrief({ headline: 'Busy day', items: [{ id: 'a', why: 'b' }] })).toBe(true);
    expect(isAiBrief({ headline: '', items: [] })).toBe(false);
    expect(isAiBrief({ headline: 'x', items: [{ id: 'a' }] })).toBe(false);
  });

  it('writes a plain headline when the AI is not used', () => {
    expect(plainHeadline([])).toBe('Nothing needs you right now.');
    expect(plainHeadline([fact('a', 'urgent', 1), fact('b', 'info', 1)])).toBe('2 things need you today, 1 urgent');
  });
});

describe('BriefService', () => {
  /** Answers each query by a word in its SQL, so detectors get rows that fit them. */
  function prismaFor(rowsFor: (sql: string) => unknown[]) {
    return { $queryRaw: jest.fn(async (sql: any) => rowsFor(sql.sql ?? sql.strings.join(' '))) };
  }
  const cache = () => ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined) });
  const rows = (sql: string) => {
    if (sql.includes('FROM crm.companies')) return [{ timezone: 'Asia/Dubai', currency: 'USD' }];
    if (sql.includes('finance."Invoice"')) return [{ id: 'i1', invoiceNumber: 'INV-1', customerName: 'Acme', balanceDue: 500, dueDate: new Date('2026-09-01T00:00:00Z') }];
    if (sql.includes("status = 'SCHEDULED'")) return [{ id: 'j1', jobNumber: 'JOB-1', customerName: 'Sara', assignedToName: null, scheduledStart: new Date('2026-10-06T05:00:00Z') }];
    if (sql.includes('count(*) FILTER')) return [{ completed: 3, cancelled: 0 }];
    if (sql.includes('finance."Payment"')) return [{ collected: 800 }];
    return [];
  };

  beforeEach(() => generateJson.mockReset());

  it('builds the brief with the AI order and lines', async () => {
    generateJson.mockResolvedValue({ data: { headline: 'Chase INV-1, then JOB-1', items: [{ id: 'overdue-invoices', why: 'Oldest money first.' }, { id: 'late-jobs', why: 'Call Sara.' }] } });
    const c = cache();
    const brief = await new BriefService(prismaFor(rows) as any, c as any).build('co-1', { seesMoney: true, now: NOW });

    expect(brief).toMatchObject({ date: '2026-10-06', timezone: 'Asia/Dubai', headline: 'Chase INV-1, then JOB-1', usedAi: true, failedChecks: [] });
    expect(brief.facts.map((f) => [f.id, f.why])).toEqual([['overdue-invoices', 'Oldest money first.'], ['late-jobs', 'Call Sara.']]);
    expect(brief.yesterday).toEqual({ date: '2026-10-05', jobsCompleted: 3, jobsCancelled: 0, collected: 800 });
    expect(c.set).toHaveBeenCalledWith('analytics:brief:co-1:money:2026-10-06', brief, 900);
    expect(generateJson.mock.calls[0][0]).toMatchObject({ task: 'brief', companyId: 'co-1' });
  });

  it('hides money from roles that do not see it, and still works without AI', async () => {
    generateJson.mockResolvedValue(null);
    const brief = await new BriefService(prismaFor(rows) as any, cache() as any).build('co-1', { seesMoney: false, now: NOW });
    expect(brief.facts.map((f) => f.id)).toEqual(['late-jobs']);
    expect(brief.yesterday.collected).toBeUndefined();
    expect(brief).toMatchObject({ usedAi: false, headline: '1 thing needs you today, 1 urgent' });
    expect(JSON.stringify(generateJson.mock.calls[0][0].prompt)).not.toContain('INV-1');
  });

  it('keeps going when one check fails, and says which', async () => {
    generateJson.mockResolvedValue(null);
    const prisma = prismaFor((sql) => { if (sql.includes('crm.leads')) throw new Error('relation missing'); return rows(sql); });
    const brief = await new BriefService(prisma as any, cache() as any).build('co-1', { seesMoney: true, now: NOW });
    expect(brief.failedChecks).toEqual(['waitingLeads']);
    expect(brief.facts.length).toBe(2);
  });

  it('serves the cached brief unless asked to refresh', async () => {
    const c = cache();
    c.get.mockResolvedValue({ headline: 'cached' });
    const svc = new BriefService(prismaFor(rows) as any, c as any);
    expect(await svc.build('co-1', { seesMoney: true, now: NOW })).toEqual({ headline: 'cached' });
    generateJson.mockResolvedValue(null);
    expect((await svc.build('co-1', { seesMoney: true, now: NOW, refresh: true })).headline).not.toBe('cached');
  });

  it('skips the AI entirely on a quiet day', async () => {
    const quiet = (sql: string) => (sql.includes('FROM crm.companies') ? [{ timezone: 'UTC', currency: 'USD' }] : sql.includes('FILTER') ? [{ completed: 0, cancelled: 0 }] : sql.includes('Payment') ? [{ collected: 0 }] : []);
    const brief = await new BriefService(prismaFor(quiet) as any, cache() as any).build('co-1', { seesMoney: true, now: NOW });
    expect(brief).toMatchObject({ headline: 'Nothing needs you right now.', facts: [], usedAi: false });
    expect(generateJson).not.toHaveBeenCalled();
  });
});
