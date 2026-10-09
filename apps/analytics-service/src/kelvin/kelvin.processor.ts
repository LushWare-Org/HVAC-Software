import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueName, createRedisConnection, QUIET_WORKER } from '@tscrm/queue';
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
        ...QUIET_WORKER,
      });
    // Without a listener, a Redis error raised by the worker would crash the process.
    this.worker.on('error', (err) => this.logger.warn(`Kelvin events worker: ${err.message}`));
    this.worker.on('failed', (job, err) => this.logger.error(`Kelvin event ${job?.id} failed: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
