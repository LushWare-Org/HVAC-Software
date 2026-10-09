import { RESCHEDULE_HINT } from '../job-updates/job-updates.service';

export type ReminderKind = 'EVE' | 'SOON' | 'MANUAL';

export interface ReminderFacts {
  kind: ReminderKind;
  jobTitle?: string | null;
  customerName?: string | null;
  technicianName?: string | null;
  address?: string | null;
  /** "Mon 12 Oct, 9:00 AM" or, for an arrival window, "Mon 12 Oct, between 8:00 AM and 12:00 PM". */
  when: string;
  /** Just the clock part, "9:00 AM" (window: "8:00 AM to 12:00 PM"). */
  clock: string;
  confirmed?: boolean;
  confirmUrl?: string;
}

const what = (f: ReminderFacts) => f.jobTitle?.trim() || 'your service visit';

/** Headline for the email and the first words of the message. */
export function customerTitle(kind: ReminderKind): string {
  return kind === 'EVE' ? 'Your visit is tomorrow' : kind === 'SOON' ? 'Your technician arrives soon' : 'A reminder about your visit';
}

/** The words the customer reads in their chat, Telegram and push. */
export function customerReminderText(f: ReminderFacts): string {
  const tech = f.technicianName?.trim();
  const day = f.kind === 'EVE' ? 'tomorrow' : f.kind === 'SOON' ? 'today' : '';
  const lead =
    f.kind === 'SOON'
      ? `${tech ?? 'Your technician'} is due to arrive for ${what(f)} ${f.when.includes('between') ? f.when : `at ${f.clock}`} today.`
      : `Reminder: your visit for ${what(f)} is ${day ? `${day}, ` : 'on '}${f.when}.${tech ? ` ${tech} will be your technician.` : ''}`;
  const confirm = f.confirmed
    ? 'You have confirmed this time. Thank you.'
    : f.confirmUrl ? `Please confirm you will be there: ${f.confirmUrl}` : '';
  return [lead, confirm, RESCHEDULE_HINT].filter(Boolean).join(' ');
}

export function technicianTitle(kind: ReminderKind): string {
  return kind === 'EVE' ? 'You have a job tomorrow' : kind === 'SOON' ? 'Your next job starts soon' : 'Job reminder';
}

/** The words the technician reads in the app, Telegram and push. */
export function technicianReminderText(f: ReminderFacts): string {
  const day = f.kind === 'EVE' ? 'Tomorrow' : f.kind === 'SOON' ? 'Soon' : 'Reminder';
  const bits = [
    `${day}, ${f.when}: ${f.jobTitle?.trim() || 'service visit'}`,
    f.customerName ? `for ${f.customerName}` : '',
    f.address ? `at ${f.address}` : '',
  ].filter(Boolean).join(' ');
  const note = f.confirmed ? 'The customer has confirmed.' : 'The customer has not confirmed yet.';
  return `${bits}. ${note}`;
}
