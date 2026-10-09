/**
 * Pure text shaping for the Telegram mirror, kept apart so it is easy to test.
 * Telegram gets HTML (only <b>, <i>, <a> are used), so everything we did not
 * write ourselves is escaped.
 */
export const escHtml = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface OutboundParts {
  /** Who it is from, as this reader should see it. */
  from: string;
  /** e.g. "Private chat with RP Tech", when it isn't their main conversation. */
  context?: string | null;
  jobNumber?: string | null;
  body: string;
  attachments?: Array<{ url: string; name?: string }>;
  edited?: boolean;
}

const MAX = 3900; // Telegram allows 4096 characters per message

export function renderOutbound(p: OutboundParts): string {
  const head = `<b>${escHtml(p.from)}</b>${p.context ? ` <i>· ${escHtml(p.context)}</i>` : ''}`;
  const lines = [head];
  if (p.jobNumber) lines.push(`<i>About ${escHtml(p.jobNumber)}</i>`);
  if (p.body) lines.push(escHtml(p.body));
  for (const a of p.attachments ?? []) {
    if (/^https:\/\//i.test(a.url)) lines.push(`📎 <a href="${escHtml(a.url)}">${escHtml(a.name || 'Attachment')}</a>`);
  }
  if (p.edited) lines.push('<i>(edited)</i>');
  const text = lines.join('\n');
  return text.length > MAX ? `${text.slice(0, MAX)}…` : text;
}

export type Inbound =
  | { kind: 'start'; code: string | null }
  | { kind: 'stop' }
  | { kind: 'help' }
  | { kind: 'text'; text: string };

/** What a message to the bot means. "/start abc" carries a link code. */
export function parseInbound(text: string | undefined | null): Inbound | null {
  const t = String(text ?? '').trim();
  if (!t) return null;
  const cmd = /^\/(\w+)(?:@\w+)?(?:\s+(.*))?$/s.exec(t);
  if (cmd) {
    const name = cmd[1].toLowerCase();
    if (name === 'start') {
      const code = (cmd[2] ?? '').trim();
      return { kind: 'start', code: /^[A-Za-z0-9_-]{8,64}$/.test(code) ? code : null };
    }
    if (name === 'stop' || name === 'unlink') return { kind: 'stop' };
    if (name === 'help') return { kind: 'help' };
  }
  return { kind: 'text', text: t };
}

/** The deep link that opens the bot with a one-time code. */
export const startLink = (botUsername: string, code: string) => `https://t.me/${botUsername}?start=${code}`;
