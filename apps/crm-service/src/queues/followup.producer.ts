import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createQueue, QueueName } from '@tscrm/queue';
import type { FollowupJobPayload } from '@tscrm/types';

@Injectable()
export class FollowupProducer implements OnModuleDestroy {
  private readonly logger = new Logger(FollowupProducer.name);
  private readonly queue = createQueue(QueueName.FOLLOWUP);

  async enqueueFollowup(payload: FollowupJobPayload): Promise<string> {
    const job = await this.queue.add('followup-job', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        count: 500,
      },
      removeOnFail: {
        count: 1000,
      },
    });

    const jobId = String(job.id);
    this.logger.log(`Queued follow-up ${payload.action} for ${payload.entityType}:${payload.entityId} as job ${jobId}`);
    return jobId;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
