/**
 * One layout for every customer-facing and staff email, so they all look like they come from
 * the same company: the company's name (and logo when it has one) on top, the facts laid
 * out in a table, clear buttons, and the company's contact details at the bottom.
 *
 * Table-based with inline styles because that is what mail apps render reliably. Every piece
 * of text passed in is plain text; it is escaped here.
 */
export interface EmailBrand {
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export interface EmailInput {
  brand: EmailBrand;
  /** Solid colour that matches the tone: blue informs, green confirms, amber warns, red cancels. */
  accent?: string;
  /** Small line above the title: "Visit booked". */
  eyebrow: string;
  title: string;
  /** Preview text in the inbox list. */
  preheader?: string;
  greeting?: string;
  intro?: string[];
  /** The facts: what, when, where, who. */
  facts?: Array<{ label: string; value: string }>;
  /** A person card, e.g. the technician with a photo. */
  person?: { name: string; role?: string; photoUrl?: string | null };
  callout?: { tone?: 'info' | 'warn' | 'good'; text: string };
  ctas?: Array<{ label: string; url: string; primary?: boolean }>;
  outro?: string[];
}

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = (u: string) => (/^(https?:|mailto:|tel:)/i.test(u) ? esc(u) : '#');

const CALLOUT: Record<string, { bg: string; bd: string; fg: string }> = {
  info: { bg: '#EFF6FF', bd: '#BFDBFE', fg: '#1E40AF' },
  warn: { bg: '#FFFBEB', bd: '#FDE68A', fg: '#92400E' },
  good: { bg: '#ECFDF5', bd: '#A7F3D0', fg: '#065F46' },
};

export function renderEmail(i: EmailInput): string {
  const accent = i.accent ?? '#2563EB';
  const b = i.brand;
  const brandName = esc(b.name || 'Your service team');
  const logo = b.logoUrl && /^https?:\/\//i.test(b.logoUrl)
    ? `<img src="${esc(b.logoUrl)}" alt="${brandName}" height="36" style="display:block;height:36px;max-width:180px;border:0;">`
    : `<span style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.01em;">${brandName}</span>`;

  const paragraphs = (list?: string[]) => (list ?? []).filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.7;color:#374151;">${esc(p).replace(/\r?\n/g, '<br>')}</p>`).join('');

  const facts = i.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;border:1px solid #E5E7EB;border-radius:12px;border-collapse:separate;overflow:hidden;">
        ${i.facts.map((f, n) => `<tr>
          <td style="padding:11px 16px;width:120px;font-size:12.5px;color:#6B7280;vertical-align:top;${n ? 'border-top:1px solid #E5E7EB;' : ''}background:#F9FAFB;">${esc(f.label)}</td>
          <td style="padding:11px 16px;font-size:14px;color:#111827;font-weight:${n === 0 ? 700 : 500};vertical-align:top;${n ? 'border-top:1px solid #E5E7EB;' : ''}">${esc(f.value)}</td>
        </tr>`).join('')}
      </table>`
    : '';

  const person = i.person
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr>
        ${i.person.photoUrl && /^https?:\/\//i.test(i.person.photoUrl)
          ? `<td style="padding-right:12px;"><img src="${esc(i.person.photoUrl)}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:24px;object-fit:cover;border:0;"></td>`
          : `<td style="padding-right:12px;"><div style="width:48px;height:48px;border-radius:24px;background:${accent};color:#fff;font-weight:700;font-size:18px;line-height:48px;text-align:center;">${esc(i.person.name.charAt(0).toUpperCase())}</div></td>`}
        <td><div style="font-size:15px;font-weight:700;color:#111827;">${esc(i.person.name)}</div>${i.person.role ? `<div style="font-size:12.5px;color:#6B7280;">${esc(i.person.role)}</div>` : ''}</td>
      </tr></table>`
    : '';

  const c = i.callout ? CALLOUT[i.callout.tone ?? 'info'] : null;
  const callout = i.callout && c
    ? `<div style="margin:0 0 20px;padding:13px 16px;border:1px solid ${c.bd};background:${c.bg};border-radius:12px;font-size:13.5px;line-height:1.6;color:${c.fg};">${esc(i.callout.text)}</div>`
    : '';

  const ctas = i.ctas?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 20px;"><tr>
        ${i.ctas.map((a) => a.primary === false
          ? `<td style="padding-right:10px;"><a href="${safeUrl(a.url)}" style="display:inline-block;padding:11px 20px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;background:#ffffff;">${esc(a.label)}</a></td>`
          : `<td style="padding-right:10px;"><a href="${safeUrl(a.url)}" style="display:inline-block;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;background:${accent};">${esc(a.label)}</a></td>`).join('')}
      </tr></table>`
    : '';

  const contact = [
    b.phone ? `Phone ${esc(b.phone)}` : '',
    b.email ? `<a href="mailto:${esc(b.email)}" style="color:#6B7280;">${esc(b.email)}</a>` : '',
    b.website ? `<a href="${safeUrl(/^https?:/i.test(b.website) ? b.website : `https://${b.website}`)}" style="color:#6B7280;">${esc(b.website.replace(/^https?:\/\//i, ''))}</a>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(i.title)}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(i.preheader ?? i.title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;"><tr><td align="center" style="padding:28px 14px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
      <tr><td style="padding:0 4px 14px;">${logo}</td></tr>
      <tr><td style="background:#ffffff;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;">
        <div style="height:4px;background:${accent};"></div>
        <div style="padding:28px 32px 8px;">
          <div style="font-size:12px;font-weight:600;letter-spacing:0.04em;color:${accent};margin-bottom:6px;">${esc(i.eyebrow)}</div>
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#111827;letter-spacing:-0.01em;">${esc(i.title)}</h1>
          ${i.greeting ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#111827;">${esc(i.greeting)}</p>` : ''}
          ${paragraphs(i.intro)}
        </div>
        <div style="padding:0 32px 8px;">
          ${facts}${person}${callout}${ctas}${paragraphs(i.outro)}
        </div>
        <div style="padding:16px 32px 24px;border-top:1px solid #E5E7EB;font-size:12.5px;line-height:1.7;color:#6B7280;">
          <strong style="color:#374151;">${brandName}</strong>${b.address ? `<br>${esc(b.address)}` : ''}${contact ? `<br>${contact}` : ''}
        </div>
      </td></tr>
      <tr><td style="padding:14px 8px 0;font-size:11.5px;color:#9CA3AF;text-align:center;">Sent by ${brandName} · Powered by HVACtor.ai</td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

/** The company's name, logo and contact details, from its settings, for the email footer. */
export function brandFromSettings(s: { name?: string | null; logoUrl?: string | null; address?: string | null; phone?: string | null; email?: string | null; website?: string | null } | null | undefined): EmailBrand {
  return { name: s?.name || 'HVACtor.ai', logoUrl: s?.logoUrl, address: s?.address, phone: s?.phone, email: s?.email, website: s?.website };
}
