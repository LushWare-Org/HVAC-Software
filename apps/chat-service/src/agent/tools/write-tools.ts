import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import type { ServiceHttp } from '../service-http';

const DISPATCH = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const MONEY = ['super_admin', 'company_admin', 'office_manager'];
const CLOSED = new Set(['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED']);

/** "Tue 7 Oct, 9:00 AM" in the company's time zone. */
export function when(iso: string | null | undefined, ctx: AgentContext): string {
  if (!iso) return 'not set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'not set';
  return d.toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: ctx.timezone || 'UTC',
  });
}

/** "Wed 18 Feb" in the company's time zone, for dates without a meaningful time. */
export function day(iso: string | null | undefined, ctx: AgentContext): string {
  if (!iso) return 'not set';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'not set';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ctx.timezone || 'UTC' });
}

function parseTime(value: unknown, field: string): Date {
  const d = new Date(String(value ?? ''));
  if (Number.isNaN(d.getTime())) throw new ToolRefusal(`I could not read the ${field} time "${value}". Give a date and time.`);
  return d;
}

/** Length of the job's current slot, else its estimate, else an hour. */
function durationMs(job: any): number {
  if (job.scheduledStart && job.scheduledEnd) {
    const ms = new Date(job.scheduledEnd).getTime() - new Date(job.scheduledStart).getTime();
    if (ms > 0) return ms;
  }
  return (Number(job.estimatedDurationMins) || 60) * 60_000;
}

async function loadJob(http: ServiceHttp, jobId: unknown) {
  if (!jobId) throw new ToolRefusal('Which job? Find it first.');
  let job: any = null;
  try {
    job = await http.get('jobs', `/jobs/${jobId}`);
  } catch { /* maybe a job number; tried below */ }
  if (!job?.id && /^[A-Z]{1,6}-[\w-]+$/i.test(String(jobId))) {
    const wanted = String(jobId).toUpperCase();
    const found = await http.get('jobs', '/jobs', { search: String(jobId), limit: 10 });
    job = (Array.isArray(found) ? found : found?.data ?? []).find((j: any) => String(j.jobNumber).toUpperCase() === wanted) ?? null;
  }
  if (!job?.id) throw new ToolRefusal('That job was not found.');
  return job;
}

const jobLine = (j: any) => `${j.jobNumber}: ${j.title}${j.customerName ? `, ${j.customerName}` : ''}`;

const money = (n: unknown, currency?: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(n) || 0);

