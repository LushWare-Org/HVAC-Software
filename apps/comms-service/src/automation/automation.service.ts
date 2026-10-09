/**
 * AutomationService — Rule-based notification engine
 *
 * How it works:
 *  1. Other services (job-service, finance-service) fire events via the internal
 *     REST endpoints in AutomationController.
 *  2. AutomationService loads all active AutomationRules for the company matching
 *     the trigger type.
 *  3. Each rule's `conditions` JSON is evaluated against the event payload.
 *  4. Matching rules fire their `actions` — each action has a channel + templateId.
 *  5. The template is rendered with the event context, then queued via
 *     NotificationsService (with optional delayMinutes).
 *
 * Condition evaluation (lightweight):
 *  - Top-level keys in conditions JSON must match event payload fields.
 *  - Example: conditions = '{"jobStatus":"COMPLETED"}' matches when
 *    event.jobStatus === "COMPLETED".
 *  - Supports simple equality only (no nested/regex — keep it simple for now).
 */

import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { EnRouteNotificationService } from '../enroute/enroute.service';
import { JobUpdatesService } from '../job-updates/job-updates.service';
import { VisitRemindersService } from '../visit-reminders/visit-reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplatesService } from '../templates/templates.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { Channel, AutomationTrigger } from '../prisma/generated';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationTriggerEnum,
  JobStatusChangedEvent,
  JobScheduleChangedEvent,
  InvoiceSentEvent,
  PaymentReceivedEvent,
  QuoteApprovedEvent,
  AppointmentBookedEvent,
} from './dto/automation.dto';

import { jobScheduleEmail } from './job-schedule.email';
import { brandFromSettings, renderEmail, type EmailBrand } from '../email/email-layout';

