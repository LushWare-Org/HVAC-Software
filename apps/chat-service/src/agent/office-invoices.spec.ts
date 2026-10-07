import { INVOICE_TOOLS } from './tools/office-invoices';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'office_manager', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => INVOICE_TOOLS.find((t) => t.name === n)!;
function http(routes: Record<string, any>) {
  const calls: Array<{ key: string; body?: any; params?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ key, ...(m === 'GET' ? { params: x } : { body: x }) });
    const v = routes[key];
    if (typeof v === 'function') return v(x);
    if (v === undefined) throw Object.assign(new Error('nf'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH') } as any, calls };
}
const inv = { id: 'i-1', invoiceNumber: 'INV-0099', status: 'SENT', total: '505.00', balanceDue: '505.00', currency: 'USD', customerName: 'R&R', customerEmail: 'ops@rr.lk' };

describe('record_payment', () => {
  it('records a partial cash payment, says what is left, and that a receipt is emailed', async () => {
    const p = await tool('record_payment').preview!({ invoiceId: 'i-1', amount: 480, method: 'CASH' }, ctx, http({ 'GET finance /invoices/i-1': inv }).client);
    expect(p.title).toBe('Record $480.00 cash for INV-0099');
    expect(p.lines).toEqual(['From: R&R', 'Leaves $25.00 to pay']);
    expect(tool('record_payment').sends!(p.args as any)).toBe('Receipt emailed to ops@rr.lk');
    expect(tool('record_payment').reverse).toBeUndefined();
    const h = http({ 'POST finance /invoices/i-1/payments': {} });
    await tool('record_payment').run(p.args as any, ctx, h.client);
    expect(h.calls[0].body).toEqual({ amount: 480, method: 'CASH', notes: 'Recorded by Kelvin' });
  });

  it('refuses more than is owed, nothing, a paid or void invoice, and an unknown method', async () => {
    const c = http({ 'GET finance /invoices/i-1': inv }).client;
    await expect(tool('record_payment').preview!({ invoiceId: 'i-1', amount: 600, method: 'CASH' }, ctx, c)).rejects.toThrow('only $505.00 is owed');
    await expect(tool('record_payment').preview!({ invoiceId: 'i-1', amount: 0, method: 'CASH' }, ctx, c)).rejects.toThrow('above zero');
    await expect(tool('record_payment').preview!({ invoiceId: 'i-1', amount: 5, method: 'BITCOIN' }, ctx, c)).rejects.toThrow('cash, cheque');
    await expect(tool('record_payment').preview!({ invoiceId: 'i-1', amount: 5, method: 'CASH' }, ctx, http({ 'GET finance /invoices/i-1': { ...inv, status: 'PAID', balanceDue: '0' } }).client)).rejects.toThrow('already paid');
  });

  it('works on an invoice an earlier plan step creates, checking against its total', async () => {
    const scope = { pending: () => ({ invoiceId: '@pending', invoiceNumber: '(new invoice)', total: 505, currency: 'USD', customerEmail: 'ops@rr.lk' }) };
    const p = await tool('record_payment').preview!({ invoiceId: '@1.invoiceId', amount: 505, method: 'ACH' }, ctx, http({}).client, scope);
    expect(p.lines).toContain('Pays it in full');
    await expect(tool('record_payment').preview!({ invoiceId: '@1.invoiceId', amount: 900, method: 'ACH' }, ctx, http({}).client, scope)).rejects.toThrow('owed');
  });
});

describe('create_invoice', () => {
  const job = { id: 'j-1', jobNumber: 'JOB-0452', status: 'COMPLETED', customerId: 'c-rr', customerName: 'R&R', title: 'AC repair' };
  const base = {
    'GET jobs /jobs/j-1': job, 'GET finance /quotes': { data: [] }, 'GET finance /invoices': { data: [] },
    'GET crm /customers/c-rr': { id: 'c-rr', firstName: 'R&R', lastName: '', email: 'ops@rr.lk' },
    'GET crm /company/settings': { currency: 'USD' }, 'GET crm /company/tax-rates': [],
    'GET jobs /price-book/p-lab': { id: 'p-lab', name: 'Labour', unitPrice: '40.00', taxable: false, isActive: true, unit: 'hour' },
  };

  it('invoices a finished job from price-book lines, and undo voids it', async () => {
    const p = await tool('create_invoice').preview!({ jobId: 'j-1', lines: [{ itemId: 'p-lab', quantity: 2 }] }, ctx, http(base).client);
    expect(p.title).toBe('Invoice R&R for JOB-0452');
    expect(p.lines).toContain('Total: $80.00');
    const r: any = await tool('create_invoice').run(p.args as any, ctx, http({ 'POST finance /invoices': { id: 'i-2', invoiceNumber: 'INV-0100' } }).client);
    expect(r).toMatchObject({ invoiceId: 'i-2', invoiceNumber: 'INV-0100' });
    expect(tool('create_invoice').reverse!(p.args as any, r, ctx)).toMatchObject({ tool: 'void_new_invoice', args: { invoiceId: 'i-2' } });
  });

  it('points to the accepted quote instead, and refuses unfinished or already invoiced jobs', async () => {
    await expect(tool('create_invoice').preview!({ jobId: 'j-1', lines: [] }, ctx, http({ ...base, 'GET finance /quotes': { data: [{ id: 'q-1', quoteNumber: 'Q-0042', status: 'ACCEPTED' }] } }).client))
      .rejects.toThrow('convert_quote');
    await expect(tool('create_invoice').preview!({ jobId: 'j-1', lines: [] }, ctx, http({ ...base, 'GET jobs /jobs/j-1': { ...job, status: 'SCHEDULED' } }).client)).rejects.toThrow('not finished');
    await expect(tool('create_invoice').preview!({ jobId: 'j-1', lines: [] }, ctx, http({ ...base, 'GET finance /invoices': { data: [{ id: 'i-9', invoiceNumber: 'INV-0009', status: 'SENT' }] } }).client)).rejects.toThrow('already invoiced');
  });
});

describe('customer_balance', () => {
  it('lists open invoices and the total owed', async () => {
    const h = http({ 'GET finance /invoices': { data: [{ ...inv }, { ...inv, id: 'i-2', invoiceNumber: 'INV-0100', status: 'PAID', balanceDue: '0' }, { ...inv, id: 'i-3', invoiceNumber: 'INV-0101', status: 'OVERDUE', balanceDue: '20' }] } });
    expect(await tool('customer_balance').run({ customerId: 'c-rr' }, ctx, h.client)).toEqual({
      owed: '$525.00',
      open: [{ invoiceId: 'i-1', invoiceNumber: 'INV-0099', status: 'SENT', balanceDue: '$505.00' }, { invoiceId: 'i-3', invoiceNumber: 'INV-0101', status: 'OVERDUE', balanceDue: '$20.00' }],
    });
  });
});
