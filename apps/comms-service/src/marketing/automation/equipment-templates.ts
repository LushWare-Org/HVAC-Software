export type AutomationTemplateKey =
  | 'hvac-tune-up-6mo'
  | 'hvac-replacement-7yr'
  | 'warranty-expiry-30d';

export interface AutomationTemplate {
  key: AutomationTemplateKey;
  channel: 'SMS' | 'EMAIL' | 'BOTH';
  smsBody: (vars: TemplateVars) => string;
  emailSubject: (vars: TemplateVars) => string;
  emailBody: (vars: TemplateVars) => string;
}

export interface TemplateVars {
  customerName: string;
  equipmentType: string;
  brand: string;
  trackedLink: string;
  unsubLink: string;
  warrantyEndDate?: string;
  companyName?: string;
}

export const EQUIPMENT_TEMPLATES: Record<AutomationTemplateKey, AutomationTemplate> = {

  'hvac-tune-up-6mo': {
    key: 'hvac-tune-up-6mo',
    channel: 'BOTH',

    smsBody: ({ customerName, equipmentType, trackedLink }) =>
      `Hi ${customerName}, it's been 6 months since your ${equipmentType} was serviced. A quick tune-up now keeps it running efficiently all season. Book here: ${trackedLink} Reply STOP to opt out.`,

    emailSubject: ({ equipmentType }) =>
      `Time for your ${equipmentType} seasonal tune-up`,

    emailBody: ({ customerName, equipmentType, brand, trackedLink, unsubLink, companyName }) =>
      buildEmail(
        `Time for your ${equipmentType} seasonal tune-up`,
        `
        <p>Hi ${customerName},</p>
        <p>It's been 6 months since your <strong>${brand} ${equipmentType}</strong> was last serviced.
        A seasonal tune-up now means better efficiency, lower energy bills, and fewer surprise breakdowns.</p>
        <p>Our tune-ups include:</p>
        <ul>
          <li>Filter inspection and replacement</li>
          <li>Coil cleaning and refrigerant check</li>
          <li>Thermostat calibration</li>
          <li>Full system performance report</li>
        </ul>
        `,
        'Book My Tune-Up',
        trackedLink,
        unsubLink,
        companyName,
      ),
  },

  'hvac-replacement-7yr': {
    key: 'hvac-replacement-7yr',
    channel: 'BOTH',

    smsBody: ({ customerName, equipmentType, trackedLink }) =>
      `Hi ${customerName}, your ${equipmentType} is 7+ years old. Today's Energy Star units use up to 40% less energy. See your upgrade options: ${trackedLink} Reply STOP to opt out.`,

    emailSubject: ({ equipmentType }) =>
      `Your ${equipmentType} is approaching end-of-life — upgrade options inside`,

    emailBody: ({ customerName, equipmentType, brand, trackedLink, unsubLink, companyName }) =>
      buildEmail(
        `Your ${equipmentType} is approaching end-of-life`,
        `
        <p>Hi ${customerName},</p>
        <p>Your <strong>${brand} ${equipmentType}</strong> has been running for over 7 years.
        The average lifespan for this type of system is 10–15 years — meaning you're in the window
        where repairs start costing more than a replacement.</p>
        <p>A modern Energy Star replacement can reduce your energy bill by up to 40% and comes with
        a full manufacturer warranty.</p>
        <p>We'll give you a free in-home assessment with no pressure to buy.</p>
        `,
        'See Upgrade Options',
        trackedLink,
        unsubLink,
        companyName,
      ),
  },

  'warranty-expiry-30d': {
    key: 'warranty-expiry-30d',
    channel: 'BOTH',

    smsBody: ({ customerName, equipmentType, warrantyEndDate, trackedLink }) =>
      `Hi ${customerName}, your ${equipmentType} warranty expires ${warrantyEndDate ?? 'soon'}. Ask us about our protection plan before it lapses: ${trackedLink} Reply STOP to opt out.`,

    emailSubject: ({ equipmentType, warrantyEndDate }) =>
      `Your ${equipmentType} warranty expires ${warrantyEndDate ?? 'soon'} — protect your investment`,

    emailBody: ({ customerName, equipmentType, brand, warrantyEndDate, trackedLink, unsubLink, companyName }) =>
      buildEmail(
        `Your ${equipmentType} warranty is expiring`,
        `
        <p>Hi ${customerName},</p>
        <p>The manufacturer warranty on your <strong>${brand} ${equipmentType}</strong> expires on
        <strong>${warrantyEndDate ?? 'soon'}</strong>. After that date, any parts or labour costs
        come entirely out of pocket.</p>
        <p>Our extended protection plan covers:</p>
        <ul>
          <li>Parts and labour for covered repairs</li>
          <li>Priority scheduling (next-business-day response)</li>
          <li>Annual preventive maintenance included</li>
        </ul>
        <p>Lock in your rate before the warranty lapses — prices increase once coverage ends.</p>
        `,
        'Get Protection Plan Details',
        trackedLink,
        unsubLink,
        companyName,
      ),
  },
};

// ── Shared HTML email builder ─────────────────────────────────────────────────

function buildEmail(
  title: string,
  bodyHtml: string,
  ctaText: string,
  ctaUrl: string,
  unsubLink: string,
  companyName = 'T&S Services',
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px">
      <tr><td style="background:#1a73e8;padding:28px 40px">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">${companyName}</h1>
      </td></tr>
      <tr><td style="padding:36px 40px">
        <h2 style="margin:0 0 20px;color:#1a1a1a;font-size:20px">${title}</h2>
        <div style="color:#444;font-size:15px;line-height:1.7">${bodyHtml}</div>
        <div style="margin-top:32px">
          <a href="${ctaUrl}"
             style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600">
            ${ctaText}
          </a>
        </div>
        <p style="margin:32px 0 0;color:#aaa;font-size:12px">
          ${companyName}<br>
          <a href="${unsubLink}" style="color:#aaa">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
