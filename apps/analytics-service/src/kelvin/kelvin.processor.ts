import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueName, createRedisConnection } from '@tscrm/queue';
import { KelvinLogService, type KelvinEventInput } from './kelvin-log.service';

/** Consumer of the kelvin-events queue (chat-service publishes; this writes). */
@Injectable()
export class KelvinProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(KelvinProcessor.name);
  private readonly worker: Pick<Worker, 'on' | 'close'>;

  constructor(private readonly log: KelvinLogService, @Optional() worker?: Pick<Worker, 'on' | 'close'>) {
    this.worker =
      worker ??
      new Worker(QueueName.KELVIN_EVENTS, async (job) => this.log.record(job.data as KelvinEventInput), {
        connection: createRedisConnection(),
      });
    this.worker.on('failed', (job, err) => this.logger.error(`Kelvin event ${job?.id} failed: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
