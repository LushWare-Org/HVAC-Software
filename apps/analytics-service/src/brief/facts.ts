import { Prisma } from '../prisma/generated';
import { localDayRange } from './local-day';

export type Severity = 'urgent' | 'important' | 'info';

/**
 * Something true about the business right now, found by an exact query.
 * Titles and numbers come only from here; the AI may reorder facts and add a
 * "why", never change what they say.
 */
export interface Fact {
  id: string;
  severity: Severity;
  /** Orders facts of the same severity, bigger first. */
  score: number;
  title: string;
  detail: string;
  /** Hidden from roles that do not see money. */
  money?: boolean;
  /** Up to five examples behind the fact. */
  items?: Array<{ id: string; label: string; meta?: string }>;
  /** Admin page that shows the full list. */
  href?: string;
  /** An assistant action that would deal with it, by tool name (see chat-service). */
  action?: { tool: string; args: Record<string, string>; label: string };
}

export interface FactContext {
  companyId: string;
  now: Date;
  timezone: string;
  currency: string;
}

export type Query = <T = Record<string, unknown>>(sql: Prisma.Sql) => Promise<T[]>;

export type Detector = (q: Query, ctx: FactContext) => Promise<Fact[]>;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const num = (v: unknown) => Number(v ?? 0) || 0;

export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
  }
}

function time(d: Date | string, timeZone: string): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
}

// ── Detectors ───────────────────────────────────────────────────────────────

/** Jobs whose start time today has passed by 15+ minutes with nobody on the way. */
export const lateJobs: Detector = async (q, { companyId, now, timezone }) => {
  const today = localDayRange(timezone, now);
  const rows = await q<{ id: string; jobNumber: string; customerName: string | null; assignedToName: string | null; scheduledStart: Date }>(Prisma.sql`
    SELECT id, "jobNumber", "customerName", "assignedToName", "scheduledStart"
    FROM jobs.jobs
    WHERE "companyId" = ${companyId} AND status = 'SCHEDULED'
      AND "scheduledStart" >= ${today.start} AND "scheduledStart" < ${new Date(now.getTime() - 15 * MIN)}
    ORDER BY "scheduledStart" LIMIT 20`);
  if (!rows.length) return [];
  return [{
    id: 'late-jobs', severity: 'urgent', score: 100 + rows.length,
    title: rows.length === 1 ? `${rows[0].jobNumber} is running late` : `${rows.length} jobs are running late`,
    detail: 'Their start time has passed and nobody is on the way yet.',
    items: rows.slice(0, 5).map((r) => ({
      id: r.id, label: `${r.jobNumber}${r.customerName ? `, ${r.customerName}` : ''}`,
      meta: `${Math.round((now.getTime() - new Date(r.scheduledStart).getTime()) / MIN)} min late${r.assignedToName ? `, ${r.assignedToName}` : ', nobody assigned'}`,
    })),
    href: '/scheduling?view=active',
  }];
};

/** Jobs left en route or on site for over 12 hours: usually never closed. */
export const stuckJobs: Detector = async (q, { companyId, now }) => {
  const rows = await q<{ id: string; jobNumber: string; status: string; assignedToName: string | null; updatedAt: Date }>(Prisma.sql`
    SELECT id, "jobNumber", status::text AS status, "assignedToName", "updatedAt"
    FROM jobs.jobs
    WHERE "companyId" = ${companyId} AND status IN ('EN_ROUTE', 'ON_SITE') AND "updatedAt" < ${new Date(now.getTime() - 12 * HOUR)}
    ORDER BY "updatedAt" LIMIT 20`);
  if (!rows.length) return [];
  return [{
    id: 'stuck-jobs', severity: 'important', score: 60 + rows.length,
    title: rows.length === 1 ? `${rows[0].jobNumber} has been ${rows[0].status === 'EN_ROUTE' ? 'en route' : 'on site'} for over 12 hours` : `${rows.length} jobs have been in progress for over 12 hours`,
    detail: 'They were probably finished but never closed, which skews the live board.',
    items: rows.slice(0, 5).map((r) => ({
      id: r.id, label: r.jobNumber,
      meta: `${r.status === 'EN_ROUTE' ? 'En route' : 'On site'} ${Math.round((now.getTime() - new Date(r.updatedAt).getTime()) / HOUR)} h${r.assignedToName ? `, ${r.assignedToName}` : ''}`,
    })),
    href: '/scheduling?view=active',
  }];
};

