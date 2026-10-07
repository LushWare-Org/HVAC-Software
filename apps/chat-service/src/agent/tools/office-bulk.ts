/**
 * Bulk changes: Kelvin picks the jobs or invoices himself and shows one card
 * with a step per item, built from the existing actions. Each step is checked
 * on its own; an item that can't be changed is left out with its reason. The
 * card runs as a plan, so re-checks before running and undo work as usual.
 */
import { MAX_STEPS, previewPlan, type PlanInput } from '../plan/plan';
import type { ServiceHttp } from '../service-http';
import { ToolRefusal, type ActionPreview, type AgentContext, type AgentTool } from '../types';
import { inHours, technicianByIdOrName } from './disruption-tools';
import { usualTechnician } from './usual-tech';

const DISPATCH = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const MONEY = ['super_admin', 'company_admin', 'office_manager'];
const WAITING = ['PENDING', 'SCHEDULED'];
const CLOSED = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'];
const DAY_MS = 86_400_000;

const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function checkDate(date: unknown, field = 'date'): string {
  const d = String(date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(`${d}T12:00:00Z`))) throw new ToolRefusal(`Give the ${field} as YYYY-MM-DD.`);
  return d;
}

/** "Thu 8 Oct" for a YYYY-MM-DD date. */
const dayName = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

function offset(ctx: AgentContext): string {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: ctx.timezone || 'UTC', timeZoneName: 'longOffset' })
    .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
  return name.replace('GMT', '') || '+00:00';
}

/** Jobs scheduled on a company-time day, optionally only one technician's (as lead). */
async function jobsOn(http: ServiceHttp, ctx: AgentContext, date: string, assignedToId?: string): Promise<any[]> {
  const off = offset(ctx);
  const jobs = list(await http.get('jobs', '/jobs', {
    dateFrom: `${date}T00:00:00${off}`, dateTo: `${date}T23:59:59${off}`, limit: 100, ...(assignedToId && { assignedToId }),
  }));
  return jobs.sort((a, b) => Date.parse(a.scheduledStart ?? '') - Date.parse(b.scheduledStart ?? ''));
}

/** Technicians off that day, and those working different hours. */
async function availabilityOn(http: ServiceHttp, date: string) {
  const rows = list(await http.get('scheduling', '/dispatch/availability', { from: date, to: date }).catch(() => []));
  return {
    off: new Set(rows.filter((r) => r.isAvailable === false).map((r) => r.technicianId as string)),
    hours: new Map(rows.filter((r) => r.isAvailable !== false && r.startTime).map((r) => [r.technicianId as string, { start: r.startTime as string, end: r.endTime as string }])),
  };
}

const span = (j: any) => {
  const start = Date.parse(j.scheduledStart);
  const end = j.scheduledEnd ? Date.parse(j.scheduledEnd) : start + (Number(j.estimatedDurationMins) || 60) * 60_000;
  return { start, end };
};

/**
 * The best free technician for each job: no clash, not off, inside their hours,
 * not already picked for an overlapping job here. Score decides, less 10 points
 * per job they were already given in this batch, so the work is spread.
 */
async function pickTechnicians(http: ServiceHttp, ctx: AgentContext, jobs: any[], date: string, exclude?: string) {
  const { off, hours } = await availabilityOn(http, date);
  const usual = new Map<string, Awaited<ReturnType<typeof usualTechnician>>>();
  const given = new Map<string, Array<{ start: number; end: number }>>();
  const picks: Array<{ job: any; tech: any }> = [];
  const notes: string[] = [];
  for (const job of jobs) {
    if (!job.scheduledStart) { notes.push(`Left out ${job.jobNumber}: it has no time yet. Give it a time first.`); continue; }
    const s = span(job);
    const cands = list(await http.get('scheduling', '/dispatch/candidates', {
      jobId: job.id, start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString(), limit: 10,
    }).catch(() => []));
    const free = cands.filter((c) => {
      const id = c.technician?.id;
      const h = hours.get(id);
      return id && id !== exclude && c.technician.isActive !== false && !c.conflicts?.length && !off.has(id)
        && (!h || inHours(job.scheduledStart, job.scheduledEnd, h.start, h.end, ctx))
        && !(given.get(id) ?? []).some((g) => g.start < s.end && s.start < g.end);
    });
    if (job.customerId && !usual.has(job.customerId)) usual.set(job.customerId, await usualTechnician(http, job.customerId));
    const regular = usual.get(job.customerId);
    // Learned: the customer's usual technician gets 15 points when free.
    const rank = (c: any) => Number(c.score || 0) - 10 * (given.get(c.technician.id)?.length ?? 0) + (regular && c.technician.userId === regular.userId ? 15 : 0);
    const best = free.reduce<any>((a, c) => (!a || rank(c) > rank(a) ? c : a), undefined);
    if (!best) { notes.push(`Left out ${job.jobNumber}: nobody is free then.`); continue; }
    if (regular && best.technician.userId === regular.userId) notes.push(`${job.jobNumber} goes to ${best.technician.name}, who usually looks after ${job.customerName ?? 'this customer'}.`);
    given.set(best.technician.id, [...(given.get(best.technician.id) ?? []), s]);
    picks.push({ job, tech: best.technician });
  }
  return { picks, notes };
}

