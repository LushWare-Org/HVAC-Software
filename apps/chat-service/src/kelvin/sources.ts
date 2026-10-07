import { routineWhen } from '../agent/tools/kelvin-memory';
import type { Audience, KelvinFix, KelvinItem, Urgency } from './types';

export const DISPATCH_ROLES = new Set(['super_admin', 'company_admin', 'office_manager', 'dispatcher']);
export const MONEY_ROLES = new Set(['super_admin', 'company_admin', 'office_manager']);

const TITLE_MAX = 140;
const WHY_MAX = 200;
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : Array.isArray((v as any)?.data) ? (v as any).data : []);
/** One clean line: no newlines, trimmed, capped. Text is rendered as text, never HTML. */
export function line(v: unknown, max = TITLE_MAX): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
const fixes = (list: any[]): KelvinFix[] =>
  list.filter((o) => o?.label && o?.request).slice(0, 3).map((o) => ({ label: line(o.label, 80), request: line(o.request, 300) }));
const first = (name: unknown) => String(name ?? '').trim().split(/\s+/)[0] || 'them';

function clock(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).toLowerCase();
}
function dayLabel(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
}

export function mapBrief(brief: any): KelvinItem[] {
  const facts = arr(brief?.facts);
  const date = String(brief?.date ?? '');
  const createdAt = String(brief?.generatedAt ?? new Date().toISOString());
  return facts.map((f, i) => ({
    id: `brief:${date}:${line(f.id, 60)}`,
    kind: 'BRIEF',
    urgency: (i === 0 ? 'soon' : 'quiet') as Urgency,
    title: line(f.title),
    ...(f.why || f.detail ? { why: line(f.why ?? f.detail, WHY_MAX) } : {}),
    fixes: f.action?.label ? fixes([{ label: f.action.label, request: f.action.label }]) : [],
    anchor: { page: 'dashboard' as const },
    audience: (f.money ? 'money' : 'all') as Audience,
    createdAt,
  }));
}

export function mapDisruptions(res: any): KelvinItem[] {
  const createdAt = String(res?.generatedAt ?? new Date().toISOString());
  return arr(res?.disruptions).map((d) => {
    const off = d.kind === 'TECH_OFF';
    const urgency: Urgency = off || Number(d.delayMins) >= 30 ? 'urgent' : 'soon';
    return {
      // Urgency is part of the id, so a delay that grows past 30 minutes alerts again.
      id: off ? `off:${d.technicianId}:${d.jobId}` : `late:${d.jobId}:${d.kind}:${urgency}`,
      kind: off ? 'TECH_OFF' : 'LATE',
      urgency,
      title: line(d.detail),
      fixes: fixes(arr(d.options)),
      anchor: { page: 'scheduling' as const, recordType: 'job' as const, recordId: String(d.jobId) },
      audience: 'dispatch' as Audience,
      createdAt,
    };
  });
}

export function mapGaps(res: any): KelvinItem[] {
  const tz = String(res?.timezone || 'UTC');
  return arr(res?.gaps).map((g) => ({
    id: `gap:${g.cancelledJobId}:${g.technicianId}:${g.date}`,
    kind: 'GAP',
    urgency: 'soon' as Urgency,
    title: line(`${g.technicianName} is free ${dayLabel(g.from, tz)}, ${clock(g.from, tz)} to ${clock(g.to, tz)}`),
    why: line(`${g.cancelledJobNumber}${g.customer ? ` for ${g.customer}` : ''} was cancelled.`, WHY_MAX),
    fixes: fixes(arr(g.fills).map((f) => ({
      label: f.kind === 'PULL_FORWARD' ? `Bring ${f.jobNumber} forward` : `Give ${f.jobNumber} to ${first(g.technicianName)}`,
      request: f.request,
    }))),
    anchor: { page: 'scheduling' as const, recordType: 'technician' as const, recordId: String(g.technicianId) },
    audience: 'dispatch' as Audience,
    createdAt: String(g.cancelledAt ?? new Date().toISOString()),
    expiresAt: String(g.to),
  }));
}