export const WRITE_TOOLS: AgentTool[] = [
  {
    name: 'reschedule_job',
    description:
      "Move a job to a new date and time. Times must be ISO 8601 with the company's UTC offset. " +
      'If no end is given the job keeps its current length. The person confirms before it changes.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        start: { type: 'string', description: 'New start, ISO 8601 with offset, e.g. 2026-10-07T09:00:00+04:00' },
        end: { type: 'string', description: 'Optional new end, ISO 8601 with offset.' },
      },
      required: ['jobId', 'start'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    preview: async (args, ctx, http) => {
      const job = await loadJob(http, args.jobId);
      if (CLOSED.has(job.status)) throw new ToolRefusal(`${job.jobNumber} is ${job.status.toLowerCase()}, so it cannot be rescheduled.`);
      const start = parseTime(args.start, 'start');
      const end = args.end ? parseTime(args.end, 'end') : new Date(start.getTime() + durationMs(job));
      if (end <= start) throw new ToolRefusal('The end has to be after the start.');
      return {
        title: `Reschedule ${job.jobNumber}`,
        lines: [
          jobLine(job),
          `From: ${when(job.scheduledStart, ctx)}`,
          `To: ${when(start.toISOString(), ctx)} until ${when(end.toISOString(), ctx).split(', ').pop()}`,
          ...(job.assignedToName ? [`${job.assignedToName} sees the new time in the technician app.`] : []),
        ],
        args: { jobId: job.id, start: start.toISOString(), end: end.toISOString() },
      };
    },
    run: async (args, _ctx, http) => {
      const job = await http.patch('jobs', `/jobs/${args.jobId}`, { scheduledStart: args.start, scheduledEnd: args.end });
      return { done: true, jobNumber: job?.jobNumber, scheduledStart: args.start };
    },
  },
  {
    name: 'assign_technician',
    description:
      'Assign a technician to a job that has nobody assigned yet. Uses the job\'s current time unless a start is given. ' +
      'Get the technician id from list_technicians. The person confirms before it changes.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        technicianId: { type: 'string' },
        start: { type: 'string', description: 'Optional start, ISO 8601 with offset. Required if the job has no time yet.' },
      },
      required: ['jobId', 'technicianId'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    preview: async (args, ctx, http) => {
      const job = await loadJob(http, args.jobId);
      if (CLOSED.has(job.status)) throw new ToolRefusal(`${job.jobNumber} is ${job.status.toLowerCase()}, so it cannot be assigned.`);
      if (job.assignedToName || job.crewUserIds?.length) {
        throw new ToolRefusal(`${job.jobNumber} is already assigned to ${job.assignedToName ?? 'a crew'}. Changing the technician is done from the Scheduling board for now.`);
      }
      const techs: any[] = (await http.get('scheduling', '/technicians'))?.data ?? [];
      const tech = techs.find((t) => t.id === args.technicianId);
      if (!tech) throw new ToolRefusal('That technician was not found. Use list_technicians for the id.');
      if (tech.isActive === false) throw new ToolRefusal(`${tech.name} is inactive.`);
      const startIso = args.start ?? job.scheduledStart;
      if (!startIso) throw new ToolRefusal(`${job.jobNumber} has no time yet. Say when the visit should be.`);
      const start = parseTime(startIso, 'start');
      const end = new Date(start.getTime() + durationMs(job));
      return {
        title: `Assign ${tech.name} to ${job.jobNumber}`,
        lines: [jobLine(job), `Technician: ${tech.name}`, `When: ${when(start.toISOString(), ctx)}`, `${tech.name} gets it in the technician app.`],
        args: {
          jobId: job.id, technicianId: tech.id, start: start.toISOString(), end: end.toISOString(),
          lat: Number(job.serviceLatitude) || 0, lng: Number(job.serviceLongitude) || 0,
        },
      };
    },
    run: async (args, _ctx, http) => {
      // The same two writes the Scheduling board makes.
      await Promise.all([
        http.post('scheduling', '/dispatch/assign/manual', {
          jobId: args.jobId, technicianId: args.technicianId,
          jobLatitude: args.lat, jobLongitude: args.lng,
          scheduledStart: args.start, scheduledEnd: args.end,
          notes: 'Assigned via AI assistant',
        }),
        http.patch('jobs', `/jobs/${args.jobId}`, { scheduledStart: args.start, scheduledEnd: args.end }),
      ]);
      return { done: true };
    },
  },
  {
    name: 'cancel_job',
    description: 'Cancel a job that has not started yet, with a reason. The person confirms before it changes.',
    parameters: {
      type: 'object',
      properties: { jobId: { type: 'string' }, reason: { type: 'string', description: 'Why it is cancelled, in a few words.' } },
      required: ['jobId', 'reason'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    preview: async (args, _ctx, http) => {
      const job = await loadJob(http, args.jobId);
      if (CLOSED.has(job.status)) throw new ToolRefusal(`${job.jobNumber} is already ${job.status.toLowerCase()}.`);
      if (job.status === 'EN_ROUTE' || job.status === 'ON_SITE') {
        throw new ToolRefusal(`${job.assignedToName ?? 'The technician'} is ${job.status === 'EN_ROUTE' ? 'on the way' : 'on site'}. Call them before cancelling.`);
      }
      const reason = String(args.reason ?? '').trim();
      if (!reason) throw new ToolRefusal('Give a reason for cancelling.');
      return {
        title: `Cancel ${job.jobNumber}`,
        lines: [jobLine(job), `Reason: ${reason}`, ...(job.assignedToName ? [`It comes off ${job.assignedToName}'s schedule.`] : [])],
        args: { jobId: job.id, reason },
      };
    },
    run: async (args, _ctx, http) => {
      await http.patch('jobs', `/jobs/${args.jobId}/status`, { status: 'CANCELLED', cancellationReason: args.reason });
      return { done: true };
    },
  },
  {
    name: 'send_invoice',
    description: 'Email an invoice to the customer, with its PDF. Works as a reminder for an invoice already sent. The person confirms first.',
    parameters: { type: 'object', properties: { invoiceId: { type: 'string' } }, required: ['invoiceId'] },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    preview: async (args, ctx, http) => {
      const inv = await http.get('finance', `/invoices/${args.invoiceId}`);
      if (!inv?.id) throw new ToolRefusal('That invoice was not found.');
      if (inv.status === 'VOID') throw new ToolRefusal(`${inv.invoiceNumber} is void.`);
      if (inv.status === 'PAID') throw new ToolRefusal(`${inv.invoiceNumber} is already paid.`);
      if (!inv.customerEmail) throw new ToolRefusal(`${inv.customerName ?? 'This customer'} has no email address on file.`);
      const reminder = !!inv.sentAt;
      return {
        title: `${reminder ? 'Send a reminder for' : 'Send'} ${inv.invoiceNumber}`,
        lines: [
          `To: ${inv.customerName ?? 'Customer'} <${inv.customerEmail}>`,
          `Balance due: ${money(inv.balanceDue, inv.currency)}${inv.dueDate ? `, due ${day(inv.dueDate, ctx)}` : ''}`,
          reminder ? `Last sent ${when(inv.sentAt, ctx)}.` : 'First time this invoice is sent.',
        ],
        args: { invoiceId: inv.id },
      };
    },
    run: async (args, _ctx, http) => {
      await http.patch('finance', `/invoices/${args.invoiceId}/send`);
      return { done: true };
    },
  },
];
