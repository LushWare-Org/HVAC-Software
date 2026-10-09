import { ToolRefusal, type AgentTool } from '../types';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const nameOf = (c: any) => `${c.firstName ?? ''} ${c.lastName ?? ''}`.replace(/\s+/g, ' ').trim() || 'Customer';

async function connected(http: any) {
  const s = await http.get('comms', '/telegram/settings').catch(() => null);
  if (!s?.connected) throw new ToolRefusal('Telegram isn\'t connected yet. An admin can connect the company bot in Settings → Telegram.');
  if (!s.enabled) throw new ToolRefusal('Telegram is paused. Turn it back on in Settings → Telegram first.');
  return s;
}

/**
 * Kelvin and the Telegram add-on. Messages Kelvin sends with message_customer
 * already reach a linked customer's Telegram, so these only cover who is
 * linked and inviting people to link.
 */
export const TELEGRAM_TOOLS: AgentTool[] = [
  {
    name: 'telegram_status',
    description:
      "Whether the company's Telegram bot is connected, how many customers and technicians get their messages on Telegram, " +
      'and (with customerId) whether one customer is linked. Messages sent to a linked customer also arrive in their Telegram.',
    parameters: { type: 'object', properties: { customerId: { type: 'string', description: 'Optional customer id from find_customers.' } } },
    kind: 'read',
    bots: ['admin'],
    roles: OFFICE,
    run: async (args, _ctx, http) => {
      const s = await http.get('comms', '/telegram/settings');
      if (!s?.connected) return { connected: false, note: 'No Telegram bot is connected. An admin can connect one in Settings → Telegram.' };
      const out: Record<string, unknown> = {
        connected: true, paused: !s.enabled, bot: `@${s.bot.username}`, link: s.bot.link,
        linkedCustomers: s.linked.customers, linkedTechnicians: s.linked.staff, officeStaffGettingAlerts: s.linked.office ?? 0, officeAlerts: s.officeAlerts !== false,
        ...(s.lastError ? { problem: s.lastError } : {}),
      };
      if (args.customerId) {
        const links = await http.get('comms', '/telegram/links', { customerId: String(args.customerId) });
        const link = (Array.isArray(links) ? links : [])[0];
        out.customer = link ? { linked: true, telegram: link.telegramName, since: link.linkedAt } : { linked: false };
      }
      return out;
    },
  },
  {
    name: 'invite_to_telegram',
    description:
      'Email customers their own one-tap link to get our messages on Telegram (each link works once, for 14 days). ' +
      'Pass customerIds for particular customers, or allCustomers for everyone with an email who is not linked yet. ' +
      'An optional short note goes at the top of the email. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        customerIds: { type: 'array', items: { type: 'string' }, description: 'Customer ids from find_customers.' },
        allCustomers: { type: 'boolean', description: 'Invite every customer with an email who is not on Telegram yet.' },
        note: { type: 'string', description: 'Optional short note in the email, in the company voice.' },
      },
    },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    sends: (a) => (a.allCustomers ? 'Email to every customer not on Telegram yet' : `Email to ${a.names?.length === 1 ? a.names[0] : `${a.names?.length ?? 0} customers`}`),
    preview: async (args, _ctx, http) => {
      const s = await connected(http);
      const note = String(args.note ?? '').trim().slice(0, 600);
      if (args.allCustomers) {
        return {
          title: 'Invite customers to Telegram',
          lines: [
            `Emails every active customer who has an email address and isn't linked yet a personal link to @${s.bot.username}.`,
            `${s.linked.customers} customer${s.linked.customers === 1 ? ' is' : 's are'} already linked and won't be emailed.`,
            ...(note ? [`Note at the top: "${note}"`] : []),
          ],
          args: { allCustomers: true, note },
        };
      }
      const ids: string[] = Array.isArray(args.customerIds) ? args.customerIds.map(String).slice(0, 50) : [];
      if (!ids.length) throw new ToolRefusal('Which customers? Find them first, or invite everyone.');
      const found = (await Promise.all(ids.map((id) => http.get('crm', `/customers/${id}`).catch(() => null)))).filter((c: any) => c?.id);
      if (!found.length) throw new ToolRefusal('Those customers were not found. Find them with find_customers first.');
      const noEmail = found.filter((c: any) => !c.email).map(nameOf);
      const withEmail = found.filter((c: any) => c.email);
      if (!withEmail.length) throw new ToolRefusal(`${noEmail.join(', ')} ha${noEmail.length === 1 ? 's' : 've'} no email address on file.`);
      return {
        title: withEmail.length === 1 ? `Invite ${nameOf(withEmail[0])} to Telegram` : `Invite ${withEmail.length} customers to Telegram`,
        lines: [
          ...withEmail.map((c: any) => `${nameOf(c)} (${c.email})`),
          ...(noEmail.length ? [`No email on file, so skipped: ${noEmail.join(', ')}.`] : []),
          `They get a personal link to @${s.bot.username}. Anyone already linked is skipped.`,
          ...(note ? [`Note at the top: "${note}"`] : []),
        ],
        args: { customerIds: withEmail.map((c: any) => c.id), names: withEmail.map(nameOf), note },
      };
    },
    run: async (args, _ctx, http) => {
      const r = await http.post('comms', '/telegram/invites', { customerIds: args.customerIds, allCustomers: !!args.allCustomers, note: args.note || undefined });
      const parts = [`${r.sent} invite${r.sent === 1 ? '' : 's'} emailed`];
      if (r.alreadyLinked) parts.push(`${r.alreadyLinked} already on Telegram`);
      if (r.noEmail) parts.push(`${r.noEmail} without an email`);
      if (r.failed) parts.push(`${r.failed} failed`);
      return { done: true, summary: parts.join(', ') };
    },
  },
];
