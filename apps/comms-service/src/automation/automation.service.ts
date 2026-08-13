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

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  InvoiceSentEvent,
  PaymentReceivedEvent,
  QuoteApprovedEvent,
  AppointmentBookedEvent,
} from './dto/automation.dto';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Solid brand colors — no gradients. Chosen per event so the mail's tone
// matches what happened (blue = informational, amber = in progress/on site,
// green = success, red = cancelled).
const JOB_EVENT_STYLE: Record<string, { accent: string; eyebrow: string }> = {
  PENDING:   { accent: '#2563EB', eyebrow: 'Service request received' },
  SCHEDULED: { accent: '#2563EB', eyebrow: 'Visit scheduled' },
  ON_SITE:   { accent: '#7C3AED', eyebrow: 'Technician on site' },
  COMPLETED: { accent: '#059669', eyebrow: 'Job completed' },
  ON_HOLD:   { accent: '#D97706', eyebrow: 'Visit on hold' },
  CANCELLED: { accent: '#DC2626', eyebrow: 'Job cancelled' },
};

function jobStatusEmailHtml(event: JobStatusChangedEvent, companyName: string): { subject: string; html: string } | null {
  const style = JOB_EVENT_STYLE[event.jobStatus];
  if (!style) return null;

  const jobLabel = event.jobTitle ? esc(event.jobTitle) : `Job ${event.jobNumber ?? event.jobId.slice(-6).toUpperCase()}`;
  const when = event.scheduledAt
    ? new Date(event.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;

  let title: string;
  let subject: string;
  let bodyHtml: string;

  switch (event.jobStatus) {
    case 'PENDING':
      title = 'Your service request has been received';
      subject = `We've received your service request — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">
          Thanks for reaching out to ${esc(companyName)}. We've logged your request for <strong>${jobLabel}</strong> and our team will schedule it shortly.
        </p>
        ${event.jobAddress ? `<div style="border:1px solid #2563EB33;background:#2563EB0d;border-radius:12px;padding:16px 18px;"><p style="margin:0;font-size:11.5px;font-weight:700;text-transform:uppercase;color:#2563EB;letter-spacing:0.06em;margin-bottom:6px;">Service address</p><p style="margin:0;font-size:13.5px;color:#111827;">${esc(event.jobAddress)}</p></div>` : ''}
      `;
      break;
    case 'SCHEDULED':
      title = 'Your visit is scheduled';
      subject = `Your visit is scheduled — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;"><strong>${jobLabel}</strong> has been scheduled with ${esc(companyName)}.</p>
        <div style="border:1px solid #2563EB33;background:#2563EB0d;border-radius:12px;padding:16px 18px;">
          ${when ? `<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111827;">${esc(when)}</p>` : ''}
          ${event.jobAddress ? `<p style="margin:0;font-size:13.5px;color:#4B5563;">${esc(event.jobAddress)}</p>` : ''}
        </div>
      `;
      break;
    case 'ON_SITE':
      title = 'Your technician has arrived';
      subject = `${event.technicianName ?? 'Your technician'} has arrived — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">
          <strong>${esc(event.technicianName ?? 'Your technician')}</strong> has arrived and is now working on <strong>${jobLabel}</strong>.
        </p>
      `;
      break;
    case 'COMPLETED':
      title = 'Your job is complete';
      subject = `Job complete — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">
          <strong>${jobLabel}</strong> has been completed. Thank you for choosing ${esc(companyName)}.
        </p>
        <div style="border:1px solid #05966933;background:#0596690d;border-radius:12px;padding:16px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#4B5563;">You can view your invoice and job history any time from your customer portal.</p>
        </div>
      `;
      break;
    case 'ON_HOLD':
      title = 'Your visit has been put on hold';
      subject = `Your visit is on hold — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;">
          <strong>${jobLabel}</strong> with ${esc(companyName)} has been placed on hold for now. We'll reach out as soon as it's ready to reschedule.
        </p>
        ${event.statusNote ? `<div style="border:1px solid #D9770633;background:#D977060d;border-radius:12px;padding:16px 18px;"><p style="margin:0;font-size:11.5px;font-weight:700;text-transform:uppercase;color:#D97706;letter-spacing:0.06em;margin-bottom:6px;">Reason</p><p style="margin:0;font-size:13.5px;color:#111827;">${esc(event.statusNote)}</p></div>` : ''}
        <p style="margin:18px 0 0;font-size:13.5px;line-height:1.7;color:#4B5563;">Questions in the meantime? Reply to this email or contact us and we'll help.</p>
      `;
      break;
    case 'CANCELLED':
      title = 'Your job was cancelled';
      subject = `Job cancelled — ${jobLabel}`;
      bodyHtml = `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${esc(event.customerName)},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4B5563;"><strong>${jobLabel}</strong> has been cancelled.</p>
        ${event.cancellationReason ? `<div style="border:1px solid #DC262633;background:#DC26260d;border-radius:12px;padding:16px 18px;"><p style="margin:0;font-size:13px;color:#4B5563;">${esc(event.cancellationReason)}</p></div>` : ''}
        <p style="margin:18px 0 0;font-size:13.5px;line-height:1.7;color:#4B5563;">If this wasn't expected, reply to this email or contact us and we'll help reschedule.</p>
      `;
      break;
    default:
      return null;
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#F3F4F6;padding:32px 18px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#111827;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.06);">
    <div style="padding:28px 32px;background:${style.accent};">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-bottom:8px;">${style.eyebrow}</div>
      <h1 style="margin:0;font-size:21px;color:#ffffff;">${title}</h1>
    </div>
    <div style="padding:30px 32px;">
      ${bodyHtml}
      <p style="margin:26px 0 0;font-size:12.5px;line-height:1.7;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:16px;">
        Sent by ${esc(companyName)} · Powered by HVACtor.ai
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly templates: TemplatesService,
    private readonly companySettings: CompanySettingsClient,
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

    // NOTE: EN_ROUTE customer email is intentionally NOT sent from here.
    // scheduling-service already triggers the richer EnRouteNotificationService
    // (tech photo, real ETA window) via POST /notifications/en-route — sending
    // a second, plainer email here would double-notify the customer.
    if (event.customerEmail && event.jobStatus !== 'EN_ROUTE') {
      const rendered = jobStatusEmailHtml(event, (await this.companySettings.getSettings(event.companyId)).name || 'HVACtor.ai');
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
          subject: rendered.subject ?? 'Notification from T&S CRM',
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
