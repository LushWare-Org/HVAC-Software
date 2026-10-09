import type { JobScheduleChangedEvent } from './dto/automation.dto';
import { renderEmail, type EmailBrand } from '../email/email-layout';

const COPY: Record<JobScheduleChangedEvent['change'], { eyebrow: string; title: string; subject: string }> = {
  SCHEDULED: { eyebrow: 'Visit booked', title: 'Your visit is booked', subject: 'Your visit is booked' },
  TIME_CHANGED: { eyebrow: 'New time', title: 'The time of your visit has changed', subject: 'The time of your visit has changed' },
  TECH_CHANGED: { eyebrow: 'New technician', title: 'You have a new technician', subject: 'New technician for your visit' },
  TIME_AND_TECH_CHANGED: { eyebrow: 'Visit updated', title: 'Your visit has been updated', subject: 'Your visit has been updated' },
};

export interface ScheduleEmailInput {
  event: JobScheduleChangedEvent;
  brand: EmailBrand;
  /** Already in the company's time zone. */
  whenLabel: string;
  windowLabel?: string | null;
  previousLabel?: string | null;
  /** Opens the visit in the portal with the reschedule form ready. */
  rescheduleUrl: string;
  /** Confirms the time in one tap. */
  confirmUrl: string;
  techPhotoUrl?: string | null;
}

export function jobScheduleEmail(i: ScheduleEmailInput): { subject: string; html: string } {
  const { event: e } = i;
  const c = COPY[e.change];
  const ref = e.jobTitle || `Job ${e.jobNumber ?? e.jobId.slice(-6).toUpperCase()}`;
  const when = i.windowLabel ?? i.whenLabel;
  const was = i.previousLabel && i.previousLabel !== i.whenLabel ? `${when} (it was ${i.previousLabel})` : when;
  const html = renderEmail({
    brand: i.brand, eyebrow: c.eyebrow, title: c.title, preheader: `${ref}: ${when}`,
    greeting: `Hi ${e.customerName},`,
    intro: [`Your visit with ${i.brand.name} is arranged. Here are the details.`],
    facts: [
      { label: 'Service', value: ref },
      { label: i.windowLabel ? 'Arrival window' : 'When', value: was },
      ...(e.jobAddress ? [{ label: 'Address', value: e.jobAddress }] : []),
      ...(e.jobNumber ? [{ label: 'Reference', value: e.jobNumber }] : []),
    ],
    person: e.technicianName ? { name: e.technicianName, role: 'Your technician', photoUrl: i.techPhotoUrl } : undefined,
    callout: i.windowLabel ? { tone: 'info', text: 'Your technician will arrive some time in this window. We will tell you the exact time on the day.' } : undefined,
    ctas: [
      { label: 'Confirm this time', url: i.confirmUrl },
      { label: 'Ask for another time', url: i.rescheduleUrl, primary: false },
    ],
    outro: ['If you need to change anything, reply to this email and we will sort it out.'],
  });
  return { subject: `${c.subject}: ${ref}`, html };
}
