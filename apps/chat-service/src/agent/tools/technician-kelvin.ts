/**
 * Kelvin for technicians: their day, what to know before a visit, their van,
 * and the visit paperwork. Status steps make the same calls as the app's own
 * buttons (assignment, job, work order), as the technician, so every service
 * applies its usual rules.
 */
import type { ServiceHttp } from '../service-http';
import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import { day, when } from './write-tools';

const TECH = ['technician'];
const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const DONE = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'];

const onCrew = (j: any, ctx: AgentContext) => j?.assignedToId === ctx.userId || (Array.isArray(j?.crewUserIds) && j.crewUserIds.includes(ctx.userId));

/** One of their own visits, by id or job number. No id: the visit they are on now (on site, then on the way). */
async function myJob(http: ServiceHttp, ctx: AgentContext, jobId: unknown): Promise<any> {
  let job: any = null;
  if (!jobId) {
    const mine = list(await http.get('jobs', '/jobs', { crewUserId: ctx.userId, limit: 50 }));
    job = mine.find((j) => j.status === 'ON_SITE') ?? mine.find((j) => j.status === 'EN_ROUTE');
    if (!job) throw new ToolRefusal('Which visit? You are not on one right now.');
  } else {
    try { job = await http.get('jobs', `/jobs/${jobId}`); } catch { /* maybe a job number */ }
    if (!job?.id && /^[A-Z]{1,6}-[\w-]+$/i.test(String(jobId))) {
      const wanted = String(jobId).toUpperCase();
      job = list(await http.get('jobs', '/jobs', { crewUserId: ctx.userId, search: String(jobId), limit: 10 })).find((j) => String(j.jobNumber).toUpperCase() === wanted) ?? null;
    }
  }
  if (!job?.id || !onCrew(job, ctx)) throw new ToolRefusal('That is not one of your visits.');
  return job;
}

/** Their assignment on the job: matched by their technician id or user id. */
async function myAssignment(http: ServiceHttp, ctx: AgentContext, jobId: string) {
  const [me, assignments] = await Promise.all([
    http.get('scheduling', '/technicians/me').catch(() => null),
    http.get('scheduling', `/dispatch/assignments/job/${jobId}`),
  ]);
  const ids = [me?.id, ctx.userId].filter(Boolean);
  const a = list(assignments).find((x) => ids.includes(x.technicianId));
  if (!a) throw new ToolRefusal('I could not find your assignment on that visit. Ask the office to check it.');
  return a;
}

async function myWorkOrder(http: ServiceHttp, ctx: AgentContext, jobId: string) {
  const all = list(await http.get('jobs', `/work-orders/by-job/${jobId}`).catch(() => []));
  return all.find((w) => w.technicianId === ctx.userId) ?? (all.length === 1 ? all[0] : undefined);
}

/** Parts from the price book only: name, price and category come from there, never from the model. */
async function priceParts(http: ServiceHttp, parts: unknown) {
  const items = Array.isArray(parts) ? parts : [];
  if (items.length > 20) throw new ToolRefusal('That is a lot of parts at once. Log up to 20.');
  return Promise.all(items.map(async (p: any) => {
    const quantity = Number(p?.quantity) || 1;
    if (!(quantity > 0) || quantity > 999) throw new ToolRefusal('Each part needs a quantity from 1 to 999.');
    const item = p?.itemId ? await http.get('jobs', `/price-book/${p.itemId}`).catch(() => null) : null;
    if (!item?.id || item.isActive === false) throw new ToolRefusal(`${clean(p?.name) || 'That part'} isn't in the price book. Search it with find_part.`);
    return {
      line: `${quantity} × ${item.name}`,
      body: { priceBookItemId: item.id, description: item.name, category: item.category || 'PART', quantity, unitPrice: Number(item.unitPrice) || 0, taxable: item.taxable !== false },
    };
  }));
}

/** The same three writes as the app's buttons: assignment, job status, then the work order step. */
async function setStatus(http: ServiceHttp, a: { assignmentId: string; jobId: string; status: string; label: string }) {
  await http.patch('scheduling', `/dispatch/assignments/${a.assignmentId}/status`, { status: a.status });
  await http.patch('jobs', `/jobs/${a.jobId}/status`, { status: a.status, note: `Technician: ${a.label} (via Kelvin)` });
}

const PARTS = { type: 'array', items: { type: 'object', properties: { itemId: { type: 'string', description: 'Price book id from find_part.' }, name: { type: 'string' }, quantity: { type: 'number' } } } };

