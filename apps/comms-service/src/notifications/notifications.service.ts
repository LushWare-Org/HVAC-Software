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

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, DeliveryStatus } from '../prisma/generated';
import { QueueName } from '@tscrm/queue';

// ── Job payload types (shared with processors) ─────────────────────────────

export interface SmsJobPayload {
  notificationId: string;
  companyId: string;
  to: string;
  body: string;
}

export interface EmailJobPayload {
  notificationId: string;
  companyId: string;
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.SEND_SMS) private readonly smsQueue: Queue,
    @InjectQueue(QueueName.SEND_EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QueueName.SEND_PUSH) private readonly pushQueue: Queue,
  ) {}

  // ── SMS ───────────────────────────────────────────────────────────────────

  async sendSms(req: SendSmsRequest) {
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

    const delay = req.scheduledAt
      ? Math.max(0, req.scheduledAt.getTime() - Date.now())
      : 0;

    const payload: EmailJobPayload = {
      notificationId: notification.id,
      companyId: req.companyId,
      to: req.recipientEmail,
      toName: req.recipientName,
      subject: req.subject,
      htmlBody: req.htmlBody,
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

  // ── List / stats ──────────────────────────────────────────────────────────

  async findAll(
    companyId: string,
    params: { channel?: Channel; status?: DeliveryStatus; page?: number; limit?: number },
  ) {
    const { channel, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = {
      companyId,
      ...(channel ? { channel } : {}),
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
    return { items, total, page, limit };
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
