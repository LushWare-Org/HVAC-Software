/**
 * Kelvin's notes for a customer, on the portal Dashboard: their technician on
 * the way, a visit coming up, quotes waiting, invoices due. Read as the
 * customer, so each service returns only their own records.
 */
import { line } from './sources';

export interface CustomerFix { label: string; request?: string; href?: string }
export interface CustomerNote { id: string; urgency: 'urgent' | 'soon'; title: string; why?: string; fixes: CustomerFix[] }

const DAY_MS = 86_400_000;
const SOON_MS = 2 * DAY_MS;
const DUE_DAYS = 7;
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : Array.isArray((v as any)?.data) ? (v as any).data : []);
const first = (name: unknown) => String(name ?? '').trim().split(/\s+/)[0] || '';

function money(n: unknown, currency?: string): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(n) || 0); } catch { return String(n); }
}
const localDate = (d: Date, tz: string) => d.toLocaleDateString('en-CA', { timeZone: tz });
const clock = (d: Date, tz: string) => d.toLocaleTimeString('en-GB', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
const shortDay = (d: Date, tz: string) => d.toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });

/** "today at 9:00 am", "tomorrow at 9:00 am", or "on Wed 14 Oct at 9:00 am". */
function whenSaid(at: Date, now: Date, tz: string): string {
  const day = localDate(at, tz);
  const which = day === localDate(now, tz) ? 'today' : day === localDate(new Date(now.getTime() + DAY_MS), tz) ? 'tomorrow' : `on ${shortDay(at, tz)}`;
  return `${which} at ${clock(at, tz)}`;
}

export function mapCustomerNotes(data: { jobs?: unknown; quotes?: unknown; invoices?: unknown }, now: Date, tz = 'UTC'): CustomerNote[] {
  const notes: CustomerNote[] = [];
  const jobs = arr(data.jobs);

  for (const j of jobs.filter((x) => x?.status === 'EN_ROUTE' || x?.status === 'ON_SITE')) {
    const tech = first(j.assignedToName) || 'Your technician';
    notes.push({
      id: `${j.status === 'EN_ROUTE' ? 'onway' : 'onsite'}:${j.id}`,
      urgency: 'urgent',
      title: j.status === 'EN_ROUTE' ? `${tech} is on the way` : `${tech} is with you now`,
      why: line(`For ${j.jobNumber}, ${j.title}.`),
      fixes: [],
    });
  }

  const next = jobs
    .filter((x) => x?.status === 'SCHEDULED' && x.scheduledStart)
    .map((x) => ({ j: x, at: new Date(x.scheduledStart) }))
    .filter(({ at }) => at.getTime() > now.getTime() && at.getTime() - now.getTime() <= SOON_MS)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  if (next) {
    const tech = first(next.j.assignedToName);
    notes.push({
      id: `visit:${next.j.id}:${next.j.scheduledStart}`,
      urgency: 'soon',
      title: `Your visit is ${whenSaid(next.at, now, tz)}`,
      why: line(`${next.j.title}${tech ? `, with ${tech}` : ''}.`),
      fixes: [
        { label: 'Change time', request: `I need to move my visit ${next.j.jobNumber}` },
        { label: 'Note for the technician', request: `I want to leave a note for the technician on ${next.j.jobNumber}` },
      ],
    });
  }

  for (const q of arr(data.quotes).filter((x) => x?.status === 'SENT' || x?.status === 'VIEWED').slice(0, 2)) {
    const valid = q.validUntil ? ` Valid until ${shortDay(new Date(q.validUntil), tz)}.` : '';
    notes.push({
      id: `quote:${q.id}`,
      urgency: 'soon',
      title: `Quote ${q.quoteNumber} is waiting for you`,
      why: line(`${q.title ? `${q.title}, ` : ''}${money(q.total, q.currency)}.${valid}`),
      fixes: [{ label: 'Accept', request: `Accept quote ${q.quoteNumber}` }, { label: 'Decline', request: `I want to decline quote ${q.quoteNumber}` }],
    });
  }

  for (const i of arr(data.invoices)) {
    if (!i?.dueDate || ['PAID', 'VOID', 'DRAFT'].includes(i.status) || !(Number(i.balanceDue) > 0)) continue;
    const left = Date.parse(i.dueDate) - now.getTime();
    if (left > DUE_DAYS * DAY_MS) continue;
    const days = Math.ceil(left / DAY_MS);
    const when = left < 0 ? 'is overdue' : days <= 0 ? 'is due today' : `is due in ${days} day${days === 1 ? '' : 's'}`;
    notes.push({
      id: `invoice:${i.id}:${left < 0 ? 'overdue' : 'due'}`,
      urgency: left < 0 ? 'urgent' : 'soon',
      title: `${i.invoiceNumber} ${when}: ${money(i.balanceDue, i.currency)}`,
      fixes: [{ label: 'Pay now', href: '/invoices' }],
    });
  }

  // Built in order of what matters most: happening now, coming up, waiting, due.
  return notes;
}
