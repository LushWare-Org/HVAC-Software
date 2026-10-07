import { isRef } from '../plan/refs';
import { ToolRefusal, type AgentTool, type PlanScope } from '../types';
import type { ServiceHttp } from '../service-http';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
export const MONEY = ['super_admin', 'company_admin', 'office_manager'];
export const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const clean = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const round = (n: number) => Math.round(n * 100) / 100;
export const moneyIn = (currency: string) => (n: unknown) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(n) || 0);

/** The customer a money step is for: one on file, or one an earlier plan step creates. */
export async function customerFor(http: ServiceHttp, id: unknown, scope?: PlanScope) {
  if (isRef(id)) {
    const p = scope?.pending(id);
    if (!p) throw new ToolRefusal('The customer from the earlier step was not found.');
    return { id, name: String(p.customerName ?? ''), email: (p.customerEmail ?? p.email ?? null) as string | null, isNew: true };
  }
  const c = await http.get('crm', `/customers/${id}`).catch(() => null);
  if (!c?.id) throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
  return { id: c.id, name: clean(`${c.firstName ?? ''} ${c.lastName ?? ''}`, 120), email: c.email ?? null, isNew: false };
}

/** Lines priced from the price book; a price outside it only when the person said it. */
export async function priceLines(http: ServiceHttp, lines: any[], money: (n: unknown) => string, said?: string) {
  if (!Array.isArray(lines) || !lines.length) throw new ToolRefusal('What should it include? Give at least one line.');
  const out: Array<{ description: string; quantity: number; unitPrice: number; taxable: boolean }> = [];
  const shown: string[] = [];
  for (const l of lines) {
    const quantity = Number(l?.quantity ?? 1);
    if (!(quantity > 0)) throw new ToolRefusal('Each line needs a quantity above zero.');
    if (l?.itemId) {
      const item = await http.get('jobs', `/price-book/${l.itemId}`).catch(() => null);
      if (!item?.id || item.isActive === false) throw new ToolRefusal(`That item isn't in your price book (any more). Search it with search_price_book, or ask the person for a price.`);
      const unitPrice = Number(item.unitPrice);
      out.push({ description: item.name, quantity, unitPrice, taxable: item.taxable !== false });
      const unit = item.unit && item.unit !== 'each' ? ` ${item.unit}` : '';
      shown.push(`${quantity}${unit} × ${item.name} at ${money(unitPrice)} = ${money(round(quantity * unitPrice))}`);
    } else {
      const description = clean(l?.description, 200);
      if (!description) throw new ToolRefusal('Each line needs a price-book item or a description.');
      // Never a made-up price: only one the person stated, flagged by the model.
      if (l?.statedByPerson !== true || !(Number(l?.unitPrice) > 0)) {
        throw new ToolRefusal(`${description} isn't in your price book. Ask the person for its price.`);
      }
      const unitPrice = Number(l.unitPrice);
      // The price must be in the person's own words, not just flagged by the model.
      if (said !== undefined && !priceWasSaid(said, unitPrice)) {
        throw new ToolRefusal(`${description} isn't in your price book, and I don't see its price in what you said. Ask the person for its price.`);
      }
      out.push({ description, quantity, unitPrice, taxable: l.taxable !== false });
      shown.push(`${quantity} × ${description} at ${money(unitPrice)} = ${money(round(quantity * unitPrice))} (price you gave)`);
    }
  }
  return { lineItems: out, shown };
}

