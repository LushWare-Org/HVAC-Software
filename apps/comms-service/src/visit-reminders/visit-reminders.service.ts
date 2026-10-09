/**
 * Reminders about a booked visit, to the customer and to the technician, on every channel:
 * an email in the company's layout, an in-app message (which also reaches the portal, the
 * app, a push, and Telegram when linked), and a push. Sent the evening before and a few
 * hours ahead by job-service, and on request when Kelvin or the office asks for one.
 *
 * Each channel and each person is tried on its own. The result says what happened, so a
 * caller can tell the person honestly ("emailed, but no device to push to").
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import type { Viewer } from '../chat/chat.policy';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { DirectNotifyService } from '../direct-notify/direct-notify.service';
import { NotificationsService } from '../notifications/notifications.service';
import { brandFromSettings, renderEmail } from '../email/email-layout';
import { customerReminderText, customerTitle, technicianReminderText, technicianTitle, type ReminderKind } from './visit-reminder.text';

export type ReminderChannel = 'message' | 'email' | 'push';
const ALL: ReminderChannel[] = ['message', 'email', 'push'];
const PORTAL_URL = (process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app').replace(/\/$/, '');

export interface VisitReminderEvent {
  companyId: string;
  jobId: string;
  kind: ReminderKind;
  audience: 'customer' | 'technician' | 'both';
  channels?: ReminderChannel[];
  customerId?: string | null;
  customerName?: string | null;
  jobTitle?: string | null;
  jobNumber?: string | null;
  jobAddress?: string | null;
  technicianUserId?: string | null;
  technicianName?: string | null;
  scheduledAt?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  confirmed?: boolean;
}

export type ChannelOutcome = 'sent' | 'no-email' | 'no-device' | 'failed' | 'skipped';
export interface ReminderResult { customer?: Partial<Record<ReminderChannel, ChannelOutcome>>; technician?: Partial<Record<ReminderChannel, ChannelOutcome>> }

@Injectable()
export class VisitRemindersService {
  private readonly logger = new Logger(VisitRemindersService.name);

  constructor(
    private readonly chat: ChatService,
    private readonly direct: DirectNotifyService,
    private readonly settings: CompanySettingsClient,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async send(e: VisitReminderEvent): Promise<ReminderResult> {
    const s = await this.settings.getSettings(e.companyId);
    const zone = s.timezone || 'UTC';
    const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: zone });
    const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone });
    const isWindow = !!(e.windowStart && e.windowEnd);
    const start = e.windowStart ?? e.scheduledAt;
    const when = !start ? 'a time we will confirm'
      : isWindow ? `${day(start)}, between ${clock(e.windowStart!)} and ${clock(e.windowEnd!)}` : `${day(start)}, ${clock(start)}`;
    const clockText = !start ? '' : isWindow ? `${clock(e.windowStart!)} to ${clock(e.windowEnd!)}` : clock(start);
    const channels = e.channels?.length ? e.channels.filter((c) => ALL.includes(c)) : ALL;
    const result: ReminderResult = {};

    if ((e.audience === 'customer' || e.audience === 'both') && e.customerId) {
      result.customer = await this.toCustomer(e, s, channels, when, clockText);
    }
    if ((e.audience === 'technician' || e.audience === 'both') && e.technicianUserId) {
      result.technician = await this.toTechnician(e, s, channels, when, clockText);
    }
    return result;
  }

  /**
   * Tells a technician their job moved or was taken off them. Same channels as a reminder:
   * the Notifications tab, a message in their chat with the office (push and Telegram ride with
   * it), and an email.
   */
  async tellTechnician(t: {
    companyId: string; jobId: string; techUserId: string; techName?: string | null;
    kind: 'REMOVED' | 'TIME_CHANGED'; jobTitle?: string | null; jobNumber?: string | null; customerName?: string | null;
    address?: string | null; whenLabel?: string | null; previousLabel?: string | null;
  }): Promise<Partial<Record<ReminderChannel, ChannelOutcome>>> {
    const out: Partial<Record<ReminderChannel, ChannelOutcome>> = {};
    const what = t.jobTitle?.trim() || 'a job';
    const title = t.kind === 'REMOVED' ? 'A job was taken off you' : 'A job time has changed';
    const body = t.kind === 'REMOVED'
      ? `${what}${t.customerName ? ` for ${t.customerName}` : ''}${t.previousLabel ? ` (${t.previousLabel})` : ''} is no longer yours. You do not need to attend.`
      : `${what}${t.customerName ? ` for ${t.customerName}` : ''} is now ${t.whenLabel ?? 'at a new time'}${t.previousLabel ? ` (it was ${t.previousLabel})` : ''}.`;
    const s = await this.settings.getSettings(t.companyId);

    void this.notifications?.sendInApp({
      companyId: t.companyId, sender: { userId: 'system', name: 'Dispatch', companyId: t.companyId, role: 'dispatcher' } as any,
      title, body, type: 'job_schedule', recipients: [{ recipientId: t.techUserId, recipientName: t.techName ?? '' }],
    }).catch((err: Error) => this.logger.warn(`technician in-app notice failed: ${err.message}`));

    try {
      const v: Viewer = { userId: 'system-reminders', companyId: t.companyId, role: 'company_admin', name: 'Dispatch', customerId: null };
      const conv = await this.chat.openTechOffice(v, t.techUserId);
      await this.chat.send(v, conv.id, { body: `${title}. ${body}`, jobId: t.jobId, clientId: `job:${t.jobId}:TECH:${t.kind}:${Date.now()}`.slice(0, 64) });
      out.message = 'sent';
    } catch (err) {
      this.logger.warn(`technician notice message for ${t.jobId} failed: ${(err as Error).message}`);
      out.message = 'failed';
    }

    const html = renderEmail({
      brand: brandFromSettings(s), accent: t.kind === 'REMOVED' ? '#D97706' : '#7C3AED', eyebrow: 'Dispatch', title,
      greeting: `Hi ${(t.techName ?? 'there').split(' ')[0]},`, intro: [body],
      facts: [
        { label: 'Job', value: t.jobTitle || 'Service visit' },
        ...(t.kind === 'TIME_CHANGED' && t.whenLabel ? [{ label: 'New time', value: t.whenLabel }] : []),
        ...(t.previousLabel ? [{ label: t.kind === 'REMOVED' ? 'Was booked for' : 'Was', value: t.previousLabel }] : []),
        ...(t.customerName ? [{ label: 'Customer', value: t.customerName }] : []),
        ...(t.address ? [{ label: 'Address', value: t.address }] : []),
        ...(t.jobNumber ? [{ label: 'Reference', value: t.jobNumber }] : []),
      ],
      outro: ['Open the technician app to see your updated schedule.'],
    });
    try {
      const r = await this.direct.send(t.companyId, { to: 'staff', id: t.techUserId, title, message: body, jobId: t.jobId, channels: ['email'] }, { emailHtml: html });
      out.email = (r.results.email ?? 'failed') as ChannelOutcome;
    } catch (err) {
      this.logger.warn(`technician notice email for ${t.jobId} failed: ${(err as Error).message}`);
      out.email = 'failed';
    }
    return out;
  }

  private async toCustomer(e: VisitReminderEvent, s: any, channels: ReminderChannel[], when: string, clock: string) {
    const out: Partial<Record<ReminderChannel, ChannelOutcome>> = {};
    const confirmUrl = `${PORTAL_URL}/jobs?confirm=${encodeURIComponent(e.jobId)}`;
    const facts = { kind: e.kind, jobTitle: e.jobTitle, technicianName: e.technicianName, when, clock, confirmed: e.confirmed, confirmUrl };
    const text = customerReminderText(facts);
    const title = customerTitle(e.kind);
    const dto = { to: 'customer' as const, id: e.customerId as string, title, message: text, jobId: e.jobId };

    if (channels.includes('message')) {
      try {
        const v: Viewer = { userId: 'system-reminders', companyId: e.companyId, role: 'company_admin', name: 'Reminders', customerId: null };
        const conv = await this.chat.openOffice(v, e.customerId as string);
        const mark = `${e.kind}:${Math.floor(new Date(e.windowStart ?? e.scheduledAt ?? 0).getTime() / 60_000)}`;
        // "REM" is not a status with its own push, so this message also sends the customer's push.
        await this.chat.send(v, conv.id, { body: text, jobId: e.jobId, clientId: `job:${e.jobId}:REM:${mark}`.slice(0, 64) });
        out.message = 'sent';
      } catch (err) {
        this.logger.warn(`reminder message for ${e.jobId} failed: ${(err as Error).message}`);
        out.message = 'failed';
      }
    }

    const wantEmail = channels.includes('email');
    // A chat message already pushes; push on its own only when no message goes.
    const wantPush = channels.includes('push') && !channels.includes('message');
    if (wantEmail || wantPush) {
      const lead = e.kind === 'SOON' ? `${e.technicianName ?? 'Your technician'} is due to arrive for your service.` : `This is a reminder about your upcoming service with ${s.name || 'us'}.`;
      const html = renderEmail({
        brand: brandFromSettings(s), eyebrow: 'Visit reminder', title, preheader: `${e.jobTitle ?? 'Your visit'}: ${when}`,
        greeting: `Hi ${e.customerName ?? 'there'},`, intro: [lead],
        facts: [
          { label: 'Service', value: e.jobTitle || 'Service visit' },
          { label: clock.includes(' to ') ? 'Arrival window' : 'When', value: when },
          ...(e.jobAddress ? [{ label: 'Address', value: e.jobAddress }] : []),
          ...(e.jobNumber ? [{ label: 'Reference', value: e.jobNumber }] : []),
        ],
        person: e.technicianName ? { name: e.technicianName, role: 'Your technician' } : undefined,
        callout: e.confirmed ? { tone: 'good', text: 'You have confirmed this time. Thank you.' } : { tone: 'warn', text: 'We have not heard back from you yet. Please confirm that you will be there.' },
        ctas: [
          ...(e.confirmed ? [] : [{ label: 'Confirm this time', url: confirmUrl }]),
          { label: 'Ask for another time', url: `${PORTAL_URL}/jobs?reschedule=${encodeURIComponent(e.jobId)}`, primary: !!e.confirmed },
        ],
        outro: ['You can also reply to this email and we will sort it out.'],
      });
      try {
        const r = await this.direct.send(e.companyId, { ...dto, channels: [wantEmail && 'email', wantPush && 'push'].filter(Boolean) as any }, { emailHtml: html });
        if (wantEmail) out.email = (r.results.email ?? 'failed') as ChannelOutcome;
        if (wantPush) out.push = (r.results.push ?? 'failed') as ChannelOutcome;
      } catch (err) {
        this.logger.warn(`reminder email/push for ${e.jobId} failed: ${(err as Error).message}`);
        if (wantEmail) out.email = 'failed';
        if (wantPush) out.push = 'failed';
      }
    } else if (channels.includes('push')) {
      out.push = out.message === 'sent' ? 'sent' : 'skipped';
    }
    return out;
  }

  private async toTechnician(e: VisitReminderEvent, s: any, channels: ReminderChannel[], when: string, clock: string) {
    const out: Partial<Record<ReminderChannel, ChannelOutcome>> = {};
    const techId = e.technicianUserId as string;
    const facts = { kind: e.kind, jobTitle: e.jobTitle, customerName: e.customerName, address: e.jobAddress, when, clock, confirmed: e.confirmed };
    const text = technicianReminderText(facts);
    const title = technicianTitle(e.kind);

    // The Notifications tab in the technician app.
    void this.notifications?.sendInApp({
      companyId: e.companyId, sender: { userId: 'system', name: 'Dispatch', companyId: e.companyId, role: 'dispatcher' } as any,
      title, body: text, type: 'job_reminder', recipients: [{ recipientId: techId, recipientName: e.technicianName ?? '' }],
    }).catch((err: Error) => this.logger.warn(`technician in-app reminder failed: ${err.message}`));

    if (channels.includes('message')) {
      try {
        const v: Viewer = { userId: 'system-reminders', companyId: e.companyId, role: 'company_admin', name: 'Reminders', customerId: null };
        const conv = await this.chat.openTechOffice(v, techId);
        const mark = `${e.kind}:${Math.floor(new Date(e.windowStart ?? e.scheduledAt ?? 0).getTime() / 60_000)}`;
        await this.chat.send(v, conv.id, { body: text, jobId: e.jobId, clientId: `job:${e.jobId}:REMT:${mark}`.slice(0, 64) });
        out.message = 'sent';
      } catch (err) {
        this.logger.warn(`technician reminder message for ${e.jobId} failed: ${(err as Error).message}`);
        out.message = 'failed';
      }
    }

    const wantEmail = channels.includes('email');
    const wantPush = channels.includes('push') && !channels.includes('message');
    if (wantEmail || wantPush) {
      const html = renderEmail({
        brand: brandFromSettings(s), accent: '#7C3AED', eyebrow: 'Job reminder', title, preheader: `${e.jobTitle ?? 'Job'}: ${when}`,
        greeting: `Hi ${(e.technicianName ?? 'there').split(' ')[0]},`,
        intro: [e.kind === 'SOON' ? 'Your next job starts soon.' : 'You have a job coming up.'],
        facts: [
          { label: 'Job', value: e.jobTitle || 'Service visit' },
          { label: 'When', value: when },
          ...(e.customerName ? [{ label: 'Customer', value: e.customerName }] : []),
          ...(e.jobAddress ? [{ label: 'Address', value: e.jobAddress }] : []),
          ...(e.jobNumber ? [{ label: 'Reference', value: e.jobNumber }] : []),
        ],
        callout: e.confirmed ? { tone: 'good', text: 'The customer has confirmed this time.' } : { tone: 'warn', text: 'The customer has not confirmed this time yet.' },
        outro: ['Open the technician app for the full details and to update your status.'],
      });
      try {
        const r = await this.direct.send(e.companyId, { to: 'staff', id: techId, title, message: text, jobId: e.jobId, channels: [wantEmail && 'email', wantPush && 'push'].filter(Boolean) as any }, { emailHtml: html });
        if (wantEmail) out.email = (r.results.email ?? 'failed') as ChannelOutcome;
        if (wantPush) out.push = (r.results.push ?? 'failed') as ChannelOutcome;
      } catch (err) {
        this.logger.warn(`technician reminder email/push for ${e.jobId} failed: ${(err as Error).message}`);
        if (wantEmail) out.email = 'failed';
        if (wantPush) out.push = 'failed';
      }
    } else if (channels.includes('push')) {
      out.push = out.message === 'sent' ? 'sent' : 'skipped';
    }
    return out;
  }
}
