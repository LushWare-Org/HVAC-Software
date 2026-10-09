import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { WebPushService } from '../web-push/web-push.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { brandFromSettings, renderEmail, type EmailBrand } from '../email/email-layout';
import type { DirectChannel, DirectNotifyDto } from './direct-notify.dto';

export type ChannelResult = 'sent' | 'no-email' | 'no-device' | 'failed';

/** A message from the company (Kelvin, the office), in the shared email layout. */
export function directEmailHtml(companyName: string, recipientName: string, message: string, brand?: EmailBrand): string {
  return renderEmail({
    brand: brand ?? { name: companyName || 'Your service team' },
    eyebrow: 'Message', title: `A message from ${companyName || 'your service team'}`,
    greeting: recipientName ? `Hi ${recipientName.split(' ')[0]},` : undefined,
    intro: message.split(/\n{2,}/),
  });
}

/**
 * Email and push to one customer or staff member, on the channels asked for.
 * Each channel is independent: a customer with no app still gets the email.
 * The result says what happened on each, so the caller can tell the person.
 */
@Injectable()
export class DirectNotifyService {
  private readonly logger = new Logger(DirectNotifyService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly webPush: WebPushService,
    private readonly crm: CompanySettingsClient,
  ) {}

  async send(companyId: string, dto: DirectNotifyDto, opts: { emailHtml?: string } = {}): Promise<{ name: string; results: Partial<Record<DirectChannel, ChannelResult>> }> {
    const contact = await this.crm.getContact(companyId, dto.to, dto.id);
    if (!contact) throw new NotFoundException(dto.to === 'customer' ? 'Customer not found' : 'Team member not found');
    const results: Partial<Record<DirectChannel, ChannelResult>> = {};
    const customerId = dto.to === 'customer' ? dto.id : undefined;

    if (dto.channels.includes('email')) {
      if (!contact.email) results.email = 'no-email';
      else {
        try {
          const company = await this.crm.getSettings(companyId);
          await this.notifications.sendEmail({
            companyId, customerId, jobId: dto.jobId,
            recipientId: contact.userId ?? dto.id, recipientName: contact.name, recipientEmail: contact.email,
            subject: dto.title, htmlBody: opts.emailHtml ?? directEmailHtml(company.name, contact.name, dto.message, brandFromSettings(company)),
          });
          results.email = 'sent';
        } catch (err) {
          this.logger.warn(`direct email failed: ${(err as Error).message}`);
          results.email = 'failed';
        }
      }
    }

    if (dto.channels.includes('push')) {
      // Phone app (FCM token) and the web portal / dashboard (browser subscriptions): whichever they have.
      let reached = false;
      try {
        if (contact.pushToken && contact.userId) {
          await this.notifications.sendPush({
            companyId, customerId, jobId: dto.jobId,
            recipientId: contact.userId, recipientName: contact.name, pushToken: contact.pushToken,
            title: dto.title, body: dto.message.slice(0, 400),
            data: { type: 'message', ...(dto.jobId ? { jobId: dto.jobId } : {}) },
          });
          reached = true;
        }
        if (contact.userId && (await this.webPush.hasSubscription(contact.userId))) {
          await this.webPush.sendToUser(contact.userId, {
            title: dto.title, body: dto.message.slice(0, 400), url: dto.jobId ? `/jobs?job=${encodeURIComponent(dto.jobId)}` : '/',
          });
          reached = true;
        }
        results.push = reached ? 'sent' : 'no-device';
      } catch (err) {
        this.logger.warn(`direct push failed: ${(err as Error).message}`);
        results.push = reached ? 'sent' : 'failed';
      }
    }

    return { name: contact.name, results };
  }
}
