import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { SuppressionService } from '../suppression/suppression.service';
import { SmsService } from '../../sms/sms.service';
import { EmailService } from '../../email/email.service';
import { CrmClient, EquipmentWithCustomer } from './crm.client';
import { signMarketingToken } from '../common/marketing-token.util';
import { EQUIPMENT_TEMPLATES, AutomationTemplateKey, TemplateVars } from './equipment-templates';

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';

// How many days after install each template triggers
const TUNE_UP_DAYS = 183;        // ~6 months
const REPLACEMENT_DAYS = 2555;   // ~7 years
const WARRANTY_WARN_DAYS = 30;   // 30 days before expiry

interface ScanResult {
  companyId: string;
  equipmentId: string;
  customerId: string;
  templateKey: AutomationTemplateKey;
  smsSent: boolean;
  emailQueued: boolean;
  skipped: boolean;
  reason?: string;
}

@Injectable()
export class EquipmentAutomationService {
  private readonly logger = new Logger(EquipmentAutomationService.name);

  constructor(
    private readonly db: MarketingPrismaService,
    private readonly suppression: SuppressionService,
    private readonly sms: SmsService,
    private readonly email: EmailService,
    private readonly crmClient: CrmClient,
    @InjectQueue(QueueName.MARKETING_SEND) private readonly sendQueue: Queue,
  ) {}

  /**
   * Main entry point called by the daily cron job.
   * Scans all equipment for a company and fires any due automations.
   */
  async scanCompany(companyId: string): Promise<ScanResult[]> {
    const equipment = await this.crmClient.getEquipmentForAutomation(companyId);
    this.logger.log(`Equipment scan: ${equipment.length} records for company ${companyId}`);

    const results: ScanResult[] = [];
    for (const eq of equipment) {
      const triggered = await this.evaluateEquipment(eq);
      if (triggered) results.push(triggered);
    }
    return results;
  }

  // ── Decide which template (if any) fires for this equipment record ──────────

  async evaluateEquipment(eq: EquipmentWithCustomer): Promise<ScanResult | null> {
    const today = new Date();

    // Skip inactive customers
    if (!eq.customer.isActive) return null;

    const templateKey = this.resolveTemplate(eq, today);
    if (!templateKey) return null;

    // Idempotency: check if we already sent this automation for this equipment in the last 90 days
    const alreadySent = await this.wasRecentlySent(eq.id, templateKey, 90);
    if (alreadySent) return null;

    return this.dispatchAutomation(eq, templateKey, today);
  }

  // ── Template resolution logic ────────────────────────────────────────────────

  private resolveTemplate(eq: EquipmentWithCustomer, today: Date): AutomationTemplateKey | null {
    // Warranty expiry check (highest priority — time-bound)
    if (eq.warrantyEnd) {
      const warrantyEnd = new Date(eq.warrantyEnd);
      const daysUntilExpiry = Math.floor((warrantyEnd.getTime() - today.getTime()) / 86_400_000);
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= WARRANTY_WARN_DAYS) {
        return 'warranty-expiry-30d';
      }
    }

    if (!eq.installDate) return null;
    const installDate = new Date(eq.installDate);
    const daysSinceInstall = Math.floor((today.getTime() - installDate.getTime()) / 86_400_000);

    // 7-year replacement pitch (check before 6-month tune-up to avoid redundant tune-up sends)
    if (daysSinceInstall >= REPLACEMENT_DAYS && daysSinceInstall < REPLACEMENT_DAYS + 30) {
      return 'hvac-replacement-7yr';
    }

    // 6-month tune-up — fires at 6mo and then every 6mo thereafter (183, 366, 549 … days)
    if (daysSinceInstall >= TUNE_UP_DAYS) {
      const periodIndex = Math.floor(daysSinceInstall / TUNE_UP_DAYS);
      const periodStart = periodIndex * TUNE_UP_DAYS;
      const inWindow = daysSinceInstall - periodStart < 7; // 7-day trigger window per period
      if (inWindow) return 'hvac-tune-up-6mo';
    }