/** Visits in the next 48 hours with nobody assigned. */
export const unassignedSoon: Detector = async (q, { companyId, now, timezone }) => {
  const rows = await q<{ id: string; jobNumber: string; customerName: string | null; scheduledStart: Date }>(Prisma.sql`
    SELECT id, "jobNumber", "customerName", "scheduledStart"
    FROM jobs.jobs
    WHERE "companyId" = ${companyId} AND status IN ('PENDING', 'SCHEDULED')
      AND "assignedToId" IS NULL AND cardinality("crewUserIds") = 0
      AND "scheduledStart" >= ${now} AND "scheduledStart" < ${new Date(now.getTime() + 2 * DAY)}
    ORDER BY "scheduledStart" LIMIT 20`);
  if (!rows.length) return [];
  const within24 = rows.filter((r) => new Date(r.scheduledStart).getTime() - now.getTime() < DAY).length;
  const hoursAway = Math.max(1, Math.round((new Date(rows[0].scheduledStart).getTime() - now.getTime()) / HOUR));
  return [{
    id: 'unassigned-soon', severity: within24 ? 'urgent' : 'important', score: 80 + rows.length,
    title: rows.length === 1
      ? `${rows[0].jobNumber} has nobody assigned yet`
      : `${rows.length} jobs in the next 48 hours have nobody assigned`,
    detail: rows.length === 1
      ? `It starts in ${plural(hoursAway, 'hour')}.`
      : within24 ? `${within24} of them ${within24 === 1 ? 'is' : 'are'} within 24 hours.` : 'Assign someone before the day starts.',
    items: rows.slice(0, 5).map((r) => {
      const day = new Date(r.scheduledStart).toLocaleDateString('en-US', { weekday: 'short', timeZone: timezone });
      return { id: r.id, label: `${r.jobNumber}${r.customerName ? `, ${r.customerName}` : ''}`, meta: `${day} ${time(r.scheduledStart, timezone)}` };
    }),
    href: '/scheduling',
  }];
};

/** Technicians with more jobs tomorrow than their daily limit. */
export const overbookedTomorrow: Detector = async (q, { companyId, now, timezone }) => {
  const tomorrow = localDayRange(timezone, now, 1);
  const rows = await q<{ name: string; max: number; jobs: number }>(Prisma.sql`
    SELECT t.name, t.max_daily_jobs AS max, count(*)::int AS jobs
    FROM jobs.jobs j
    JOIN scheduling.technicians t ON t.user_id::text = j."assignedToId" AND t.company_id::text = j."companyId"
    WHERE j."companyId" = ${companyId} AND j.status <> 'CANCELLED'
      AND j."scheduledStart" >= ${tomorrow.start} AND j."scheduledStart" < ${tomorrow.end}
    GROUP BY t.name, t.max_daily_jobs
    HAVING count(*) > t.max_daily_jobs
    ORDER BY count(*) - t.max_daily_jobs DESC`);
  if (!rows.length) return [];
  const extra = rows.reduce((s, r) => s + (num(r.jobs) - num(r.max)), 0);
  return [{
    id: 'overbooked-tomorrow', severity: 'important', score: 70 + extra,
    title: rows.length === 1
      ? `${rows[0].name} has ${rows[0].jobs} jobs tomorrow, ${num(rows[0].jobs) - num(rows[0].max)} over the limit`
      : `${rows.length} technicians are overbooked tomorrow`,
    detail: 'Move a job to someone with room before the day starts.',
    items: rows.slice(0, 5).map((r) => ({ id: r.name, label: r.name, meta: `${r.jobs} jobs, limit ${r.max}` })),
    href: '/scheduling',
  }];
};

/** Unpaid invoices past their due date. */
export const overdueInvoices: Detector = async (q, { companyId, now, currency }) => {
  const rows = await q<{ id: string; invoiceNumber: string; customerName: string; balanceDue: unknown; dueDate: Date }>(Prisma.sql`
    SELECT id, "invoiceNumber", "customerName", "balanceDue", "dueDate"
    FROM finance."Invoice"
    WHERE "companyId" = ${companyId} AND status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
      AND "dueDate" < ${now} AND "balanceDue" > 0
    ORDER BY "dueDate" LIMIT 200`);
  if (!rows.length) return [];
  const total = rows.reduce((s, r) => s + num(r.balanceDue), 0);
  const over60 = rows.filter((r) => now.getTime() - new Date(r.dueDate).getTime() > 60 * DAY).length;
  const oldest = rows[0];
  return [{
    id: 'overdue-invoices', severity: 'important', score: 50 + Math.min(40, total / 1000), money: true,
    title: `${money(total, currency)} is overdue on ${plural(rows.length, 'invoice')}`,
    detail: over60 ? `${over60} of them ${over60 === 1 ? 'is' : 'are'} more than 60 days late.` : 'All within the last 60 days.',
    items: rows.slice(0, 5).map((r) => ({
      id: r.id, label: `${r.invoiceNumber}, ${r.customerName}`,
      meta: `${money(num(r.balanceDue), currency)}, ${Math.round((now.getTime() - new Date(r.dueDate).getTime()) / DAY)} days late`,
    })),
    href: '/finance?tab=invoices&status=OVERDUE',
    action: { tool: 'send_invoice', args: { invoiceId: oldest.id }, label: `Send a reminder for ${oldest.invoiceNumber}` },
  }];
};

