/**
 * NotificationsService
 * Central orchestrator: enqueues delivery jobs into BullMQ and reads back
 * the delivery log from MongoDB.
 *
 * Actual sending happens in the three processors:
 *  - SmsProcessor  (@tscrm/queue QueueName.SEND_SMS)
 *  - EmailProcessor (@tscrm/queue QueueName.SEND_EMAIL)
 *  - PushProcessor (@tscrm/queue QueueName.SEND_PUSH)
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthUser, clampPagination } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, DeliveryStatus } from '../prisma/generated';
import { QueueName } from '@tscrm/queue';
import { EmailService } from '../email/email.service';
import { isFeatureEnabled } from '@tscrm/types';
import { CompanySettingsClient } from '../company-settings/company-settings.client';

// ── Job payload types (shared with processors) ─────────────────────────────

export interface SmsJobPayload {
  notificationId: string;
  companyId: string;
  to: string;
  body: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export interface EmailJobPayload {
  notificationId: string;
  companyId: string;
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
}

export interface PushJobPayload {
  notificationId: string;
  companyId: string;
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ── Send request types ─────────────────────────────────────────────────────

export interface SendSmsRequest {
  companyId: string;
  customerId?: string;
  jobId?: string;
  invoiceId?: string;
  recipientId: string;
  recipientName?: string;
  recipientPhone: string;
  body: string;
  scheduledAt?: Date;
}

export interface SendEmailRequest {
  companyId: string;
  customerId?: string;
  jobId?: string;
  invoiceId?: string;
  quoteId?: string;
  recipientId: string;
  recipientName?: string;
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  attachments?: EmailAttachment[];
  scheduledAt?: Date;
}

export interface SendPushRequest {
  companyId: string;
  customerId?: string;
  jobId?: string;
  recipientId: string;
  recipientName?: string;
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  scheduledAt?: Date;
}

export interface InAppRecipient {
  recipientId: string;
  recipientName?: string;
  customerId?: string;
  role?: string;
}

export interface SendInAppRequest {
  companyId: string;
  sender: AuthUser;
  title: string;
  body: string;
  type?: string;
  roles?: string[];
  recipients: InAppRecipient[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly companySettings: CompanySettingsClient,
    @InjectQueue(QueueName.SEND_SMS) private readonly smsQueue: Queue,
    @InjectQueue(QueueName.SEND_EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QueueName.SEND_PUSH) private readonly pushQueue: Queue,
  ) {}

  // ── SMS ───────────────────────────────────────────────────────────────────

  async sendSms(req: SendSmsRequest) {
    const settings = await this.companySettings.getSettings(req.companyId);
    if (!isFeatureEnabled(settings.features, 'sms')) {
      this.logger.log(`[sms-disabled] companyId=${req.companyId} skipped sms to=${req.recipientPhone}`);
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        companyId: req.companyId,
        customerId: req.customerId,
        jobId: req.jobId,
        invoiceId: req.invoiceId,
        recipientId: req.recipientId,
        recipientName: req.recipientName,
        recipientPhone: req.recipientPhone,
        channel: Channel.SMS,
        body: req.body,
        status: DeliveryStatus.QUEUED,
        scheduledAt: req.scheduledAt,
      },
    });

    const delay = req.scheduledAt
      ? Math.max(0, req.scheduledAt.getTime() - Date.now())
      : 0;

    const payload: SmsJobPayload = {
      notificationId: notification.id,
      companyId: req.companyId,
      to: req.recipientPhone,
      body: req.body,
    };

    await this.smsQueue.add('send-sms', payload, { delay });
    this.logger.log(`SMS queued for ${req.recipientPhone}`);
    return notification;
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  async sendEmail(req: SendEmailRequest) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId: req.companyId,
        customerId: req.customerId,
        jobId: req.jobId,
        invoiceId: req.invoiceId,
        quoteId: req.quoteId,
        recipientId: req.recipientId,
        recipientName: req.recipientName,
        recipientEmail: req.recipientEmail,
        channel: Channel.EMAIL,
        subject: req.subject,
        body: req.htmlBody,
        status: DeliveryStatus.QUEUED,
        scheduledAt: req.scheduledAt,
      },
    });

    // For immediate send requests, deliver now and return real outcome.
    // Keep queue path only for scheduled emails.
    if (!req.scheduledAt) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: DeliveryStatus.SENT, sentAt: new Date() },
      });

      const result = await this.emailService.send({
        to: req.recipientEmail,
        toName: req.recipientName,
        subject: req.subject,
        htmlBody: req.htmlBody,
        attachments: req.attachments,
      });

      if (result.success) {
        const delivered = await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: DeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
            externalId: result.externalId,
          },
        });

        await this.prisma.deliveryLog.create({
          data: {
            companyId: req.companyId,
            notificationId: notification.id,
            channel: Channel.EMAIL,
            recipient: req.recipientEmail,
            status: DeliveryStatus.DELIVERED,
            provider: result.provider ?? 'unknown',
            externalId: result.externalId,
            durationMs: result.durationMs,
          },
        });

        this.logger.log(`Email delivered to ${req.recipientEmail}`);
        return delivered;
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: DeliveryStatus.FAILED,
          failedAt: new Date(),
          error: result.error,
        },
      });

      await this.prisma.deliveryLog.create({
        data: {
          companyId: req.companyId,
          notificationId: notification.id,
          channel: Channel.EMAIL,
          recipient: req.recipientEmail,
          status: DeliveryStatus.FAILED,
          provider: result.provider ?? 'unknown',
          durationMs: result.durationMs,
          error: result.error,
        },
      });

      throw new BadRequestException(result.error ?? 'Email delivery failed');
    }

    const delay = Math.max(0, req.scheduledAt.getTime() - Date.now());

    const payload: EmailJobPayload = {
      notificationId: notification.id,
      companyId: req.companyId,
      to: req.recipientEmail,
      toName: req.recipientName,
      subject: req.subject,
      htmlBody: req.htmlBody,
      attachments: req.attachments,
    };

    await this.emailQueue.add('send-email', payload, { delay });
    this.logger.log(`Email queued for ${req.recipientEmail}`);
    return notification;
  }

  // ── Push ──────────────────────────────────────────────────────────────────

  async sendPush(req: SendPushRequest) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId: req.companyId,
        customerId: req.customerId,
        jobId: req.jobId,
        recipientId: req.recipientId,
        recipientName: req.recipientName,
        recipientPushToken: req.pushToken,
        channel: Channel.PUSH,
        body: req.body,
        status: DeliveryStatus.QUEUED,
        scheduledAt: req.scheduledAt,
      },
    });

    const delay = req.scheduledAt
      ? Math.max(0, req.scheduledAt.getTime() - Date.now())
      : 0;

    const payload: PushJobPayload = {
      notificationId: notification.id,
      companyId: req.companyId,
      token: req.pushToken,
      title: req.title,
      body: req.body,
      data: req.data,
    };

    await this.pushQueue.add('send-push', payload, { delay });
    return notification;
  }

  async sendInApp(req: SendInAppRequest) {
    const uniqueRecipients = req.recipients.filter((recipient, index, list) => (
      list.findIndex((candidate) => candidate.recipientId === recipient.recipientId) === index
    ));

    if (uniqueRecipients.length === 0) {
      throw new BadRequestException('At least one notification recipient is required');
    }

    const notifications = await Promise.all(
      uniqueRecipients.map((recipient) => this.prisma.notification.create({
        data: {
          companyId: req.companyId,
          customerId: recipient.customerId,
          recipientId: recipient.recipientId,
          recipientName: recipient.recipientName,
          channel: Channel.IN_APP,
          title: req.title,
          body: req.body,
          status: DeliveryStatus.SENT,
          isRead: false,
          type: req.type ?? 'info',
        },
      })),
    );

    const senderCopy = await this.prisma.notification.create({
      data: {
        companyId: req.companyId,
        recipientId: req.sender.userId,
        recipientName: req.sender.name,
        channel: Channel.IN_APP,
        title: req.title,
        body: req.body,
        status: DeliveryStatus.SENT,
        isRead: true,
        type: 'sent',
        providerResponse: JSON.stringify({
          recipientCount: notifications.length,
          roles: req.roles ?? [],
        }),
      },
    });

    this.logger.log(`In-app broadcast sent by ${req.sender.userId} to ${notifications.length} recipients`);

    return {
      count: notifications.length,
      roles: req.roles ?? [],
      data: [...notifications, senderCopy],
    };
  }

  // ── List / stats / read ────────────────────────────────────────────────

  async findAll(
    companyId: string,
    user: AuthUser,
    params: { channel?: Channel; status?: DeliveryStatus; page?: number; limit?: number },
  ) {
    const { channel, status } = params;
    const { page, limit, skip } = clampPagination({ page: params.page, limit: params.limit });
    const recipientId = user.role === 'customer' ? (user.customerId ?? user.userId) : user.userId;
    const where = {
      companyId,
      recipientId,
      channel: channel ?? Channel.IN_APP,
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    // Map to frontend-expected shape
    const data = items.map((n) => {
      const metadata = (() => {
        if (!n.providerResponse) return undefined;
        try {
          return JSON.parse(n.providerResponse) as { recipientCount?: number; roles?: string[] };
        } catch {
          return undefined;
        }
      })();

      return {
        id: n.id,
        companyId: n.companyId,
        userId: n.recipientId,
        title: n.title ?? n.subject ?? `${n.channel} notification`,
        body: n.body,
        isRead: n.isRead,
        type: n.type ?? (n.status === 'FAILED' ? 'error' : 'info'),
        referenceId: n.customerId ?? n.jobId ?? undefined,
        referenceType: n.customerId ? 'customer' : n.jobId ? 'job' : undefined,
        createdAt: n.createdAt.toISOString(),
        channel: n.channel,
        status: n.status,
        recipientName: n.recipientName,
        sentRecipientCount: metadata?.recipientCount,
        sentRoles: metadata?.roles,
      };
    });
    return { data, total, page, limit };
  }

  async markRead(companyId: string, user: AuthUser, id: string) {
    const recipientId = user.role === 'customer' ? (user.customerId ?? user.userId) : user.userId;
    return this.prisma.notification.updateMany({
      where: { id, companyId, recipientId, channel: Channel.IN_APP },
      data: { isRead: true },
    });
  }

  async markAllRead(companyId: string, user: AuthUser) {
    const recipientId = user.role === 'customer' ? (user.customerId ?? user.userId) : user.userId;
    return this.prisma.notification.updateMany({
      where: { companyId, recipientId, channel: Channel.IN_APP, isRead: false },
      data: { isRead: true },
    });
  }

  async getDeliveryStats(companyId: string) {
    const stats = await this.prisma.notification.groupBy({
      by: ['channel', 'status'],
      where: { companyId },
      _count: { id: true },
    });
    return stats;
  }
}
