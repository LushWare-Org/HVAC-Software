import { ToolRefusal, type AgentTool } from '../types';
import { serviceErrorMessage } from '../service-http';
import { when } from './write-tools';

const DISPATCH = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'] as const;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const nameOf = (c: any) => clean(`${c.firstName ?? ''} ${c.lastName ?? ''}`, 120);
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** The customer's own map point, when known. Address rows carry none. */
function coordsOf(c: any) {
  return c.latitude != null && c.longitude != null && (Number(c.latitude) || Number(c.longitude))
    ? { serviceLatitude: Number(c.latitude), serviceLongitude: Number(c.longitude) }
    : {};
}
const same = (a: unknown, b: unknown) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/** The visit's address: the chosen site, the only site, else the customer's own address. */
function siteFor(c: any, addressId?: string) {
  const all: any[] = Array.isArray(c.addresses) ? c.addresses : [];
  const fromRow = (a: any, onlySite: boolean) => ({
    serviceAddress: a.line1, serviceCity: a.city ?? undefined, serviceState: a.state ?? undefined, serviceZip: a.postcode ?? undefined,
    // The customer's point belongs to this site when it is their only one, or the same street.
    ...(onlySite || same(a.line1, c.address) ? coordsOf(c) : {}),
  });
  if (addressId) {
    const a = all.find((x) => x.id === addressId);
    if (!a) throw new ToolRefusal('That address is not one of this customer\'s.');
    return fromRow(a, false);
  }
  const sites = all.filter((a) => a.type === 'Site');
  if (sites.length > 1) {
    throw new ToolRefusal(`${nameOf(c)} has ${sites.length} sites: ${sites.map((s) => `${s.line1} (id ${s.id})`).join('; ')}. Which one?`);
  }
  if (sites.length === 1) return fromRow(sites[0], true);
  if (!c.address) throw new ToolRefusal(`${nameOf(c)} has no address on file. Add one in Customers first.`);
  return { serviceAddress: c.address, serviceCity: c.city ?? undefined, serviceState: c.state ?? undefined, serviceZip: c.zipCode ?? undefined, ...coordsOf(c) };
}

function localDate(d: Date, tz: string) {
  return d.toLocaleDateString('en-CA', { timeZone: tz });
}