/** Quotes sent over a week ago with no answer. */
export const staleQuotes: Detector = async (q, { companyId, now, currency }) => {
  const rows = await q<{ id: string; quoteNumber: string; customerName: string; total: unknown; sentAt: Date }>(Prisma.sql`
    SELECT id, "quoteNumber", "customerName", total, "sentAt"
    FROM finance."Quote"
    WHERE "companyId" = ${companyId} AND status IN ('SENT', 'VIEWED') AND "sentAt" < ${new Date(now.getTime() - 7 * DAY)}
    ORDER BY "sentAt" LIMIT 100`);
  if (!rows.length) return [];
  const total = rows.reduce((s, r) => s + num(r.total), 0);
  return [{
    id: 'stale-quotes', severity: 'info', score: 30 + Math.min(20, total / 2000), money: true,
    title: `${plural(rows.length, 'quote')} worth ${money(total, currency)} ${rows.length === 1 ? 'has' : 'have'} no answer after a week`,
    detail: 'A short follow-up often gets a reply.',
    items: rows.slice(0, 5).map((r) => ({
      id: r.id, label: `${r.quoteNumber}, ${r.customerName}`,
      meta: `${money(num(r.total), currency)}, sent ${Math.round((now.getTime() - new Date(r.sentAt).getTime()) / DAY)} days ago`,
    })),
    href: '/finance?tab=quotes&filter=pending_quotes',
  }];
};

/** New leads nobody has touched for a day. */
export const waitingLeads: Detector = async (q, { companyId, now }) => {
  const rows = await q<{ id: string; firstName: string; lastName: string; createdAt: Date }>(Prisma.sql`
    SELECT id, "firstName", "lastName", "createdAt"
    FROM crm.leads
    WHERE "companyId" = ${companyId} AND status = 'NEW' AND "createdAt" < ${new Date(now.getTime() - DAY)}
    ORDER BY "createdAt" LIMIT 50`);
  if (!rows.length) return [];
  return [{
    id: 'waiting-leads', severity: 'important', score: 55 + rows.length,
    title: `${plural(rows.length, 'new lead')} waiting over a day for contact`,
    detail: 'Leads go cold fast; the oldest has waited longest.',
    items: rows.slice(0, 5).map((r) => ({
      id: r.id, label: `${r.firstName} ${r.lastName}`.trim(),
      meta: `${Math.round((now.getTime() - new Date(r.createdAt).getTime()) / DAY)} days`,
    })),
    href: '/customers',
  }];
};

/** Technicians who signed up and are waiting to be approved. */
export const pendingTechnicians: Detector = async (q, { companyId }) => {
  const rows = await q<{ id: string; name: string }>(Prisma.sql`
    SELECT id, name FROM crm.company_users
    WHERE "companyId" = ${companyId} AND "approvalStatus" = 'PENDING'
    ORDER BY "createdAt" LIMIT 20`);
  if (!rows.length) return [];
  return [{
    id: 'pending-technicians', severity: 'important', score: 45 + rows.length,
    title: `${plural(rows.length, 'technician')} waiting for approval`,
    detail: 'They cannot sign in until approved.',
    items: rows.slice(0, 5).map((r) => ({ id: r.id, label: r.name })),
    href: '/team',
  }];
};

export const DETECTORS: Record<string, Detector> = {
  lateJobs, stuckJobs, unassignedSoon, overbookedTomorrow, overdueInvoices, staleQuotes, waitingLeads, pendingTechnicians,
};

const SEVERITY_RANK: Record<Severity, number> = { urgent: 0, important: 1, info: 2 };

/** Most pressing first: by severity, then score. */
export function rankFacts(facts: Fact[]): Fact[] {
  return [...facts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.score - a.score);
}

export interface Yesterday {
  date: string;
  jobsCompleted: number;
  jobsCancelled: number;
  /** Payments received; absent for roles that do not see money. */
  collected?: number;
}

/** What happened yesterday, local time. */
export async function yesterdayStats(q: Query, { companyId, now, timezone }: FactContext): Promise<Yesterday> {
  const y = localDayRange(timezone, now, -1);
  const [jobs, pay] = await Promise.all([
    q<{ completed: number; cancelled: number }>(Prisma.sql`
      SELECT
        count(*) FILTER (WHERE status IN ('COMPLETED', 'INVOICED', 'PAID') AND "completedAt" >= ${y.start} AND "completedAt" < ${y.end})::int AS completed,
        count(*) FILTER (WHERE status = 'CANCELLED' AND "updatedAt" >= ${y.start} AND "updatedAt" < ${y.end})::int AS cancelled
      FROM jobs.jobs WHERE "companyId" = ${companyId}`),
    q<{ collected: unknown }>(Prisma.sql`
      SELECT COALESCE(SUM(amount), 0) AS collected FROM finance."Payment"
      WHERE "companyId" = ${companyId} AND status = 'SUCCEEDED' AND "paidAt" >= ${y.start} AND "paidAt" < ${y.end}`),
  ]);
  return { date: y.date, jobsCompleted: num(jobs[0]?.completed), jobsCancelled: num(jobs[0]?.cancelled), collected: num(pay[0]?.collected) };
}
