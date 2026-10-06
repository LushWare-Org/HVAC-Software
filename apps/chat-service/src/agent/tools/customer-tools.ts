import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import type { ServiceHttp } from '../service-http';
import { day, when } from './write-tools';

/**
 * What a signed-in customer can ask the assistant to do. Each mirrors a button
 * the portal already has and calls the same endpoint as that customer, so the
 * services' own "only your records" checks apply; the previews check
 * ownership again so a foreign id is refused before anything is shown.
 */

const CUSTOMER = ['customer'];
const CLOSED = new Set(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED']);
const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? res?.items ?? []);
const money = (n: unknown, currency?: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(n) || 0);

/** Looks like "JOB-0412" or "Q-0042" rather than an id. */
export const looksLikeNumber = (v: unknown) => /^[A-Z]{1,6}-[\w-]+$/i.test(String(v ?? '')) && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(v));

async function myJob(http: ServiceHttp, ctx: AgentContext, jobId: unknown) {
  if (!jobId) throw new ToolRefusal('Which visit? Look it up first.');
  let job: any = null;
  try {
    job = await http.get('jobs', `/jobs/${jobId}`);
  } catch { /* maybe a job number; tried below */ }
  if (!job?.id && looksLikeNumber(jobId)) {
    // People say the job number. Only the customer's own jobs are searched.
    const wanted = String(jobId).toUpperCase();
    job = list(await http.get('jobs', '/jobs', { search: String(jobId), limit: 10 })).find((j) => String(j.jobNumber).toUpperCase() === wanted) ?? null;
  }
  if (!job?.id || (ctx.customerId && job.customerId && job.customerId !== ctx.customerId)) {
    throw new ToolRefusal('That visit was not found on your account.');
  }
  return job;
}

async function myQuote(http: ServiceHttp, ctx: AgentContext, quoteId: unknown) {
  if (!quoteId) throw new ToolRefusal('Which quote? Look it up first.');
  let quote: any = null;
  try {
    quote = await http.get('finance', `/quotes/${quoteId}`);
  } catch { /* maybe a quote number; tried below */ }
  if (!quote?.id && looksLikeNumber(quoteId)) {
    const wanted = String(quoteId).toUpperCase();
    quote = list(await http.get('finance', '/quotes', { limit: 50 })).find((q) => String(q.quoteNumber).toUpperCase() === wanted) ?? null;
  }
  if (!quote?.id || (ctx.customerId && quote.customerId !== ctx.customerId)) throw new ToolRefusal('That quote was not found on your account.');
  return quote;
}

function future(value: unknown, label: string): Date {
  const d = new Date(String(value ?? ''));
  if (Number.isNaN(d.getTime())) throw new ToolRefusal(`I could not read the ${label} "${value}". Give a date and time.`);
  if (d.getTime() < Date.now()) throw new ToolRefusal(`The ${label} is in the past.`);
  return d;
}

function openableQuote(quote: any): void {
  if (quote.status === 'ACCEPTED' || quote.status === 'CONVERTED') throw new ToolRefusal(`${quote.quoteNumber} is already accepted.`);
  if (quote.status === 'DECLINED') throw new ToolRefusal(`${quote.quoteNumber} was declined.`);
  if (quote.status === 'EXPIRED' || (quote.validUntil && new Date(quote.validUntil).getTime() < Date.now())) {
    throw new ToolRefusal(`${quote.quoteNumber} has expired. Message the office for an updated quote.`);
  }
}

const URGENCY: Record<string, { priority: string; label: string }> = {
  normal: { priority: 'NORMAL', label: 'Normal' },
  soon: { priority: 'HIGH', label: 'Soon, within a day or two' },
  emergency: { priority: 'EMERGENCY', label: 'Emergency' },
};

const REASONS: Record<string, { code: string; label: string }> = {
  not_available: { code: 'CUSTOMER_UNAVAILABLE', label: "I'm not available" },
  access: { code: 'ACCESS_ISSUE', label: 'Access to the property' },
  other: { code: 'OTHER', label: 'Other' },
};

