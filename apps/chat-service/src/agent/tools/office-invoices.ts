import { isRef } from '../plan/refs';
import { ToolRefusal, type AgentTool } from '../types';
import { defaultTax, list, MONEY, moneyIn, priceLines, totalsLines } from './office-quotes';
import { usualTechnician } from './usual-tech';

const round = (n: number) => Math.round(n * 100) / 100;
const METHODS: Record<string, { method: string; label: string }> = {
  cash: { method: 'CASH', label: 'cash' },
  cheque: { method: 'CHECK', label: 'cheque' }, check: { method: 'CHECK', label: 'cheque' },
  'bank transfer': { method: 'ACH', label: 'bank transfer' }, bank: { method: 'ACH', label: 'bank transfer' }, transfer: { method: 'ACH', label: 'bank transfer' }, ach: { method: 'ACH', label: 'bank transfer' },
  card: { method: 'CARD', label: 'card' },
  other: { method: 'OTHER', label: 'other' },
};
const methodOf = (v: unknown) => METHODS[String(v ?? '').trim().toLowerCase()];
const OPEN = (status: string) => !['PAID', 'VOID', 'DRAFT'].includes(status);

export const INVOICE_TOOLS: AgentTool[] = [
  {
    name: 'customer_balance',
    description: "What a customer owes: their open invoices and the total.",
    parameters: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    run: async (args, _ctx, http) => {
      const invoices = list(await http.get('finance', '/invoices', { customerId: args.customerId, limit: 100 }));
      const open = invoices.filter((i) => OPEN(i.status));
      const money = moneyIn(invoices[0]?.currency);
      return {
        owed: money(round(open.reduce((a, i) => a + Number(i.balanceDue || 0), 0))),
        open: open.map((i) => ({ invoiceId: i.id, invoiceNumber: i.invoiceNumber, status: i.status, balanceDue: money(i.balanceDue) })),
      };
    },
  },
  {
    name: 'customer_history',
    description: "A customer's recent jobs, quotes and invoices, newest first.",
    parameters: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    run: async (args, _ctx, http) => {
      const q = { customerId: args.customerId, limit: 5 };
      const [jobs, quotes, invoices, usual] = await Promise.all([
        http.get('jobs', '/jobs', q).catch(() => []), http.get('finance', '/quotes', q).catch(() => []), http.get('finance', '/invoices', q).catch(() => []),
        usualTechnician(http, args.customerId),
      ]);
      return {
        usualTechnician: usual ? `${usual.name} (finished ${usual.jobs} of their recent jobs)` : null,
        jobs: list(jobs).map((j) => ({ jobNumber: j.jobNumber, title: j.title, status: j.status, when: j.scheduledStart })),
        quotes: list(quotes).map((x) => ({ quoteNumber: x.quoteNumber, status: x.status, total: moneyIn(x.currency)(x.total) })),
        invoices: list(invoices).map((i) => ({ invoiceNumber: i.invoiceNumber, status: i.status, balanceDue: moneyIn(i.currency)(i.balanceDue) })),
      };
    },
  },
  {
    name: 'create_invoice',
    description:
      'Invoice a finished job. Lines as in create_quote: { itemId, quantity } from the price book, or a stated price with statedByPerson: true. ' +
      'If the job has an accepted quote, use convert_quote instead. Nothing is sent yet.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        lines: { type: 'array', items: { type: 'object', properties: { itemId: { type: 'string' }, quantity: { type: 'number' }, description: { type: 'string' }, unitPrice: { type: 'number' }, statedByPerson: { type: 'boolean' } } } },
      },
      required: ['jobId', 'lines'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await http.get('jobs', `/jobs/${args.jobId}`).catch(() => null);
      if (!job?.id) throw new ToolRefusal('That job was not found. Find it with find_jobs first.');
      if (job.status !== 'COMPLETED') throw new ToolRefusal(`${job.jobNumber} is not finished yet (it is ${String(job.status).toLowerCase()}), so it can't be invoiced.`);
      const existing = list(await http.get('finance', '/invoices', { jobId: job.id, limit: 5 })).find((i) => i.status !== 'VOID');
      if (existing) throw new ToolRefusal(`${job.jobNumber} is already invoiced (${existing.invoiceNumber}).`);
      const accepted = list(await http.get('finance', '/quotes', { jobId: job.id, limit: 5 })).find((x) => x.status === 'ACCEPTED');
      if (accepted) throw new ToolRefusal(`${job.jobNumber} has an accepted quote (${accepted.quoteNumber}). Use convert_quote with it instead.`);
      const c = await http.get('crm', `/customers/${job.customerId}`).catch(() => null);
      const settings = await http.get('crm', '/company/settings').catch(() => ({}));
      const currency = (settings as any)?.currency;
      const money = moneyIn(currency);
      const { lineItems, shown } = await priceLines(http, args.lines, money, ctx.said);
      const tax = await defaultTax(http);
      const totals = totalsLines(lineItems, tax, money);
      return {
        title: `Invoice ${job.customerName} for ${job.jobNumber}`,
        lines: [...shown, ...totals.lines, 'Created as an invoice. Nothing is sent yet.'],
        args: {
          dto: { jobId: job.id, customerId: job.customerId, customerName: job.customerName, ...(c?.email && { customerEmail: c.email }), lineItems, taxRate: tax.rate },
          jobNumber: job.jobNumber, total: totals.total, currency,
        },
      };
    },
    signature: (a) => ({ lineItems: a.dto?.lineItems, taxRate: a.dto?.taxRate }),
    provides: (a) => ({ invoiceId: '@pending', invoiceNumber: '(new invoice)', total: a.total, currency: a.currency, customerEmail: a.dto?.customerEmail }),
    run: async (args, _ctx, http) => {
      const inv = await http.post('finance', '/invoices', args.dto);
      return { invoiceId: inv.id, id: inv.id, invoiceNumber: inv.invoiceNumber, total: args.total, currency: args.currency, customerEmail: args.dto?.customerEmail, summary: `Created invoice ${inv.invoiceNumber} for ${args.jobNumber}` };
    },
    reverse: (_a, r) => (r?.invoiceId ? { tool: 'void_new_invoice', args: { invoiceId: r.invoiceId, invoiceNumber: r.invoiceNumber }, title: `Void invoice ${r.invoiceNumber}` } : null),
  },
  {
    name: 'record_payment',
    description:
      'Record a payment made outside the system: cash, cheque, bank transfer, card at a terminal, or other. Partial payments are fine; never more than is owed. ' +
      'The customer is emailed a receipt automatically, so it cannot be undone. Never charges a card.',
    parameters: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        amount: { type: 'number' },
        method: { type: 'string', enum: ['cash', 'cheque', 'bank transfer', 'card', 'other'] },
      },
      required: ['invoiceId', 'amount', 'method'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    sends: (a) => `Receipt emailed to ${a.customerEmail ?? 'the customer'}`,
    signature: (a) => ({ amount: a.amount, method: a.method }),
    preview: async (args, _ctx, http, scope) => {
      const m = methodOf(args.method);
      if (!m) throw new ToolRefusal('Payment method must be cash, cheque, bank transfer, card (at a terminal) or other.');
      const amount = round(Number(args.amount));
      if (!(amount > 0)) throw new ToolRefusal('The amount has to be above zero.');
      let inv: any;
      if (isRef(args.invoiceId)) {
        const p = scope?.pending(args.invoiceId);
        if (!p) throw new ToolRefusal('The invoice from the earlier step was not found.');
        inv = { id: args.invoiceId, invoiceNumber: 'the new invoice', status: 'DRAFT', balanceDue: p.total, currency: p.currency, customerEmail: p.customerEmail };
      } else {
        inv = await http.get('finance', `/invoices/${args.invoiceId}`).catch(() => null);
        if (!inv?.id) throw new ToolRefusal('That invoice was not found. Find it with find_invoices first.');
        if (inv.status === 'PAID') throw new ToolRefusal(`${inv.invoiceNumber} is already paid.`);
        if (inv.status === 'VOID') throw new ToolRefusal(`${inv.invoiceNumber} is void.`);
      }
      const money = moneyIn(inv.currency);
      const owed = round(Number(inv.balanceDue) || 0);
      if (amount > owed) throw new ToolRefusal(`That is more than is owed: only ${money(owed)} is owed on ${inv.invoiceNumber}.`);
      const left = round(owed - amount);
      return {
        title: `Record ${money(amount)} ${m.label} for ${inv.invoiceNumber}`,
        lines: [...(inv.customerName ? [`From: ${inv.customerName}`] : []), left > 0 ? `Leaves ${money(left)} to pay` : 'Pays it in full'],
        args: { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amount, method: m.method, label: m.label, customerEmail: inv.customerEmail, money: money(amount) },
      };
    },
    run: async (args, _ctx, http) => {
      await http.post('finance', `/invoices/${args.invoiceId}/payments`, { amount: args.amount, method: args.method, notes: 'Recorded by Kelvin' });
      return { summary: `Recorded ${args.money} ${args.label} for ${args.invoiceNumber}` };
    },
  },
];
