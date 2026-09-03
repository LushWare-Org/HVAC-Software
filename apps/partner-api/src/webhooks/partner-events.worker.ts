import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  PartnerEventJob,
  QueueName,
  Worker,
  createRedisConnection,
} from '@tscrm/queue';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { StaffAlertsService } from './staff-alerts.service';

@Injectable()
export class PartnerEventsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PartnerEventsWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly delivery: WebhookDeliveryService,
    private readonly staffAlerts: StaffAlertsService,
  ) {}

  onModuleInit(): void {
    if (process.env.PARTNER_EVENTS_WORKER === 'false') {
      this.logger.log('Partner events worker disabled by configuration');
      return;
    }

    try {
      this.worker = new Worker(
        QueueName.PARTNER_EVENTS,
        async (job) => this.handle(job.data as PartnerEventJob),
        {
          connection: createRedisConnection(),
          concurrency: Number(process.env.PARTNER_EVENTS_CONCURRENCY ?? 5),
        },
      );

      this.worker.on('failed', (job, err) => {
        this.logger.error(
          `Partner event ${job?.name} failed: ${err?.message ?? err}`,
        );
      });

      this.logger.log(`Listening for ${QueueName.PARTNER_EVENTS}`);
    } catch (err) {
      // Redis being unreachable must not stop the API serving requests —
      // events simply queue up until the worker can start.
      this.logger.warn(
        `Partner events worker could not start: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async handle(event: PartnerEventJob): Promise<void> {
    const [partners, staff] = await Promise.allSettled([
      this.delivery.dispatch(event),
      this.staffAlerts.notify(event),
    ]);

    const delivered =
      partners.status === 'fulfilled' ? partners.value.delivered : 'error';
    const alerted = staff.status === 'fulfilled' ? staff.value : 'error';

    this.logger.log(
      `${event.type} ${event.entityId}: ${delivered} partner deliveries, ${alerted} staff alerts`,
    );

    if (partners.status === 'rejected') {
      this.logger.error(`Partner fan-out failed: ${partners.reason}`);
    }
    if (staff.status === 'rejected') {
      this.logger.error(`Staff alert failed: ${staff.reason}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
