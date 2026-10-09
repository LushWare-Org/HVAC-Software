/**
 * Office alerts: pure rules for when an office person gets a Telegram alert
 * about a new inbox message, and how it reads. Kept apart so they are easy to test.
 */
import { escHtml } from './telegram.format';
import type { OfficePrefs } from './telegram.service';

/** Minutes since midnight, now, in the company's time zone. */
export function minutesNow(timeZone: string, now = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return h * 60 + m;
  } catch {
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** True inside quiet hours. "20:00"–"07:00" wraps past midnight. */
export function inQuietHours(prefs: Pick<OfficePrefs, 'quietFrom' | 'quietTo'>, nowMin: number): boolean {
  if (!prefs.quietFrom || !prefs.quietTo || prefs.quietFrom === prefs.quietTo) return false;
  const from = toMin(prefs.quietFrom), to = toMin(prefs.quietTo);
  return from < to ? nowMin >= from && nowMin < to : nowMin >= from || nowMin < to;
}

export function officeAlertText(a: { senderName: string; who: 'customer' | 'technician'; jobNumber?: string | null; body: string; attachments: number }): string {
  const first = a.senderName.split(' ')[0] || a.senderName;
  const body = a.body.length > 1500 ? `${a.body.slice(0, 1500)}…` : a.body;
  return [
    `💬 <b>${escHtml(a.senderName)}</b> <i>· ${a.who}</i>`,
    ...(a.jobNumber ? [`<i>About ${escHtml(a.jobNumber)}</i>`] : []),
    ...(body ? [escHtml(body)] : []),
    ...(a.attachments ? [`📎 ${a.attachments === 1 ? '1 attachment' : `${a.attachments} attachments`} (open the dashboard to see)`] : []),
    `<i>Reply to this message to answer ${escHtml(first)}.</i>`,
  ].join('\n');
}

/** A button to the conversation in the dashboard; Telegram only accepts public https links. */
export function dashboardButton(conversationId: string): Record<string, unknown> | undefined {
  const base = (process.env.FRONTEND_URL ?? '').replace(/\/+$/, '');
  if (!/^https:\/\//i.test(base)) return undefined;
  return { reply_markup: { inline_keyboard: [[{ text: 'Open in dashboard', url: `${base}/communications?c=${encodeURIComponent(conversationId)}` }]] } };
}
