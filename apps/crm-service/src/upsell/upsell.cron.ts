import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsellAgentService } from './upsell-agent.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UpsellCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UpsellCron.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly upsellAgent: UpsellAgentService,
  ) {}

  onModuleInit(): void {
    if (process.env.UPSELL_AGENT_ENABLED === 'false') {
      this.logger.log('Upsell agent cron is disabled');
      return;
    }

    this.intervalHandle = setInterval(() => {
      void this.runOnce();
    }, ONE_DAY_MS);

    void this.runOnce();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async runOnce(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Skipping upsell cycle because the previous run is still in progress');
      return;
    }

    this.isRunning = true;

    try {
      if (!(await this.prisma.ensureRequiredSchemaReady())) {
        this.logger.warn('Skipping upsell cycle because the CRM database schema is not ready');
        return;
      }

      this.logger.log('Starting upsell recommendation cycle');
      const summary = await this.upsellAgent.runDailyBatch();
      this.logger.log(`Upsell recommendation cycle completed: ${JSON.stringify(summary)}`);
    } catch (error) {
      this.logger.error('Upsell recommendation cycle failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.isRunning = false;
    }
  }
}
