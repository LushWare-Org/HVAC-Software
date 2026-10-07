import { CREATE_JOB } from './tools/create-job';
import { confirmAction } from './action-runner';
import { signAction } from './action-token';
import { setKelvinQueueForTests } from '../kelvin/kelvin-events';
import { ToolRefusal, type AgentContext } from './types';

process.env.JWT_SECRET = 'test-secret';
const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'd@x.c', timezone: 'Asia/Colombo', token: 'jwt' };

const rr = {
  id: 'c-rr', firstName: 'R&R', lastName: 'Brothers (pvt) LTD', isActive: true, phone: '0771234567', email: 'ops@rr.lk',
  address: '12 Galle Rd', city: 'Colombo', state: 'WP', zipCode: '00300', latitude: 6.9, longitude: 79.85, addresses: [],
};

function http(routes: Record<string, any>) {
  const calls: Array<{ m: string; key: string; body?: any; params?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ m, key, ...(m === 'GET' ? { params: x } : { body: x }) });
    const v = routes[key];
    if (v instanceof Error) throw v;
    if (v === undefined) throw Object.assign(new Error('not found'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH') } as any, calls };
}

describe('create_job', () => {
  afterEach(() => setKelvinQueueForTests(null));

  it('previews a job with no time: it will go to the unassigned list', async () => {
    const { client } = http({ 'GET crm /customers/c-rr': rr });
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: '  AC not cooling\n' }, ctx, client);
    expect(p.title).toBe('Create a job for R&R Brothers (pvt) LTD');
    expect(p.lines).toEqual([
      'Customer: R&R Brothers (pvt) LTD',
      'Job: AC not cooling',
      'Address: 12 Galle Rd, Colombo',
      'When: no time yet, it goes to the unassigned list',
      'Technician: nobody yet',
    ]);
    expect(p.args).toMatchObject({ dto: { customerId: 'c-rr', customerName: 'R&R Brothers (pvt) LTD', title: 'AC not cooling', priority: 'NORMAL', serviceAddress: '12 Galle Rd', serviceLatitude: 6.9, estimatedDurationMins: 90 } });
  });

  it('refuses an inactive customer, and one without an address', async () => {
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': { ...rr, isActive: false } }).client)).rejects.toThrow(ToolRefusal);
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': { ...rr, address: null, addresses: [] } }).client)).rejects.toThrow('no address on file');
  });

  it('a single site keeps the customer\'s map location', async () => {
    const one = { ...rr, addresses: [{ id: 'a1', type: 'Site', line1: '12 Galle Rd', city: 'Colombo', isPrimary: true }] };
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': one }).client);
    expect(p.args).toMatchObject({ dto: { serviceAddress: '12 Galle Rd', serviceLatitude: 6.9, serviceLongitude: 79.85 } });
  });

  it('without a map location the card says so, and assignment never sends 0,0', async () => {
    const noMap = { ...rr, latitude: null, longitude: null };
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': noMap }).client);
    expect(p.lines).toContain('Map location: none on file, so travel time is not checked');
    expect((p.args as any).dto.serviceLatitude).toBeUndefined();
    const run = http({ 'POST jobs /jobs': { id: 'j', jobNumber: 'JOB-1' }, 'POST scheduling /dispatch/assign/manual': {} });
    await CREATE_JOB.run({ dto: { customerName: 'X', scheduledStart: 's', scheduledEnd: 'e' }, technicianId: 't', technicianName: 'K' }, ctx, run.client);
    const body = run.calls.find((c) => c.key === 'POST scheduling /dispatch/assign/manual')!.body;
    expect(body.jobLatitude).toBeUndefined();
    expect(body.jobLongitude).toBeUndefined();
  });

  it('asks which site when the customer has several', async () => {
    const sites = { ...rr, addresses: [
      { id: 'a1', type: 'Site', line1: 'Factory, Ja-Ela', city: 'Ja-Ela', isPrimary: true },
      { id: 'a2', type: 'Site', line1: 'Office, Colombo 3', city: 'Colombo', isPrimary: false },
    ] };
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': sites }).client))
      .rejects.toThrow('has 2 sites: Factory, Ja-Ela (id a1); Office, Colombo 3 (id a2). Which one?');
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', addressId: 'a2' }, ctx, http({ 'GET crm /customers/c-rr': sites }).client);
    expect(p.lines).toContain('Address: Office, Colombo 3, Colombo');
  });

  it('with a technician, the time must be one of their open times', async () => {
    const routes = {
      'GET crm /customers/c-rr': rr,
      'GET scheduling /technicians': { data: [{ id: 't-k', name: 'Kasun', isActive: true }] },
      'GET scheduling /dispatch/slots': { slots: [{ technicianId: 't-k', start: '2026-10-06T11:00:00.000Z', end: '2026-10-06T12:30:00.000Z' }] },
    };
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k' }, ctx, http(routes).client)).rejects.toThrow('Say when');
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k', start: '2026-10-06T17:00:00+05:30' }, ctx, http(routes).client))
      .rejects.toThrow("Kasun isn't free then. Open times that day: 4:30 pm");
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k', start: '2026-10-06T16:30:00+05:30', priority: 'EMERGENCY' }, ctx, http(routes).client);
    expect(p.lines).toEqual(expect.arrayContaining(['Priority: Emergency', 'Technician: Kasun']));
    expect(p.args).toMatchObject({ technicianId: 't-k', dto: { scheduledStart: '2026-10-06T11:00:00.000Z', scheduledEnd: '2026-10-06T12:30:00.000Z' } });
  });

  it('runs: creates, then assigns; an assignment failure keeps the job and says so', async () => {
    const created = { id: 'j-new', jobNumber: 'JOB-0452' };
    const args = { dto: { customerId: 'c-rr', customerName: 'R&R Brothers (pvt) LTD', title: 'x', scheduledStart: 's', scheduledEnd: 'e', serviceLatitude: 6.9, serviceLongitude: 79.85 }, technicianId: 't-k', technicianName: 'Kasun' };
    const okRun = http({ 'POST jobs /jobs': created, 'POST scheduling /dispatch/assign/manual': {} });
    expect(await CREATE_JOB.run(args, ctx, okRun.client)).toEqual({ done: true, jobId: 'j-new', id: 'j-new', jobNumber: 'JOB-0452', customerId: 'c-rr', customerName: 'R&R Brothers (pvt) LTD', summary: 'Created JOB-0452 for R&R Brothers (pvt) LTD, with Kasun', recordRef: 'job:j-new' });
    const failRun = http({ 'POST jobs /jobs': created, 'POST scheduling /dispatch/assign/manual': Object.assign(new Error('busy'), { response: { status: 409, data: { error: 'Kasun is already booked' } } }) });
    const r: any = await CREATE_JOB.run(args, ctx, failRun.client);
    expect(r.summary).toBe('Created JOB-0452 for R&R Brothers (pvt) LTD. Assigning Kasun failed (Kasun is already booked), so it is in the unassigned list');
  });

  it('confirming logs the action to Kelvin with the summary', async () => {
    const add = jest.fn(async (..._args: any[]) => ({}));
    setKelvinQueueForTests({ add } as any);
    jest.spyOn(CREATE_JOB, 'run').mockResolvedValueOnce({ done: true, summary: 'Created JOB-0452 for R&R', recordRef: 'job:j-new' });
    const { token } = signAction({ tool: 'create_job', args: {}, title: 'Create a job for R&R', lines: [] }, ctx);
    const out = await confirmAction(token, ctx, 'admin');
    expect(out).toMatchObject({ ok: true, message: 'Done: Created JOB-0452 for R&R.' });
    expect(add.mock.calls[0][1]).toMatchObject({ type: 'ACTION_DONE', action: 'create_job', summary: 'Created JOB-0452 for R&R', recordRef: 'job:j-new', confirmedBy: 'u' });
  });
});

