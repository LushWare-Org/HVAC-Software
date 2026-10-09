import { TECHNICIAN_TOOLS } from './tools/technician-kelvin';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u-k', role: 'technician', email: 'k@x', name: 'Kasun Fernando', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => TECHNICIAN_TOOLS.find((t) => t.name === n)!;

function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, body: x });
    const v = routes[key];
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: `Not found ${key}` } } });
    return typeof v === 'function' ? v(x) : v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH') } as any, calls };
}

const job = (extra: Record<string, unknown> = {}) => ({
  id: 'j-1', jobNumber: 'JOB-0412', title: 'AC not cooling', customerId: 'c-1', customerName: 'Sara Perera',
  serviceAddress: '12 Marina Walk', status: 'SCHEDULED', scheduledStart: '2026-10-08T05:30:00Z', crewUserIds: ['u-k'], assignedToId: 'u-k', notes: 'Bedroom unit', ...extra,
});
const base = (j = job(), extra: Record<string, any> = {}) => ({
  'GET jobs /jobs/j-1': j,
  'GET scheduling /technicians/me': { id: 't-k', userId: 'u-k', name: 'Kasun Fernando' },
  'GET scheduling /dispatch/assignments/job/j-1': { data: [{ id: 'a-9', technicianId: 't-other' }, { id: 'a-1', technicianId: 't-k' }] },
  'GET jobs /work-orders/by-job/j-1': [{ id: 'wo-1', technicianId: 'u-k', tasks: [{ title: 'Check refrigerant', isRequired: true, isCompleted: true }] }],
  ...extra,
});

describe('only their own visits', () => {
  it('refuses a job they are not on', async () => {
    await expect(tool('start_route').preview!({ jobId: 'j-1' }, ctx, http(base(job({ crewUserIds: ['someone'], assignedToId: 'someone' }))).client))
      .rejects.toThrow('not one of your visits');
  });

  it('"this job" with no id means the visit they are on now', async () => {
    const h = http({ ...base(job({ status: 'ON_SITE' })), 'GET jobs /jobs': { data: [job({ id: 'j-0', status: 'SCHEDULED' }), job({ status: 'ON_SITE' })] } });
    const p = await tool('add_job_note').preview!({ note: 'Replaced capacitor' }, ctx, h.client);
    expect(p.args).toMatchObject({ jobId: 'j-1' });
  });
});

describe('status steps', () => {
  it('start_route moves their assignment and the job to on the way', async () => {
    const h = http({ ...base(), 'PATCH scheduling /dispatch/assignments/a-1/status': {}, 'PATCH jobs /jobs/j-1/status': {} });
    const p = await tool('start_route').preview!({ jobId: 'j-1' }, ctx, h.client);
    expect(p.title).toBe('On the way to JOB-0412');
    expect(p.lines).toContain('The office and Sara Perera see you are on the way.');
    await tool('start_route').run(p.args!, ctx, h.client);
    expect(h.calls.filter((c) => c.key.startsWith('PATCH')).map((c) => [c.key, c.body])).toEqual([
      ['PATCH scheduling /dispatch/assignments/a-1/status', { status: 'EN_ROUTE' }],
      ['PATCH jobs /jobs/j-1/status', { status: 'EN_ROUTE', note: 'Technician: Start Route (via Kelvin)' }],
    ]);
  });

  it('start_route refuses a job already under way', async () => {
    await expect(tool('start_route').preview!({ jobId: 'j-1' }, ctx, http(base(job({ status: 'ON_SITE' }))).client)).rejects.toThrow('already');
  });

  it('arrived also checks them in on their work order', async () => {
    const h = http({ ...base(job({ status: 'EN_ROUTE' })), 'PATCH scheduling /dispatch/assignments/a-1/status': {}, 'PATCH jobs /jobs/j-1/status': {}, 'PATCH jobs /work-orders/wo-1/check-in': {} });
    const p = await tool('arrived').preview!({ jobId: 'j-1' }, ctx, h.client);
    await tool('arrived').run(p.args!, ctx, h.client);
    expect(h.calls.filter((c) => c.key.startsWith('PATCH')).map((c) => c.key)).toEqual([
      'PATCH scheduling /dispatch/assignments/a-1/status', 'PATCH jobs /jobs/j-1/status', 'PATCH jobs /work-orders/wo-1/check-in',
    ]);
  });
});

