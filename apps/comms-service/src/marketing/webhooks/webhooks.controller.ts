import {
  Controller, Post, Req, Res, Headers, Body,
  HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createVerify } from 'crypto';
import { SmsService } from '../../sms/sms.service';
import { SuppressionService } from '../suppression/suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { MarketingChannel, SendEventType, SuppressionReason } from '../prisma/generated';

// SendGrid event type → SendEventType map
const SG_EVENT_MAP: Record<string, SendEventType | null> = {
  delivered:   SendEventType.DELIVERED,
  open:        SendEventType.OPENED,
  click:       SendEventType.CLICKED,
  bounce:      SendEventType.BOUNCED,
  deferred:    null,          // not tracked
  dropped:     SendEventType.BOUNCED,
  spamreport:  SendEventType.COMPLAINED,
  unsubscribe: SendEventType.UNSUBSCRIBED,
  group_unsubscribe: SendEventType.UNSUBSCRIBED,
};

@ApiTags('Marketing — Webhooks')
@Controller('m/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly sgPublicKey = process.env.SENDGRID_WEBHOOK_SIGNING_SECRET ?? '';
  private readonly twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? '';

  constructor(
    private readonly smsService: SmsService,
    private readonly suppressionService: SuppressionService,
    private readonly prisma: MarketingPrismaService,
  ) {}

  // ── SendGrid Event Webhook ────────────────────────────────────────────────

  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SendGrid event webhook receiver' })
  async sendgrid(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestamp: string,
    @Body() body: Buffer,
  ): Promise<void> {
    const rawBody = Buffer.isBuffer(body) ? body.toString('utf8') : JSON.stringify(body);

    if (this.sgPublicKey && !this.verifySendGridSignature(rawBody, timestamp, signature)) {
      this.logger.warn('Invalid SendGrid webhook signature');
      res.status(HttpStatus.FORBIDDEN).json({ error: 'Invalid signature' });
      return;
    }

    let events: Array<Record<string, unknown>>;
    try {
      events = JSON.parse(rawBody);
    } catch {
      res.status(HttpStatus.OK).json({ ok: true }); // always ack
      return;
    }

    for (const event of events) {
      try {
        await this.handleSendGridEvent(event);
      } catch (err) {
        this.logger.warn(`Failed to process SendGrid event: ${(err as Error).message}`);
      }
    }

    res.status(HttpStatus.OK).json({ ok: true });
  }

  private async handleSendGridEvent(event: Record<string, unknown>): Promise<void> {
    const eventType = event['event'] as string;
    const messageId  = event['sg_message_id'] as string | undefined;
    const email      = event['email'] as string | undefined;
    const url        = event['url'] as string | undefined;
    const companyId  = event['companyId'] as string | undefined; // custom arg we embed on send

    const mappedType = SG_EVENT_MAP[eventType];
    if (!mappedType) return;

    // Find the SendJob by externalId (sg_message_id)
    const sendJob = messageId
      ? await this.prisma.sendJob.findFirst({ where: { externalId: { startsWith: messageId.split('.')[0] } }, select: { id: true, companyId: true } })
      : null;

    if (sendJob) {
      await this.prisma.sendEvent.create({
        data: { sendJobId: sendJob.id, eventType: mappedType, urlClicked: url ?? null },
      });
    }

    // Unsubscribe + spam → add to suppression list
    if ((mappedType === SendEventType.UNSUBSCRIBED || mappedType === SendEventType.COMPLAINED) && email) {
      const cId = sendJob?.companyId ?? companyId;
      if (cId) {
        const reason = mappedType === SendEventType.COMPLAINED ? SuppressionReason.COMPLAINED : SuppressionReason.UNSUBSCRIBED;
        await this.suppressionService.addSuppression(cId, MarketingChannel.EMAIL, email, reason);
      }
    }

    // Bounce → suppress
    if (mappedType === SendEventType.BOUNCED && email) {
      const cId = sendJob?.companyId ?? companyId;
      if (cId) {
        await this.suppressionService.addSuppression(cId, MarketingChannel.EMAIL, email, SuppressionReason.BOUNCED);
      }
    }
  }

  private verifySendGridSignature(rawBody: string, timestamp: string, signature: string): boolean {
    if (!timestamp || !signature) return false;
    try {
      const verify = createVerify('SHA256');
      verify.update(timestamp + rawBody);
      // SendGrid sends ECDSA IEEE P1363 format signature
      return verify.verify(
        { key: this.sgPublicKey, format: 'pem', dsaEncoding: 'ieee-p1363' } as Parameters<typeof verify.verify>[0],
        Buffer.from(signature, 'base64'),
      );
    } catch {
      return false;
    }
  }

  // ── Twilio Status + Inbound Webhook ───────────────────────────────────────

  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twilio status callback + inbound SMS receiver' })
  async twilio(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature: string,
    @Body() body: Record<string, string>,
  ): Promise<void> {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    if (this.twilioAuthToken && !this.smsService.validateWebhookSignature(url, body, signature)) {
      this.logger.warn('Invalid Twilio webhook signature on /m/webhooks/twilio');
      res.status(HttpStatus.FORBIDDEN).type('text/xml').send('<Response/>');
      return;
    }

    try {
      await this.handleTwilioPayload(body);
    } catch (err) {
      this.logger.warn(`Twilio webhook processing error: ${(err as Error).message}`);
    }

    // Always respond with empty TwiML
    res.status(HttpStatus.OK).type('text/xml').send('<Response/>');
  }

  private async handleTwilioPayload(body: Record<string, string>): Promise<void> {
    const messageSid  = body['MessageSid'];
    const messageBody = body['Body']?.trim().toUpperCase();
    const fromPhone   = body['From'];
    const status      = body['MessageStatus'];

    // Status callback (no Body) — update SendEvent
    if (messageSid && !messageBody && status) {
      const statusMap: Record<string, SendEventType | null> = {
        delivered: SendEventType.DELIVERED,
        failed:    SendEventType.BOUNCED,
        undelivered: SendEventType.BOUNCED,
        sent:      null,
        queued:    null,
      };
      const mappedType = statusMap[status];
      if (mappedType) {
        const sendJob = await this.prisma.sendJob.findFirst({
          where: { externalId: messageSid },
          select: { id: true },
        });
        if (sendJob) {
          await this.prisma.sendEvent.create({
            data: { sendJobId: sendJob.id, eventType: mappedType },
          });
        }
      }
      return;
    }

    // Inbound STOP keyword → suppress
    if (fromPhone && messageBody === 'STOP') {
      // Find the most recent outbound SendJob to this number to get companyId
      const lastJob = await this.prisma.sendJob.findFirst({
        where: { address: fromPhone, channel: MarketingChannel.SMS },
        orderBy: { createdAt: 'desc' },
        select: { companyId: true },
      });
      if (lastJob) {
        await this.suppressionService.addSuppression(
          lastJob.companyId,
          MarketingChannel.SMS,
          fromPhone,
          SuppressionReason.UNSUBSCRIBED,
        );
        this.logger.log(`STOP received from ${fromPhone} — added to suppression list`);
      }
    }
  }
}
