/** The "get our messages on Telegram" email: one button, three short steps. */
import { escHtml } from './telegram.format';

export function telegramInviteHtml(p: {
  companyName: string; logoUrl: string | null; name: string; link: string; botUsername: string; note?: string; forTechnician?: boolean;
}): string {
  const first = escHtml((p.name || '').split(' ')[0] || 'there');
  const company = escHtml(p.companyName);
  const note = p.note ? `<p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6;">${escHtml(p.note).replace(/\r?\n/g, '<br>')}</p>` : '';
  const what = p.forTechnician
    ? 'Get messages from the office on Telegram, and reply right there.'
    : `Get replies from ${company} on Telegram, and message us from there too. Your portal keeps the full history.`;
  const step = (n: number, text: string) => `<tr><td style="padding:6px 0;vertical-align:top;width:28px;"><span style="display:inline-block;width:22px;height:22px;border-radius:11px;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:700;text-align:center;line-height:22px;">${n}</span></td><td style="padding:6px 0;color:#334155;font-size:14px;line-height:1.5;">${text}</td></tr>`;
  return `<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:28px 16px;">
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    <div style="background:#229ED9;padding:22px 24px;color:#ffffff;">
      ${p.logoUrl ? `<img src="${escHtml(p.logoUrl)}" alt="${company}" style="height:28px;margin-bottom:12px;border-radius:6px;background:#fff;padding:2px;">` : ''}
      <div style="font-size:20px;font-weight:700;line-height:1.3;">${company} is now on Telegram</div>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px;color:#0f172a;font-size:15px;">Hi ${first},</p>
      <p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.6;">${what}</p>
      ${note}
      <div style="text-align:center;margin:8px 0 22px;">
        <a href="${escHtml(p.link)}" style="display:inline-block;background:#229ED9;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;">Connect Telegram</a>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e2e8f0;padding-top:10px;">
        ${step(1, 'Tap <b>Connect Telegram</b> on your phone.')}
        ${step(2, `Telegram opens our chat, <b>@${escHtml(p.botUsername)}</b>. Press <b>Start</b>.`)}
        ${step(3, "That's it. You'll see a welcome message.")}
      </table>
      <p style="margin:18px 0 0;color:#64748b;font-size:12px;line-height:1.5;">This link is just for you and works once, for 14 days. Don't have Telegram? Ignore this email. Nothing changes, and we'll keep reaching you as usual. Send /stop in the chat any time to disconnect.</p>
    </div>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin:14px 0 0;">${company}</p>
</div></body></html>`;
}
