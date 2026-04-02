import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import type { FollowupAction, FollowupJobPayload } from '@tscrm/types';
import type { Job } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

@Processor(QueueName.FOLLOWUP)
export class FollowupWorker extends WorkerHost {
  private readonly logger = new Logger(FollowupWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<FollowupJobPayload>): Promise<{ channel: 'SMS' | 'EMAIL' } | { skipped: true }> {
    const message = this.buildMessage(job.data.action);

    if (job.data.recipientPhone) {
      await this.notificationsService.sendSms({
        companyId: job.data.companyId,
        customerId: job.data.customerId,
        recipientId: job.data.recipientId,
        recipientName: job.data.recipientName,
        recipientPhone: job.data.recipientPhone,
        body: message,
      });

      this.logger.log(`Follow-up SMS queued for ${job.data.entityType}:${job.data.entityId}`);
      return { channel: 'SMS' };
    }

    if (job.data.recipientEmail) {
      await this.notificationsService.sendEmail({
        companyId: job.data.companyId,
        customerId: job.data.customerId,
        recipientId: job.data.recipientId,
        recipientName: job.data.recipientName,
        recipientEmail: job.data.recipientEmail,
        subject: this.buildSubject(job.data.action),
        htmlBody: `<p>${message}</p>`,
      });

      this.logger.log(`Follow-up email queued for ${job.data.entityType}:${job.data.entityId}`);
      return { channel: 'EMAIL' };
    }

    this.logger.warn(`No delivery channel available for ${job.data.entityType}:${job.data.entityId}`);
    return { skipped: true };
  }

  private buildSubject(action: FollowupAction): string {
    switch (action) {
      case 'RETENTION':
        return 'Let us keep your HVAC system running smoothly';
      case 'REENGAGEMENT':
        return 'Time to book your next HVAC service';
      case 'LEAD_FOLLOWUP':
        return 'Ready to schedule your first HVAC visit?';
      default:
        return 'HVAC follow-up';
    }
  }

  private buildMessage(action: FollowupAction): string {
    switch (action) {
      case 'RETENTION':
        return 'We value your business. Ask us about a maintenance offer for your next HVAC service.';
      case 'REENGAGEMENT':
        return 'It has been a while since your last HVAC service. Schedule maintenance to keep your system efficient.';
      case 'LEAD_FOLLOWUP':
        return 'Need help with your HVAC system? Reply to book your first service visit with our team.';
      default:
        return 'Our HVAC team is ready to help with your next service.';
    }
  }
}