/** Caps the list at what one card holds, with a note about the rest. */
function cap<T>(items: T[], what: string): { items: T[]; notes: string[] } {
  if (items.length <= MAX_STEPS) return { items, notes: [] };
  return { items: items.slice(0, MAX_STEPS), notes: [`${items.length - MAX_STEPS} more ${what} after these. Ask me again once these are done.`] };
}

/** One card from the steps; picker notes first, then what the steps left out, then anything else. */
async function bulkCard(summary: string, steps: PlanInput['steps'], ctx: AgentContext, http: ServiceHttp, before: string[], after: string[] = []): Promise<ActionPreview> {
  if (!steps.length) throw new ToolRefusal(before.map((n) => n.replace(/^Left out /, '')).join(' ') || 'There is nothing to change.');
  const p = await previewPlan({ summary, steps }, ctx, http, 'admin', { lenient: true });
  return { title: p.title, lines: p.lines, steps: p.steps, notes: [...before, ...p.notes, ...after], args: p.args as unknown as Record<string, unknown> };
}

const notRun = async () => { throw new ToolRefusal('This runs as a plan from its card.'); };

export const BULK_TOOLS: AgentTool[] = [
  {
    name: 'fill_unassigned_jobs',
    description:
      'Assign every unassigned job on a day in one card: each to the best technician who is free then (no clash, not off), spreading the work; ' +
      'or all to one named technician. Use for "give tomorrow\'s unassigned jobs to whoever is free".',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The day, YYYY-MM-DD in company time.' },
        technician: { type: 'string', description: 'Optional: give them all to this technician (name or id).' },
      },
      required: ['date'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const date = checkDate(args.date);
      const waiting = (await jobsOn(http, ctx, date)).filter((j) => WAITING.includes(j.status) && !j.assignedToId && !j.crewUserIds?.length);
      if (!waiting.length) throw new ToolRefusal(`No unassigned jobs on ${dayName(date)}.`);
      const { items, notes: more } = cap(waiting, 'unassigned jobs');
      let picks: Array<{ job: any; tech: any }>;
      let notes: string[] = [];
      if (args.technician) {
        const tech = await technicianByIdOrName(http, args.technician);
        picks = items.map((job) => ({ job, tech }));
      } else {
        ({ picks, notes } = await pickTechnicians(http, ctx, items, date));
      }
      const steps = picks.map(({ job, tech }) => ({ tool: 'assign_technician', args: { jobId: job.id, technicianId: tech.id }, label: job.jobNumber }));
      return bulkCard(`Assign ${plural(steps.length, 'unassigned job')}, ${dayName(date)}`, steps, ctx, http, notes,
        [...more, "Assignments can't be undone from here; change one on the Scheduling board."]);
    },
    run: notRun,
  },
  {
    name: 'move_technician_day',
    description:
      "Move all of one technician's waiting visits from one day to another, keeping their times. Each move can be undone. " +
      'Use for "move Nuwan\'s Thursday to Friday".',
    parameters: {
      type: 'object',
      properties: {
        technician: { type: 'string', description: 'Name or id.' },
        from: { type: 'string', description: 'The day to move from, YYYY-MM-DD.' },
        to: { type: 'string', description: 'The day to move to, YYYY-MM-DD.' },
      },
      required: ['technician', 'from', 'to'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const from = checkDate(args.from, 'day to move from');
      const to = checkDate(args.to, 'day to move to');
      if (from === to) throw new ToolRefusal('Those are the same day.');
      const tech = await technicianByIdOrName(http, args.technician);
      const jobs = (await jobsOn(http, ctx, from, tech.userId)).filter((j) => !CLOSED.includes(j.status) && j.scheduledStart);
      const busy = jobs.filter((j) => !WAITING.includes(j.status)).map((j) => `${j.jobNumber} is already under way, so it stays.`);
      const waiting = jobs.filter((j) => WAITING.includes(j.status));
      if (!waiting.length) throw new ToolRefusal(`${tech.name} has no waiting visits on ${dayName(from)}.${busy.length ? ` ${busy.join(' ')}` : ''}`);
      const { items, notes: more } = cap(waiting, 'visits');
      const shift = Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS) * DAY_MS;
      const steps = items.map((j) => {
        const s = span(j);
        return { tool: 'reschedule_job', args: { jobId: j.id, start: new Date(s.start + shift).toISOString(), end: new Date(s.end + shift).toISOString() }, label: j.jobNumber };
      });
      const after: string[] = [...more];
      if ((await availabilityOn(http, to)).off.has(tech.id)) after.push(`${tech.name} is marked off on ${dayName(to)}.`);
      const already = (await jobsOn(http, ctx, to, tech.userId)).filter((j) => !CLOSED.includes(j.status)).length;
      if (already) after.push(`${tech.name} already has ${plural(already, 'visit')} on ${dayName(to)}. Check the times don't clash.`);
      return bulkCard(`Move ${tech.name}'s visits from ${dayName(from)} to ${dayName(to)}`, steps, ctx, http, busy, after);
    },
    run: notRun,
  },
  {
    name: 'hand_over_day',
    description:
      "Give all of one technician's waiting visits on a day to someone else: one named technician, or each to whoever is free then. " +
      'Use when someone is sick or off ("Nuwan is sick, give his Thursday to Kasun"). Each hand-over can be undone. ' +
      'Afterwards, offer to mark them off that day with set_technician_availability.',
    parameters: {
      type: 'object',
      properties: {
        technician: { type: 'string', description: 'Whose visits: name or id.' },
        date: { type: 'string', description: 'The day, YYYY-MM-DD.' },
        to: { type: 'string', description: 'Optional: who gets them all (name or id). Leave out for whoever is free.' },
      },
      required: ['technician', 'date'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const date = checkDate(args.date);
      const tech = await technicianByIdOrName(http, args.technician);
      const waiting = (await jobsOn(http, ctx, date, tech.userId)).filter((j) => WAITING.includes(j.status));
      if (!waiting.length) throw new ToolRefusal(`${tech.name} has no waiting visits on ${dayName(date)}.`);
      const { items, notes: more } = cap(waiting, 'visits');
      let picks: Array<{ job: any; tech: any }>;
      let notes: string[] = [];
      if (args.to) {
        const next = await technicianByIdOrName(http, args.to);
        if (next.id === tech.id) throw new ToolRefusal('That is the same technician.');
        picks = items.map((job) => ({ job, tech: next }));
      } else {
        ({ picks, notes } = await pickTechnicians(http, ctx, items, date, tech.id));
      }
      const steps = picks.map(({ job, tech: next }) => ({ tool: 'reassign_job', args: { jobId: job.id, technician: next.id }, label: job.jobNumber }));
      return bulkCard(`Hand over ${tech.name}'s ${dayName(date)}`, steps, ctx, http, notes, more);
    },
    run: notRun,
  },
  {
    name: 'chase_overdue_invoices',
    description:
      'Email a reminder for every overdue invoice, oldest first, optionally only those overdue at least N days. ' +
      'Each reminder reaches the customer and cannot be unsent.',
    parameters: {
      type: 'object',
      properties: { minDaysOverdue: { type: 'number', description: 'Only invoices at least this many days past due. Default 1.' } },
    },
    kind: 'write',
    bots: ['admin'],
    roles: MONEY,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const days = Math.max(1, Math.floor(Number(args.minDaysOverdue) || 1));
      const cutoff = Date.now() - days * DAY_MS;
      const due = list(await http.get('finance', '/invoices', { status: 'OVERDUE', limit: 100 }))
        .filter((i) => i.dueDate && Date.parse(i.dueDate) <= cutoff)
        .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
      if (!due.length) throw new ToolRefusal(`No invoices are ${plural(days, 'day')} or more overdue.`);
      const { items, notes: more } = cap(due, 'overdue invoices');
      const steps = items.map((i) => ({ tool: 'send_invoice', args: { invoiceId: i.id }, label: i.invoiceNumber }));
      return bulkCard(`Chase ${plural(steps.length, 'overdue invoice')}`, steps, ctx, http, [], more);
    },
    run: notRun,
  },
  {
    name: 'message_day_customers',
    description:
      "Send the same message to every customer with a visit on a day, or on one technician's day, once per customer. " +
      'For example that the technician is running late. Write it so it fits every customer (no names). It cannot be unsent.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The day, YYYY-MM-DD.' },
        technician: { type: 'string', description: "Optional: only this technician's customers (name or id)." },
        message: { type: 'string', description: 'The message, polite and specific, signed off as the company.' },
      },
      required: ['date', 'message'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const message = String(args.message ?? '').trim();
      if (!message) throw new ToolRefusal('What should the message say?');
      const date = checkDate(args.date);
      const tech = args.technician ? await technicianByIdOrName(http, args.technician) : undefined;
      const seen = new Set<string>();
      const jobs = (await jobsOn(http, ctx, date, tech?.userId))
        .filter((j) => !CLOSED.includes(j.status) && j.customerId && !seen.has(j.customerId) && seen.add(j.customerId));
      if (!jobs.length) throw new ToolRefusal(`No customers to message on ${tech ? `${tech.name}'s ` : ''}${dayName(date)}.`);
      const { items, notes: more } = cap(jobs, 'customers');
      const steps = items.map((j) => ({ tool: 'message_customer', args: { jobId: j.id, message }, label: j.jobNumber }));
      return bulkCard(`Message ${plural(steps.length, 'customer')} on ${tech ? `${tech.name}'s ` : ''}${dayName(date)}`, steps, ctx, http, [], more);
    },
    run: notRun,
  },
];
