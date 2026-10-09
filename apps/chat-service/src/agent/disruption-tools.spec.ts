import { DISRUPTION_TOOLS } from './tools/disruption-tools';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'd@x', timezone: 'Asia/Dubai' };
const tool = (n: string) => DISRUPTION_TOOLS.find((t) => t.name === n)!;

function fakeHttp(routes: Record<string, unknown>) {
  const calls: Array<{ method: string; path: string; body?: any }> = [];
  const answer = (method: string) => async (_s: string, path: string, body?: any) => {
    if (method === 'GET' && body && typeof body === 'object') calls.push({ method: 'PARAMS', path, body });
    calls.push({ method, path, body });
    const key = `${method} ${path}`;
    if (!(key in routes)) throw new Error(`unexpected ${key}`);
    return routes[key];
  };
  return { http: { get: answer('GET'), post: answer('POST'), patch: answer('PATCH'), put: answer('PUT'), delete: answer('DELETE') } as any, calls };
}

const job = { id: 'j-1', jobNumber: 'JOB-0412', title: 'AC repair', customerId: 'c-1', customerName: 'Sara Perera', status: 'SCHEDULED', scheduledStart: '2026-10-07T07:00:00Z', assignedToName: 'Nuwan Silva' };
const techs = { data: [{ id: 't-n', name: 'Nuwan Silva', isActive: true }, { id: 't-k', name: 'Kasun Fernando', isActive: true }, { id: 't-h', name: 'Helper Hari', isActive: true }] };
const crew = { data: [
  { assignment: { isLead: true }, technician: { id: 't-n', name: 'Nuwan Silva' } },
  { assignment: { isLead: false }, technician: { id: 't-h', name: 'Helper Hari' } },
] };