/** Whether a number appears in what the person typed: "90", "90.00", "1,250", "1250.5". */
export function priceWasSaid(said: string, price: number): boolean {
  const numbers = (said.replace(/,(?=\d{3}\b)/g, '').match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  return numbers.some((n) => Math.abs(n - price) < 0.005);
}

/** The company's default tax preset, if any. */
export async function defaultTax(http: ServiceHttp): Promise<{ rate: number; name: string }> {
  const rates = list(await http.get('crm', '/company/tax-rates').catch(() => []));
  const d = rates.find((r: any) => r.isDefault && r.isActive !== false);
  return d ? { rate: Number(d.rate) || 0, name: d.name || 'Tax' } : { rate: 0, name: 'Tax' };
}

export function totalsLines(lineItems: Array<{ quantity: number; unitPrice: number; taxable: boolean }>, tax: { rate: number; name: string }, money: (n: unknown) => string) {
  const subtotal = round(lineItems.reduce((a, l) => a + l.quantity * l.unitPrice, 0));
  const taxAmount = round(lineItems.filter((l) => l.taxable).reduce((a, l) => a + l.quantity * l.unitPrice, 0) * tax.rate);
  return {
    total: round(subtotal + taxAmount),
    lines: [...(taxAmount > 0 ? [`${tax.name} ${round(tax.rate * 100)}%: ${money(taxAmount)}`] : []), `Total: ${money(round(subtotal + taxAmount))}`],
  };
}

async function loadQuote(http: ServiceHttp, id: unknown) {
  const q = await http.get('finance', `/quotes/${id}`).catch(() => null);
  if (!q?.id) throw new ToolRefusal('That quote was not found. Find it with find_quotes first.');
  return q;
}

export const QUOTE_TOOLS: AgentTool[] = [
  {
    name: 'search_price_book',
    description: 'Search the price book by name. Use the itemId in create_quote and create_invoice lines.',
    parameters: { type: 'object', properties: { search: { type: 'string' } } },
    kind: 'read',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    run: async (args, _ctx, http) =>
      list(await http.get('jobs', '/price-book', { search: args.search, limit: 15 }))
        .filter((i) => i.isActive !== false)
        .map((i) => ({ itemId: i.id, name: i.name, unitPrice: Number(i.unitPrice), unit: i.unit, taxable: i.taxable !== false })),
  },
  {
    name: 'find_quotes',
    description: 'Find quotes by number or customer, optionally by status. Use it to get a quoteId.',
    parameters: {
      type: 'object',
      properties: { search: { type: 'string' }, customerId: { type: 'string' }, status: { type: 'string', enum: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED'] } },
    },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    run: async (args, _ctx, http) => {
      const q = clean(args.search).toLowerCase();
      return list(await http.get('finance', '/quotes', { status: args.status, customerId: args.customerId, limit: 50 }))
        .filter((x) => !q || `${x.quoteNumber} ${x.customerName ?? ''} ${x.title ?? ''}`.toLowerCase().includes(q))
        .slice(0, 10)
        .map((x) => ({ quoteId: x.id, quoteNumber: x.quoteNumber, customer: x.customerName, title: x.title, status: x.status, total: moneyIn(x.currency)(x.total) }));
    },
  },
  {
    name: 'create_quote',
    description:
      'Create a draft quote. Lines are { itemId, quantity } from search_price_book, or { description, quantity, unitPrice, statedByPerson: true } ' +
      'ONLY when the person told you the price. Never invent prices. Tax comes from the company default. Nothing is sent until send_quote.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        jobId: { type: 'string' },
        title: { type: 'string' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: { itemId: { type: 'string' }, quantity: { type: 'number' }, description: { type: 'string' }, unitPrice: { type: 'number' }, statedByPerson: { type: 'boolean' } },
          },
        },
        notes: { type: 'string' },
      },
      required: ['customerId', 'title', 'lines'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    preview: async (args, ctx, http, scope) => {
      const customer = await customerFor(http, args.customerId, scope);
      if (!customer.email) throw new ToolRefusal(`${customer.name} has no email on file, and a quote needs one. Add it with update_customer first.`);
      const title = clean(args.title, 200);
      if (!title) throw new ToolRefusal('What is the quote for? Give it a short title.');
      const settings = await http.get('crm', '/company/settings').catch(() => ({}));
      const money = moneyIn((settings as any)?.currency);
      const { lineItems, shown } = await priceLines(http, args.lines, money, ctx.said);
      const tax = await defaultTax(http);
      const totals = totalsLines(lineItems, tax, money);
      return {
        title: `Quote ${customer.name}: ${title}`,
        lines: [...shown, ...totals.lines, 'Saved as a draft. Nothing is sent yet.'],
        args: {
          dto: {
            customerId: customer.id, customerName: customer.name, customerEmail: customer.email, title,
            ...(args.jobId && { jobId: args.jobId }), ...(args.notes && { notes: clean(args.notes, 2000) }),
            lineItems, taxRate: tax.rate,
          },
          total: money(totals.total),
        },
      };
    },
    signature: (a) => ({ lineItems: a.dto?.lineItems, taxRate: a.dto?.taxRate }),
    provides: (a) => ({ quoteId: '@pending', quoteNumber: '(new quote)', customerId: a.dto?.customerId, customerName: a.dto?.customerName, customerEmail: a.dto?.customerEmail }),
    run: async (args, _ctx, http) => {
      const q = await http.post('finance', '/quotes', args.dto);
      return {
        quoteId: q.id, id: q.id, quoteNumber: q.quoteNumber,
        customerId: args.dto.customerId, customerName: args.dto.customerName, customerEmail: args.dto.customerEmail,
        summary: `Created quote ${q.quoteNumber} for ${args.dto.customerName} (${args.total})`,
      };
    },
    reverse: (_a, r) => (r?.quoteId ? { tool: 'delete_draft_quote', args: { quoteId: r.quoteId, quoteNumber: r.quoteNumber }, title: `Delete draft quote ${r.quoteNumber}` } : null),
  },
  {
    name: 'send_quote',
    description: 'Email a quote to the customer with a link to accept it. The person confirms first; it cannot be unsent.',
    parameters: { type: 'object', properties: { quoteId: { type: 'string' } }, required: ['quoteId'] },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    sends: (a) => `Emailed to ${a.customerEmail ?? 'the customer'} with a link to accept`,
    preview: async (args, _ctx, http, scope) => {
      if (isRef(args.quoteId)) {
        const p = scope?.pending(args.quoteId);
        if (!p) throw new ToolRefusal('The quote from the earlier step was not found.');
        return { title: 'Send the new quote', lines: [`To: ${p.customerEmail}`], args: { quoteId: args.quoteId, quoteNumber: 'the new quote', customerEmail: p.customerEmail } };
      }
      const q = await loadQuote(http, args.quoteId);
      if (['DECLINED', 'EXPIRED', 'CONVERTED'].includes(q.status)) throw new ToolRefusal(`${q.quoteNumber} is ${String(q.status).toLowerCase()}, so it can't be sent.`);
      return {
        title: `Send quote ${q.quoteNumber}`,
        lines: [`To: ${q.customerName} (${q.customerEmail})`, `Total: ${moneyIn(q.currency)(q.total)}`],
        args: { quoteId: q.id, quoteNumber: q.quoteNumber, customerEmail: q.customerEmail },
      };
    },
    run: async (args, _ctx, http) => {
      await http.patch('finance', `/quotes/${args.quoteId}/send`);
      return { summary: `Sent quote ${args.quoteNumber}` };
    },
  },
  {
    name: 'convert_quote',
    description: 'Turn an accepted quote into an invoice. Only for quotes the customer has accepted.',
    parameters: { type: 'object', properties: { quoteId: { type: 'string' } }, required: ['quoteId'] },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    preview: async (args, _ctx, http) => {
      const q = await loadQuote(http, args.quoteId);
      if (q.status !== 'ACCEPTED') throw new ToolRefusal(`${q.quoteNumber} is not accepted yet (it is ${String(q.status).toLowerCase()}). It can be invoiced once the customer accepts.`);
      return {
        title: `Invoice ${q.customerName} for quote ${q.quoteNumber}`,
        lines: [`Total: ${moneyIn(q.currency)(q.total)}`, 'Created as an invoice. Nothing is sent yet.'],
        args: { quoteId: q.id, quoteNumber: q.quoteNumber, customerName: q.customerName, customerEmail: q.customerEmail, total: Number(q.total), currency: q.currency },
      };
    },
    provides: (a) => ({ invoiceId: '@pending', invoiceNumber: '(new invoice)', total: a.total, currency: a.currency, customerEmail: a.customerEmail }),
    run: async (args, _ctx, http) => {
      const inv = await http.post('finance', `/quotes/${args.quoteId}/convert`);
      return { invoiceId: inv.id, id: inv.id, invoiceNumber: inv.invoiceNumber, total: args.total, currency: args.currency, customerEmail: args.customerEmail, summary: `Created invoice ${inv.invoiceNumber} from quote ${args.quoteNumber}` };
    },
    reverse: (_a, r) => (r?.invoiceId ? { tool: 'void_new_invoice', args: { invoiceId: r.invoiceId, invoiceNumber: r.invoiceNumber }, title: `Void invoice ${r.invoiceNumber}` } : null),
  },
  {
    name: 'delete_draft_quote',
    description: 'Undo only: deletes a quote that is still a draft.',
    parameters: { type: 'object', properties: { quoteId: { type: 'string' } }, required: ['quoteId'] },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    internal: true,
    preview: async (args, _ctx, http) => {
      const q = await loadQuote(http, args.quoteId);
      if (q.status !== 'DRAFT') throw new ToolRefusal(`${args.quoteNumber ?? 'The quote'} was already sent, so it can't be removed. Send a correction instead.`);
      return { title: `Delete draft quote ${args.quoteNumber ?? ''}`.trim(), lines: [] };
    },
    run: async (args, _ctx, http) => {
      await http.delete('finance', `/quotes/${args.quoteId}`);
      return { summary: `Deleted draft quote ${args.quoteNumber ?? ''}`.trim() };
    },
  },
  {
    name: 'void_new_invoice',
    description: 'Undo only: voids an invoice that was just created and has no payments.',
    parameters: { type: 'object', properties: { invoiceId: { type: 'string' } }, required: ['invoiceId'] },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    internal: true,
    preview: async (args, _ctx, http) => {
      const inv = await http.get('finance', `/invoices/${args.invoiceId}`).catch(() => null);
      if (!inv?.id) throw new ToolRefusal('That invoice was not found.');
      const paid = ['PAID', 'PARTIALLY_PAID'].includes(inv.status) || Number(inv.total) - Number(inv.balanceDue) > 0;
      if (paid) throw new ToolRefusal(`${args.invoiceNumber ?? 'The invoice'} has already been paid in part, so it can't be voided here.`);
      if (inv.status === 'VOID') throw new ToolRefusal(`${args.invoiceNumber ?? 'The invoice'} is already void.`);
      return { title: `Void invoice ${args.invoiceNumber ?? ''}`.trim(), lines: [] };
    },
    run: async (args, _ctx, http) => {
      await http.patch('finance', `/invoices/${args.invoiceId}/void`);
      return { summary: `Voided invoice ${args.invoiceNumber ?? ''}`.trim() };
    },
  },
];
