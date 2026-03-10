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

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly templates: TemplatesService,
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
