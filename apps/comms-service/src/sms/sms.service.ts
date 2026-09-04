/**
 * SmsService — Twilio SMS delivery
 *
 * Responsibilities:
 *  - Send single SMS via Twilio REST API
 *  - Validate Twilio webhook signatures (for inbound messages)
 *  - Return structured delivery result for the BullMQ processor to log
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isFeatureEnabled } from '@tscrm/types';
import twilio from 'twilio';
import { CompanySettingsClient } from '../company-settings/company-settings.client';

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

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly companySettings?: CompanySettingsClient,
  ) {
    const accountSid = this.config.get<string>('twilio.accountSid') ?? '';
    const authToken = this.config.get<string>('twilio.authToken') ?? '';
    this.fromPhone = this.config.get<string>('twilio.fromPhone') ?? '';
    this.webhookSecret = this.config.get<string>('twilio.webhookSecret') ?? '';

    const credentialsLookReal =
      /^AC[0-9a-f]{32}$/i.test(accountSid) && authToken.length >= 20;

    if (credentialsLookReal) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.client = null as any;
      if (this.isProduction) {
        this.logger.error(
          'Twilio is not configured — SMS sending is DISABLED and every send will fail. ' +
            'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER.',
        );
      } else {
        this.logger.warn('Twilio not configured — SMS is mocked in this environment');
      }
    }
  }

  private get isProduction(): boolean {
    return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
  }

  async send(to: string, body: string, companyId?: string): Promise<SmsDeliveryResult> {
    const start = Date.now();
    try {
      if (companyId && this.companySettings) {
        const settings = await this.companySettings.getSettings(companyId);
        if (!isFeatureEnabled(settings.features, 'sms')) {
          this.logger.log(`[sms-disabled] companyId=${companyId} skipped sms to=${to}`);
          return { success: false, error: 'sms-disabled', durationMs: 0 };
        }
      }

      if (!this.client) {
        // Never report success for a message that was not sent.
        if (this.isProduction) {
          this.logger.error(`SMS to ${to} not sent — Twilio is not configured`);
          return {
            success: false,
            error: 'sms-not-configured',
            durationMs: Date.now() - start,
          };
        }
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
