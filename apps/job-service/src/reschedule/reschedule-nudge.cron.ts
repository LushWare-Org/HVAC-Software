import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RescheduleStatus } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RescheduleNotifyClient } from './reschedule-notify.client';

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;   // hourly
const NUDGE_AFTER_MS = 48 * 60 * 60 * 1000; // 48h of silence
const BATCH_LIMIT = 200;

/**
 * RescheduleNudgeCron — re-notifies whoever is sitting on an unanswered
 * reschedule.
 *
 * An ignored request quietly becomes a missed appointment, and nothing else in
 * the system would surface it. Symmetric on purpose: if staff are the ones
 * sitting on it, staff get nudged.
 *
 * Uses setInterval + an isRunning guard rather than @nestjs/schedule, matching
 * crm-service's agreements.cron.ts — ScheduleModule is not registered anywhere
 * in this repo.
 */
@Injectable()
export class RescheduleNudgeCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RescheduleNudgeCron.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: RescheduleNotifyClient,
  ) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => {
      void this.runGuarded();
    }, SWEEP_INTERVAL_MS);
    this.logger.log('Reschedule nudge sweep scheduled (hourly)');
  }

  onModuleDestroy() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
  }

  private async runGuarded() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const sent = await this.sweep();
      if (sent > 0) this.logger.log(`Reschedule nudges sent: ${sent}`);
    } catch (err) {
      this.logger.warn(`Reschedule nudge sweep failed: ${(err as Error).message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async sweep(): Promise<number> {
    const cutoff = new Date(Date.now() - NUDGE_AFTER_MS);

    const candidates = await this.prisma.rescheduleRequest.findMany({
      where: {
        status: RescheduleStatus.AWAITING_RESPONSE,
        nudgedAt: null,
        createdAt: { lt: cutoff },
      },
      include: { slots: { orderBy: { startAt: 'asc' } }, job: true },
      take: BATCH_LIMIT,
    });

    let sent = 0;
    for (const request of candidates) {
      // Cloud Run runs several instances and each fires this interval. The
      // conditional claim means exactly one of them sends each nudge — without
      // it, a customer gets one reminder per running instance.
      const claimed = await this.prisma.rescheduleRequest.updateMany({
        where: { id: request.id, nudgedAt: null },
        data: { nudgedAt: new Date() },
      });
      if (claimed.count === 0) continue;

      try {
        await this.notify.nudge(request.companyId, {
          job: (request as any).job,
          request: request as any,
        });
        sent += 1;
      } catch (err) {
        // One bad recipient must not abandon the rest of the batch.
        this.logger.warn(`Nudge for request ${request.id} failed: ${(err as Error).message}`);
      }
    }

    return sent;
  }
}
