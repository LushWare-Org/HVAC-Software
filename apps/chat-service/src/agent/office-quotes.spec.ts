import { QUOTE_TOOLS } from './tools/office-quotes';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'office_manager', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => QUOTE_TOOLS.find((t) => t.name === n)!;

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
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH'), delete: h('DELETE') } as any, calls };
}

const rr = { id: 'c-rr', firstName: 'R&R', lastName: 'Brothers', email: 'ops@rr.lk' };
const base = {
  'GET crm /customers/c-rr': rr,
  'GET crm /company/settings': { currency: 'USD' },
  'GET crm /company/tax-rates': [{ rate: '0.1000', isDefault: true, isActive: true, name: 'VAT' }],
  'GET jobs /price-book/p-comp': { id: 'p-comp', name: 'Compressor 1.5 ton', unitPrice: '350.00', taxable: true, isActive: true, unit: 'each' },
  'GET jobs /price-book/p-lab': { id: 'p-lab', name: 'Labour', unitPrice: '40.00', taxable: false, isActive: true, unit: 'hour' },
};

describe('create_quote', () => {
  it('prices every line from the price book, never from the model', async () => {
    const p = await tool('create_quote').preview!({
      customerId: 'c-rr', title: 'Compressor replacement',
      lines: [{ itemId: 'p-comp', quantity: 1, unitPrice: 1 }, { itemId: 'p-lab', quantity: 3 }],
    }, ctx, http(base).client);
    expect(p.title).toBe('Quote R&R Brothers: Compressor replacement');
    expect(p.lines).toEqual([
      '1 × Compressor 1.5 ton at $350.00 = $350.00',
      '3 hour × Labour at $40.00 = $120.00',
      'VAT 10%: $35.00',
      'Total: $505.00',
      'Saved as a draft. Nothing is sent yet.',
    ]);
    expect((p.args as any).dto).toMatchObject({ customerId: 'c-rr', customerEmail: 'ops@rr.lk', taxRate: 0.1, lineItems: [{ description: 'Compressor 1.5 ton', quantity: 1, unitPrice: 350, taxable: true }, { description: 'Labour', quantity: 3, unitPrice: 40, taxable: false }] });
  });

  it('a line not in the price book needs a price the person gave', async () => {
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ description: 'Fan motor', quantity: 1 }] }, ctx, http(base).client))
      .rejects.toThrow('Fan motor isn\'t in your price book. Ask the person for its price.');
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ description: 'Fan motor', quantity: 1, unitPrice: 90 }] }, ctx, http(base).client))
      .rejects.toThrow('Ask the person for its price');
    const ok = await tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ description: 'Fan motor', quantity: 1, unitPrice: 90, statedByPerson: true }] }, ctx, http(base).client);
    expect(ok.lines[0]).toBe('1 × Fan motor at $90.00 = $90.00 (price you gave)');
  });

  it('a price "the person gave" must really be in what they said', async () => {
    const said = { ...ctx, said: 'Quote R&R for a compressor and a fan motor, the motor is 90' };
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ description: 'Fan motor', quantity: 1, unitPrice: 120, statedByPerson: true }] }, said, http(base).client))
      .rejects.toThrow('Ask the person for its price');
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ description: 'Fan motor', quantity: 1, unitPrice: 90, statedByPerson: true }] }, said, http(base).client)).resolves.toBeDefined();
  });

  it('refuses unknown or inactive items, and customers without an email', async () => {
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ itemId: 'p-x', quantity: 1 }] }, ctx, http(base).client)).rejects.toThrow('price book');
    await expect(tool('create_quote').preview!({ customerId: 'c-rr', title: 'x', lines: [{ itemId: 'p-comp', quantity: 1 }] }, ctx, http({ ...base, 'GET crm /customers/c-rr': { ...rr, email: null } }).client))
      .rejects.toThrow('has no email');
  });

  it('works for a customer created earlier in the plan, and undo deletes the draft', async () => {
    const scope = { pending: () => ({ customerId: '@pending', customerName: 'New Co', customerEmail: 'a@new.co' }) };
    const p = await tool('create_quote').preview!({ customerId: '@1.customerId', title: 'x', lines: [{ itemId: 'p-comp', quantity: 1 }] }, ctx, http(base).client, scope);
    expect((p.args as any).dto).toMatchObject({ customerId: '@1.customerId', customerName: 'New Co', customerEmail: 'a@new.co' });
    const h = http({ 'POST finance /quotes': { id: 'q-1', quoteNumber: 'Q-0042', total: '385.00' } });
    const r: any = await tool('create_quote').run(p.args as any, ctx, h.client);
    expect(r).toMatchObject({ quoteId: 'q-1', id: 'q-1', quoteNumber: 'Q-0042' });
    // Everything create_quote promises to later steps must really come back from the run.
    for (const k of Object.keys(tool('create_quote').provides!(p.args as any, p))) expect(r[k]).toBeDefined();
    expect(tool('create_quote').reverse!(p.args as any, r, ctx)).toEqual({ tool: 'delete_draft_quote', args: { quoteId: 'q-1', quoteNumber: 'Q-0042' }, title: 'Delete draft quote Q-0042' });
  });
});

