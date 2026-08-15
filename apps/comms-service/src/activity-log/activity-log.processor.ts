import { Injectable, Logger, Optional, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'bullmq';
import { createRedisConnection, QueueName } from '@tscrm/queue';
import type { ActivityLogEvent } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyNameCacheService } from './company-name-cache.service';
import { ActivityGateway } from './activity.gateway';

/**
 * The single write+broadcast choke point for every activity-log event,
 * regardless of which of the 8 services originated it (NestJS services push
 * here via BullMQ directly; scheduling-service pushes via the ingest
 * endpoint in ActivityLogController, which enqueues the same way).
 */
@Injectable()
export class ActivityLogProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(ActivityLogProcessor.name);
  private readonly worker: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyNames: CompanyNameCacheService,
    private readonly gateway: ActivityGateway,
    @Optional() worker?: Worker,
  ) {
    // `worker` is injectable so unit tests can construct this class without
    // opening a real Redis connection (which would otherwise keep Jest's
    // process alive after the test finishes).
    this.worker =
      worker ??
      new Worker(QueueName.ACTIVITY_LOG, async (job) => this.handleEvent(job.data as ActivityLogEvent), {
        connection: createRedisConnection(),
      });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Activity-log job ${job?.id} failed: ${err.message}`);
    });
  }

  async handleEvent(event: ActivityLogEvent) {
    const companyName = await this.companyNames.resolve(event.companyId);
    const created = await this.prisma.activityLog.create({
      data: {
        companyId: event.companyId,
        companyName,
        service: event.service,
        method: event.method,
        path: event.path,
        actorUserId: event.actorUserId,
        actorName: event.actorName,
        actorRole: event.actorRole,
        action: event.action,
        description: event.description,
        status: event.status,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        requestSummary: (event.requestSummary ?? undefined) as any,
        responseSummary: (event.responseSummary ?? undefined) as any,
        errorMessage: event.errorMessage,
      },
    });
    this.gateway.broadcastActivity(created);
    return created;
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