export function mapEmergencies(jobs: any, now: Date): KelvinItem[] {
  return arr(jobs)
    .filter((j) => j?.priority === 'EMERGENCY' && !j.assignedToId && !(Array.isArray(j.crewUserIds) && j.crewUserIds.length))
    .map((j) => ({
      id: `emergency:${j.id}`,
      kind: 'EMERGENCY_UNASSIGNED',
      urgency: 'urgent' as Urgency,
      title: line(`Emergency at ${j.customerName}: ${j.title}. Nobody is assigned.`),
      fixes: [{ label: 'Find someone now', request: `Who can take ${j.jobNumber} as soon as possible? Assign the best technician.` }],
      anchor: { page: 'jobs' as const, recordType: 'job' as const, recordId: String(j.id) },
      audience: 'dispatch' as Audience,
      createdAt: String(j.createdAt ?? now.toISOString()),
    }));
}

export function mapReschedules(inbox: any): KelvinItem[] {
  return arr(inbox).filter((r) => r?.request?.id && r?.job).map((r) => ({
    id: `reschedule:${r.request.id}`,
    kind: 'RESCHEDULE_REQUEST',
    urgency: 'soon' as Urgency,
    title: line(`${r.job.customerName} wants to move ${r.job.jobNumber}`),
    fixes: [{ label: 'Suggest a time', request: `Show me the reschedule request for ${r.job.jobNumber} and suggest a time that works.` }],
    anchor: { page: 'scheduling' as const, recordType: 'job' as const, recordId: String(r.job.id) },
    audience: 'dispatch' as Audience,
    createdAt: String(r.request.createdAt ?? new Date().toISOString()),
  }));
}

export function mapNotices(res: any): KelvinItem[] {
  return arr(res).filter((n) => n?.id && n.isRead === false).map((n) => ({
    id: `notice:${n.id}`,
    kind: 'NOTICE',
    urgency: 'quiet' as Urgency,
    title: line(n.title),
    ...(n.body ? { why: line(n.body, WHY_MAX) } : {}),
    fixes: [],
    audience: 'all' as Audience,
    createdAt: String(n.createdAt ?? new Date().toISOString()),
  }));
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The date, weekday and minutes since midnight in a zone; null for an unknown zone. */
function localNow(now: Date, timeZone: string) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now).map((p) => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: WEEKDAYS.indexOf(parts.weekday), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  } catch {
    return null;
  }
}

