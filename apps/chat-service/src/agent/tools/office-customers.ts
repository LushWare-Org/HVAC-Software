import { ToolRefusal, type AgentTool } from '../types';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const clean = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '');
const nameOf = (c: any) => clean(`${c.firstName ?? ''} ${c.lastName ?? ''}`, 120);
const FIELDS = { phone: 'Phone', email: 'Email', address: 'Address', city: 'City' } as const;
type Field = keyof typeof FIELDS;

/** Someone already on file with this phone (last 7 digits), email or exact name. */
async function findDuplicate(http: any, name: string, phone: string, email: string) {
  const tail = digits(phone).slice(-7);
  const searches = [tail.length >= 7 ? tail : '', email, name].filter(Boolean);
  for (const search of searches) {
    const hits = list(await http.get('crm', '/customers', { search, limit: 10 }));
    const hit = hits.find((c) =>
      (tail.length >= 7 && digits(c.phone).endsWith(tail)) ||
      (email && String(c.email ?? '').toLowerCase() === email.toLowerCase()) ||
      nameOf(c).toLowerCase() === name.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

export const CUSTOMER_OFFICE_TOOLS: AgentTool[] = [
  {
    name: 'create_customer',
    description:
      'Add a new customer: a name plus a phone or email, optionally an address and residential/commercial. ' +
      'Refuses when the customer already exists and says which one, so use that customer instead. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name or business name as the person said it.' },
        phone: { type: 'string' }, email: { type: 'string' },
        address: { type: 'string' }, city: { type: 'string' },
        type: { type: 'string', enum: ['RESIDENTIAL', 'COMMERCIAL'] },
      },
      required: ['name'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    preview: async (args, _ctx, http) => {
      const name = clean(args.name, 160);
      if (!name) throw new ToolRefusal('What is the customer\'s name?');
      const phone = clean(args.phone, 40);
      const email = clean(args.email, 160).toLowerCase();
      if (!phone && !email) throw new ToolRefusal(`How can we reach ${name}? Give a phone or email.`);
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ToolRefusal(`"${email}" doesn't look like an email address.`);
      const dup = await findDuplicate(http, name, phone, email);
      if (dup) throw new ToolRefusal(`${nameOf(dup)} already exists (id ${dup.id}). Use that customer instead.`);
      const [first, ...rest] = name.split(' ');
      const type = args.type === 'COMMERCIAL' || args.type === 'RESIDENTIAL' ? args.type : undefined;
      const address = clean(args.address);
      const city = clean(args.city, 100);
      const body = {
        firstName: first, lastName: rest.join(' '),
        ...(phone && { phone }), ...(email && { email }),
        ...(address && { address }), ...(city && { city }), ...(type && { type }),
      };
      return {
        title: `Add customer ${name}`,
        lines: [
          `Name: ${name}`,
          ...(phone ? [`Phone: ${phone}`] : []),
          ...(email ? [`Email: ${email}`] : []),
          ...(address ? [`Address: ${[address, city].filter(Boolean).join(', ')}`] : []),
          ...(type ? [`Type: ${type.toLowerCase()}`] : []),
        ],
        args: { body, name },
      };
    },
    provides: (a) => ({ customerId: '@pending', customerName: a.name, customerEmail: a.body?.email, ...a.body }),
    run: async (args, _ctx, http) => {
      const c = await http.post('crm', '/customers', args.body);
      return { customerId: c.id, id: c.id, customerName: args.name, customerEmail: args.body?.email, summary: `Added customer ${args.name}` };
    },
    reverse: (a, r) => (r?.customerId ? { tool: 'hide_customer', args: { customerId: r.customerId, name: a.name }, title: `Remove customer ${a.name}` } : null),
  },
  {
    name: 'hide_customer',
    description: 'Undo only: removes a customer that was just added, if nothing has been created for them yet.',
    parameters: { type: 'object', properties: { customerId: { type: 'string' }, name: { type: 'string' } }, required: ['customerId'] },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    internal: true,
    preview: async (args, _ctx, http) => {
      const q = { customerId: args.customerId, limit: 20 };
      const [jobs, quotes, invoices] = await Promise.all([
        http.get('jobs', '/jobs', q), http.get('finance', '/quotes', q), http.get('finance', '/invoices', q),
      ]);
      // What this same undo just cancelled or voided doesn't count.
      const live = [
        ...list(jobs).filter((j) => j.status !== 'CANCELLED'),
        ...list(quotes).filter((q) => !['DECLINED', 'EXPIRED'].includes(q.status)),
        ...list(invoices).filter((i) => i.status !== 'VOID'),
      ];
      if (live.length) {
        throw new ToolRefusal(`${args.name ?? 'This customer'} already has jobs, quotes or invoices, so they can't be removed now.`);
      }
      return { title: `Remove customer ${args.name ?? ''}`.trim(), lines: ['They are hidden from lists, not deleted.'] };
    },
    run: async (args, _ctx, http) => {
      await http.put('crm', `/customers/${args.customerId}`, { isActive: false });
      return { summary: `Removed customer ${args.name ?? ''}`.trim() };
    },
  },
  {
    name: 'update_customer',
    description: "Change a customer's phone, email, address or city. Shows old and new; the person confirms first.",
    parameters: {
      type: 'object',
      properties: { customerId: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' }, city: { type: 'string' } },
      required: ['customerId'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    preview: async (args, _ctx, http) => {
      const c = await http.get('crm', `/customers/${args.customerId}`).catch(() => null);
      if (!c?.id) throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
      const changes: Partial<Record<Field, string>> = {};
      const previous: Partial<Record<Field, string>> = {};
      for (const f of Object.keys(FIELDS) as Field[]) {
        if (args[f] === undefined) continue;
        const next = clean(args[f], 200);
        if (next === clean(c[f], 200)) continue;
        changes[f] = next;
        // Empty becomes null: crm accepts null to clear a field, not '' (which fails email validation).
        previous[f] = (c[f] || null) as any;
      }
      if (!Object.keys(changes).length) throw new ToolRefusal('Nothing would change: those details are already on file.');
      const name = nameOf(c);
      return {
        title: `Update ${name}`,
        lines: (Object.keys(changes) as Field[]).map((f) => `${FIELDS[f]}: ${previous[f] || 'none'} → ${changes[f]}`),
        args: { customerId: c.id, name, changes, previous },
      };
    },
    run: async (args, _ctx, http) => {
      await http.put('crm', `/customers/${args.customerId}`, args.changes);
      return { summary: `Updated ${args.name}` };
    },
    reverse: (a) => ({ tool: 'restore_customer_details', args: { customerId: a.customerId, name: a.name, changes: a.previous, expect: a.changes }, title: `Put back ${a.name}'s old details` }),
  },
  {
    name: 'restore_customer_details',
    description: "Undo only: puts a customer's previous contact details back.",
    parameters: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    internal: true,
    preview: async (args, _ctx, http) => {
      const c = await http.get('crm', `/customers/${args.customerId}`).catch(() => null);
      if (!c?.id) throw new ToolRefusal('That customer was not found.');
      // Only undo if the details are still what Kelvin set; otherwise someone changed them on purpose.
      const moved = Object.entries(args.expect ?? {}).some(([f, v]) => clean(c[f], 200) !== clean(v, 200));
      if (moved) throw new ToolRefusal(`${args.name}'s details changed again since, so I won't put the old ones back.`);
      return {
        title: `Put back ${args.name}'s old details`,
        lines: Object.entries(args.changes ?? {}).map(([f, v]) => `${FIELDS[f as Field] ?? f}: ${v || 'none'}`),
      };
    },
    run: async (args, _ctx, http) => {
      await http.put('crm', `/customers/${args.customerId}`, args.changes ?? {});
      return { summary: `Put back ${args.name}'s old details` };
    },
  },
];
