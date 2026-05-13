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
    name: 'Electrical Safety Check',
    channel: 'EMAIL',
    subject: '{{customer.firstName}}, is your electrical panel safe?',
    htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 0">
<table width="600" style="margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
  <tr><td style="background:#f59e0b;padding:28px 40px"><h1 style="margin:0;color:#fff;font-size:22px">{{company.name}}</h1></td></tr>
  <tr><td style="padding:36px 40px">
    <h2 style="margin:0 0 12px;color:#1a1a1a">Hi {{customer.firstName}},</h2>
    <p style="color:#555;line-height:1.7">Electrical panels over 25 years old can be a fire hazard. A quick safety inspection by our licensed electricians takes under an hour and gives you peace of mind.</p>
    <a href="{{trackedLink}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">Book a Safety Check</a>
    <p style="margin-top:32px;color:#999;font-size:12px"><a href="{{unsubLink}}" style="color:#999">Unsubscribe</a></p>
  </td></tr>
</table></body></html>`,
  },
  {
    name: 'Water Heater Maintenance',
    channel: 'EMAIL',
    subject: 'Extend your water heater life — {{customer.firstName}}',
    htmlBody: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:40px 0">
<table width="600" style="margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
  <tr><td style="background:#0ea5e9;padding:28px 40px"><h1 style="margin:0;color:#fff;font-size:22px">{{company.name}}</h1></td></tr>
  <tr><td style="padding:36px 40px">
    <h2 style="margin:0 0 12px;color:#1a1a1a">Hi {{customer.firstName}},</h2>
    <p style="color:#555;line-height:1.7">Annual flushing and anode rod replacement can double the life of your water heater. Our service takes about 45 minutes and costs far less than a full replacement.</p>
    <a href="{{trackedLink}}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">Schedule Maintenance</a>
    <p style="margin-top:32px;color:#999;font-size:12px"><a href="{{unsubLink}}" style="color:#999">Unsubscribe</a></p>
  </td></tr>
</table></body></html>`,
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
];
