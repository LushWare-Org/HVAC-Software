export interface WinbackVars {
  customerName: string;
  companyName: string;
  trackedLink: string;
  unsubLink: string;
  offerText?: string;   // optional discount/offer line, e.g. "15% off your next service"
}

// Step 1 — day 0 — warm re-engagement SMS
export function step1Sms(v: WinbackVars): string {
  return `Hi ${v.customerName}, it's been a while! We'd love to help you again. Book anytime: ${v.trackedLink} Reply STOP to opt out.`;
}

// Step 2 — day 3 — email with special offer
export function step2EmailSubject(v: WinbackVars): string {
  return `We miss you, ${v.customerName} — here's something special`;
}

export function step2EmailBody(v: WinbackVars): string {
  const offerBlock = v.offerText
    ? `<p style="margin:0 0 20px;padding:16px;background:#f0f7ff;border-left:4px solid #1a73e8;color:#1a1a1a;font-size:15px;border-radius:4px">
         <strong>Exclusive offer for returning customers:</strong> ${v.offerText}
       </p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px">
      <tr><td style="background:#1a73e8;padding:28px 40px">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">${v.companyName}</h1>
      </td></tr>
      <tr><td style="padding:36px 40px">
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px">We miss you, ${v.customerName}</h2>
        <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.7">
          It's been a while since we last saw you. We hope everything's going well.
          When you're ready, we're here — and we'd love to make your next service experience
          even better than the last.
        </p>
        ${offerBlock}
        <a href="${v.trackedLink}"
           style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600">
          Book a Service
        </a>
        <p style="margin:32px 0 0;color:#aaa;font-size:12px">
          ${v.companyName}<br>
          <a href="${v.unsubLink}" style="color:#aaa">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Step 3 — day 7 — final SMS with urgency (offer expires)
export function step3Sms(v: WinbackVars): string {
  const offer = v.offerText ? ` Your ${v.offerText} expires soon.` : '';
  return `Hi ${v.customerName}, last chance!${offer} We'd love to serve you again: ${v.trackedLink} Reply STOP to opt out.`;
}
