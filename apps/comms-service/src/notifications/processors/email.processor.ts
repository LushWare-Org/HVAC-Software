/**
 * EmailProcessor — BullMQ worker for QueueName.SEND_EMAIL
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { EmailJobPayload } from '../notifications.service';

@Processor(QueueName.SEND_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const { notificationId, companyId, to, toName, subject, htmlBody, attachments } = job.data;
    this.logger.log(`Processing email job ${job.id} for notification ${notificationId}`);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: DeliveryStatus.SENT, sentAt: new Date() },
    });

    const result = await this.emailService.send({ to, toName, subject, htmlBody, attachments });

    if (result.success) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
          externalId: result.externalId,
        },
      });

      await this.prisma.deliveryLog.create({
        data: {
          companyId,
          notificationId,
          channel: 'EMAIL',
          recipient: to,
          status: DeliveryStatus.DELIVERED,
          provider: 'sendgrid',
          externalId: result.externalId,
          durationMs: result.durationMs,
        },
      });
    } else {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: DeliveryStatus.FAILED,
          failedAt: new Date(),
          error: result.error,
        },
      });

      await this.prisma.deliveryLog.create({
        data: {
          companyId,
          notificationId,
          channel: 'EMAIL',
          recipient: to,
          status: DeliveryStatus.FAILED,
          provider: 'sendgrid',
          durationMs: result.durationMs,
          error: result.error,
        },
      });

      throw new Error(`Email delivery failed: ${result.error}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobPayload>, err: Error) {
    this.logger.error(`Email job ${job.id} failed: ${err.message}`);
  }
}