export const CREATE_JOB: AgentTool = {
  name: 'create_job',
  description:
    'Create a new job for an existing customer (get customerId from find_customers). A start time and a technician are optional; ' +
    'if you give a technician you must give a start, and it must be one of their open times from find_open_times. ' +
    'The person confirms before it is created.',
  parameters: {
    type: 'object',
    properties: {
      customerId: { type: 'string' },
      title: { type: 'string', description: 'Short job title in the person\'s words, e.g. "AC not cooling".' },
      description: { type: 'string' },
      priority: { type: 'string', enum: [...PRIORITIES] },
      start: { type: 'string', description: 'Optional start, ISO 8601 with the company offset.' },
      durationMins: { type: 'number', description: 'Optional, default 90.' },
      technicianId: { type: 'string', description: 'Optional, from list_technicians or find_open_times.' },
      addressId: { type: 'string', description: 'Only when the customer has several sites; the id from the refusal message.' },
    },
    required: ['customerId', 'title'],
  },
  kind: 'write',
  bots: ['admin'],
  roles: DISPATCH,
  kelvinOnly: true,
  preview: async (args, ctx, http) => {
    let c: any;
    try {
      c = await http.get('crm', `/customers/${args.customerId}`);
    } catch {
      throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
    }
    if (!c?.id) throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
    if (c.isActive === false) throw new ToolRefusal(`${nameOf(c)} is inactive. Reactivate them in Customers first.`);
    const name = nameOf(c);
    const title = clean(args.title, 200);
    if (!title) throw new ToolRefusal('What is the job? Give a short title.');
    const priority = (PRIORITIES as readonly string[]).includes(args.priority) ? args.priority : 'NORMAL';
    const durationMins = Math.min(600, Math.max(15, Math.round(Number(args.durationMins) || 90)));
    const site = siteFor(c, args.addressId);

    let start: Date | undefined;
    if (args.start) {
      start = new Date(String(args.start));
      if (Number.isNaN(start.getTime())) throw new ToolRefusal(`I could not read the time "${args.start}". Give a date and time.`);
    }
    let tech: any;
    if (args.technicianId) {
      const techs: any[] = (await http.get('scheduling', '/technicians'))?.data ?? [];
      tech = techs.find((t) => t.id === args.technicianId);
      if (!tech) throw new ToolRefusal('That technician was not found. Use list_technicians for the id.');
      if (tech.isActive === false) throw new ToolRefusal(`${tech.name} is inactive.`);
      if (!start) throw new ToolRefusal(`Say when, so ${tech.name} gets a time. Use find_open_times to offer free times.`);
      const tz = ctx.timezone || 'UTC';
      const res = await http.get('scheduling', '/dispatch/slots', {
        from: localDate(start, tz), days: 1, durationMins, technicianId: tech.id, limit: 50,
        ...((site as any).serviceLatitude != null && { lat: (site as any).serviceLatitude, lng: (site as any).serviceLongitude }),
      });
      const offers: any[] = (res?.slots ?? []).filter((s: any) => s.technicianId === tech.id);
      if (!offers.some((s) => Date.parse(s.start) === start!.getTime())) {
        const list = offers.slice(0, 4).map((s) => when(s.start, ctx).split(', ').pop()).join(', ');
        throw new ToolRefusal(`${tech.name} isn't free then. ${list ? `Open times that day: ${list}.` : 'They have no open time that day.'}`);
      }
    }
    const end = start ? new Date(start.getTime() + durationMins * 60_000) : undefined;
    const dto = {
      customerId: c.id, customerName: name,
      ...(c.phone && { customerPhone: c.phone }), ...(c.email && { customerEmail: c.email }),
      ...site, title, ...(args.description && { description: clean(args.description, 2000) }),
      priority, estimatedDurationMins: durationMins,
      ...(start && end && { scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() }),
    };
    return {
      title: `Create a job for ${name}`,
      lines: [
        `Customer: ${name}`,
        `Job: ${title}`,
        ...(priority !== 'NORMAL' ? [`Priority: ${cap(priority)}`] : []),
        `Address: ${[site.serviceAddress, site.serviceCity].filter(Boolean).join(', ')}`,
        ...((site as any).serviceLatitude == null ? ['Map location: none on file, so travel time is not checked'] : []),
        `When: ${start ? when(start.toISOString(), ctx) : 'no time yet, it goes to the unassigned list'}`,
        `Technician: ${tech ? tech.name : 'nobody yet'}`,
      ],
      args: { dto, ...(tech && { technicianId: tech.id, technicianName: tech.name }) },
    };
  },
  run: async (args, _ctx, http) => {
    const job = await http.post('jobs', '/jobs', args.dto);
    const base = `Created ${job.jobNumber} for ${args.dto.customerName}`;
    const out = { done: true as const, jobId: job.id, jobNumber: job.jobNumber, recordRef: `job:${job.id}` };
    if (!args.technicianId) return { ...out, summary: base };
    try {
      await http.post('scheduling', '/dispatch/assign/manual', {
        jobId: job.id, technicianId: args.technicianId,
        // Never 0,0: that is a real place in the sea and would skew distance scores.
        ...(args.dto.serviceLatitude != null && { jobLatitude: args.dto.serviceLatitude, jobLongitude: args.dto.serviceLongitude }),
        scheduledStart: args.dto.scheduledStart, scheduledEnd: args.dto.scheduledEnd,
        notes: 'Assigned by Kelvin',
      });
      return { ...out, summary: `${base}, with ${args.technicianName}` };
    } catch (err) {
      return { ...out, summary: `${base}. Assigning ${args.technicianName} failed (${serviceErrorMessage(err)}), so it is in the unassigned list` };
    }
  },
};
