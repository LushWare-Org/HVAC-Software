import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import type { ServiceHttp } from '../service-http';
import { when } from './write-tools';
import { CHANNELS_PARAM, channelWords, channelsOf, sendDirect, sendsLine, type Channel } from './reach';

const DISPATCH = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);

/** Accepts an id or a job number like "JOB-0412", as people say. */
async function loadJob(http: ServiceHttp, jobId: unknown) {
  if (!jobId) throw new ToolRefusal('Which job? Find it first.');
  let job: any = null;
  try { job = await http.get('jobs', `/jobs/${jobId}`); } catch { /* maybe a number */ }
  if (!job?.id && /^[A-Z]{1,6}-[\w-]+$/i.test(String(jobId))) {
    const wanted = String(jobId).toUpperCase();
    job = list(await http.get('jobs', '/jobs', { search: String(jobId), limit: 10 })).find((j) => String(j.jobNumber).toUpperCase() === wanted) ?? null;
  }
  if (!job?.id) throw new ToolRefusal('That job was not found.');
  return job;
}

export async function technicianByIdOrName(http: ServiceHttp, idOrName: unknown) {
  const techs = list(await http.get('scheduling', '/technicians'));
  const q = String(idOrName ?? '').trim().toLowerCase();
  const tech = techs.find((t) => t.id === idOrName)
    ?? techs.find((t) => String(t.name).toLowerCase() === q)
    ?? (() => { const m = techs.filter((t) => String(t.name).toLowerCase().includes(q)); return m.length === 1 ? m[0] : undefined; })();
  if (!tech) throw new ToolRefusal(`No single technician matches "${idOrName}". Use list_technicians.`);
  if (tech.isActive === false) throw new ToolRefusal(`${tech.name} is inactive.`);
  return tech;
}

