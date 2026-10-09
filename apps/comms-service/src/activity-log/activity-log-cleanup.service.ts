import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { createRedisConnection, createQueue, QueueName, QUIET_WORKER } from '@tscrm/queue';
import { PrismaService } from '../prisma/prisma.service';

const RETENTION_DAYS = 90;
const CLEANUP_JOB_NAME = 'run-cleanup';

/**
 * Nightly sweep enforcing the 90-day retention window. Postgres has no
 * native TTL index (unlike the Mongo TTL index this design originally
 * assumed — see the spec's data-model correction note), so this is a BullMQ
 * repeatable job instead: scheduled once at module init, runs on its own
 * cron regardless of how many times the service restarts. Uses its own
 * QueueName.ACTIVITY_LOG_CLEANUP queue — separate from the high-volume
 * ACTIVITY_LOG ingestion queue so the two Workers never compete for jobs.
 */
@Injectable()
export class ActivityLogCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActivityLogCleanupService.name);
  private worker?: Worker;

  constructor(private readonly prisma: PrismaService) {}

  async runCleanup(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    this.logger.log(`Activity-log cleanup: removed ${result.count} rows older than ${RETENTION_DAYS} days`);
    return { deleted: result.count };
  }

  async onModuleInit() {
    // Never let Redis stop the service from starting (e.g. a hosted Redis that hit its
    // request allowance): without this, one failed command here took all of comms down,
    // emails and chat included. The nightly cleanup simply waits for the next start.
    const cleanupQueue = createQueue(QueueName.ACTIVITY_LOG_CLEANUP);
    try {
      await cleanupQueue.add(
        CLEANUP_JOB_NAME,
        {},
        { repeat: { pattern: '0 3 * * *' }, jobId: CLEANUP_JOB_NAME },
      );
    } catch (err) {
      this.logger.warn(`Could not schedule the nightly activity-log cleanup (Redis): ${(err as Error).message}`);
    } finally {
      await cleanupQueue.close().catch(() => undefined);
    }

    this.worker = new Worker(QueueName.ACTIVITY_LOG_CLEANUP, async () => this.runCleanup(), {
      connection: createRedisConnection(),
        ...QUIET_WORKER,
    });
    // Without a listener, a Redis error raised by the worker would crash the process.
    this.worker.on('error', (err) => this.logger.warn(`Activity-log cleanup worker: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
