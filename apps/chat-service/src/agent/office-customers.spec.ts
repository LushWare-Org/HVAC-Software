import { CUSTOMER_OFFICE_TOOLS } from './tools/office-customers';
import { ToolRefusal, type AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => CUSTOMER_OFFICE_TOOLS.find((t) => t.name === n)!;

/** Answers by "METHOD service path"; query params are matched by a function when given. */
function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any; params?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, ...(m === 'GET' ? { params: x } : { body: x }) });
    const v = routes[key];
    if (typeof v === 'function') return v(x);
    if (v instanceof Error) throw v;
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), put: h('PUT'), patch: h('PATCH') } as any, calls };
}
const none = { 'GET crm /customers': { data: [] } };

describe('create_customer', () => {
  it('previews a new customer from a full name, phone and address', async () => {
    const p = await tool('create_customer').preview!({ name: 'R&R Brothers (pvt) LTD', phone: '077 123 4567', address: '12 Galle Rd', city: 'Colombo', type: 'COMMERCIAL' }, ctx, http(none).client);
    expect(p.title).toBe('Add customer R&R Brothers (pvt) LTD');
    expect(p.lines).toEqual(['Name: R&R Brothers (pvt) LTD', 'Phone: 077 123 4567', 'Address: 12 Galle Rd, Colombo', 'Type: commercial']);
    expect((p.args as any).body).toMatchObject({ firstName: 'R&R', lastName: 'Brothers (pvt) LTD', phone: '077 123 4567', type: 'COMMERCIAL' });
    expect(tool('create_customer').provides!(p.args as any, p)).toMatchObject({ customerId: '@pending', customerName: 'R&R Brothers (pvt) LTD', phone: '077 123 4567' });
  });

  it('needs a name and a way to reach them', async () => {
    await expect(tool('create_customer').preview!({ name: 'R&R' }, ctx, http(none).client)).rejects.toThrow('phone or email');
    await expect(tool('create_customer').preview!({ phone: '0771234567' }, ctx, http(none).client)).rejects.toThrow('name');
  });

  it('refuses a duplicate by phone, email or exact name, and says which one exists', async () => {
    const existing = { id: 'c-1', firstName: 'R&R', lastName: 'Brothers (pvt) LTD', phone: '+94 77 123 4567', email: 'ops@rr.lk' };
    const routes = { 'GET crm /customers': (q: any) => ({ data: q.search && ['4567', 'ops@rr.lk', 'R&R Brothers (pvt) LTD'].some((x) => String(q.search).toLowerCase().includes(x.toLowerCase())) ? [existing] : [] }) };
    await expect(tool('create_customer').preview!({ name: 'Someone', phone: '0771234567' }, ctx, http(routes).client))
      .rejects.toThrow('R&R Brothers (pvt) LTD already exists (id c-1). Use that customer instead.');
    await expect(tool('create_customer').preview!({ name: 'r&r brothers (pvt) ltd', email: 'new@x.com' }, ctx, http(routes).client)).rejects.toThrow(ToolRefusal);
  });

  it('runs, returns the new id for later steps, and can be undone by hiding', async () => {
    const h = http({ ...none, 'POST crm /customers': { id: 'c-9' } });
    const p = await tool('create_customer').preview!({ name: 'R&R Brothers', email: 'ops@rr.lk' }, ctx, h.client);
    const r: any = await tool('create_customer').run(p.args as any, ctx, h.client);
    expect(r).toMatchObject({ customerId: 'c-9', customerName: 'R&R Brothers', customerEmail: 'ops@rr.lk' });
    expect(tool('create_customer').reverse!(p.args as any, r, ctx)).toEqual({ tool: 'hide_customer', args: { customerId: 'c-9', name: 'R&R Brothers' }, title: 'Remove customer R&R Brothers' });
  });
});

