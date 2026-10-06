import { CUSTOMER_TOOLS } from './tools/customer-tools';
import { toolsFor } from './registry';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co-1', userId: 'cu-1', customerId: 'c-1', role: 'customer', email: 'sara@example.com', name: 'Sara Perera', timezone: 'Asia/Dubai', token: 'jwt' };
const tool = (name: string) => CUSTOMER_TOOLS.find((t) => t.name === name)!;
const DAY = 86_400_000;
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();

function fakeHttp(routes: Record<string, unknown>) {
  const calls: Array<{ method: string; service: string; path: string; body?: any }> = [];
  const answer = (method: string) => async (service: string, path: string, body?: unknown) => {
    calls.push({ method, service, path, body });
    const key = `${method} ${service} ${path}`;
    if (!(key in routes)) throw Object.assign(new Error(`unexpected ${key}`), { response: { status: 404 } });
    const v = routes[key];
    if (v instanceof Error) throw v;
    return typeof v === 'function' ? (v as any)(body) : v;
  };
  return { http: { get: answer('GET'), post: answer('POST'), patch: answer('PATCH') } as any, calls };
}

const me = { firstName: 'Sara', lastName: 'Perera', email: 'sara@example.com', phone: '+971500000000', address: '12 Marina Walk', city: 'Dubai', latitude: '25.08', longitude: '55.14' };
const job = (over: Record<string, unknown> = {}) => ({ id: 'j-1', jobNumber: 'JOB-0412', title: 'AC not cooling', customerId: 'c-1', status: 'SCHEDULED', scheduledStart: inDays(2), rescheduleState: null, ...over });
const quote = (over: Record<string, unknown> = {}) => ({ id: 'q-1', quoteNumber: 'Q-0042', title: 'Replace compressor', customerId: 'c-1', status: 'SENT', total: '1200.00', currency: 'USD', validUntil: inDays(10), ...over });

describe('customer tool access', () => {
  it('gives customers their lookups and five actions, and staff none of the actions', () => {
    const names = toolsFor('customer', 'customer').map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['get_my_jobs', 'get_my_quotes', 'book_service', 'request_reschedule', 'accept_quote', 'decline_quote', 'message_office']));
    const staff = toolsFor('admin', 'office_manager').map((t) => t.name);
    expect(staff).not.toContain('book_service');
    expect(toolsFor('customer', 'office_manager').filter((t) => t.kind === 'write')).toEqual([]);
  });
});

describe('book_service', () => {
  it('uses the address on file and its map pin, and lets the office arrange the time', async () => {
    const { http } = fakeHttp({ 'GET crm /customers/me': me });
    const p = await tool('book_service').preview!({ title: 'AC not cooling', description: 'Bedroom unit blowing warm air since Monday', urgency: 'soon' }, ctx, http);
    expect(p.lines).toEqual([
      'What: AC not cooling', 'Details: Bedroom unit blowing warm air since Monday', 'Where: 12 Marina Walk, Dubai',
      'When: The office will contact you to arrange a time', 'Urgency: Soon, within a day or two',
    ]);
    expect(p.args).toMatchObject({ address: '12 Marina Walk, Dubai', lat: 25.08, lng: 55.14, priority: 'HIGH', start: undefined, phone: '+971500000000' });
  });

  it('drops the stored map pin when the visit is at a different address', async () => {
    const { http } = fakeHttp({ 'GET crm /customers/me': me });
    const p = await tool('book_service').preview!({ title: 'Leak', urgency: 'normal', address: 'Villa 7, Arabian Ranches' }, ctx, http);
    expect(p.args).toMatchObject({ address: 'Villa 7, Arabian Ranches', lat: undefined, lng: undefined });
  });

  it('refuses without any address, or with a preferred time in the past', async () => {
    const none = fakeHttp({ 'GET crm /customers/me': { ...me, address: null, city: null } });
    await expect(tool('book_service').preview!({ title: 'x', urgency: 'normal' }, ctx, none.http)).rejects.toThrow('no address on your account');
    const past = fakeHttp({ 'GET crm /customers/me': me });
    await expect(tool('book_service').preview!({ title: 'x', urgency: 'normal', preferredStart: '2020-01-01T09:00:00+04:00' }, ctx, past.http)).rejects.toThrow('in the past');
  });

  it('creates the job as the customer, tagged as coming from the assistant', async () => {
    const { http, calls } = fakeHttp({ 'POST jobs /jobs': { jobNumber: 'JOB-0999' } });
    const out = await tool('book_service').run({ title: 'AC', address: 'A', priority: 'HIGH', name: 'Sara Perera', email: 'e', phone: 'p' }, ctx, http);
    expect(out).toEqual({ done: true, jobNumber: 'JOB-0999' });
    expect(calls[0].body).toMatchObject({ customerId: 'c-1', title: 'AC', serviceAddress: 'A', priority: 'HIGH', tags: ['portal-request', 'via-assistant'] });
  });
});

