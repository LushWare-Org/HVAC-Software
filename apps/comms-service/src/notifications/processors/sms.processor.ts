/**
 * SmsProcessor — BullMQ worker for QueueName.SEND_SMS
 *
 * Picks up jobs queued by NotificationsService, delivers them via Twilio,
 * and updates the Notification document status + DeliveryLog in MongoDB.
 *
 * Retry policy: 3 attempts, exponential backoff starting at 2 s (configured in queue factory).
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { SmsService } from '../../sms/sms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { SmsJobPayload } from '../notifications.service';

@Processor(QueueName.SEND_SMS)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<SmsJobPayload>): Promise<void> {
    const { notificationId, companyId, to, body } = job.data;
    this.logger.log(`Processing SMS job ${job.id} for notification ${notificationId}`);

    // Mark as sending
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: DeliveryStatus.SENT, sentAt: new Date() },
    });

    const result = await this.smsService.send(to, body);

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
          channel: 'SMS',
          recipient: to,
          status: DeliveryStatus.DELIVERED,
          provider: 'twilio',
          externalId: result.externalId,
          durationMs: result.durationMs,
        },
      });
    } else {
      // BullMQ will retry if we throw — so only throw if attempts remain
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
          channel: 'SMS',
          recipient: to,
          status: DeliveryStatus.FAILED,
          provider: 'twilio',
          durationMs: result.durationMs,
          error: result.error,
        },
      });

      throw new Error(`SMS delivery failed: ${result.error}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SmsJobPayload>, err: Error) {
    this.logger.error(
      `SMS job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SmsJobPayload>) {
    this.logger.debug(`SMS job ${job.id} completed`);
  }
}
