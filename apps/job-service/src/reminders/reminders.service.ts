import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { VisitCareService } from '../jobs/visit-care.service';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

/**
 * Visit reminders, to the customer and the technician: the evening before and a few hours
 * ahead. A sweep rather than delayed jobs: it re-reads the current booking every run, so a
 * moved or cancelled visit needs no cancelling. Each reminder is claimed per start time on
 * the job itself, so repeated sweeps (or two copies of this service) send it once.
 *
 * Lives in job-service because the sweep spans every tenant: one local query here versus
 * enumerating companies and calling over HTTP from comms.
 */
@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly care: VisitCareService) {}

  onModuleInit() {
    // Set on a standby copy of this service, so two copies never both send.
    if (process.env.DISABLE_SCHEDULED_TASKS === 'true' || process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      this.sweep().catch((err: Error) => this.logger.warn(`reminder sweep failed: ${err.message}`));
    }, SWEEP_INTERVAL_MS);
    // Never hold the process open just for reminders.
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  sweep() {
    return this.care.sweep();
  }
}
