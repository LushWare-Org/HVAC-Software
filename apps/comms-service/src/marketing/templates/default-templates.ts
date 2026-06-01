export interface DefaultTemplate {
  name: string;
  channel: 'SMS' | 'EMAIL';
  subject?: string;
  htmlBody?: string;
  smsBody?: string;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'HVAC Tune-Up Reminder',
    channel: 'SMS',
    smsBody: "Hi {{customer.firstName}}, it's time for your annual HVAC tune-up! Keeping your system maintained saves you money and extends its life. Book now at {{company.name}}: {{trackedLink}} Reply STOP to opt out.",
  },
  {
    name: 'Plumbing Emergency Alert',
    channel: 'SMS',
    smsBody: "{{customer.firstName}}, {{company.name}} here. Did you know we offer 24/7 emergency plumbing? Next time pipes burst or drains back up, we're one call away. Learn more: {{trackedLink}} STOP to opt out.",
  },
  {
    name: 'Seasonal Promo',
    channel: 'SMS',
    smsBody: "Hey {{customer.firstName}}! {{company.name}} is running a limited-time seasonal offer. Book any service this month and save 10%. Grab your spot: {{trackedLink}} Reply STOP to opt out.",
  },
  {
    name: 'Win-Back Offer',
    channel: 'SMS',
    smsBody: "Hi {{customer.firstName}}, we miss you! It's been a while since your last service with {{company.name}}. Come back and get 15% off your next visit: {{trackedLink}} Reply STOP to opt out.",
  },
  {
    name: 'Electrical Safety Check',
    channel: 'EMAIL',
    subject: '{{customer.firstName}}, is your electrical panel safe?',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <tr><td style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:36px 48px">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600">{{company.name}}</p>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3">⚡ Electrical Safety Alert</h1>
      </td></tr>
      <tr><td style="padding:40px 48px">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1a1a2e">Hi {{customer.firstName}},</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.75">Electrical panels over 25 years old are a leading cause of house fires. A quick safety inspection by our licensed electricians takes under an hour and gives you complete peace of mind.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
          <tr>
            <td width="31%" style="background:#eff6ff;border-radius:8px;padding:18px;text-align:center"><p style="margin:0 0 4px;font-size:20px">🔍</p><p style="margin:0;font-size:12px;font-weight:700;color:#1e40af">Panel Inspection</p></td>
            <td width="3%"></td>
            <td width="32%" style="background:#eff6ff;border-radius:8px;padding:18px;text-align:center"><p style="margin:0 0 4px;font-size:20px">⚡</p><p style="margin:0;font-size:12px;font-weight:700;color:#1e40af">Circuit Testing</p></td>
            <td width="3%"></td>
            <td width="31%" style="background:#eff6ff;border-radius:8px;padding:18px;text-align:center"><p style="margin:0 0 4px;font-size:20px">✅</p><p style="margin:0;font-size:12px;font-weight:700;color:#1e40af">Safety Report</p></td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px"><tr><td align="center">
          <a href="{{trackedLink}}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:15px;font-weight:700">Book a Safety Check →</a>
        </td></tr></table>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px">
            <p style="margin:0;font-size:13px;font-weight:700;color:#92400e">Why act now?</p>
            <p style="margin:6px 0 0;font-size:13px;color:#78716c;line-height:1.6">Outdated wiring and overloaded circuits silently increase fire risk. Our inspection identifies hazards before they become emergencies.</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7">{{company.name}} · You're receiving this as a valued customer.<br><a href="{{unsubLink}}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    name: 'Water Heater Maintenance',
    channel: 'EMAIL',
    subject: 'Extend your water heater life — {{customer.firstName}}',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(16,185,129,0.12)">
      <tr><td style="background:#0891b2;padding:36px 48px">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600">{{company.name}}</p>
        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3">💧 Water Heater Maintenance</h1>
      </td></tr>
      <tr><td style="padding:40px 48px">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0c4a6e">Hi {{customer.firstName}},</p>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.75">Annual flushing and anode rod replacement can <strong style="color:#0891b2">double the life of your water heater</strong>. Our service takes about 45 minutes and costs far less than a full replacement.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td style="width:50%;padding-right:8px;vertical-align:top">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#e0f7fa;border-radius:8px">
                <tr><td style="padding:20px">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0891b2">Without Maintenance</p>
                  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">🔴 Sediment buildup<br>🔴 Higher energy bills<br>🔴 8–10 year lifespan<br>🔴 Unexpected failure</p>
                </td></tr>
              </table>
            </td>
            <td style="width:50%;padding-left:8px;vertical-align:top">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:8px">
                <tr><td style="padding:20px">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#059669">With Our Service</p>
                  <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">✅ Clean, efficient system<br>✅ Lower energy bills<br>✅ 15–20 year lifespan<br>✅ Peace of mind</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <a href="{{trackedLink}}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:15px;font-weight:700">Schedule Maintenance →</a>
        </td></tr></table>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #d1fae5;padding:24px 48px;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7">{{company.name}} · You're receiving this as a valued customer.<br><a href="{{unsubLink}}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
];