describe('finish_job', () => {
  const filter = { id: 'p-f', name: 'Filter 16x25', unitPrice: '12.50', category: 'PART', taxable: true, isActive: true, unit: 'each' };
  const onSite = (extra: Record<string, any> = {}) => base(job({ status: 'ON_SITE' }), { 'GET jobs /price-book/p-f': filter, ...extra });

  it('one card: the parts used from the price book, then complete', async () => {
    const h = http({
      ...onSite(),
      'POST jobs /work-orders/wo-1/line-items': {}, 'PATCH jobs /work-orders/wo-1/check-out': {},
      'PATCH scheduling /dispatch/assignments/a-1/status': {}, 'PATCH jobs /jobs/j-1/status': {},
    });
    const p = await tool('finish_job').preview!({ jobId: 'j-1', parts: [{ itemId: 'p-f', quantity: 2, unitPrice: 1 }], note: 'Cleaned coils' }, ctx, h.client);
    expect(p.title).toBe('Finish JOB-0412');
    expect(p.lines).toEqual(['Used: 2 × Filter 16x25', 'Note: Cleaned coils', 'Marks the visit complete and checks you out.']);
    await tool('finish_job').run(p.args!, ctx, h.client);
    expect(h.calls.filter((c) => c.key.startsWith('P')).map((c) => [c.key, c.body])).toEqual([
      ['POST jobs /work-orders/wo-1/line-items', { priceBookItemId: 'p-f', description: 'Filter 16x25', category: 'PART', quantity: 2, unitPrice: 12.5, taxable: true }],
      ['PATCH jobs /work-orders/wo-1/check-out', { notes: 'Cleaned coils' }],
      ['PATCH scheduling /dispatch/assignments/a-1/status', { status: 'COMPLETED' }],
      ['PATCH jobs /jobs/j-1/status', { status: 'COMPLETED', note: 'Technician: Complete Job (via Kelvin)' }],
    ]);
  });

  it('refuses while required checklist tasks are open, naming them', async () => {
    const h = http(onSite({ 'GET jobs /work-orders/by-job/j-1': [{ id: 'wo-1', technicianId: 'u-k', tasks: [{ title: 'Take photos', isRequired: true, isCompleted: false }, { title: 'Optional', isRequired: false, isCompleted: false }] }] }));
    await expect(tool('finish_job').preview!({ jobId: 'j-1' }, ctx, h.client)).rejects.toThrow('Take photos');
  });

  it('only from on site, and never with a part not in the price book', async () => {
    await expect(tool('finish_job').preview!({ jobId: 'j-1' }, ctx, http(base()).client)).rejects.toThrow('arrived');
    await expect(tool('finish_job').preview!({ jobId: 'j-1', parts: [{ itemId: 'nope', quantity: 1 }] }, ctx, http(onSite()).client)).rejects.toThrow('price book');
  });
});

describe('notes, parts and messages', () => {
  it('add_job_note appends a dated note with their name', async () => {
    const h = http({ ...base(), 'PATCH jobs /jobs/j-1': {} });
    const p = await tool('add_job_note').preview!({ jobId: 'j-1', note: 'Unit is R22, needs replacing soon' }, ctx, h.client);
    await tool('add_job_note').run(p.args!, ctx, h.client);
    expect(h.calls.at(-1)!.body.notes).toMatch(/^Bedroom unit\n\nKasun Fernando \(\d{4}-\d{2}-\d{2}\): Unit is R22, needs replacing soon$/);
  });

  it('log_parts adds them to their work order without finishing', async () => {
    const filter = { id: 'p-f', name: 'Filter 16x25', unitPrice: '12.50', category: 'PART', taxable: true, isActive: true };
    const h = http({ ...base(job({ status: 'ON_SITE' })), 'GET jobs /price-book/p-f': filter, 'POST jobs /work-orders/wo-1/line-items': {} });
    const p = await tool('log_parts').preview!({ jobId: 'j-1', parts: [{ itemId: 'p-f', quantity: 1 }] }, ctx, h.client);
    expect(p.lines).toEqual(['1 × Filter 16x25', 'Taken from your van stock.']);
    await tool('log_parts').run(p.args!, ctx, h.client);
    expect(h.calls.filter((c) => c.key.startsWith('P')).map((c) => c.key)).toEqual(['POST jobs /work-orders/wo-1/line-items']);
  });

  it('job_brief says which project and house or unit a visit is for', async () => {
    const h = http({
      ...base(job({ projectId: 'p-mall', componentId: 'c-12', customerId: undefined })),
      'GET crm /projects/p-mall': { id: 'p-mall', name: 'Colombo Mall — Chiller Retrofit', siteAddress: '1 Mall Rd', notes: 'Gate pass at security.' },
      'GET crm /components/c-12': { id: 'c-12', label: 'Plant room B', ownerName: null },
    });
    const out: any = await tool('job_brief').run({ jobId: 'j-1' }, ctx, h.client);
    expect(out.project).toEqual({ name: 'Colombo Mall — Chiller Retrofit', unit: 'Plant room B', site: '1 Mall Rd', siteNotes: 'Gate pass at security.' });
  });

  it('van_stock reads their own van only', async () => {
    const h = http({
      'GET scheduling /technicians/me': { id: 't-k', userId: 'u-k' },
      'GET inventory /locations': [{ id: 'l-1', type: 'VAN', technicianId: 'u-other' }, { id: 'l-2', type: 'VAN', technicianId: 'u-k' }],
      'GET inventory /locations/l-2/stock': { data: [{ quantity: '3', item: { name: 'Filter 16x25', sku: 'F1' } }, { quantity: '0', item: { name: 'Capacitor', sku: 'C1' } }] },
    });
    expect(await tool('van_stock').run({ search: 'filter' }, ctx, h.client)).toEqual({ items: [{ item: 'Filter 16x25', sku: 'F1', quantity: 3 }] });
  });

  it('my_day lists their crew visits for the day in order', async () => {
    const h = http({ 'GET jobs /jobs': (q: any) => (q.crewUserId === 'u-k' ? { data: [job({ id: 'j-2', jobNumber: 'JOB-0500', scheduledStart: '2026-10-08T09:00:00Z' }), job()] } : { data: [] }) });
    const out: any = await tool('my_day').run({ date: '2026-10-08' }, ctx, h.client);
    expect(out.visits.map((v: any) => v.job)).toEqual(['JOB-0412', 'JOB-0500']);
  });
});
