import type { AgentTool } from '../types';

const STAFF = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const MONEY = ['super_admin', 'company_admin', 'office_manager'];

const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? res?.items ?? []);

/** The job fields the model needs to talk about and act on a job. */
export function jobSummary(j: any) {
  return {
    id: j.id,
    jobNumber: j.jobNumber,
    title: j.title,
    status: j.status,
    priority: j.priority,
    customer: j.customerName,
    address: j.serviceAddress,
    scheduledStart: j.scheduledStart,
    scheduledEnd: j.scheduledEnd,
    technician: j.assignedToName ?? null,
  };
}

// ── Customer bot ────────────────────────────────────────────────────────────

const customerTools: AgentTool[] = [
  {
    name: 'get_my_jobs',
    description: "List the customer's own jobs, optionally filtered by status.",
    parameters: { type: 'object', properties: { status: { type: 'string', description: 'e.g. SCHEDULED, COMPLETED' } } },
    kind: 'read',
    bots: ['customer'],
    // job-service forces customerId from the token for the customer role.
    run: async (args, _ctx, http) =>
      list(await http.get('jobs', '/jobs', { status: args.status, limit: 10 })).map(jobSummary),
  },
  {
    name: 'get_my_next_appointment',
    description: "The customer's next scheduled visit.",
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['customer'],
    run: async (_args, _ctx, http) => {
      const jobs = list(await http.get('jobs', '/jobs', { status: 'SCHEDULED', limit: 20 }))
        .filter((j) => j.scheduledStart && new Date(j.scheduledStart).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
      return jobs[0] ? jobSummary(jobs[0]) : { message: 'No upcoming appointments.' };
    },
  },
  {
    name: 'get_my_invoices',
    description: "List the customer's own invoices, optionally filtered by status.",
    parameters: { type: 'object', properties: { status: { type: 'string', description: 'e.g. SENT, OVERDUE, PAID' } } },
    kind: 'read',
    bots: ['customer'],
    run: async (args, _ctx, http) =>
      list(await http.get('finance', '/invoices', { status: args.status, limit: 10 })).map((inv) => ({
        invoiceNumber: inv.invoiceNumber, status: inv.status, total: Number(inv.total), balanceDue: Number(inv.balanceDue), dueDate: inv.dueDate,
      })),
  },
  {
    name: 'get_my_equipment',
    description: "The customer's registered equipment.",
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['customer'],
    run: async (_args, ctx, http) =>
      list(await http.get('crm', `/customers/${ctx.customerId}/equipment`)).map((e) => ({
        type: e.type, brand: e.brand, model: e.model, serialNo: e.serialNo, installDate: e.installDate, warrantyEnd: e.warrantyEnd,
      })),
  },
];

// ── Staff bot ───────────────────────────────────────────────────────────────

const staffTools: AgentTool[] = [
  {
    name: 'find_jobs',
    description: 'Search jobs by job number, customer name or title, and/or status or date. Use this to get a job id before acting on it.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Job number (e.g. JOB-2026-0124), customer name or words from the title.' },
        status: { type: 'string', enum: ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'] },
        date: { type: 'string', description: 'A day, YYYY-MM-DD, to list jobs scheduled that day.' },
      },
    },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (args, _ctx, http) => {
      const params: Record<string, unknown> = { search: args.search, status: args.status, limit: 15 };
      if (args.date) { params.dateFrom = `${args.date}T00:00:00.000Z`; params.dateTo = `${args.date}T23:59:59.999Z`; }
      return list(await http.get('jobs', '/jobs', params)).map(jobSummary);
    },
  },
  {
    name: 'get_job',
    description: 'Full details of one job by id.',
    parameters: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (args, _ctx, http) => {
      const j = await http.get('jobs', `/jobs/${args.jobId}`);
      return { ...jobSummary(j), description: j.description, notes: j.notes, crewSize: j.crewUserIds?.length ?? 0, estimatedValue: j.estimatedValue };
    },
  },
  {
    name: 'find_customers',
    description:
      'Search customers by name, email or phone. Names may be typed partly or with typos: when nothing matches exactly, ' +
      'close matches come back with closeMatch: true. Offer those to the person before saying a customer does not exist.',
    parameters: { type: 'object', properties: { search: { type: 'string' } }, required: ['search'] },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (args, _ctx, http) => {
      const search = String(args.search ?? '').trim();
      const shape = (c: any, closeMatch: boolean) => ({
        id: c.id, name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(), type: c.type,
        phone: c.phone ?? c.mobile, email: c.email, address: c.address, ...(closeMatch && { closeMatch: true }),
      });
      const exact = list(await http.get('crm', '/customers', { search, limit: 8 }));
      if (exact.length) return exact.map((c) => shape(c, false));
      // A typo in one word ("btothers") hides the customer; each word on its own still finds them.
      const words = search.split(/\s+/).filter((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length >= 2).slice(0, 4);
      if (words.length < 2) return [];
      const seen = new Map<string, any>();
      for (const rows of await Promise.all(words.map((w) => http.get('crm', '/customers', { search: w, limit: 5 })))) {
        for (const c of list(rows)) if (!seen.has(c.id)) seen.set(c.id, c);
      }
      return [...seen.values()].slice(0, 8).map((c) => shape(c, true));
    },
  },
  {
    name: 'list_technicians',
    description: 'All technicians with their id, whether they are active, and skills. Use the id when assigning.',
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (_args, _ctx, http) =>
      list(await http.get('scheduling', '/technicians')).map((t) => ({
        id: t.id, name: t.name, active: t.isActive, skills: t.skills, lastSeenAt: t.lastSeenAt,
      })),
  },
  {
    name: 'find_invoices',
    description: 'Find invoices by invoice number or customer name, optionally by status. Use this to get an invoice id.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Invoice number or customer name.' },
        status: { type: 'string', enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'] },
      },
    },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    run: async (args, _ctx, http) => {
      const q = String(args.search ?? '').toLowerCase().trim();
      return list(await http.get('finance', '/invoices', { status: args.status, limit: 100 }))
        .filter((inv) => !q || `${inv.invoiceNumber} ${inv.customerName ?? ''}`.toLowerCase().includes(q))
        .slice(0, 10)
        .map((inv) => ({
          id: inv.id, invoiceNumber: inv.invoiceNumber, customer: inv.customerName, status: inv.status,
          total: Number(inv.total), balanceDue: Number(inv.balanceDue), dueDate: inv.dueDate, sentAt: inv.sentAt,
        }));
    },
  },
  {
    name: 'list_overdue_invoices',
    description: 'Invoices past their due date and not fully paid.',
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    run: async (_args, _ctx, http) =>
      list(await http.get('finance', '/invoices', { status: 'OVERDUE', limit: 20 })).map((inv) => ({
        id: inv.id, invoiceNumber: inv.invoiceNumber, customer: inv.customerName, total: Number(inv.total), balanceDue: Number(inv.balanceDue), dueDate: inv.dueDate, sentAt: inv.sentAt,
      })),
  },
  {
    name: 'get_revenue_summary',
    description: 'Revenue total for a period.',
    parameters: { type: 'object', properties: { period: { type: 'string', enum: ['week', 'month', 'quarter'] } }, required: ['period'] },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    run: async (args, _ctx, http) => {
      const range = { week: '7d', month: '30d', quarter: '90d' }[args.period as 'week' | 'month' | 'quarter'] ?? '30d';
      const res = await http.get('analytics', '/revenue/series', { range });
      const series: any[] = res?.series ?? list(res);
      return { period: args.period, totalRevenue: series.reduce((s, p) => s + Number(p.revenue ?? 0), 0), points: series.length };
    },
  },
  {
    name: 'get_job_stats',
    description: 'Job counts by status for a recent range.',
    parameters: { type: 'object', properties: { range: { type: 'string', enum: ['week', 'month'] } } },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (args, _ctx, http) => http.get('analytics', '/jobs-analytics/by-status', { range: args.range === 'week' ? '7d' : '30d' }),
  },
  {
    name: 'get_customer_stats',
    description: 'Active customers, lead conversion and outstanding invoices.',
    parameters: { type: 'object', properties: {} },
    kind: 'read',
    bots: ['admin'],
    roles: MONEY,
    run: async (_args, _ctx, http) => {
      const k = await http.get('analytics', '/dashboard/kpis');
      return {
        activeCustomers: k?.activeCustomers?.value ?? null,
        leadConversionRate: k?.leadConversionRate?.formattedValue ?? null,
        outstandingInvoices: k?.outstandingInvoices?.value ?? null,
        outstandingValue: k?.outstandingInvoices?.formattedValue ?? null,
      };
    },
  },
  {
    name: 'get_top_technicians',
    description: 'Technicians ranked by jobs completed and rating.',
    parameters: { type: 'object', properties: { limit: { type: 'number' } } },
    kind: 'read',
    bots: ['admin'],
    roles: STAFF,
    run: async (args, _ctx, http) =>
      list(await http.get('analytics', '/technician-metrics', { limit: args.limit ?? 5 })).slice(0, args.limit ?? 5).map((t) => ({
        name: t.name, jobsCompleted: t.jobsCompleted, rating: t.rating, utilization: t.utilization,
      })),
  },
];

export const READ_TOOLS: AgentTool[] = [...customerTools, ...staffTools];