export const DISRUPTION_TOOLS: AgentTool[] = [
  {
    name: 'get_disruptions',
    description:
      'What is going wrong today: jobs starting late, technicians arriving late, jobs running over, and which later jobs that makes late. ' +
      'Each comes with ready options (give it to someone else, move it, tell the customer). Use when asked what is running late or how to fix the day.',
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: DISPATCH,
    run: async (_args, _ctx, http) => {
      const res = await http.get('scheduling', '/dispatch/disruptions');
      const items: any[] = res?.disruptions ?? [];
      if (!items.length) return { disruptions: [], note: 'Nothing is running late right now.' };
      return {
        disruptions: items.map((d) => ({
          kind: d.kind, job: d.jobNumber, technician: d.technicianName, detail: d.detail,
          laterJobsMadeLate: (d.knockOn ?? []).map((k: any) => `${k.jobNumber} (${k.delayMins} min)`),
          options: (d.options ?? []).map((o: any) => ({ option: o.label, howToDoIt: o.request })),
        })),
      };
    },
  },
  {
    name: 'reassign_job',
    description:
      'Give a job to a different technician instead of the current one (helpers stay on). For a job nobody has yet, use assign_technician. ' +
      'Not possible once the technician is on the way or on site. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job id or job number.' },
        technician: { type: 'string', description: 'The new technician: id or name.' },
      },
      required: ['jobId', 'technician'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    preview: async (args, ctx, http) => {
      const job = await loadJob(http, args.jobId);
      if (['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(job.status)) throw new ToolRefusal(`${job.jobNumber} is ${job.status.toLowerCase()}.`);
      if (job.status === 'EN_ROUTE' || job.status === 'ON_SITE') {
        throw new ToolRefusal(`${job.assignedToName ?? 'The technician'} is already ${job.status === 'EN_ROUTE' ? 'on the way' : 'on site'}. Call them before changing it.`);
      }
      const crew = list(await http.get('scheduling', `/dispatch/jobs/${job.id}/crew`));
      if (!crew.length) throw new ToolRefusal(`${job.jobNumber} has nobody assigned yet; assign someone instead.`);
      const lead = crew.find((m) => m.assignment?.isLead) ?? crew[0];
      // An undo: only hand it back if nobody changed it since.
      if (args.expectLeadId && lead.technician?.id !== args.expectLeadId) throw new ToolRefusal(`${job.jobNumber} was given to someone else since, so I won't hand it back.`);
      const next = await technicianByIdOrName(http, args.technician);
      if (next.id === lead.technician?.id) throw new ToolRefusal(`${next.name} already has ${job.jobNumber}.`);
      const helpers = crew.map((m) => m.technician?.id).filter((id: string) => id && id !== lead.technician?.id && id !== next.id);
      return {
        title: `Give ${job.jobNumber} to ${next.name}`,
        lines: [
          `${job.jobNumber}: ${job.title}${job.customerName ? `, ${job.customerName}` : ''}`,
          `From ${lead.technician?.name ?? 'the current technician'} to ${next.name}, ${when(job.scheduledStart, ctx)}`,
          ...(helpers.length ? [helpers.length === 1 ? '1 helper stays on the job.' : `${helpers.length} helpers stay on the job.`] : []),
          `${next.name} gets it in the technician app; ${lead.technician?.name ?? 'the previous technician'} no longer sees it.`,
        ],
        args: {
          jobId: job.id, technicianIds: [next.id, ...helpers], leadTechnicianId: next.id,
          // Kept so undo can hand it back.
          jobNumber: job.jobNumber, nextName: next.name, prevLeadId: lead.technician?.id, prevLeadName: lead.technician?.name,
        },
      };
    },
    run: async (args, _ctx, http) => {
      await http.patch('scheduling', `/dispatch/jobs/${args.jobId}/crew`, { technicianIds: args.technicianIds, leadTechnicianId: args.leadTechnicianId });
      return { done: true, summary: `Gave ${args.jobNumber ?? 'the job'} to ${args.nextName ?? 'the new technician'}` };
    },
    reverse: (a) => (a.prevLeadId
      ? { tool: 'reassign_job', args: { jobId: a.jobId, technician: a.prevLeadId, expectLeadId: a.leadTechnicianId }, title: `Give ${a.jobNumber ?? 'the job'} back to ${a.prevLeadName ?? 'the previous technician'}` }
      : null),
  },
  {
    name: 'message_customer',
    description:
      "Send a customer a message: in their portal inbox, by email, as a push notification, or any mix. Usually about a job " +
      "(e.g. the technician is running late); pass customerId instead for anything else. Shows the exact wording first; the person confirms.",
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job id or job number, when the message is about a job.' },
        customerId: { type: 'string', description: 'Customer id from find_customers, when it is not about a job.' },
        message: { type: 'string', description: 'The message, polite and specific, signed off as the company.' },
        subject: { type: 'string', description: 'Optional email subject / notification heading.' },
        channels: CHANNELS_PARAM,
      },
      required: ['message'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    sends: (a) => sendsLine(channelsOf(a.channels), a.customerName ?? 'the customer'),
    preview: async (args, _ctx: AgentContext, http) => {
      const message = String(args.message ?? '').trim();
      if (!message) throw new ToolRefusal('What should the message say?');
      if (message.length > 1000) throw new ToolRefusal('Keep the message under 1,000 characters.');
      let customerId: string, customerName: string, email: string | null, job: any = null;
      if (args.jobId) {
        job = await loadJob(http, args.jobId);
        if (!job.customerId) throw new ToolRefusal(`${job.jobNumber} has no customer to message.`);
        customerId = job.customerId; customerName = job.customerName ?? 'the customer'; email = job.customerEmail ?? null;
        if (!email) email = (await http.get('crm', `/customers/${customerId}`).catch(() => null))?.email ?? null;
      } else if (args.customerId) {
        const c = await http.get('crm', `/customers/${args.customerId}`).catch(() => null);
        if (!c?.id) throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
        customerId = c.id; customerName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'the customer'; email = c.email ?? null;
      } else throw new ToolRefusal('Which customer, or which job is it about?');

      let channels = channelsOf(args.channels);
      const notes: string[] = [];
      if (channels.includes('email') && !email) {
        channels = channels.filter((c) => c !== 'email');
        notes.push(`${customerName} has no email address on file, so it won't be emailed.`);
      }
      if (!channels.length) throw new ToolRefusal(`${customerName} has no email address on file. Send it as a message or push instead?`);
      const subject = String(args.subject ?? '').trim().slice(0, 120) || (job ? `About your visit (${job.jobNumber})` : 'A message from us');
      return {
        title: `Message ${customerName}`,
        lines: [
          ...(job ? [`About ${job.jobNumber}: ${job.title}`] : []),
          `"${message}"`,
          `Sends as: ${channelWords(channels)}${channels.includes('email') ? ` (to ${email})` : ''}.`,
          ...(channels.includes('push') ? ['Push reaches them only if they turned on notifications in the app or portal.'] : []),
          ...notes,
        ],
        args: { customerId, customerName, jobId: job?.id, jobNumber: job?.jobNumber, message, subject, channels },
      };
    },
    run: async (args, _ctx, http) => {
      const channels = channelsOf(args.channels);
      const done: Channel[] = [];
      if (channels.includes('message')) {
        // The customer's conversation with the office; Kelvin is shown as the sender.
        await http.post('comms', `/chat/customers/${args.customerId}/messages`, { body: args.message, jobId: args.jobId, via: 'kelvin' });
        done.push('message');
      }
      const { sent, missed } = await sendDirect(http, {
        to: 'customer', id: args.customerId, title: args.subject ?? 'A message from us', message: args.message, channels, jobId: args.jobId,
      });
      done.push(...sent);
      if (!done.length) throw new ToolRefusal(`Nothing reached ${args.customerName}. ${missed.join('. ')}.`);
      return { done: true, summary: `${sendsLine(done, args.customerName ?? 'the customer')}: sent${missed.length ? `. ${missed.join('. ')}` : ''}` };
    },
  },
  {
    name: 'message_technician',
    description:
      'Send a technician a message from the office: an in-app notification in their app, a push to their phone, an email, or any mix. ' +
      'For example a change to their day, or something to bring. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        technician: { type: 'string', description: 'Name or id.' },
        message: { type: 'string', description: 'The message, short and specific.' },
        title: { type: 'string', description: 'Optional short heading, e.g. "Change to your 2pm".' },
        channels: { ...CHANNELS_PARAM, description: CHANNELS_PARAM.description.replace('Defaults to ["message"]', 'Defaults to ["message","push"]') },
        jobId: { type: 'string', description: 'Optional job the message is about.' },
      },
      required: ['technician', 'message'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    sends: (a) => sendsLine(channelsOf(a.channels, ['message', 'push']), a.name ?? 'the technician'),
    preview: async (args, _ctx: AgentContext, http) => {
      const message = String(args.message ?? '').trim();
      if (!message) throw new ToolRefusal('What should the message say?');
      if (message.length > 1000) throw new ToolRefusal('Keep the message under 1,000 characters.');
      const tech = await technicianByIdOrName(http, args.technician);
      if (!tech.userId) throw new ToolRefusal(`${tech.name} has no login to send to.`);
      const channels = channelsOf(args.channels, ['message', 'push']);
      const title = String(args.title ?? '').trim().slice(0, 120) || 'Message from the office';
      return {
        title: `Message ${tech.name}`,
        lines: [`"${message}"`, `Sends as: ${channelWords(channels)}.`],
        args: { userId: tech.userId, name: tech.name, message, title, channels, jobId: args.jobId ? String(args.jobId) : undefined },
      };
    },
    run: async (args, _ctx, http) => {
      const channels = channelsOf(args.channels, ['message', 'push']);
      const done: Channel[] = [];
      if (channels.includes('message')) {
        // The technician's conversation with the office (they get a push from it too).
        const conv = await http.post('comms', '/chat/conversations/tech-office', { techUserId: args.userId });
        await http.post('comms', `/chat/conversations/${conv.id}/messages`, { body: args.message, jobId: args.jobId, via: 'kelvin' });
        done.push('message');
      }
      const { sent, missed } = await sendDirect(http, { to: 'staff', id: args.userId, title: args.title, message: args.message, channels, jobId: args.jobId });
      done.push(...sent);
      if (!done.length) throw new ToolRefusal(`Nothing reached ${args.name}. ${missed.join('. ')}.`);
      return { done: true, summary: `${sendsLine(done, args.name)}: sent${missed.length ? `. ${missed.join('. ')}` : ''}` };
    },
  },
  {
    name: 'request_location',
    description:
      "Ask a job's customer to mark where the visit is on a map. They get a link by in-app message, email and/or push; their pin " +
      'goes straight onto the job. Use when a job has no map location (Smart Assign cannot measure distance without it). The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'Job id or job number.' },
        channels: { ...CHANNELS_PARAM, description: CHANNELS_PARAM.description.replace('Defaults to ["message"]', 'Defaults to all three') },
      },
      required: ['jobId'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    sends: (a) => `Location request: ${sendsLine(channelsOf(a.channels, ['message', 'email', 'push']), a.customerName ?? 'the customer')}`,
    preview: async (args, _ctx: AgentContext, http) => {
      const job = await loadJob(http, args.jobId);
      if (!job.customerId) throw new ToolRefusal(`${job.jobNumber} has no customer to ask.`);
      if (['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(job.status)) throw new ToolRefusal(`${job.jobNumber} is already done, so its location isn't needed.`);
      const channels = channelsOf(args.channels, ['message', 'email', 'push']);
      const has = Number(job.serviceLatitude) || Number(job.serviceLongitude);
      return {
        title: `Ask ${job.customerName ?? 'the customer'} where ${job.jobNumber} is`,
        lines: [
          `${job.jobNumber}: ${job.title}`,
          has ? 'It already has a map pin; their answer will replace it.' : 'It has no map location yet.',
          `They get a link to drop a pin, by ${channelWords(channels)}. The link works for 14 days.`,
        ],
        args: { jobId: job.id, jobNumber: job.jobNumber, customerName: job.customerName, channels },
      };
    },
    run: async (args, _ctx, http) => {
      const res = await http.post('jobs', `/jobs/${args.jobId}/location-request`, { channels: channelsOf(args.channels, ['message', 'email', 'push']) });
      const results = Object.entries(res?.results ?? {}) as Array<[Channel, string]>;
      const sent = results.filter(([, r]) => r === 'sent').map(([c]) => c);
      const missed = results.filter(([, r]) => r !== 'sent' && r !== 'with-message').map(([c, r]) => `${c}: ${r === 'no-device' ? 'notifications not turned on' : r === 'no-email' ? 'no email on file' : 'failed'}`);
      if (!sent.length) throw new ToolRefusal(`The request didn't reach ${args.customerName}. ${missed.join('; ')}. The link is ${res?.url}`);
      return { done: true, summary: `Asked ${args.customerName} where ${args.jobNumber} is (${channelWords(sent)})${missed.length ? `. Not sent: ${missed.join('; ')}` : ''}` };
    },
  },
  {
    name: 'set_technician_availability',
    description:
      'Mark a technician off for one or more days (sick, leave, training), give them different hours for a day, or put days back to normal. ' +
      'Dates are YYYY-MM-DD in company time. The card lists booked visits that will need someone else; offer to re-plan them after. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        technician: { type: 'string', description: 'Name or id.' },
        from: { type: 'string', description: 'First date, YYYY-MM-DD.' },
        to: { type: 'string', description: 'Last date, YYYY-MM-DD. Defaults to the first date.' },
        status: { type: 'string', enum: ['off', 'hours', 'normal'], description: 'off: not working. hours: working different hours. normal: a standard day again.' },
        start: { type: 'string', description: 'For hours: start time HH:MM.' },
        end: { type: 'string', description: 'For hours: end time HH:MM.' },
        note: { type: 'string', description: 'Why, e.g. "Sick" or "Training".' },
      },
      required: ['technician', 'from', 'status'],
    },
    kind: 'write',
    bots: ['admin'],
    roles: DISPATCH,
    preview: async (args, ctx, http) => {
      const tech = await technicianByIdOrName(http, args.technician);
      const dates = dateRange(String(args.from ?? ''), String(args.to ?? args.from ?? ''));
      const status = ['off', 'hours', 'normal'].includes(args.status) ? args.status : 'off';
      const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (status === 'hours' && (!hhmm.test(String(args.start)) || !hhmm.test(String(args.end)) || String(args.start) >= String(args.end))) {
        throw new ToolRefusal('Give the hours as start and end times like 08:00 and 12:00.');
      }
      const note = args.note ? String(args.note).trim().slice(0, 200) : undefined;

      // Visits already booked for them on those days: they are what will need re-planning.
      const offset = new Intl.DateTimeFormat('en-US', { timeZone: ctx.timezone || 'UTC', timeZoneName: 'longOffset' })
        .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value.replace('GMT', '') || '+00:00';
      const booked = status === 'normal' ? [] : list(await http.get('jobs', '/jobs', {
        crewUserId: tech.userId, dateFrom: `${dates[0]}T00:00:00${offset}`, dateTo: `${dates[dates.length - 1]}T23:59:59${offset}`, limit: 50,
      })).filter((j) => ['PENDING', 'SCHEDULED'].includes(j.status))
        .filter((j) => status === 'off' || !inHours(j.scheduledStart, j.scheduledEnd, String(args.start), String(args.end), ctx));

      const days = dates.length === 1 ? day(dates[0], ctx) : `${day(dates[0], ctx)} to ${day(dates[dates.length - 1], ctx)}`;
      const what = status === 'off' ? `off ${days}` : status === 'hours' ? `working ${args.start} to ${args.end}, ${days}` : `back to a normal day, ${days}`;
      return {
        title: `${tech.name}: ${status === 'off' ? 'off' : status === 'hours' ? 'different hours' : 'normal hours'}`,
        lines: [
          `${tech.name} ${what}${note ? ` (${note})` : ''}`,
          ...(booked.length
            ? [`${booked.length} booked visit${booked.length === 1 ? '' : 's'} will need someone else or another time:`,
              ...booked.slice(0, 6).map((j) => `${j.jobNumber}, ${when(j.scheduledStart, ctx)}${j.customerName ? `, ${j.customerName}` : ''}`)]
            : status === 'normal' ? [] : ['No booked visits are affected.']),
          `New bookings ${status === 'normal' ? 'can use them again' : 'will not be offered at these times'}.`,
        ],
        args: { technicianId: tech.id, dates, status, start: args.start, end: args.end, note },
      };
    },
    run: async (args, _ctx, http) => {
      for (const date of args.dates as string[]) {
        const path = `/dispatch/availability/${args.technicianId}/${date}`;
        if (args.status === 'normal') await http.delete('scheduling', path);
        else await http.put('scheduling', path, args.status === 'off'
          ? { available: false, note: args.note }
          : { available: true, start: args.start, end: args.end, note: args.note });
      }
      return { done: true, note: 'Ask what is running behind to re-plan any affected visits.' };
    },
  },
];

/** Every date from `from` to `to`, at most 14. */
function dateRange(from: string, to: string): string[] {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(from) || !iso.test(to)) throw new ToolRefusal('Give the dates as YYYY-MM-DD.');
  const out: string[] = [];
  for (let d = new Date(`${from}T12:00:00Z`); d <= new Date(`${to}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
    if (out.length > 14) throw new ToolRefusal('Set at most 14 days at a time.');
  }
  if (!out.length) throw new ToolRefusal('The last date is before the first.');
  return out;
}

/** "Wed 7 Oct" for a local date string. */
function day(date: string, _ctx: AgentContext): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Whether a visit sits inside a day's new hours, compared in company time. */
export function inHours(startIso: string, endIso: string, from: string, to: string, ctx: AgentContext): boolean {
  const hm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ctx.timezone || 'UTC' });
  return !!startIso && hm(startIso) >= from && (!endIso || hm(endIso) <= to);
}

