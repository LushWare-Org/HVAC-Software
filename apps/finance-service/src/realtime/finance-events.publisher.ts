import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Deliberately a NEW channel prefix, not `assignment:`. The Go scheduling
 * hub pattern-subscribes `assignment:*` and `gps:*`; publishing finance
 * events anywhere it listens would push document events onto every dispatch
 * board. comms-service is the only subscriber to this prefix.
 */
const CHANNEL_PREFIX = 'finance:';

export type FinanceEventType = 'QUOTE_CHANGED' | 'INVOICE_CHANGED';

export interface FinanceChangedPayload {
  type: FinanceEventType;
  /** Quote id or Invoice id. */
  documentId: string;
  /** Required for customer-scoped fan-out; comms drops events without it. */
  customerId: string;
  change:
    | 'SENT'
    | 'APPROVED'
    | 'DECLINED'
    | 'CONVERTED'
    | 'PAID'
    | 'PARTIALLY_PAID'
    | 'OVERDUE'
    | 'VOIDED';
  status?: string;
  documentNumber?: string;
  total?: string;
  currency?: string;
}

@Injectable()
export class FinanceEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(FinanceEventsPublisher.name);
  private readonly client: Redis;
  private warnedOnce = false;

  constructor(private readonly config: ConfigService) {
    // Same tuning as job-service's publisher: this is a best-effort side
    // channel, so keep retries short and the logs quiet. A noisy reconnect
    // loop on every finance write is worse than degrading to client polling.
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
        `Redis unavailable — finance realtime events will be skipped: ${err.message}`,
      );
    });
    this.client.connect().catch(() => {
      // Handled by the 'error' listener above.
    });
  }

  /** Never throws, never awaits anything slow. Safe to call inside a request path. */
  publish(companyId: string, payload: FinanceChangedPayload): void {
    const message = JSON.stringify({ type: payload.type, companyId, payload });
    this.client
      .publish(`${CHANNEL_PREFIX}${companyId}`, message)
      .catch((err: unknown) => {
        this.logger.debug?.(
          `finance event publish skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