describe('request_reschedule', () => {
  it('proposes up to three times, each two hours long by default', async () => {
    const { http } = fakeHttp({ 'GET jobs /jobs/j-1': job() });
    const t1 = inDays(4);
    const p = await tool('request_reschedule').preview!({ jobId: 'j-1', reason: 'not_available', note: 'Travelling', preferredTimes: [{ start: t1 }] }, ctx, http);
    expect(p.title).toBe('Ask to move JOB-0412');
    expect(p.lines[1]).toBe("Reason: I'm not available. Travelling");
    expect(p.args).toMatchObject({ jobId: 'j-1', reasonCode: 'CUSTOMER_UNAVAILABLE', slots: [{ startAt: t1, endAt: new Date(Date.parse(t1) + 7_200_000).toISOString() }] });
  });

  it('asks the office to suggest when no times are given', async () => {
    const { http, calls } = fakeHttp({ 'GET jobs /jobs/j-1': job(), 'POST jobs /reschedule/jobs/j-1': {} });
    const p = await tool('request_reschedule').preview!({ jobId: 'j-1', reason: 'access' }, ctx, http);
    expect(p.lines).toContain('You are asking the office to suggest new times.');
    await tool('request_reschedule').run(p.args!, ctx, http);
    expect(calls.at(-1)!.body).toEqual({ mode: 'OPEN_ASK', reasonCode: 'ACCESS_ISSUE', reason: undefined });
  });

  it("refuses someone else's visit, a visit already under way, and a second open request", async () => {
    const other = fakeHttp({ 'GET jobs /jobs/j-1': job({ customerId: 'c-2' }) });
    await expect(tool('request_reschedule').preview!({ jobId: 'j-1', reason: 'other' }, ctx, other.http)).rejects.toThrow('not found on your account');
    const going = fakeHttp({ 'GET jobs /jobs/j-1': job({ status: 'EN_ROUTE' }) });
    await expect(tool('request_reschedule').preview!({ jobId: 'j-1', reason: 'other' }, ctx, going.http)).rejects.toThrow('already on the way');
    const open = fakeHttp({ 'GET jobs /jobs/j-1': job({ rescheduleState: 'AWAITING_ADMIN' }) });
    await expect(tool('request_reschedule').preview!({ jobId: 'j-1', reason: 'other' }, ctx, open.http)).rejects.toThrow('already an open request');
  });
});

