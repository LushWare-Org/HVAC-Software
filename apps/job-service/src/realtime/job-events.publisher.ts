import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Channel the Go scheduling-service hub already pattern-subscribes to
 * (`assignment:*` — see internal/database/redis.go). Publishing here means job
 * events reach every connected dispatch board with no new transport, no new
 * socket server, and no change to how the browser connects.
 */
const CHANNEL_PREFIX = 'assignment:';

/** Mirrors models.WSTypeJobChanged in scheduling-service. */
export type JobEventType = 'JOB_CHANGED';

export interface JobChangedPayload {
  jobId: string;
  /** What changed, so the client can invalidate narrowly instead of everything. */
  change: 'STATUS' | 'CREATED' | 'SCHEDULE' | 'RESCHEDULE' | 'ASSIGNMENT' | 'DELETED';
  status?: string;
  previousStatus?: string;
  scheduledStart?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  rescheduleState?: string | null;
  jobNumber?: string;
  title?: string;
  customerName?: string | null;
  /** Who caused it, so a client can avoid re-reacting to its own action. */
  actorUserId?: string;
}

/**
 * Publishes job changes so the dispatch board updates without a refresh.
 *
 * Why this exists: the Scheduling page's data is mostly *jobs* — the pending
 * queue, statuses, schedules, reschedule state — but every realtime event in the
 * system came from scheduling-service, which only knows about assignments and
 * GPS. Job status changes had no path to the browser at all, so the board could
 * not reflect them however healthy the socket was.
 *
 * Fire-and-forget by design: a job write must never fail, or slow down, because
 * a notification could not be published. Failures are logged and dropped, and
 * the client's polling fallback covers the gap.
 */
@Injectable()
export class JobEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(JobEventsPublisher.name);
  private readonly client: Redis;
  private warnedOnce = false;

  constructor(private readonly config: ConfigService) {
    // Same resolution order as RedisCacheService in this service: REDIS_URL when
    // present (Upstash in prod), otherwise discrete host/port (local docker,
    // which is what .env actually sets). Reading only REDIS_URL would silently
    // disable realtime in local dev — the exact failure this feature exists to
    // remove.
    // Keep retries short and quiet: this is a best-effort side channel, and a
    // noisy reconnect loop in the logs of every job write is worse than
    // degrading to the client's polling fallback.
    const common = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 500, 2_000)),
      lazyConnect: true,
    };
    const url = this.config.get<string>('REDIS_URL');
    this.client = url
      ? new Redis(url, common)
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(this.config.get<string | number>('REDIS_PORT', 6379)),
          password: this.config.get<string>('REDIS_PASSWORD'),
          ...common,
        });
    this.client.on('error', (err) => {
      if (this.warnedOnce) return;
      this.warnedOnce = true;
      this.logger.warn(
        `Redis unavailable — job realtime events will be skipped, clients fall back to polling: ${err.message}`,
      );
    });
    this.client.connect().catch(() => {
      // Handled by the 'error' listener above.
    });
  }

  /** Never throws, never awaits anything slow. Safe to call inside a request path. */
  publish(companyId: string, payload: JobChangedPayload): void {
    const message = JSON.stringify({
      type: 'JOB_CHANGED' satisfies JobEventType,
      companyId,
      payload,
    });
    this.client
      .publish(`${CHANNEL_PREFIX}${companyId}`, message)
      .catch((err: unknown) => {
        this.logger.debug?.(
          `job event publish skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  async onModuleDestroy() {
    // quit() rather than disconnect() so an in-flight publish still lands.
    await this.client.quit().catch(() => undefined);
  }
}
