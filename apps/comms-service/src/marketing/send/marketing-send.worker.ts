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
import { WinbackProcessor, WinbackEmailPayload, WinbackSmsPayload } from '../winback/winback.processor';

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
    return this.processMarketingSend(job.data as MarketingSendPayload);
  }

  // ── Campaign / automation send ──────────────────────────────────────────────

  private async processMarketingSend(data: MarketingSendPayload): Promise<void> {
    const { sendJobId, companyId, channel, address, renderedBody, subject, zipCode, stateCode } = data;

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
      const result = await this.emailService.send({ to: address, subject: subject ?? 'A message from us', htmlBody: renderedBody });
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