describe('hide_customer (undo only)', () => {
  it('is internal', () => expect(tool('hide_customer').internal).toBe(true));

  it('refuses once anything was created for the customer', async () => {
    const h = http({ 'GET jobs /jobs': { data: [{ id: 'j' }] }, 'GET finance /quotes': { data: [] }, 'GET finance /invoices': { data: [] } });
    await expect(tool('hide_customer').preview!({ customerId: 'c-9', name: 'R&R' }, ctx, h.client)).rejects.toThrow('already has jobs, quotes or invoices');
  });

  it('ignores what the same undo just cancelled or voided', async () => {
    const h = http({ 'GET jobs /jobs': { data: [{ id: 'j', status: 'CANCELLED' }] }, 'GET finance /quotes': { data: [] }, 'GET finance /invoices': { data: [{ id: 'i', status: 'VOID' }] }, 'PUT crm /customers/c-9': {} });
    await expect(tool('hide_customer').preview!({ customerId: 'c-9', name: 'R&R' }, ctx, h.client)).resolves.toBeDefined();
  });

  it('hides a customer nothing uses yet', async () => {
    const h = http({ 'GET jobs /jobs': { data: [] }, 'GET finance /quotes': { data: [] }, 'GET finance /invoices': { data: [] }, 'PUT crm /customers/c-9': {} });
    await tool('hide_customer').preview!({ customerId: 'c-9', name: 'R&R' }, ctx, h.client);
    await tool('hide_customer').run({ customerId: 'c-9', name: 'R&R' }, ctx, h.client);
    expect(h.calls.find((c) => c.key === 'PUT crm /customers/c-9')?.body).toEqual({ isActive: false });
  });
});

describe('update_customer', () => {
  const c = { id: 'c-1', firstName: 'R&R', lastName: 'Brothers', phone: '0771', email: 'old@rr.lk', address: '12 Galle Rd', city: 'Colombo' };

  it('shows old to new, and undo puts the old values back', async () => {
    const h = http({ 'GET crm /customers/c-1': c, 'PUT crm /customers/c-1': {} });
    const p = await tool('update_customer').preview!({ customerId: 'c-1', email: 'new@rr.lk', phone: '0771' }, ctx, h.client);
    expect(p.lines).toEqual(['Email: old@rr.lk → new@rr.lk']);
    await tool('update_customer').run(p.args as any, ctx, h.client);
    expect(h.calls.find((x) => x.key === 'PUT crm /customers/c-1')?.body).toEqual({ email: 'new@rr.lk' });
    const back = tool('update_customer').reverse!(p.args as any, {}, ctx)!;
    expect(back).toEqual({ tool: 'restore_customer_details', args: { customerId: 'c-1', name: 'R&R Brothers', changes: { email: 'old@rr.lk' }, expect: { email: 'new@rr.lk' } }, title: 'Put back R&R Brothers\'s old details' });
  });

  it('undo of a field that was empty clears it (null, not an invalid empty string)', async () => {
    const p = await tool('update_customer').preview!({ customerId: 'c-1', city: 'Kandy' }, ctx, http({ 'GET crm /customers/c-1': { ...c, city: null } }).client);
    expect(tool('update_customer').reverse!(p.args as any, {}, ctx)!.args).toMatchObject({ changes: { city: null }, expect: { city: 'Kandy' } });
  });

  it('undo refuses if someone changed those details again since', async () => {
    const h = http({ 'GET crm /customers/c-1': { ...c, email: 'someone-else@rr.lk' } });
    await expect(tool('restore_customer_details').preview!({ customerId: 'c-1', name: 'R&R Brothers', changes: { email: 'old@rr.lk' }, expect: { email: 'new@rr.lk' } }, ctx, h.client))
      .rejects.toThrow('changed again since');
  });

  it('refuses when nothing would change', async () => {
    await expect(tool('update_customer').preview!({ customerId: 'c-1', phone: '0771' }, ctx, http({ 'GET crm /customers/c-1': c }).client)).rejects.toThrow('Nothing would change');
  });
});
