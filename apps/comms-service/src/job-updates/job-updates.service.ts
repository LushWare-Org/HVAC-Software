/**
 * Job updates in the customer's conversation with the office.
 *
 * Every customer-visible status change (booked, on the way, arrived, done,
 * on hold, cancelled) is also posted as a message from the company into the
 * customer's chat. That one message reaches them in the portal and app, and on
 * Telegram if they linked it (the Telegram relay mirrors it, with the
 * technician's photo when there is one). Email and the status push keep their
 * own paths; this never fails the status change.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import type { Viewer } from '../chat/chat.policy';

export type CustomerJobStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';

export interface JobUpdate {
  companyId: string;
  customerId?: string | null;
  jobId: string;
  status: string;
  jobTitle?: string | null;
  technicianName?: string | null;
  /** "between 2:40 PM and 3:00 PM" */
  arrivalWindow?: string | null;
  /** Already formatted in the company's time zone, e.g. "Mon 12 Oct, 9:00 AM". */
  scheduledLabel?: string | null;
  note?: string | null;
  techPhotoUrl?: string | null;
}

/** The words the customer reads. Null for statuses we don't announce. */
export function jobUpdateText(u: JobUpdate): string | null {
  const what = u.jobTitle?.trim() || 'your service visit';
  const tech = u.technicianName?.trim() || 'Your technician';
  const note = u.note?.trim() ? ` ${u.note.trim().replace(/\.?$/, '.')}` : '';
  switch (u.status) {
    case 'SCHEDULED':
      return `Your visit for ${what} is booked${u.scheduledLabel ? ` for ${u.scheduledLabel}` : ''}.${tech !== 'Your technician' ? ` ${tech} will be your technician.` : ''}`;
    case 'EN_ROUTE':
      return `${tech} is on the way to you for ${what}.${u.arrivalWindow ? ` Expected ${u.arrivalWindow}.` : ''}`;
    case 'ON_SITE':
      return `${tech} has arrived and is starting work on ${what}.`;
    case 'COMPLETED':
      return `${capital(what)} is complete. Thank you!${note} You can see the details in your portal.`;
    case 'CANCELLED':
      return `${capital(what)}${u.scheduledLabel ? ` on ${u.scheduledLabel}` : ''} has been cancelled.${note} Reply here if you'd like to book another time.`;
    case 'ON_HOLD':
      return `${capital(what)} is on hold for now.${note} We'll be in touch to arrange the next step.`;
    default:
      return null;
  }
}

export type ScheduleChangeKind = 'SCHEDULED' | 'TIME_CHANGED' | 'TECH_CHANGED' | 'TIME_AND_TECH_CHANGED';

export interface ScheduleUpdate {
  companyId: string;
  customerId?: string | null;
  jobId: string;
  change: ScheduleChangeKind;
  jobTitle?: string | null;
  technicianName?: string | null;
  /** "Mon 12 Oct, 9:00 AM" in the company's time zone. */
  whenLabel: string;
  /** "Mon 12 Oct, between 8:00 AM and 12:00 PM" for an arrival window. */
  windowLabel?: string | null;
  previousLabel?: string | null;
  techPhotoUrl?: string | null;
}

/** Said at the end of every schedule message: the way out when the time does not suit. */
export const RESCHEDULE_HINT = "If this time doesn't work for you, you can ask for another time from the visit in your portal or app, or just reply here.";

/** The words the customer reads when their visit is booked or changed. */
export function scheduleUpdateText(u: ScheduleUpdate): string {
  const what = u.jobTitle?.trim() || 'your service visit';
  const tech = u.technicianName?.trim();
  const when = u.windowLabel ? `${u.windowLabel}` : u.whenLabel;
  const was = u.previousLabel && u.previousLabel !== u.whenLabel ? ` (it was ${u.previousLabel})` : '';
  switch (u.change) {
    case 'SCHEDULED':
      return `Your visit for ${what} is booked for ${when}.${tech ? ` ${tech} will be your technician.` : ''} ${RESCHEDULE_HINT}`;
    case 'TIME_CHANGED':
      return `The time for ${what} has changed. It is now ${when}${was}.${tech ? ` ${tech} is still your technician.` : ''} ${RESCHEDULE_HINT}`;
    case 'TECH_CHANGED':
      return `${tech ?? 'A different technician'} will now be your technician for ${what} on ${when}. ${RESCHEDULE_HINT}`;
    default:
      return `Your visit for ${what} has been updated: ${when}${tech ? ` with ${tech}` : ''}${was}. ${RESCHEDULE_HINT}`;
  }
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const shortHash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

@Injectable()
export class JobUpdatesService {
  private readonly logger = new Logger(JobUpdatesService.name);

  constructor(private readonly chat: ChatService) {}

  /**
   * Posts a booked or changed visit as the company. The id carries the time and technician,
   * so the same booking is never posted twice and a real change always is.
   */
  async postSchedule(u: ScheduleUpdate & { startAtIso?: string | null }): Promise<boolean> {
    if (!u.customerId) return false;
    try {
      const v: Viewer = { userId: 'system-job-updates', companyId: u.companyId, role: 'company_admin', name: 'Job updates', customerId: null };
      const conv = await this.chat.openOffice(v, u.customerId);
      const mark = `${Math.floor(new Date(u.startAtIso ?? 0).getTime() / 60_000)}${shortHash(u.technicianName ?? '')}`;
      const photo = /^https:\/\//i.test(u.techPhotoUrl ?? '') ? [{ url: u.techPhotoUrl as string, name: `${u.technicianName ?? 'Technician'}`, type: 'image/jpeg' }] : undefined;
      // "SCHED" is deliberately not a status with its own push, so this message sends the customer's push.
      await this.chat.send(v, conv.id, { body: scheduleUpdateText(u), jobId: u.jobId, clientId: `job:${u.jobId}:SCHED:${mark}`.slice(0, 64), attachments: photo });
      return true;
    } catch (err) {
      this.logger.warn(`schedule message for ${u.jobId} (${u.change}) failed: ${(err as Error).message}`);
      return false;
    }
  }

  /** Posts the update as the company. At most once per job, status and day (retries and double triggers are absorbed). */
  async post(u: JobUpdate): Promise<boolean> {
    const text = jobUpdateText(u);
    if (!text || !u.customerId) return false;
    try {
      const v: Viewer = { userId: 'system-job-updates', companyId: u.companyId, role: 'company_admin', name: 'Job updates', customerId: null };
      const conv = await this.chat.openOffice(v, u.customerId);
      const day = new Date().toISOString().slice(0, 10);
      const photo = /^https:\/\//i.test(u.techPhotoUrl ?? '') ? [{ url: u.techPhotoUrl as string, name: `${u.technicianName ?? 'Technician'}`, type: 'image/jpeg' }] : undefined;
      await this.chat.send(v, conv.id, { body: text, jobId: u.jobId, clientId: `job:${u.jobId}:${u.status}:${day}`.slice(0, 64), attachments: photo });
      return true;
    } catch (err) {
      this.logger.warn(`job update message for ${u.jobId} (${u.status}) failed: ${(err as Error).message}`);
      return false;
    }
  }
}