    return null;
  }

  // ── Idempotency: SendJob record acts as a sent-log ──────────────────────────

  private async wasRecentlySent(equipmentId: string, templateKey: string, withinDays: number): Promise<boolean> {
    const since = new Date(Date.now() - withinDays * 86_400_000);
    const count = await this.db.sendJob.count({
      where: {
        automationTemplate: `${templateKey}:${equipmentId}`,
        createdAt: { gte: since },
      },
    });
    return count > 0;
  }

  // ── Dispatch: create SendJob rows + fire SMS immediately + queue email ───────

  private async dispatchAutomation(
    eq: EquipmentWithCustomer,
    templateKey: AutomationTemplateKey,
    today: Date,
  ): Promise<ScanResult> {
    const { customer } = eq;
    const template = EQUIPMENT_TEMPLATES[templateKey];
    const dedupKey = `${templateKey}:${eq.id}`;

    const customerName = `${customer.firstName} ${customer.lastName}`;
    const brand = eq.brand ?? 'your';
    const warrantyEndDate = eq.warrantyEnd
      ? new Date(eq.warrantyEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : undefined;

    const result: ScanResult = {
      companyId: eq.companyId,
      equipmentId: eq.id,
      customerId: customer.id,
      templateKey,
      smsSent: false,
      emailQueued: false,
      skipped: false,
    };

    // SMS
    const phone = customer.mobile ?? customer.phone;
    if (phone && (template.channel === 'SMS' || template.channel === 'BOTH')) {
      const smsSuppressed = await this.suppression.isSuppressed(eq.companyId, 'SMS', phone);
      if (!smsSuppressed) {
        const smsToken = signMarketingToken({ type: 'review-click', companyId: eq.companyId, customerId: customer.id, jobId: eq.id });
        const trackedLink = `${CLICK_BASE}/m/r/${smsToken}?dest=${encodeURIComponent(CLICK_BASE + '/book')}`;
        const vars: TemplateVars = { customerName, equipmentType: eq.type, brand, trackedLink, unsubLink: '', warrantyEndDate };
        const body = template.smsBody(vars);

        try {
          // Create SendJob record for idempotency tracking
          const smsJob = await this.db.sendJob.create({
            data: {
              companyId: eq.companyId,
              customerId: customer.id,
              channel: 'SMS',
              address: phone,
              automationTemplate: dedupKey,
            },
          });
          await this.sms.send(phone, body);
          await this.db.sendJob.update({ where: { id: smsJob.id }, data: { status: 'SENT', sentAt: new Date() } });
          result.smsSent = true;
        } catch (err) {
          this.logger.error(`Equipment automation SMS failed for ${eq.id}: ${(err as Error).message}`);
        }
      }
    }

    // Email — via BullMQ so it respects quiet hours + retries
    const emailAddr = customer.email;
    if (emailAddr && (template.channel === 'EMAIL' || template.channel === 'BOTH')) {
      const emailSuppressed = await this.suppression.isSuppressed(eq.companyId, 'EMAIL', emailAddr);
      if (!emailSuppressed) {
        const emailToken = signMarketingToken({ type: 'review-click', companyId: eq.companyId, customerId: customer.id, jobId: eq.id });
        const unsubToken = signMarketingToken({ type: 'unsub', companyId: eq.companyId, customerId: customer.id, channel: 'EMAIL', address: emailAddr });
        const trackedLink = `${CLICK_BASE}/m/r/${emailToken}?dest=${encodeURIComponent(CLICK_BASE + '/book')}`;
        const unsubLink = `${CLICK_BASE}/m/u/${unsubToken}`;
        const vars: TemplateVars = { customerName, equipmentType: eq.type, brand, trackedLink, unsubLink, warrantyEndDate };

        const emailJob = await this.db.sendJob.create({
          data: {
            companyId: eq.companyId,
            customerId: customer.id,
            channel: 'EMAIL',
            address: emailAddr,
            automationTemplate: dedupKey,
          },
        });

        await this.sendQueue.add(
          'automation-email',
          {
            type: 'automation-email',
            sendJobId: emailJob.id,
            companyId: eq.companyId,
            to: emailAddr,
            subject: template.emailSubject(vars),
            htmlBody: template.emailBody(vars),
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
        );

        result.emailQueued = true;
      }
    }

    if (!result.smsSent && !result.emailQueued) {
      result.skipped = true;
      result.reason = 'no_reachable_address';
    }

    this.logger.log(
      `Equipment automation [${templateKey}] eq=${eq.id} sms=${result.smsSent} email=${result.emailQueued}`,
    );
    return result;
  }
}