export const TECHNICIAN_TOOLS: AgentTool[] = [
  {
    name: 'my_day',
    description: "The technician's visits for a day (default today), in order, with customer, address and status.",
    parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD in company time. Default today.' } } },
    kind: 'read', bots: ['technician'], roles: TECH, kelvinOnly: true,
    run: async (args, ctx, http) => {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(args.date ?? '')) ? String(args.date) : new Date().toLocaleDateString('en-CA', { timeZone: ctx.timezone || 'UTC' });
      const visits = list(await http.get('jobs', '/jobs', { crewUserId: ctx.userId, dateFrom: `${date}T00:00:00.000Z`, dateTo: `${date}T23:59:59.999Z`, limit: 50 }))
        .filter((j) => j.status !== 'CANCELLED')
        .sort((a, b) => Date.parse(a.scheduledStart ?? '') - Date.parse(b.scheduledStart ?? ''));
      return {
        visits: visits.map((j) => ({ id: j.id, job: j.jobNumber, when: when(j.scheduledStart, ctx), what: j.title, customer: j.customerName, address: j.serviceAddress, status: j.status, priority: j.priority })),
        ...(visits.length ? {} : { note: `No visits on ${day(`${date}T12:00:00Z`, ctx)}.` }),
      };
    },
  },
  {
    name: 'job_brief',
    description: 'What to know before or during a visit: the job, notes, customer contact, their equipment, the last visits there, and open checklist tasks.',
    parameters: { type: 'object', properties: { jobId: { type: 'string', description: 'Id or job number; omit for the current visit.' } } },
    kind: 'read', bots: ['technician'], roles: TECH, kelvinOnly: true,
    run: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      const [customer, history, equipment, wo, project, unit] = await Promise.all([
        job.customerId ? http.get('crm', `/customers/${job.customerId}`).catch(() => null) : null,
        job.customerId ? http.get('jobs', '/jobs', { customerId: job.customerId, limit: 10 }).catch(() => []) : [],
        job.customerId ? http.get('crm', `/customers/${job.customerId}/equipment`).catch(() => []) : [],
        myWorkOrder(http, ctx, job.id),
        job.projectId ? http.get('crm', `/projects/${job.projectId}`).catch(() => null) : null,
        job.componentId ? http.get('crm', `/components/${job.componentId}`).catch(() => null) : null,
      ]);
      return {
        job: { number: job.jobNumber, what: job.title, description: job.description, when: when(job.scheduledStart, ctx), status: job.status, priority: job.priority, address: job.serviceAddress, notes: job.notes },
        customer: customer ? { name: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(), phone: customer.phone ?? customer.mobile } : { name: job.customerName },
        equipment: list(equipment).slice(0, 5).map((e) => ({ type: e.type, brand: e.brand, model: e.model, installed: e.installDate })),
        lastVisits: list(history).filter((j) => j.id !== job.id && ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status)).slice(0, 3)
          .map((j) => ({ when: day(j.scheduledStart, ctx), what: j.title, by: j.assignedToName, notes: clean(j.notes).slice(0, 200) || undefined })),
        ...(project && { project: { name: project.name, unit: unit?.label ?? null, site: project.siteAddress ?? null, siteNotes: clean(project.notes).slice(0, 300) || null } }),
        openTasks: (wo?.tasks ?? []).filter((t: any) => !t.isCompleted).map((t: any) => `${t.title}${t.isRequired ? ' (required)' : ''}`),
      };
    },
  },
  {
    name: 'van_stock',
    description: "What is in the technician's own van, optionally searched by name or SKU.",
    parameters: { type: 'object', properties: { search: { type: 'string' } } },
    kind: 'read', bots: ['technician'], roles: TECH, kelvinOnly: true,
    run: async (args, ctx, http) => {
      const me = await http.get('scheduling', '/technicians/me').catch(() => null);
      const ids = [ctx.userId, me?.id, me?.userId].filter(Boolean);
      const van = list(await http.get('inventory', '/locations')).find((l) => l.type === 'VAN' && ids.includes(l.technicianId));
      if (!van) return { items: [], note: 'You have no van stock location yet. Ask the office to set one up.' };
      const q = clean(args.search).toLowerCase();
      const items = list(await http.get('inventory', `/locations/${van.id}/stock`, { limit: 200 }))
        .map((s) => ({ item: s.item?.name ?? s.itemName, sku: s.item?.sku ?? s.sku, quantity: Number(s.quantity) || 0 }))
        .filter((s) => s.quantity > 0 && (!q || `${s.item} ${s.sku}`.toLowerCase().includes(q)));
      return { items: items.slice(0, 30) };
    },
  },
  {
    name: 'find_part',
    description: 'Search the price book for a part, material or labour item, to log it on a visit.',
    parameters: { type: 'object', properties: { search: { type: 'string' } }, required: ['search'] },
    kind: 'read', bots: ['technician'], roles: TECH, kelvinOnly: true,
    run: async (args, _ctx, http) =>
      list(await http.get('jobs', '/price-book', { search: clean(args.search), limit: 10 })).filter((i) => i.isActive !== false)
        .map((i) => ({ itemId: i.id, name: i.name, category: i.category, unit: i.unit })),
  },
  {
    name: 'start_route',
    description: 'Mark that the technician is on the way to a visit (the same as Start Route).',
    parameters: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (!['SCHEDULED', 'PENDING'].includes(job.status)) throw new ToolRefusal(`${job.jobNumber} is already ${String(job.status).toLowerCase().replace('_', ' ')}.`);
      const a = await myAssignment(http, ctx, job.id);
      return {
        title: `On the way to ${job.jobNumber}`,
        lines: [`${job.title}, ${job.customerName ?? 'customer'}`, ...(job.serviceAddress ? [job.serviceAddress] : []), `The office and ${job.customerName ?? 'the customer'} see you are on the way.`],
        args: { jobId: job.id, jobNumber: job.jobNumber, assignmentId: a.id, address: job.serviceAddress },
      };
    },
    run: async (args, _ctx, http) => {
      await setStatus(http, { assignmentId: args.assignmentId, jobId: args.jobId, status: 'EN_ROUTE', label: 'Start Route' });
      return { done: true, summary: `On the way to ${args.jobNumber}`, navigateTo: args.address };
    },
  },
  {
    name: 'arrived',
    description: 'Mark that the technician has arrived on site, and check them in (the same as Arrived on Site).',
    parameters: { type: 'object', properties: { jobId: { type: 'string' } } },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (job.status !== 'EN_ROUTE') throw new ToolRefusal(job.status === 'ON_SITE' ? `You're already checked in at ${job.jobNumber}.` : `Start the route to ${job.jobNumber} first.`);
      const [a, wo] = await Promise.all([myAssignment(http, ctx, job.id), myWorkOrder(http, ctx, job.id)]);
      return {
        title: `Arrived at ${job.jobNumber}`,
        lines: [`${job.title}, ${job.customerName ?? 'customer'}`, 'Checks you in and starts the clock on the visit.'],
        args: { jobId: job.id, jobNumber: job.jobNumber, assignmentId: a.id, workOrderId: wo?.id },
      };
    },
    run: async (args, _ctx, http) => {
      await setStatus(http, { assignmentId: args.assignmentId, jobId: args.jobId, status: 'ON_SITE', label: 'Arrived on Site' });
      if (args.workOrderId) await http.patch('jobs', `/work-orders/${args.workOrderId}/check-in`);
      return { done: true, summary: `Checked in at ${args.jobNumber}` };
    },
  },
  {
    name: 'log_parts',
    description: 'Record parts or materials used on a visit, from the price book. They come out of the van stock. Does not finish the visit.',
    parameters: { type: 'object', properties: { jobId: { type: 'string' }, parts: PARTS }, required: ['parts'] },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (DONE.includes(job.status)) throw new ToolRefusal(`${job.jobNumber} is already ${String(job.status).toLowerCase()}.`);
      const parts = await priceParts(http, args.parts);
      if (!parts.length) throw new ToolRefusal('Which parts did you use?');
      const wo = await myWorkOrder(http, ctx, job.id);
      return {
        title: `Parts for ${job.jobNumber}`,
        lines: [...parts.map((p) => p.line), 'Taken from your van stock.'],
        args: { jobId: job.id, jobNumber: job.jobNumber, workOrderId: wo?.id, lineItems: parts.map((p) => p.body) },
      };
    },
    signature: (a) => a.lineItems,
    run: async (args, _ctx, http) => {
      const woId = args.workOrderId ?? (await http.post('jobs', `/work-orders/mine/${args.jobId}`))?.id;
      for (const item of args.lineItems) await http.post('jobs', `/work-orders/${woId}/line-items`, item);
      return { done: true, summary: `Logged ${args.lineItems.length} part${args.lineItems.length === 1 ? '' : 's'} on ${args.jobNumber}` };
    },
  },
  {
    name: 'finish_job',
    description: 'Finish a visit: log any parts used, add an optional closing note, check out and mark it complete (the same as Complete Job). One card.',
    parameters: { type: 'object', properties: { jobId: { type: 'string' }, parts: PARTS, note: { type: 'string', description: 'What was done, for the office and the next visit.' } } },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (!['ON_SITE', 'IN_PROGRESS'].includes(job.status)) throw new ToolRefusal(`Mark that you've arrived at ${job.jobNumber} before finishing it.`);
      const [a, wo, parts] = await Promise.all([myAssignment(http, ctx, job.id), myWorkOrder(http, ctx, job.id), priceParts(http, args.parts)]);
      const open = (wo?.tasks ?? []).filter((t: any) => t.isRequired && !t.isCompleted).map((t: any) => t.title);
      if (open.length) throw new ToolRefusal(`Finish the required checklist first: ${open.join(', ')}.`);
      const note = clean(args.note).slice(0, 1000);
      return {
        title: `Finish ${job.jobNumber}`,
        lines: [
          ...(parts.length ? [`Used: ${parts.map((p) => p.line).join(', ')}`] : []),
          ...(note ? [`Note: ${note}`] : []),
          'Marks the visit complete and checks you out.',
        ],
        args: { jobId: job.id, jobNumber: job.jobNumber, assignmentId: a.id, workOrderId: wo?.id, lineItems: parts.map((p) => p.body), note },
      };
    },
    signature: (a) => a.lineItems,
    run: async (args, _ctx, http) => {
      const woId = args.workOrderId ?? (args.lineItems.length ? (await http.post('jobs', `/work-orders/mine/${args.jobId}`))?.id : undefined);
      for (const item of args.lineItems) await http.post('jobs', `/work-orders/${woId}/line-items`, item);
      if (woId) await http.patch('jobs', `/work-orders/${woId}/check-out`, args.note ? { notes: args.note } : {});
      await setStatus(http, { assignmentId: args.assignmentId, jobId: args.jobId, status: 'COMPLETED', label: 'Complete Job' });
      return { done: true, summary: `Finished ${args.jobNumber}` };
    },
  },
  {
    name: 'add_job_note',
    description: 'Add a note to a visit for the office and the next technician, e.g. "unit is R22, needs replacing soon".',
    parameters: { type: 'object', properties: { jobId: { type: 'string' }, note: { type: 'string' } }, required: ['note'] },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const note = clean(args.note);
      if (!note) throw new ToolRefusal('What should the note say?');
      if (note.length > 500) throw new ToolRefusal('Keep the note under 500 characters.');
      const job = await myJob(http, ctx, args.jobId);
      return { title: `Note on ${job.jobNumber}`, lines: [`"${note}"`], args: { jobId: job.id, jobNumber: job.jobNumber, note } };
    },
    run: async (args, ctx, http) => {
      // Read again just before writing, so a note added meanwhile is kept.
      const job = await http.get('jobs', `/jobs/${args.jobId}`);
      const line = `${ctx.name ?? 'Technician'} (${new Date().toISOString().slice(0, 10)}): ${args.note}`;
      await http.patch('jobs', `/jobs/${args.jobId}`, { notes: job?.notes ? `${job.notes}\n\n${line}` : line });
      return { done: true, summary: `Added a note to ${args.jobNumber}` };
    },
  },
  {
    name: 'message_office_tech',
    description: 'Send the office a message from the technician, optionally about one visit (running late, need a part, need help).',
    parameters: { type: 'object', properties: { message: { type: 'string' }, jobId: { type: 'string' } }, required: ['message'] },
    kind: 'write', bots: ['technician'], roles: TECH, kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const message = clean(args.message);
      if (!message) throw new ToolRefusal('What should the message say?');
      if (message.length > 1000) throw new ToolRefusal('Keep it under 1,000 characters.');
      const job = args.jobId ? await myJob(http, ctx, args.jobId) : null;
      return {
        title: 'Message the office',
        lines: [...(job ? [`About ${job.jobNumber}, ${job.title}`] : []), `"${message}"`],
        args: { message, jobId: job?.id },
      };
    },
    run: async (args, ctx, http) => {
      // Into this technician's conversation with the office, which every office user sees.
      await http.post('comms', '/chat/office/messages', { body: args.message, jobId: args.jobId });
      return { done: true, summary: 'Sent to the office' };
    },
  },
];