export const CUSTOMER_TOOLS: AgentTool[] = [
  // ── Lookups ────────────────────────────────────────────────────────────────
  {
    name: 'get_my_quotes',
    description: "The customer's own quotes, optionally by status. Use the id to accept or decline one.",
    parameters: { type: 'object', properties: { status: { type: 'string', enum: ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED'] } } },
    kind: 'read',
    bots: ['customer'],
    roles: CUSTOMER,
    run: async (args, _ctx, http) =>
      list(await http.get('finance', '/quotes', { status: args.status, limit: 20 })).map((q) => ({
        id: q.id, quoteNumber: q.quoteNumber, title: q.title, status: q.status, total: Number(q.total), currency: q.currency, validUntil: q.validUntil,
      })),
  },
  {
    name: 'get_my_profile',
    description: "The customer's name, phone, email and service address on file.",
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['customer'],
    roles: CUSTOMER,
    run: async (_args, _ctx, http) => {
      const c = await http.get('crm', '/customers/me');
      return { name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(), phone: c.phone ?? c.mobile, email: c.email, address: [c.address, c.city].filter(Boolean).join(', ') };
    },
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  {
    name: 'book_service',
    description:
      'Request a visit. Use the customer\'s address on file unless they give another. A preferred time is optional; ' +
      'without one the office arranges it. The customer confirms before it is sent.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short summary, e.g. "AC not cooling in the bedroom".' },
        description: { type: 'string', description: 'What the customer described: symptoms, which unit, anything useful for the technician.' },
        urgency: { type: 'string', enum: ['normal', 'soon', 'emergency'] },
        address: { type: 'string', description: 'Only if different from the address on file.' },
        preferredStart: { type: 'string', description: 'Optional preferred start, ISO 8601 with the company offset.' },
      },
      required: ['title', 'urgency'],
    },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    preview: async (args, ctx, http) => {
      const title = String(args.title ?? '').trim();
      if (!title) throw new ToolRefusal('What is the visit for?');
      const urgency = URGENCY[String(args.urgency)] ?? URGENCY.normal;
      const me = await http.get('crm', '/customers/me');
      const onFile = [me.address, me.city].filter(Boolean).join(', ');
      const address = String(args.address ?? '').trim() || onFile;
      if (!address) throw new ToolRefusal('There is no address on your account. Which address should the technician go to?');
      const start = args.preferredStart ? future(args.preferredStart, 'preferred time') : null;
      const usesFileAddress = address === onFile;
      return {
        title: 'Request a visit',
        lines: [
          `What: ${title}`,
          ...(args.description ? [`Details: ${String(args.description).trim()}`] : []),
          `Where: ${address}`,
          `When: ${start ? `${when(start.toISOString(), ctx)} if possible` : 'The office will contact you to arrange a time'}`,
          `Urgency: ${urgency.label}`,
        ],
        args: {
          title, description: args.description ? String(args.description).trim() : undefined, address,
          lat: usesFileAddress && me.latitude ? Number(me.latitude) : undefined,
          lng: usesFileAddress && me.longitude ? Number(me.longitude) : undefined,
          priority: urgency.priority, start: start?.toISOString(),
          name: `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || ctx.name, phone: me.phone ?? me.mobile, email: me.email ?? ctx.email,
        },
      };
    },
    run: async (args, ctx, http) => {
      const job = await http.post('jobs', '/jobs', {
        customerId: ctx.customerId, customerName: args.name, customerPhone: args.phone, customerEmail: args.email,
        title: args.title, description: args.description,
        serviceAddress: args.address, serviceLatitude: args.lat, serviceLongitude: args.lng,
        priority: args.priority, scheduledStart: args.start,
        tags: ['portal-request', 'via-assistant'],
      });
      return { done: true, jobNumber: job?.jobNumber };
    },
  },
  {
    name: 'request_reschedule',
    description:
      'Ask the office to move one of the customer\'s visits. Offer up to 3 preferred times, or none to let the office suggest. ' +
      'The office confirms the new time. The customer confirms the request first.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        reason: { type: 'string', enum: ['not_available', 'access', 'other'] },
        note: { type: 'string', description: 'Anything the office should know.' },
        preferredTimes: {
          type: 'array', maxItems: 3,
          items: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } }, required: ['start'] },
          description: 'ISO 8601 with the company offset. End defaults to 2 hours after start.',
        },
      },
      required: ['jobId', 'reason'],
    },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (CLOSED.has(job.status)) throw new ToolRefusal(`${job.jobNumber} is ${job.status.toLowerCase()}, so it cannot be moved.`);
      if (job.status === 'EN_ROUTE' || job.status === 'ON_SITE') {
        throw new ToolRefusal(`Your technician is ${job.status === 'EN_ROUTE' ? 'already on the way' : 'already there'}. Call the office to change it now.`);
      }
      if (job.rescheduleState) throw new ToolRefusal(`There is already an open request to move ${job.jobNumber}. The office will reply to it.`);
      const reason = REASONS[String(args.reason)] ?? REASONS.other;
      const times = (Array.isArray(args.preferredTimes) ? args.preferredTimes : []).slice(0, 3).map((t: any) => {
        const start = future(t?.start, 'preferred time');
        const end = t?.end ? future(t.end, 'end time') : new Date(start.getTime() + 2 * 3600_000);
        if (end <= start) throw new ToolRefusal('Each preferred time needs to end after it starts.');
        return { startAt: start.toISOString(), endAt: end.toISOString() };
      });
      return {
        title: `Ask to move ${job.jobNumber}`,
        lines: [
          `${job.title}, now ${when(job.scheduledStart, ctx)}`,
          `Reason: ${reason.label}${args.note ? `. ${String(args.note).trim()}` : ''}`,
          ...(times.length
            ? times.map((t: { startAt: string }, i: number) => `Option ${i + 1}: ${when(t.startAt, ctx)}`)
            : ['You are asking the office to suggest new times.']),
          'The office confirms the new time with you.',
        ],
        args: { jobId: job.id, reasonCode: reason.code, reason: args.note ? String(args.note).trim() : undefined, slots: times },
      };
    },
    run: async (args, _ctx, http) => {
      await http.post('jobs', `/reschedule/jobs/${args.jobId}`, {
        mode: args.slots.length ? 'PROPOSE_SLOTS' : 'OPEN_ASK', reasonCode: args.reasonCode, reason: args.reason,
        ...(args.slots.length ? { slots: args.slots } : {}),
      });
      return { done: true };
    },
  },
  {
    name: 'accept_quote',
    description: 'Accept one of the customer\'s quotes, agreeing to the work and price. The customer confirms first.',
    parameters: { type: 'object', properties: { quoteId: { type: 'string' } }, required: ['quoteId'] },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    preview: async (args, ctx, http) => {
      const quote = await myQuote(http, ctx, args.quoteId);
      openableQuote(quote);
      return {
        title: `Accept ${quote.quoteNumber}`,
        lines: [
          `${quote.title ?? 'Quote'}: ${money(quote.total, quote.currency)}`,
          ...(quote.validUntil ? [`Valid until ${day(quote.validUntil, ctx)}`] : []),
          'You agree to the work and price in this quote. The office will be in touch to schedule it.',
        ],
        args: { quoteId: quote.id },
      };
    },
    run: async (args, ctx, http) => {
      await http.post('finance', `/quotes/${args.quoteId}/approve`, { approvedByName: ctx.name ?? 'Customer', approvedByEmail: ctx.email });
      return { done: true };
    },
  },
  {
    name: 'decline_quote',
    description: 'Decline one of the customer\'s quotes, with an optional reason. The customer confirms first.',
    parameters: { type: 'object', properties: { quoteId: { type: 'string' }, reason: { type: 'string' } }, required: ['quoteId'] },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    preview: async (args, ctx, http) => {
      const quote = await myQuote(http, ctx, args.quoteId);
      openableQuote(quote);
      return {
        title: `Decline ${quote.quoteNumber}`,
        lines: [`${quote.title ?? 'Quote'}: ${money(quote.total, quote.currency)}`, ...(args.reason ? [`Reason: ${String(args.reason).trim()}`] : [])],
        args: { quoteId: quote.id, reason: args.reason ? String(args.reason).trim() : undefined },
      };
    },
    run: async (args, ctx, http) => {
      await http.post('finance', `/quotes/${args.quoteId}/decline`, { declinedByName: ctx.name ?? 'Customer', declinedByEmail: ctx.email, reason: args.reason });
      return { done: true };
    },
  },
  {
    name: 'message_office',
    description: 'Send the company office a message from the customer, optionally about one visit. The customer confirms the wording first.',
    parameters: {
      type: 'object',
      properties: { message: { type: 'string', description: 'The message, in the customer\'s voice.' }, jobId: { type: 'string' } },
      required: ['message'],
    },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    preview: async (args, ctx, http) => {
      const message = String(args.message ?? '').trim();
      if (!message) throw new ToolRefusal('What should the message say?');
      if (message.length > 1000) throw new ToolRefusal('That message is too long. Keep it under 1,000 characters.');
      const job = args.jobId ? await myJob(http, ctx, args.jobId) : null;
      return {
        title: 'Message the office',
        lines: [...(job ? [`About: ${job.jobNumber}, ${job.title}`] : []), `"${message}"`],
        args: { message, jobId: job?.id, subject: job ? `About ${job.jobNumber}` : 'Message from the assistant' },
      };
    },
    run: async (args, ctx, http) => {
      const thread = await http.post('comms', '/messaging/threads', {
        customerId: ctx.customerId, customerName: ctx.name, subject: args.subject, jobId: args.jobId,
      });
      await http.post('comms', `/messaging/threads/${thread.id}/messages`, { body: args.message });
      return { done: true };
    },
  },
];
