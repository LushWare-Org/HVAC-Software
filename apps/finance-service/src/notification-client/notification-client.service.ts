import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

export interface EmailAttachmentPayload {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export interface SendEmailPayload {
  companyId: string;
  recipientId: string;
  recipientName?: string;
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  customerId?: string;
  quoteId?: string;
  invoiceId?: string;
  attachments?: EmailAttachmentPayload[];
}

@Injectable()
export class NotificationClientService {
  private readonly logger = new Logger(NotificationClientService.name);
  private readonly commsBaseUrl: string;
  private readonly jwtSecret: string;

  constructor(private readonly httpService: HttpService) {
    this.commsBaseUrl = process.env.COMMS_SERVICE_URL ?? 'http://localhost:3005';
    this.jwtSecret = process.env.JWT_SECRET ?? '';
  }

  private getServiceToken(companyId: string): string {
    if (!this.jwtSecret) return '';
    return jwt.sign(
      {
        sub: 'service-finance',
        email: 'system@tsbrothers.com',
        company_id: companyId,
        role: 'super_admin',
        name: 'Finance Service',
        iss: 'tscrm-local',
      },
      this.jwtSecret,
      { algorithm: 'HS256', expiresIn: '1h' },
    );
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    try {
      const token = this.getServiceToken(payload.companyId);
      await firstValueFrom(
        this.httpService.post(`${this.commsBaseUrl}/notifications/email`, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 10_000,
        }),
      );
      this.logger.log(`Email queued to ${payload.recipientEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to queue email to ${payload.recipientEmail}: ${(err as Error).message}`);
      throw err;
    }
  }
}