const PORTAL_URL = (process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app').replace(/\/$/, '');

// Solid colours per event: blue informs, amber is in progress or on hold, green is done, red is cancelled.
const JOB_EVENT_STYLE: Record<string, { accent: string; eyebrow: string }> = {
  PENDING:   { accent: '#2563EB', eyebrow: 'Request received' },
  ON_SITE:   { accent: '#7C3AED', eyebrow: 'Technician on site' },
  COMPLETED: { accent: '#059669', eyebrow: 'Job completed' },
  ON_HOLD:   { accent: '#D97706', eyebrow: 'Visit on hold' },
  CANCELLED: { accent: '#DC2626', eyebrow: 'Job cancelled' },
};

/** The status emails (request received, on site, completed, on hold, cancelled), in the shared layout. */
export function jobStatusEmailHtml(event: JobStatusChangedEvent, brand: EmailBrand): { subject: string; html: string } | null {
  const style = JOB_EVENT_STYLE[event.jobStatus];
  if (!style) return null;
  const ref = event.jobTitle || `Job ${event.jobNumber ?? event.jobId.slice(-6).toUpperCase()}`;
  const when = event.scheduledAt
    ? new Date(event.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;
  const base = { brand, accent: style.accent, eyebrow: style.eyebrow, greeting: `Hi ${event.customerName},` };
  const facts = [
    { label: 'Service', value: ref },
    ...(event.jobNumber ? [{ label: 'Reference', value: event.jobNumber }] : []),
    ...(event.jobAddress ? [{ label: 'Address', value: event.jobAddress }] : []),
  ];
  const portal = { label: 'Open your portal', url: PORTAL_URL };

  switch (event.jobStatus) {
    case 'PENDING':
      return { subject: `We have your request: ${ref}`, html: renderEmail({ ...base, title: 'Your service request has been received',
        intro: [`Thanks for contacting ${brand.name}. We have logged your request and our team will schedule it shortly.`], facts,
        outro: ['We will email you again as soon as a technician and a time are arranged.'] }) };
    case 'ON_SITE':
      return { subject: `${event.technicianName ?? 'Your technician'} has arrived: ${ref}`, html: renderEmail({ ...base, title: 'Your technician has arrived',
        intro: [`${event.technicianName ?? 'Your technician'} has arrived and is starting work on your service.`], facts,
        person: event.technicianName ? { name: event.technicianName, role: 'Your technician' } : undefined }) };
    case 'COMPLETED':
      return { subject: `Job complete: ${ref}`, html: renderEmail({ ...base, title: 'Your job is complete',
        intro: [`Your service with ${brand.name} has been completed. Thank you for choosing us.`], facts: [...facts, ...(when ? [{ label: 'Scheduled', value: when }] : [])],
        callout: { tone: 'good', text: 'You can see your invoice and job history at any time in your customer portal.' }, ctas: [portal] }) };
    case 'ON_HOLD':
      return { subject: `Your visit is on hold: ${ref}`, html: renderEmail({ ...base, title: 'Your visit has been put on hold',
        intro: [`${ref} has been placed on hold for now. We will reach out as soon as it is ready to be rescheduled.`], facts,
        callout: event.statusNote ? { tone: 'warn', text: `Reason: ${event.statusNote}` } : undefined,
        outro: ['Questions in the meantime? Reply to this email and we will help.'] }) };
    case 'CANCELLED':
      return { subject: `Job cancelled: ${ref}`, html: renderEmail({ ...base, title: 'Your job was cancelled',
        intro: [`${ref} has been cancelled.`], facts,
        callout: event.cancellationReason ? { tone: 'warn', text: `Reason: ${event.cancellationReason}` } : undefined,
        outro: ['If this was not expected, reply to this email and we will help you book another time.'] }) };
    default:
      return null;
  }
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly templates: TemplatesService,
    private readonly companySettings: CompanySettingsClient,
    @Optional() private readonly enRoute?: EnRouteNotificationService,
    @Optional() private readonly jobUpdates?: JobUpdatesService,
    @Optional() private readonly visitReminders?: VisitRemindersService,
  ) {}

  // ── Rule CRUD ─────────────────────────────────────────────────────────────

  async createRule(companyId: string, dto: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        companyId,
        name: dto.name,
        trigger: dto.trigger as AutomationTrigger,
        conditions: dto.conditions,
        actions: dto.actions,
        delayMinutes: dto.delayMinutes ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findRules(companyId: string, params: { trigger?: AutomationTrigger } = {}) {
    return this.prisma.automationRule.findMany({
      where: {
        companyId,
        ...(params.trigger ? { trigger: params.trigger } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findRule(companyId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({
      where: { id, companyId },
    });
    if (!rule) throw new NotFoundException(`Automation rule ${id} not found`);
    return rule;
  }

  async updateRule(companyId: string, id: string, dto: UpdateAutomationRuleDto) {
    await this.findRule(companyId, id);
    return this.prisma.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions } : {}),
        ...(dto.actions !== undefined ? { actions: dto.actions } : {}),
        ...(dto.delayMinutes !== undefined ? { delayMinutes: dto.delayMinutes } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async removeRule(companyId: string, id: string) {
    await this.findRule(companyId, id);
    await this.prisma.automationRule.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Event Processors ──────────────────────────────────────────────────────

  async processJobStatusChanged(event: JobStatusChangedEvent) {
    this.logger.log(`Automation: JOB_STATUS_CHANGED — job ${event.jobId} → ${event.jobStatus}`);
    const context = {
      customerName: event.customerName,
      jobId: event.jobId,
      jobStatus: event.jobStatus,
      jobAddress: event.jobAddress ?? '',
      technicianName: event.technicianName ?? '',
      scheduledAt: event.scheduledAt ?? '',
    };

    // EN_ROUTE gets the richer notification (technician photo + arrival window, by email,
    // SMS, in-app and Telegram). scheduling-service sends it when the assignment moves;
    // when the technician app moves the job itself, only this event fires, so send it
    // from here. The en-route service sends once per job, whichever trigger comes first.
    if (event.jobStatus === 'EN_ROUTE') {
      void this.enRoute?.notifyFromJob(event.companyId, event.jobId).catch((err: unknown) => {
        this.logger.warn(`En-route notification failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    } else if (event.jobStatus !== 'SCHEDULED') {
      // Every other customer-visible change also goes into their chat with the office
      // (portal, app, and Telegram when linked). SCHEDULED is announced by
      // processJobScheduleChanged, together with the technician and the time.
      const settings = await this.companySettings.getSettings(event.companyId);
      void this.jobUpdates?.post({
        companyId: event.companyId, customerId: event.customerId, jobId: event.jobId, status: event.jobStatus,
        jobTitle: event.jobTitle, technicianName: event.technicianName,
        scheduledLabel: event.scheduledAt ? new Date(event.scheduledAt).toLocaleString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: settings.timezone || 'UTC',
        }) : null,
        note: event.jobStatus === 'CANCELLED' ? event.cancellationReason : event.statusNote,
      });
    }

    if (event.customerEmail && event.jobStatus !== 'EN_ROUTE' && event.jobStatus !== 'SCHEDULED') {
      const rendered = jobStatusEmailHtml(event, brandFromSettings(await this.companySettings.getSettings(event.companyId)));
      if (rendered) {
        await this.notifications.sendEmail({
          companyId: event.companyId,
          customerId: event.customerId,
          jobId: event.jobId,
          recipientId: event.customerId,
          recipientName: event.customerName,
          recipientEmail: event.customerEmail,
          subject: rendered.subject,
          htmlBody: rendered.html,
        }).catch((err: unknown) => {
          this.logger.warn(`Job ${event.jobStatus} email failed: ${err instanceof Error ? err.message : String(err)}`);
        });
      }
    }

    await this.executeRules(event.companyId, AutomationTrigger.JOB_STATUS_CHANGED, event as any, context);
  }

  /**
   * A booked visit got a technician and a time, or one of them changed: tell the customer by
   * email, in the chat (portal, app, push, and Telegram when linked), with a way to ask for
   * another time. Each channel is tried on its own, so one failing never blocks the rest.
   */
  async processJobScheduleChanged(event: JobScheduleChangedEvent) {
    this.logger.log(`Automation: JOB_SCHEDULE_CHANGED — job ${event.jobId} ${event.change}`);
    const settings = await this.companySettings.getSettings(event.companyId);
    const zone = settings.timezone || 'UTC';
    const day = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: zone }) : '');
    const clock = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone }) : '');
    const whenLabel = event.scheduledAt ? `${day(event.scheduledAt)}, ${clock(event.scheduledAt)}` : 'a time we will confirm';
    const windowLabel = event.windowStart && event.windowEnd ? `${day(event.windowStart)}, between ${clock(event.windowStart)} and ${clock(event.windowEnd)}` : null;
    const previousLabel = event.previousScheduledAt ? `${day(event.previousScheduledAt)}, ${clock(event.previousScheduledAt)}` : null;

    void this.jobUpdates?.postSchedule({
      companyId: event.companyId, customerId: event.customerId, jobId: event.jobId, change: event.change,
      jobTitle: event.jobTitle, technicianName: event.technicianName, whenLabel, windowLabel, previousLabel,
      startAtIso: event.scheduledAt,
    });

    // The technicians: the one who lost the job is told, and so is the one whose time moved.
    // (A new technician hears about the job from the assignment itself.)
    const techBase = {
      companyId: event.companyId, jobId: event.jobId, jobTitle: event.jobTitle, jobNumber: event.jobNumber,
      customerName: event.customerName, address: event.jobAddress,
    };
    if ((event.change === 'TECH_CHANGED' || event.change === 'TIME_AND_TECH_CHANGED') && event.previousTechnicianUserId) {
      void this.visitReminders?.tellTechnician({ ...techBase, techUserId: event.previousTechnicianUserId, kind: 'REMOVED', previousLabel });
    }
    if (event.change === 'TIME_CHANGED' && event.technicianUserId) {
      void this.visitReminders?.tellTechnician({ ...techBase, techUserId: event.technicianUserId, techName: event.technicianName, kind: 'TIME_CHANGED', whenLabel: windowLabel ?? whenLabel, previousLabel });
    }

    if (event.customerEmail) {
      const mail = jobScheduleEmail({
        event, brand: brandFromSettings(settings), whenLabel, windowLabel, previousLabel,
        rescheduleUrl: `${PORTAL_URL}/jobs?reschedule=${encodeURIComponent(event.jobId)}`,
        confirmUrl: `${PORTAL_URL}/jobs?confirm=${encodeURIComponent(event.jobId)}`,
      });
      await this.notifications.sendEmail({
        companyId: event.companyId, customerId: event.customerId, jobId: event.jobId,
        recipientId: event.customerId, recipientName: event.customerName, recipientEmail: event.customerEmail,
        subject: mail.subject, htmlBody: mail.html,
      }).catch((err: unknown) => {
        this.logger.warn(`Schedule email failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }

  async processInvoiceSent(event: InvoiceSentEvent) {
    this.logger.log(`Automation: INVOICE_SENT — invoice ${event.invoiceNumber}`);
    const context = {
      customerName: event.customerName,
      invoiceNumber: event.invoiceNumber,
      total: event.total,
      dueDate: event.dueDate ?? '',
      paymentUrl: event.paymentUrl ?? '',
    };
    await this.executeRules(event.companyId, AutomationTrigger.INVOICE_SENT, event as any, context);
  }

  async processPaymentReceived(event: PaymentReceivedEvent) {
    this.logger.log(`Automation: PAYMENT_RECEIVED — invoice ${event.invoiceNumber}`);
    const context = {
      customerName: event.customerName,
      invoiceNumber: event.invoiceNumber,
      amountPaid: event.amountPaid,
    };
    await this.executeRules(event.companyId, AutomationTrigger.PAYMENT_RECEIVED, event as any, context);
  }

  async processQuoteApproved(event: QuoteApprovedEvent) {
    this.logger.log(`Automation: QUOTE_APPROVED — quote ${event.quoteNumber}`);
    const context = {
      customerName: event.customerName,
      quoteNumber: event.quoteNumber,
      approvedByName: event.approvedByName ?? event.customerName,
    };
    await this.executeRules(event.companyId, AutomationTrigger.QUOTE_APPROVED, event as any, context);
  }

  async processAppointmentBooked(event: AppointmentBookedEvent) {
    this.logger.log(`Automation: APPOINTMENT_BOOKED — job ${event.jobId}`);
    const context = {
      customerName: event.customerName,
      scheduledAt: event.scheduledAt,
      jobAddress: event.jobAddress ?? '',
      technicianName: event.technicianName ?? '',
    };
    await this.executeRules(event.companyId, AutomationTrigger.APPOINTMENT_BOOKED, event as any, context);
  }

  // ── Core Rule Engine ──────────────────────────────────────────────────────

  private async executeRules(
    companyId: string,
    trigger: AutomationTrigger,
    event: Record<string, unknown>,
    context: Record<string, unknown>,
  ) {
    const rules = await this.prisma.automationRule.findMany({
      where: { companyId, trigger, isActive: true },
    });

    this.logger.debug(`Found ${rules.length} active rules for ${trigger}`);

    for (const rule of rules) {
      try {
        const conditions = JSON.parse(rule.conditions) as Record<string, unknown>;
        if (!this.matchesConditions(event, conditions)) {
          this.logger.debug(`Rule ${rule.id} (${rule.name}) conditions not met — skipping`);
          continue;
        }

        const actions = JSON.parse(rule.actions) as Array<{
          channel: string;
          templateId: string;
        }>;

        const scheduledAt = rule.delayMinutes > 0
          ? new Date(Date.now() + rule.delayMinutes * 60_000)
          : undefined;

        for (const action of actions) {
          await this.dispatchAction(companyId, action, context, event, scheduledAt);
        }

        this.logger.log(`Rule ${rule.id} (${rule.name}) executed — ${actions.length} actions`);
      } catch (err) {
        this.logger.error(`Rule ${rule.id} execution failed: ${(err as Error).message}`);
      }
    }
  }

  private matchesConditions(
    event: Record<string, unknown>,
    conditions: Record<string, unknown>,
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (event[key] !== value) return false;
    }
    return true;
  }

  private async dispatchAction(
    companyId: string,
    action: { channel: string; templateId: string },
    context: Record<string, unknown>,
    event: Record<string, unknown>,
    scheduledAt?: Date,
  ) {
    let rendered: { subject?: string; body: string };

    try {
      rendered = await this.templates.render(companyId, action.templateId, context);
    } catch (err) {
      this.logger.error(`Template render failed for ${action.templateId}: ${(err as Error).message}`);
      return;
    }

    const recipientId = (event.customerId as string) ?? 'unknown';
    const recipientName = (context.customerName as string) ?? '';

    switch (action.channel) {
      case Channel.SMS: {
        const phone = (event.customerPhone as string) ?? '';
        if (!phone) {
          this.logger.warn(`SMS action skipped — no phone for customer ${recipientId}`);
          return;
        }
        await this.notifications.sendSms({
          companyId,
          customerId: event.customerId as string,
          jobId: event.jobId as string | undefined,
          invoiceId: event.invoiceId as string | undefined,
          recipientId,
          recipientName,
          recipientPhone: phone,
          body: rendered.body,
          scheduledAt,
        });
        break;
      }

      case Channel.EMAIL: {
        const email = (event.customerEmail as string) ?? '';
        if (!email) {
          this.logger.warn(`Email action skipped — no email for customer ${recipientId}`);
          return;
        }
        await this.notifications.sendEmail({
          companyId,
          customerId: event.customerId as string,
          jobId: event.jobId as string | undefined,
          invoiceId: event.invoiceId as string | undefined,
          quoteId: event.quoteId as string | undefined,
          recipientId,
          recipientName,
          recipientEmail: email,
          subject: rendered.subject ?? 'Notification from HVACtor.ai',
          htmlBody: rendered.body,
          scheduledAt,
        });
        break;
      }

      case Channel.PUSH: {
        const pushToken = (event.pushToken as string) ?? '';
        if (!pushToken) {
          this.logger.warn(`Push action skipped — no push token for customer ${recipientId}`);
          return;
        }
        await this.notifications.sendPush({
          companyId,
          customerId: event.customerId as string,
          recipientId,
          recipientName,
          pushToken,
          title: rendered.subject ?? 'New notification',
          body: rendered.body,
          scheduledAt,
        });
        break;
      }

      default:
        this.logger.warn(`Unknown channel in automation action: ${action.channel}`);
    }
  }
}
