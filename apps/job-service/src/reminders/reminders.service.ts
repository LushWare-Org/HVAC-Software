import { Injectable, Logger, Optional, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const COMMS_URL = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // every 15 min
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // jobs starting within 24h

/**
 * Appointment reminders.
 *
 * A sweep rather than delayed jobs: it re-reads current job state every run, so
 * a reschedule or cancellation needs no cancellation bookkeeping. Idempotency
 * is comms' job via dedupeKey, which is keyed on the scheduled DATE — so a
 * rescheduled booking legitimately earns a new reminder while repeated sweeps
 * of an unchanged booking do not.
 *
 * This lives in job-service because the sweep spans every tenant, which is one
 * local query here versus enumerate-companies-then-N-HTTP-calls from comms.
 */
@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    // @Optional() is required, not cosmetic: TypeScript emits `Function` as this
    // parameter's design:type, so without it Nest tries to resolve an
    // AxiosInstance provider at boot and the whole module fails to load. The
    // default value alone does not stop that lookup.
    @Optional() private readonly http: AxiosInstance = axios,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.sweep().catch((err: Error) =>
        this.logger.warn(`reminder sweep failed: ${err.message}`),
      );
    }, SWEEP_INTERVAL_MS);
    // Never hold the process open just for reminders.
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<{ scanned: number; sent: number }> {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);

    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: { gte: now, lte: until },
      },
      select: {
        id: true,
        companyId: true,
        customerId: true,
        title: true,
        scheduledStart: true,
      },
    });

    let sent = 0;
    for (const job of jobs) {
      if (!job.customerId) continue;
      const day = job.scheduledStart!.toISOString().slice(0, 10);
      try {
        await this.http.post(
          `${COMMS_URL}/notifications/customer-push`,
          {
            companyId: job.companyId,
            customerId: job.customerId,
            title: 'Reminder: service tomorrow',
            body: job.title ? `${job.title} — tap for details.` : 'Tap for details.',
            data: { type: 'job_reminder', jobId: job.id },
            jobId: job.id,
            dedupeKey: `job-reminder:${job.id}:${day}`,
          },
          { timeout: 8_000 },
        );
        sent += 1;
      } catch (err) {
        // One bad tenant must not abort the sweep for everyone else.
        this.logger.warn(`reminder for job ${job.id} failed: ${(err as Error).message}`);
      }
    }

    return { scanned: jobs.length, sent };
  }
}