describe('reassign_job', () => {
  it('swaps the lead by name and keeps helpers on', async () => {
    const { http } = fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': crew, 'GET /technicians': techs });
    const p = await tool('reassign_job').preview!({ jobId: 'j-1', technician: 'kasun' }, ctx, http);
    expect(p.title).toBe('Give JOB-0412 to Kasun Fernando');
    expect(p.lines[1]).toMatch(/^From Nuwan Silva to Kasun Fernando, /);
    expect(p.lines).toContain('1 helper stays on the job.');
    expect(p.args).toMatchObject({ jobId: 'j-1', technicianIds: ['t-k', 't-h'], leadTechnicianId: 't-k' });
  });

  it('refuses once the technician is on the way, or when nobody is assigned yet', async () => {
    const going = fakeHttp({ 'GET /jobs/j-1': { ...job, status: 'EN_ROUTE' } });
    await expect(tool('reassign_job').preview!({ jobId: 'j-1', technician: 'Kasun' }, ctx, going.http)).rejects.toThrow('already on the way');
    const empty = fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': { data: [] } });
    await expect(tool('reassign_job').preview!({ jobId: 'j-1', technician: 'Kasun' }, ctx, empty.http)).rejects.toThrow('nobody assigned yet');
  });

  it('refuses an ambiguous or same technician', async () => {
    const same = fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': crew, 'GET /technicians': techs });
    await expect(tool('reassign_job').preview!({ jobId: 'j-1', technician: 'Nuwan Silva' }, ctx, same.http)).rejects.toThrow('already has');
    const vague = fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': crew, 'GET /technicians': techs });
    await expect(tool('reassign_job').preview!({ jobId: 'j-1', technician: 'a' }, ctx, vague.http)).rejects.toThrow('No single technician');
  });

  it('undo hands it back, unless it was given to someone else since', async () => {
    const { http } = fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': crew, 'GET /technicians': techs });
    const p = await tool('reassign_job').preview!({ jobId: 'j-1', technician: 'kasun' }, ctx, http);
    const back = tool('reassign_job').reverse!(p.args!, { done: true }, ctx)!;
    expect(back).toEqual({ tool: 'reassign_job', args: { jobId: 'j-1', technician: 't-n', expectLeadId: 't-k' }, title: 'Give JOB-0412 back to Nuwan Silva' });
    const kasunNow = { data: [{ assignment: { isLead: true }, technician: { id: 't-k', name: 'Kasun Fernando' } }, crew.data[1]] };
    const ok = await tool('reassign_job').preview!(back.args, ctx, fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': kasunNow, 'GET /technicians': techs }).http);
    expect(ok.args).toMatchObject({ technicianIds: ['t-n', 't-h'], leadTechnicianId: 't-n' });
    await expect(tool('reassign_job').preview!(back.args, ctx, fakeHttp({ 'GET /jobs/j-1': job, 'GET /dispatch/jobs/j-1/crew': crew }).http))
      .rejects.toThrow('given to someone else since');
  });

  it('changes the crew in one call', async () => {
    const { http, calls } = fakeHttp({ 'PATCH /dispatch/jobs/j-1/crew': {} });
    await tool('reassign_job').run({ jobId: 'j-1', technicianIds: ['t-k'], leadTechnicianId: 't-k' }, ctx, http);
    expect(calls[0].body).toEqual({ technicianIds: ['t-k'], leadTechnicianId: 't-k' });
  });
});

describe('message_customer', () => {
  it("shows the wording and posts to the job's customer", async () => {
    const { http, calls } = fakeHttp({ 'GET /jobs/j-1': job, 'POST /chat/customers/c-1/messages': { conversationId: 'cv' } });
    const p = await tool('message_customer').preview!({ jobId: 'j-1', message: 'Nuwan is running 20 minutes late.' }, ctx, http);
    expect(p.lines).toEqual(['About JOB-0412: AC repair', '"Nuwan is running 20 minutes late."', 'Sends as: in-app message.']);
    expect(tool('message_customer').sends!(p.args!)).toBe('In-app message to Sara Perera');
    await tool('message_customer').run(p.args!, ctx, http);
    expect(calls.filter((c) => c.method === 'POST').map((c) => [c.path, c.body])).toEqual([
      ['/chat/customers/c-1/messages', { body: 'Nuwan is running 20 minutes late.', jobId: 'j-1', via: 'kelvin' }],
    ]);
  });

  it('also emails and pushes when asked, and says honestly what could not be sent', async () => {
    const { http, calls } = fakeHttp({
      'GET /jobs/j-1': { ...job, customerEmail: 'sara@x.lk' },
      'POST /chat/customers/c-1/messages': { conversationId: 'cv' },
      'POST /notifications/direct': { name: 'Sara Perera', results: { email: 'sent' } },
    });
    const p = await tool('message_customer').preview!({ jobId: 'j-1', message: 'Running late.', channels: ['message', 'email', 'push'] }, ctx, http);
    expect(p.lines).toContain('Sends as: in-app message, email, push notification (to sara@x.lk).');
    const out: any = await tool('message_customer').run(p.args!, ctx, http);
    // With a chat message, the push rides along with it: not sent twice.
    expect(calls.find((c) => c.path === '/notifications/direct')!.body).toMatchObject({
      to: 'customer', id: 'c-1', channels: ['email'], jobId: 'j-1', title: 'About your visit (JOB-0412)', message: 'Running late.',
    });
    expect(out.summary).toBe('In-app message and email to Sara Perera: sent. The push goes with the message if they have notifications on');
  });

  it('drops email when there is no address, and refuses when nothing is left', async () => {
    const { http } = fakeHttp({ 'GET /jobs/j-1': job, 'GET /customers/c-1': { id: 'c-1', email: null } });
    const p = await tool('message_customer').preview!({ jobId: 'j-1', message: 'Hi', channels: ['email', 'push'] }, ctx, http);
    expect(p.args!.channels).toEqual(['push']);
    expect(p.lines).toContain("Sara Perera has no email address on file, so it won't be emailed.");
    await expect(tool('message_customer').preview!({ jobId: 'j-1', message: 'Hi', channels: ['email'] }, ctx, http)).rejects.toThrow('no email address');
  });

  it('can message a customer without a job', async () => {
    const { http } = fakeHttp({ 'GET /customers/c-9': { id: 'c-9', firstName: 'Yumeth', lastName: 'Sumathipala', email: 'y@x.lk' } });
    const p = await tool('message_customer').preview!({ customerId: 'c-9', message: 'Your annual service is due.', channels: ['email'] }, ctx, http);
    expect(p.title).toBe('Message Yumeth Sumathipala');
    expect(p.args).toMatchObject({ customerId: 'c-9', channels: ['email'], subject: 'A message from us' });
  });
});

describe('message_technician', () => {
  const people = { data: [{ id: 't-r', userId: 'u-r', name: 'RP Tech', isActive: true }] };

  it("messages them in their office chat by default, which also pushes", async () => {
    const { http, calls } = fakeHttp({
      'GET /technicians': people, 'POST /chat/conversations/tech-office': { id: 'cv-t' }, 'POST /chat/conversations/cv-t/messages': {},
    });
    const p = await tool('message_technician').preview!({ technician: 'RP', message: 'Bring the ladder.' }, ctx, http);
    expect(p.lines).toEqual(['"Bring the ladder."', 'Sends as: in-app message, push notification.']);
    const out: any = await tool('message_technician').run(p.args!, ctx, http);
    expect(calls.find((c) => c.path === '/chat/conversations/tech-office')!.body).toEqual({ techUserId: 'u-r' });
    expect(calls.find((c) => c.path === '/chat/conversations/cv-t/messages')!.body).toMatchObject({ body: 'Bring the ladder.', via: 'kelvin' });
    expect(calls.some((c) => c.path === '/notifications/direct')).toBe(false);
    expect(out.summary).toBe('In-app message to RP Tech: sent. The push goes with the message if they have notifications on');
  });

  it('fails plainly when nothing reaches them', async () => {
    const { http } = fakeHttp({ 'GET /technicians': people, 'POST /notifications/direct': { results: { email: 'no-email' } } });
    const p = await tool('message_technician').preview!({ technician: 'RP', message: 'Hi', channels: ['email'] }, ctx, http);
    await expect(tool('message_technician').run(p.args!, ctx, http)).rejects.toThrow('Nothing reached RP Tech. No email: no email address on file.');
  });
});

describe('get_disruptions', () => {
  it('summarises disruptions with their options', async () => {
    const { http } = fakeHttp({ 'GET /dispatch/disruptions': { disruptions: [{
      kind: 'OVERRUN', jobNumber: 'JOB-A', technicianName: 'Nuwan', detail: 'Nuwan has been at JOB-A 50 minutes longer than planned.',
      knockOn: [{ jobNumber: 'JOB-B', delayMins: 25 }],
      options: [{ label: 'Give JOB-B to Kasun, on time', request: 'Reassign JOB-B to Kasun Fernando' }],
    }] } });
    const out: any = await tool('get_disruptions').run({}, ctx, http);
    expect(out.disruptions[0]).toMatchObject({ job: 'JOB-A', laterJobsMadeLate: ['JOB-B (25 min)'], options: [{ howToDoIt: 'Reassign JOB-B to Kasun Fernando' }] });
  });
});

describe('set_technician_availability', () => {
  const people = { data: [{ id: 't-n', userId: 'u-n', name: 'Nuwan Silva', isActive: true }] };
  const visits = { data: [
    { jobNumber: 'JOB-1', status: 'SCHEDULED', scheduledStart: '2026-10-07T05:00:00Z', scheduledEnd: '2026-10-07T06:00:00Z', customerName: 'Sara' }, // 09:00 Dubai
    { jobNumber: 'JOB-2', status: 'SCHEDULED', scheduledStart: '2026-10-07T10:00:00Z', scheduledEnd: '2026-10-07T11:00:00Z', customerName: 'Ali' }, // 14:00 Dubai
    { jobNumber: 'JOB-3', status: 'COMPLETED', scheduledStart: '2026-10-07T04:00:00Z' },
  ] };

  it('lists the booked visits a day off affects, searching that technician and day in company time', async () => {
    const { http, calls } = fakeHttp({ 'GET /technicians': people, 'GET /jobs': visits });
    const p = await tool('set_technician_availability').preview!({ technician: 'Nuwan', from: '2026-10-07', status: 'off', note: 'Sick' }, ctx, http);
    expect(p.title).toBe('Nuwan Silva: off');
    expect(p.lines[0]).toBe('Nuwan Silva off Wed 7 Oct (Sick)');
    expect(p.lines[1]).toBe('2 booked visits will need someone else or another time:');
    expect(p.lines).toEqual(expect.arrayContaining([expect.stringMatching(/^JOB-1, Wed 7 Oct, 9:00 am, Sara$/)]));
    const search = calls.find((c) => c.method === 'PARAMS' && c.path === '/jobs')!.body;
    expect(search).toMatchObject({ crewUserId: 'u-n', dateFrom: '2026-10-07T00:00:00+04:00', dateTo: '2026-10-07T23:59:59+04:00' });
    expect(p.args).toMatchObject({ technicianId: 't-n', dates: ['2026-10-07'], status: 'off', note: 'Sick' });
  });

  it('for different hours, lists only visits outside the new hours', async () => {
    const { http } = fakeHttp({ 'GET /technicians': people, 'GET /jobs': visits });
    const p = await tool('set_technician_availability').preview!({ technician: 't-n', from: '2026-10-07', status: 'hours', start: '08:00', end: '12:00' }, ctx, http);
    expect(p.lines[1]).toBe('1 booked visit will need someone else or another time:');
    expect(p.lines[2]).toMatch(/^JOB-2, /);
  });

  it('refuses bad hours and more than 14 days', async () => {
    const { http } = fakeHttp({ 'GET /technicians': people, 'GET /jobs': visits });
    await expect(tool('set_technician_availability').preview!({ technician: 'Nuwan', from: '2026-10-07', status: 'hours', start: '13:00', end: '12:00' }, ctx, http)).rejects.toThrow('start and end times');
    await expect(tool('set_technician_availability').preview!({ technician: 'Nuwan', from: '2026-10-01', to: '2026-10-20', status: 'off' }, ctx, http)).rejects.toThrow('at most 14 days');
  });

  it('sets each day, or clears them for a normal day', async () => {
    const off = fakeHttp({ 'PUT /dispatch/availability/t-n/2026-10-07': {}, 'PUT /dispatch/availability/t-n/2026-10-08': {} });
    await tool('set_technician_availability').run({ technicianId: 't-n', dates: ['2026-10-07', '2026-10-08'], status: 'off', note: 'Leave' }, ctx, off.http);
    expect(off.calls.map((c) => [c.method, c.path, c.body])).toEqual([
      ['PUT', '/dispatch/availability/t-n/2026-10-07', { available: false, note: 'Leave' }],
      ['PUT', '/dispatch/availability/t-n/2026-10-08', { available: false, note: 'Leave' }],
    ]);
    const back = fakeHttp({ 'DELETE /dispatch/availability/t-n/2026-10-07': undefined });
    await tool('set_technician_availability').run({ technicianId: 't-n', dates: ['2026-10-07'], status: 'normal' }, ctx, back.http);
    expect(back.calls[0]).toMatchObject({ method: 'DELETE', path: '/dispatch/availability/t-n/2026-10-07' });
  });
});

describe('request_location', () => {
  it('asks the customer by every channel and reports what reached them', async () => {
    const { http, calls } = fakeHttp({
      'GET /jobs/j-1': job,
      'POST /jobs/j-1/location-request': { url: 'https://p/share-location/t', results: { message: 'sent', email: 'sent', push: 'no-device' } },
    });
    const p = await tool('request_location').preview!({ jobId: 'j-1' }, ctx, http);
    expect(p.lines).toContain('It has no map location yet.');
    const out: any = await tool('request_location').run(p.args!, ctx, http);
    expect(calls.find((c) => c.path === '/jobs/j-1/location-request')!.body).toEqual({ channels: ['message', 'email', 'push'] });
    expect(out.summary).toBe('Asked Sara Perera where JOB-0412 is (in-app message, email). Not sent: push: notifications not turned on');
  });

  it('refuses a finished job', async () => {
    const { http } = fakeHttp({ 'GET /jobs/j-1': { ...job, status: 'COMPLETED' } });
    await expect(tool('request_location').preview!({ jobId: 'j-1' }, ctx, http)).rejects.toThrow('already done');
  });
});
