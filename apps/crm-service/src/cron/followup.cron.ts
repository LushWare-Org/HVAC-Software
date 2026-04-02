import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FollowupAgent } from '../agents/followup.agent';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class FollowupCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FollowupCron.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(private readonly followupAgent: FollowupAgent) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => {
      void this.runOnce();
    }, SIX_HOURS_MS);

    void this.runOnce();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async runOnce(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Skipping follow-up cycle because the previous run is still in progress');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting follow-up cycle');

    try {
      const summary = await this.followupAgent.run();
      this.logger.log(`Follow-up cycle completed: ${JSON.stringify(summary)}`);
    } catch (error) {
      this.logger.error('Follow-up cycle failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.isRunning = false;
    }
  }
}
