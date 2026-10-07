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
    const { http, calls } = fakeHttp({ 'GET /jobs/j-1': job, 'POST /messaging/threads': { id: 'th' }, 'POST /messaging/threads/th/messages': {} });
    const p = await tool('message_customer').preview!({ jobId: 'j-1', message: 'Nuwan is running 20 minutes late.' }, ctx, http);
    expect(p.lines).toEqual(['About JOB-0412: AC repair', '"Nuwan is running 20 minutes late."']);
    expect(tool('message_customer').sends!(p.args!)).toBe('Message to Sara Perera');
    await tool('message_customer').run(p.args!, ctx, http);
    expect(calls.slice(-2).map((c) => c.body)).toEqual([
      { customerId: 'c-1', customerName: 'Sara Perera', subject: 'About JOB-0412', jobId: 'j-1' },
      { body: 'Nuwan is running 20 minutes late.' },
    ]);
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