describe('quotes', () => {
  it('shows what accepting means, and approves as the customer', async () => {
    const { http, calls } = fakeHttp({ 'GET finance /quotes/q-1': quote(), 'POST finance /quotes/q-1/approve': {} });
    const p = await tool('accept_quote').preview!({ quoteId: 'q-1' }, ctx, http);
    expect(p.lines[0]).toBe('Replace compressor: $1,200.00');
    await tool('accept_quote').run(p.args!, ctx, http);
    expect(calls.at(-1)!.body).toEqual({ approvedByName: 'Sara Perera', approvedByEmail: 'sara@example.com' });
  });

  it('refuses expired, settled or foreign quotes', async () => {
    for (const [over, msg] of [
      [{ validUntil: inDays(-1) }, 'expired'], [{ status: 'ACCEPTED' }, 'already accepted'],
      [{ status: 'DECLINED' }, 'was declined'], [{ customerId: 'c-2' }, 'not found on your account'],
    ] as const) {
      const { http } = fakeHttp({ 'GET finance /quotes/q-1': quote(over) });
      await expect(tool('accept_quote').preview!({ quoteId: 'q-1' }, ctx, http)).rejects.toThrow(msg);
    }
  });

  it('declines with the reason given', async () => {
    const { http, calls } = fakeHttp({ 'GET finance /quotes/q-1': quote(), 'POST finance /quotes/q-1/decline': {} });
    const p = await tool('decline_quote').preview!({ quoteId: 'q-1', reason: 'Found a cheaper option' }, ctx, http);
    await tool('decline_quote').run(p.args!, ctx, http);
    expect(calls.at(-1)!.body).toMatchObject({ reason: 'Found a cheaper option', declinedByEmail: 'sara@example.com' });
  });
});

describe('message_office', () => {
  it('shows the exact wording, then opens a thread and posts it', async () => {
    const { http, calls } = fakeHttp({
      'GET jobs /jobs/j-1': job(),
      'POST comms /messaging/threads': { id: 'th-1' },
      'POST comms /messaging/threads/th-1/messages': {},
    });
    const p = await tool('message_office').preview!({ message: 'The gate code is 4512.', jobId: 'j-1' }, ctx, http);
    expect(p.lines).toEqual(['About: JOB-0412, AC not cooling', '"The gate code is 4512."']);
    await tool('message_office').run(p.args!, ctx, http);
    expect(calls.slice(-2).map((c) => [c.path, c.body])).toEqual([
      ['/messaging/threads', { customerId: 'c-1', customerName: 'Sara Perera', subject: 'About JOB-0412', jobId: 'j-1' }],
      ['/messaging/threads/th-1/messages', { body: 'The gate code is 4512.' }],
    ]);
  });

  it('refuses an empty or very long message', async () => {
    const { http } = fakeHttp({});
    await expect(tool('message_office').preview!({ message: '  ' }, ctx, http)).rejects.toThrow('What should the message say');
    await expect(tool('message_office').preview!({ message: 'x'.repeat(1001) }, ctx, http)).rejects.toThrow('too long');
  });
});

describe('job and quote numbers', () => {
  it('accepts a job number the customer says, from their own jobs only', async () => {
    const { http } = fakeHttp({
      'GET jobs /jobs/JOB-0412': new Error('404'),
      'GET jobs /jobs': { data: [job(), job({ id: 'j-9', jobNumber: 'JOB-0413' })] },
    });
    const p = await tool('request_reschedule').preview!({ jobId: 'job-0412', reason: 'other' }, ctx, http);
    expect(p.args).toMatchObject({ jobId: 'j-1' });
  });

  it('accepts a quote number', async () => {
    const { http } = fakeHttp({ 'GET finance /quotes/Q-0042': new Error('404'), 'GET finance /quotes': { data: [quote()] } });
    const p = await tool('accept_quote').preview!({ quoteId: 'Q-0042' }, ctx, http);
    expect(p.args).toEqual({ quoteId: 'q-1' });
  });

  it('still refuses a number that is not theirs', async () => {
    const { http } = fakeHttp({ 'GET jobs /jobs/JOB-7777': new Error('404'), 'GET jobs /jobs': { data: [job()] } });
    await expect(tool('request_reschedule').preview!({ jobId: 'JOB-7777', reason: 'other' }, ctx, http)).rejects.toThrow('not found on your account');
  });
});