describe('create_job inside a plan', () => {
  const scope = (rec: Record<string, unknown>) => ({ pending: (ref: string) => (ref.startsWith('@1') ? rec : undefined) });
  const newCustomer = { customerId: '@1', firstName: 'R&R', lastName: 'Brothers', phone: '0771234567', email: 'ops@rr.lk', address: '12 Galle Rd', city: 'Colombo' };

  it('uses a customer the plan creates earlier, keeping the reference for the run', async () => {
    const p = await CREATE_JOB.preview!({ customerId: '@1.customerId', title: 'AC not cooling' }, ctx, http({}).client, scope(newCustomer));
    expect(p.title).toBe('Create a job for R&R Brothers');
    expect(p.lines).toContain('Customer: R&R Brothers (new)');
    expect((p.args as any).dto).toMatchObject({ customerId: '@1.customerId', customerName: 'R&R Brothers', serviceAddress: '12 Galle Rd', customerPhone: '0771234567' });
    expect(CREATE_JOB.provides!(p.args as any, p)).toMatchObject({ jobId: '@pending', customerName: 'R&R Brothers' });
  });

  it('books an agreement visit when given an agreement', async () => {
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'Annual service', agreementId: 'ag-1' }, ctx, http({ 'GET crm /customers/c-rr': rr }).client);
    expect((p.args as any).dto).toMatchObject({ agreementId: 'ag-1', isAgreementJob: true });
    expect(p.lines).toContain('Part of a service agreement');
  });

  it('undo cancels the job it created', () => {
    expect(CREATE_JOB.reverse!({ dto: { customerName: 'R&R' } }, { jobId: 'j-new', jobNumber: 'JOB-0452' }, ctx))
      .toEqual({ tool: 'cancel_job', args: { jobId: 'j-new', reason: 'Undone in Kelvin' }, title: 'Cancel JOB-0452' });
  });
});
