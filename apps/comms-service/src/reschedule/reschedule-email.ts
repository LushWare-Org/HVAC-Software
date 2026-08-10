/**
 * Reschedule email templates.
 *
 * Pure functions with no Nest dependencies so the HTML is directly testable.
 * Styled to match the job-status email family: solid accent header, uppercase
 * eyebrow, 560px card, no gradients.
 *
 * Accent follows the same rule as the in-app badges — amber means "you are the
 * holdup", green means settled, grey means closed.
 */
import { RESCHEDULE_WINDOWS } from '@tscrm/types';

export type RescheduleEmailEvent = 'OPENED' | 'RESPONDED' | 'APPLIED' | 'CLOSED' | 'NUDGE';

export interface RescheduleEmailSlot {
  id?: string;
  startAt: string;
  endAt: string;
  window?: string | null;
}

export interface RescheduleEmailInput {
  event: RescheduleEmailEvent;
  companyName: string;
  customerName: string;
  jobTitle: string;
  jobNumber?: string;
  reasonText?: string;
  slots: RescheduleEmailSlot[];
  appliedSlot?: RescheduleEmailSlot;
  portalUrl: string;
  timeZone: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "Tue, Aug 12 · Morning (8:00 AM – 12:00 PM)", rendered in the tenant's zone. */
function formatSlot(slot: RescheduleEmailSlot, timeZone: string): string {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const day = start.toLocaleDateString('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric',
  });
  const t = (d: Date) => d.toLocaleTimeString('en-US', {
    timeZone, hour: 'numeric', minute: '2-digit',
  });
  const win = slot.window && slot.window in RESCHEDULE_WINDOWS
    ? RESCHEDULE_WINDOWS[slot.window as keyof typeof RESCHEDULE_WINDOWS]
    : null;
  return win
    ? `${day} · ${win.label} (${t(start)} – ${t(end)})`
    : `${day} · ${t(start)} – ${t(end)}`;
}

const ACCENT: Record<RescheduleEmailEvent, string> = {
  OPENED: '#D97706',
  RESPONDED: '#2563EB',
  APPLIED: '#059669',
  CLOSED: '#6B7280',
  NUDGE: '#D97706',
};

const EYEBROW: Record<RescheduleEmailEvent, string> = {
  OPENED: 'Reschedule requested',
  RESPONDED: 'Reschedule update',
  APPLIED: 'New time confirmed',
  CLOSED: 'Reschedule closed',
  NUDGE: 'Reminder — still waiting on you',
};

export function buildRescheduleEmail(input: RescheduleEmailInput): { subject: string; html: string } {
  const job = esc(input.jobTitle);
  const company = esc(input.companyName);
  const who = esc(input.customerName || 'there');
  const accent = ACCENT[input.event];

  let subject: string;
  let heading: string;
  let lead: string;

  switch (input.event) {
    case 'APPLIED':
      subject = `New time confirmed — ${job}`;
      heading = 'Your new appointment time is confirmed';
      lead = `<strong>${job}</strong> has been moved. Here is the new time:`;
      break;
    case 'CLOSED':
      subject = `Reschedule closed — ${job}`;
      heading = 'That reschedule request is closed';
      lead = `The reschedule request for <strong>${job}</strong> has been closed. `
        + 'Your existing appointment still stands.';
      break;
    case 'NUDGE':
      subject = `Reminder: we're still waiting to hear from you — ${job}`;
      heading = 'A quick reminder';
      lead = `We're still waiting to hear back about rescheduling <strong>${job}</strong>.`;
      break;
    case 'RESPONDED':
      subject = `Reschedule update — ${job}`;
      heading = 'There is an update on your reschedule';
      lead = `There is a new proposal for <strong>${job}</strong>.`;
      break;
    default:
      subject = input.slots.length
        ? `Can we move your visit? — ${job}`
        : `We need to reschedule — ${job}`;
      heading = input.slots.length ? 'Can we move your visit?' : 'We need to reschedule your visit';
      lead = input.slots.length
        ? `We'd like to move <strong>${job}</strong>. Would any of these work?`
        : `We need to move <strong>${job}</strong>.`;
  }

  const appliedBlock = input.appliedSlot
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:18px 20px;">
         <p style="margin:0 0 6px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:${accent};letter-spacing:0.06em;">Confirmed for</p>
         <p style="margin:0;font-size:17px;font-weight:700;color:#111827;">${esc(formatSlot(input.appliedSlot, input.timeZone))}</p>
       </div>`
    : '';

  const slotList = input.slots.length
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:16px 18px;">
         <p style="margin:0 0 10px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:${accent};letter-spacing:0.06em;">Proposed times</p>
         ${input.slots.map((s) => `<p style="margin:0 0 8px;font-size:14.5px;font-weight:600;color:#111827;">${esc(formatSlot(s, input.timeZone))}</p>`).join('')}
       </div>`
    : '';

  const askBlock = input.event !== 'APPLIED' && input.event !== 'CLOSED' && !input.slots.length
    ? `<div style="border:1px solid ${accent}33;background:${accent}0d;border-radius:12px;padding:16px 18px;">
         <p style="margin:0;font-size:14px;color:#111827;">Please let us know what times work for you and we'll book it in.</p>
       </div>`
    : '';

  const reasonBlock = input.reasonText
    ? `<div style="margin-top:16px;padding:14px 16px;background:#F9FAFB;border-radius:10px;">
         <p style="margin:0 0 4px;font-size:11.5px;font-weight:700;text-transform:uppercase;color:#6B7280;letter-spacing:0.06em;">Reason</p>
         <p style="margin:0;font-size:13.5px;color:#374151;">${esc(input.reasonText)}</p>
       </div>`
    : '';

  const cta = input.event === 'CLOSED'
    ? ''
    : `<div style="margin-top:24px;">
         <a href="${esc(input.portalUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:10px;">
           ${input.event === 'APPLIED' ? 'View your booking' : 'Choose a time'}
         </a>
       </div>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#F3F4F6;padding:32px 18px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
    <div style="padding:28px 32px;background:${accent};">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-bottom:8px;">${EYEBROW[input.event]}</div>
      <h1 style="margin:0;font-size:21px;color:#ffffff;">${heading}</h1>
    </div>
    <div style="padding:30px 32px;">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${who},</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">${lead}</p>
      ${appliedBlock}${slotList}${askBlock}${reasonBlock}${cta}
      <p style="margin:26px 0 0;font-size:12.5px;line-height:1.7;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:16px;">
        ${input.jobNumber ? `Job ${esc(input.jobNumber)} · ` : ''}Sent by ${company} · Powered by HVACtor.ai
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
