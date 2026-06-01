import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { SmsService } from '../../sms/sms.service';
import { EmailService } from '../../email/email.service';
import { SuppressionService } from '../suppression/suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { MarketingChannel, SendJobStatus, SendEventType } from '../prisma/generated';
import { canSendNow, nextSendableTime } from './quiet-hours.util';
import { signMarketingToken } from '../common/marketing-token.util';
import { WinbackProcessor, WinbackEmailPayload, WinbackSmsPayload } from '../winback/winback.processor'
import { AutomationEmailPayload } from '../automation/equipment-automation.processor';

export interface MarketingSendPayload {
  sendJobId: string;
  companyId: string;
  channel: MarketingChannel;
  address: string;
  renderedBody: string;
  subject?: string;
  zipCode?: string | null;
  stateCode?: string | null;
}

export interface ReviewEmailPayload {
  type: 'review-email';
  reviewRequestId: string;
  companyId: string;
  customerId: string;
  jobId: string;
  customerName: string;
  customerEmail: string;
  reviewLink?: string;
}

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';

@Processor(QueueName.MARKETING_SEND)
export class MarketingSendWorker extends WorkerHost {
  private readonly logger = new Logger(MarketingSendWorker.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly suppressionService: SuppressionService,
    private readonly prisma: MarketingPrismaService,
    private readonly winback: WinbackProcessor,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'review-email') return this.processReviewEmail(job.data as ReviewEmailPayload);
    if (job.name === 'winback-email') return this.winback.processEmail(job.data as WinbackEmailPayload);
    if (job.name === 'winback-sms') return this.winback.processSms(job.data as WinbackSmsPayload);
    if (job.name === 'automation-email') return this.processAutomationEmail(job.data as AutomationEmailPayload);
    return this.processMarketingSend(job.data as MarketingSendPayload);
  }

  // ── Campaign / automation send ──────────────────────────────────────────────

  private async isGloballyEnabled(companyId: string): Promise<boolean> {
    const settings = await this.prisma.marketingSettings.findUnique({ where: { companyId } });
    return settings?.globalEnabled ?? true; // fail-open if no settings row yet
  }

  private async isWithinFrequencyCap(companyId: string, sendJobId: string): Promise<boolean> {
    const [settings, job] = await Promise.all([
      this.prisma.marketingSettings.findUnique({ where: { companyId } }),
      this.prisma.sendJob.findUnique({ where: { id: sendJobId }, select: { customerId: true } }),
    ]);
    if (!settings || !job?.customerId) return true; // fail-open
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const [dayCount, weekCount] = await Promise.all([
      this.prisma.sendJob.count({ where: { companyId, customerId: job.customerId, status: 'SENT', sentAt: { gte: dayAgo } } }),
      this.prisma.sendJob.count({ where: { companyId, customerId: job.customerId, status: 'SENT', sentAt: { gte: weekAgo } } }),
    ]);
    if (dayCount >= settings.frequencyCapPerDay) return false;
    if (weekCount >= settings.frequencyCapPerWeek) return false;
    return true;
  }

  private async processMarketingSend(data: MarketingSendPayload): Promise<void> {
    const { sendJobId, companyId, channel, address, renderedBody, subject, zipCode, stateCode } = data;

    // Sprint 6: global toggle + frequency cap
    if (!await this.isGloballyEnabled(companyId)) {
      this.logger.log(`Send job ${sendJobId} skipped — marketing is globally disabled for company ${companyId}`);
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.SKIPPED } });
      return;
    }
    if (!await this.isWithinFrequencyCap(companyId, sendJobId)) {
      this.logger.log(`Send job ${sendJobId} skipped — frequency cap exceeded for company ${companyId}`);
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.SKIPPED } });
      return;
    }

    const suppressed = await this.suppressionService.isSuppressed(companyId, channel, address);
    if (suppressed) {
      this.logger.log(`Send job ${sendJobId} skipped — ${address} is suppressed`);
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.SKIPPED } });
      return;
    }

    if (channel === MarketingChannel.SMS && !canSendNow(zipCode, stateCode)) {
      const sendAt = nextSendableTime(zipCode, stateCode);
      const delayMs = sendAt.toMillis() - Date.now();
      this.logger.log(`Send job ${sendJobId} outside quiet hours — rescheduling to ${sendAt.toISO()}`);
      // moveToDelayed is not available on WorkerHost job directly; throw to trigger BullMQ delay via backoff
      await this.prisma.sendJob.update({
        where: { id: sendJobId },
        data: { status: SendJobStatus.SCHEDULED, scheduledAt: sendAt.toJSDate() },
      });
      throw Object.assign(new Error('QUIET_HOURS'), { delay: delayMs });
    }

    let externalId: string | undefined;
    let sendError: string | undefined;

    if (channel === MarketingChannel.SMS) {
      const result = await this.smsService.send(address, renderedBody);
      externalId = result.externalId;
      if (!result.success) sendError = result.error;
    } else {
      // Unsubscribe token so recipients can opt out (also required by Gmail bulk-sender rules)
      const unsubToken = signMarketingToken({ type: 'unsub', companyId, customerId: sendJobId, channel: 'EMAIL', address });
      const unsubUrl = `${CLICK_BASE}/m/u/${unsubToken}`;

      const result = await this.emailService.send({
        to: address,
        subject: subject ?? 'A message from us',
        htmlBody: renderedBody,
        headers: {
          // Required by Gmail for bulk senders since Feb 2024 — without this Gmail silently discards the email
          'List-Unsubscribe': `<${unsubUrl}>, <mailto:${this.emailService.senderEmail}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Precedence': 'bulk',
          'X-Campaign-Id': sendJobId,
        },
      });
      externalId = result.externalId;
      if (!result.success) sendError = result.error;
    }

    if (sendError) {
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.FAILED, error: sendError } });
      await this.prisma.sendEvent.create({ data: { sendJobId, eventType: SendEventType.BOUNCED } });
      throw new Error(`Marketing send failed: ${sendError}`);
    }

    await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.SENT, sentAt: new Date(), externalId } });
    await this.prisma.sendEvent.create({ data: { sendJobId, eventType: SendEventType.DELIVERED } });
    this.logger.log(`Send job ${sendJobId} delivered via ${channel} to ${address}`);
  }

  // ── Equipment automation email ─────────────────────────────────────────────
  // These arrive on MARKETING_SEND queue with payload shape { to, subject, htmlBody }
  // (not { address, renderedBody }) — handle separately to avoid undefined crashes.

  private async processAutomationEmail(data: AutomationEmailPayload): Promise<void> {
    const { sendJobId, companyId, to, subject, htmlBody } = data;

    const suppressed = await this.suppressionService.isSuppressed(companyId, 'EMAIL', to);
    if (suppressed) {
      this.logger.log(`Automation email ${sendJobId} skipped — ${to} is suppressed`);
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.SKIPPED } });
      return;
    }

    const result = await this.emailService.send({ to, subject, htmlBody });

    if (!result.success) {
      await this.prisma.sendJob.update({ where: { id: sendJobId }, data: { status: SendJobStatus.FAILED, error: result.error } });
      throw new Error(`Automation email failed: ${result.error}`);
    }

    await this.prisma.sendJob.update({
      where: { id: sendJobId },
      data: { status: SendJobStatus.SENT, sentAt: new Date(), externalId: result.externalId },
    });
    this.logger.log(`Automation email delivered: ${sendJobId}`);
  }

  // ── Review request email (day-3 delayed) ───────────────────────────────────

  private async processReviewEmail(data: ReviewEmailPayload): Promise<void> {
    const { reviewRequestId, companyId, customerId, jobId, customerName, customerEmail, reviewLink } = data;

    const suppressed = await this.suppressionService.isSuppressed(companyId, 'EMAIL', customerEmail);
    if (suppressed) {
      this.logger.log(`Review email ${reviewRequestId} skipped — ${customerEmail} is suppressed`);
      return;
    }

    const token = signMarketingToken({ type: 'review-click', companyId, customerId, jobId });
    const destination = reviewLink ?? `${CLICK_BASE}/review`;
    const trackedLink = `${CLICK_BASE}/m/r/${token}?dest=${encodeURIComponent(destination)}`;
    const unsubToken = signMarketingToken({ type: 'unsub', companyId, customerId, channel: 'EMAIL', address: customerEmail });
    const unsubLink = `${CLICK_BASE}/m/u/${unsubToken}`;

    const htmlBody = buildReviewEmailHtml(customerName, trackedLink, unsubLink);

    const result = await this.emailService.send({
      to: customerEmail,
      subject: `How was your service, ${customerName}?`,
      htmlBody,
    });

    if (!result.success) {
      this.logger.error(`Review email ${reviewRequestId} failed: ${result.error}`);
      throw new Error(`Review email failed: ${result.error}`);
    }

    await this.prisma.reviewRequest.update({
      where: { id: reviewRequestId },
      data: { emailAt: new Date() },
    });

    this.logger.log(`Review email delivered for request ${reviewRequestId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Marketing job ${job.name}/${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`);
  }
}

// ── Email template ────────────────────────────────────────────────────────────

function buildReviewEmailHtml(name: string, reviewLink: string, unsubLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px">
      <tr><td style="background:#1a73e8;padding:32px 40px">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">T&amp;S Services</h1>
      </td></tr>
      <tr><td style="padding:40px">
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px">How was your service, ${name}?</h2>
        <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
          We hope everything went smoothly. Your feedback means a lot to us and helps other homeowners find quality service.
        </p>
        <a href="${reviewLink}" style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600">
          Leave a Review ★
        </a>
        <p style="margin:32px 0 0;color:#999;font-size:12px">
          Thank you for your business.<br>
          <a href="${unsubLink}" style="color:#999">Unsubscribe</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