/** Routines whose time has come today: each shows once a day with Run it, until the day ends. */
export function mapRoutines(res: any, now: Date): KelvinItem[] {
  return arr(res).flatMap((r) => {
    const local = localNow(now, String(r?.timezone || 'UTC'));
    const [h, m] = String(r?.time ?? '').split(':').map(Number);
    if (!local || !Array.isArray(r?.days) || !r.days.includes(local.weekday) || !(local.minutes >= h * 60 + m)) return [];
    const startOfDay = now.getTime() - (local.minutes * 60 + now.getUTCSeconds()) * 1000 - now.getUTCMilliseconds();
    return [{
      id: `routine:${r.id}:${local.date}`,
      kind: 'ROUTINE' as const,
      urgency: 'soon' as Urgency,
      title: line(`Your routine: ${r.request}`),
      why: routineWhen(r.days, r.time),
      fixes: fixes([{ label: 'Run it', request: r.request }]),
      anchor: { page: 'dashboard' as const },
      audience: 'all' as Audience,
      createdAt: new Date(startOfDay + (h * 60 + m) * 60_000).toISOString(),
      expiresAt: new Date(startOfDay + 24 * 60 * 60_000).toISOString(),
    }];
  });
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const DAY_MS = 86_400_000;

/** Overdue invoices: one note for Finance, with how many, how much and the oldest. */
export function mapOverdue(res: any, now: Date): KelvinItem[] {
  const due = arr(res).filter((i) => i?.dueDate).sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  if (!due.length) return [];
  const currencies = new Set(due.map((i) => i.currency || 'USD'));
  let total = '';
  if (currencies.size === 1) {
    const sum = due.reduce((a, i) => a + (Number(i.balanceDue) || 0), 0);
    try { total = `, ${new Intl.NumberFormat('en-US', { style: 'currency', currency: [...currencies][0] }).format(sum)} in all`; } catch { /* unknown currency */ }
  }
  const oldest = due[0];
  const late = Math.floor((now.getTime() - Date.parse(oldest.dueDate)) / DAY_MS);
  return [{
    id: `overdue:${now.toISOString().slice(0, 10)}:${due.length}`,
    kind: 'OVERDUE',
    urgency: 'soon' as Urgency,
    title: line(`${plural(due.length, 'invoice')} ${due.length === 1 ? 'is' : 'are'} overdue${total}`),
    why: line(`The oldest is ${oldest.invoiceNumber}${oldest.customerName ? ` for ${oldest.customerName}` : ''}, ${plural(late, 'day')} late.`, WHY_MAX),
    fixes: [{ label: 'Chase them', request: 'Chase every overdue invoice' }],
    anchor: { page: 'finance' as const },
    audience: 'money' as Audience,
    createdAt: now.toISOString(),
  }];
}

/** Items below their reorder point: one note for Inventory, worst first. */
export function mapLowStock(res: any, now: Date): KelvinItem[] {
  const low = arr(res).filter((i) => i?.itemName);
  if (!low.length) return [];
  const named = low.slice(0, 3).map((i) => `${i.itemName} (${Number(i.currentQty) || 0} left)`);
  const more = low.length > 3 ? ` and ${low.length - 3} more` : '';
  return [{
    id: `lowstock:${now.toISOString().slice(0, 10)}:${low.length}`,
    kind: 'LOW_STOCK',
    urgency: 'soon' as Urgency,
    title: line(`${plural(low.length, 'item')} ${low.length === 1 ? 'is' : 'are'} below ${low.length === 1 ? 'its' : 'their'} reorder point`),
    why: line(`${more ? named.join(', ') + more : named.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`, WHY_MAX),
    fixes: [{ label: 'What to reorder', request: 'Which items are low on stock, and how many should we reorder?' }],
    anchor: { page: 'inventory' as const },
    audience: 'all' as Audience,
    createdAt: now.toISOString(),
  }];
}

const PAGES = ['customers', 'finance', 'jobs', 'scheduling', 'inventory'] as const;

/** The AI recommendations, high priority only, as notes on the page each one is about. */
export function mapSuggestions(res: any, now: Date): KelvinItem[] {
  return arr(res).filter((r) => r?.id && r.title && r.priority === 'high').slice(0, 3).map((r) => {
    const path = String(r.action ?? '').replace(/^\//, '').split(/[/?#]/)[0];
    const page = (PAGES as readonly string[]).includes(path) ? path as (typeof PAGES)[number] : 'dashboard';
    const why = r.reason ? line(r.reason, WHY_MAX) : undefined;
    return {
      id: `suggest:${line(r.id, 80)}`,
      kind: 'SUGGESTION' as const,
      urgency: 'soon' as Urgency,
      title: line(r.title),
      ...(why && { why }),
      fixes: fixes([{ label: 'Ask Kelvin', request: `About "${line(r.title)}"${why ? ` (${why})` : ''}: what should we do? Prepare it if you can.` }]),
      anchor: { page: page as any },
      audience: 'money' as Audience,
      createdAt: now.toISOString(),
    };
  });
}

export function visibleTo(item: KelvinItem, role: string): boolean {
  const r = role.toLowerCase();
  if (!DISPATCH_ROLES.has(r)) return false; // the admin Kelvin is for office roles only in release 1
  if (item.audience === 'money') return MONEY_ROLES.has(r);
  return true;
}

const RANK: Record<Urgency, number> = { urgent: 0, soon: 1, quiet: 2 };
export function sortItems(items: KelvinItem[]): KelvinItem[] {
  return [...items].sort((a, b) => RANK[a.urgency] - RANK[b.urgency] || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
