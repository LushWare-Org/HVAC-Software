/**
 * PushProcessor — BullMQ worker for QueueName.SEND_PUSH
 */

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { PushService } from '../../push/push.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { PushJobPayload } from '../notifications.service';

@Processor(QueueName.SEND_PUSH)
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    private readonly pushService: PushService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<PushJobPayload>): Promise<void> {
    const { notificationId, companyId, token, title, body, data } = job.data;
    this.logger.log(`Processing push job ${job.id} for notification ${notificationId}`);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: DeliveryStatus.SENT, sentAt: new Date() },
    });

    const result = await this.pushService.sendToToken(token, { title, body, data });

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
          channel: 'PUSH',
          recipient: token,
          status: DeliveryStatus.DELIVERED,
          provider: 'fcm',
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
          channel: 'PUSH',
          recipient: token,
          status: DeliveryStatus.FAILED,
          provider: 'fcm',
          durationMs: result.durationMs,
          error: result.error,
        },
      });

      throw new Error(`Push delivery failed: ${result.error}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PushJobPayload>, err: Error) {
    this.logger.error(`Push job ${job.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PushJobPayload>) {
    this.logger.log(`Push job ${job.id} completed`);
  }
}
