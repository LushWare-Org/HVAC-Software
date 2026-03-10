/**
 * SmsService — Twilio SMS delivery
 *
 * Responsibilities:
 *  - Send single SMS via Twilio REST API
 *  - Validate Twilio webhook signatures (for inbound messages)
 *  - Return structured delivery result for the BullMQ processor to log
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

export interface SmsDeliveryResult {
  success: boolean;
  externalId?: string;   // Twilio MessageSid
  error?: string;
  durationMs: number;
}

export interface InboundSmsPayload {
  From: string;          // Twilio passes E.164 phone number
  To: string;
  Body: string;
  MessageSid: string;
  NumMedia?: string;
  MediaUrl0?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: twilio.Twilio;
  private readonly fromPhone: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('twilio.accountSid') ?? '';
    const authToken = this.config.get<string>('twilio.authToken') ?? '';
    this.fromPhone = this.config.get<string>('twilio.fromPhone') ?? '';
    this.webhookSecret = this.config.get<string>('twilio.webhookSecret') ?? '';

    // In test environments don't require real credentials
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not set — SMS will be mocked in non-prod');
      this.client = null as any;
    }
  }

  async send(to: string, body: string): Promise<SmsDeliveryResult> {
    const start = Date.now();
    try {
      if (!this.client) {
        this.logger.debug(`[MOCK SMS] To: ${to} | Body: ${body.substring(0, 50)}`);
        return { success: true, externalId: `mock-sid-${Date.now()}`, durationMs: 0 };
      }

      const message = await this.client.messages.create({
        to,
        from: this.fromPhone,
        body,
      });

      this.logger.log(`SMS sent to ${to} — SID: ${message.sid}`);
      return {
        success: true,
        externalId: message.sid,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(`SMS send failed to ${to}: ${error}`);
      return { success: false, error, durationMs: Date.now() - start };
    }
  }

  /**
   * Validate that an incoming webhook request is genuinely from Twilio.
   * Should be called before processing any inbound SMS.
   */
  validateWebhookSignature(url: string, params: Record<string, string>, signature: string): boolean {
    if (!this.client) return true; // trust all in dev/test
    return twilio.validateRequest(
      this.config.get<string>('twilio.authToken') ?? '',
      signature,
      url,
      params,
    );
  }
}
