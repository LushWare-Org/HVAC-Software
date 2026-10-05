import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueName, createRedisConnection } from '@tscrm/queue';
import { AiUsageService, type AiUsageEvent } from './ai-usage.service';

/** The one consumer of the ai-usage queue that every service's AI gateway publishes to. */
@Injectable()
export class AiUsageProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(AiUsageProcessor.name);
  private readonly worker: Pick<Worker, 'on' | 'close'>;

  constructor(
    private readonly usage: AiUsageService,
    // Injectable so unit tests can build this without opening a Redis connection.
    @Optional() worker?: Pick<Worker, 'on' | 'close'>,
  ) {
    this.worker =
      worker ??
      new Worker(QueueName.AI_USAGE, async (job) => this.usage.record(job.data as AiUsageEvent), {
        connection: createRedisConnection(),
      });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`AI usage job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
