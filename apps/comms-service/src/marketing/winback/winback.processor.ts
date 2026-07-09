import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../email/email.service';
import { SmsService } from '../../sms/sms.service';
import { SuppressionService } from '../suppression/suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { signMarketingToken } from '../common/marketing-token.util';
import { step2EmailSubject, step2EmailBody, step3Sms } from './winback-templates';

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';
const OFFER_TEXT = process.env.WINBACK_OFFER_TEXT ?? '15% off your next service';

export interface WinbackEmailPayload {
  type: 'winback-email';
  sendJobId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  to: string;
  step: 2;
}

export interface WinbackSmsPayload {
  type: 'winback-sms';
  sendJobId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  phone: string;
  step: 3;
}

/**
 * Handles delayed win-back step-2 (email) and step-3 (SMS) jobs.
 * This is a plain service — job dispatch happens in MarketingSendWorker.process().
 */
@Injectable()
export class WinbackProcessor {
  private readonly logger = new Logger(WinbackProcessor.name);

  constructor(
    private readonly email: EmailService,
    private readonly sms: SmsService,
    private readonly suppression: SuppressionService,
    private readonly db: MarketingPrismaService,
  ) {}

  async processEmail(data: WinbackEmailPayload): Promise<void> {
    const { sendJobId, companyId, customerId, customerName, to } = data;

    const suppressed = await this.suppression.isSuppressed(companyId, 'EMAIL', to);
    if (suppressed) {
      await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'SKIPPED' } });
      return;
    }

    const token = signMarketingToken({ type: 'review-click', companyId, customerId, jobId: 'winback-s2' });
    const unsubToken = signMarketingToken({ type: 'unsub', companyId, customerId, channel: 'EMAIL', address: to });
    const trackedLink = `${CLICK_BASE}/m/r/${token}?dest=${encodeURIComponent(CLICK_BASE + '/book')}`;
    const unsubLink = `${CLICK_BASE}/m/u/${unsubToken}`;
    const vars = { customerName, companyName: 'T&S Services', trackedLink, unsubLink, offerText: OFFER_TEXT };

    const result = await this.email.send({
      to,
      subject: step2EmailSubject(vars),
      htmlBody: step2EmailBody(vars),
    });

    if (!result.success) {
      await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'FAILED', error: result.error } });
      throw new Error(`Win-back email failed: ${result.error}`);
    }

    await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'SENT', sentAt: new Date(), externalId: result.externalId } });
    this.logger.log(`Win-back step-2 email delivered to ${to}`);
  }

  async processSms(data: WinbackSmsPayload): Promise<void> {
    const { sendJobId, companyId, customerId, customerName, phone } = data;

    const suppressed = await this.suppression.isSuppressed(companyId, 'SMS', phone);
    if (suppressed) {
      await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'SKIPPED' } });
      return;
    }

    const token = signMarketingToken({ type: 'review-click', companyId, customerId, jobId: 'winback-s3' });
    const trackedLink = `${CLICK_BASE}/m/r/${token}?dest=${encodeURIComponent(CLICK_BASE + '/book')}`;
    const body = step3Sms({ customerName, companyName: 'T&S Services', trackedLink, unsubLink: '', offerText: OFFER_TEXT });

    const result = await this.sms.send(phone, body, companyId);
    if (!result.success) {
      await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'FAILED', error: result.error } });
      throw new Error(`Win-back SMS failed: ${result.error}`);
    }

    await this.db.sendJob.update({ where: { id: sendJobId }, data: { status: 'SENT', sentAt: new Date(), externalId: result.externalId } });
    this.logger.log(`Win-back step-3 SMS delivered to ${phone}`);
  }

}