describe('send, convert and undo', () => {
  it('send_quote is marked as sent and cannot be undone', async () => {
    const h = http({ 'GET finance /quotes/q-1': { id: 'q-1', quoteNumber: 'Q-0042', status: 'DRAFT', customerName: 'R&R', customerEmail: 'ops@rr.lk', total: '385', currency: 'USD' } });
    const p = await tool('send_quote').preview!({ quoteId: 'q-1' }, ctx, h.client);
    expect(tool('send_quote').sends!(p.args as any)).toBe('Emailed to ops@rr.lk with a link to accept');
    expect(tool('send_quote').reverse).toBeUndefined();
  });

  it('convert_quote only for accepted quotes, and undo voids the new invoice', async () => {
    const q = { id: 'q-1', quoteNumber: 'Q-0042', status: 'SENT', customerName: 'R&R', total: '385', currency: 'USD' };
    await expect(tool('convert_quote').preview!({ quoteId: 'q-1' }, ctx, http({ 'GET finance /quotes/q-1': q }).client)).rejects.toThrow('not accepted');
    const h = http({ 'GET finance /quotes/q-1': { ...q, status: 'ACCEPTED' }, 'POST finance /quotes/q-1/convert': { id: 'i-1', invoiceNumber: 'INV-0099' } });
    const p = await tool('convert_quote').preview!({ quoteId: 'q-1' }, ctx, h.client);
    const r: any = await tool('convert_quote').run(p.args as any, ctx, h.client);
    expect(r).toMatchObject({ invoiceId: 'i-1', invoiceNumber: 'INV-0099' });
    expect(tool('convert_quote').reverse!(p.args as any, r, ctx)).toMatchObject({ tool: 'void_new_invoice', args: { invoiceId: 'i-1' } });
  });

  it('delete_draft_quote refuses once the quote was sent', async () => {
    await expect(tool('delete_draft_quote').preview!({ quoteId: 'q-1', quoteNumber: 'Q-0042' }, ctx, http({ 'GET finance /quotes/q-1': { id: 'q-1', status: 'SENT' } }).client))
      .rejects.toThrow('already sent');
  });

  it('void_new_invoice refuses once anything was paid', async () => {
    await expect(tool('void_new_invoice').preview!({ invoiceId: 'i-1', invoiceNumber: 'INV-0099' }, ctx, http({ 'GET finance /invoices/i-1': { id: 'i-1', status: 'PARTIALLY_PAID', total: '100', balanceDue: '40' } }).client))
      .rejects.toThrow('already been paid');
  });

  it('search_price_book lists active items with prices', async () => {
    const h = http({ 'GET jobs /price-book': { data: [{ id: 'p-comp', name: 'Compressor 1.5 ton', unitPrice: '350.00', unit: 'each', taxable: true, isActive: true }, { id: 'old', name: 'Old', unitPrice: '1', isActive: false }] } });
    expect(await tool('search_price_book').run({ search: 'compressor' }, ctx, h.client)).toEqual([{ itemId: 'p-comp', name: 'Compressor 1.5 ton', unitPrice: 350, unit: 'each', taxable: true }]);
  });
});
