import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MessagingGateway } from '../messaging/messaging.gateway';

const JOB_CHANNEL_PATTERN = 'assignment:*';
const FINANCE_CHANNEL_PATTERN = 'finance:*';

/** Slimmed shapes actually sent to a customer socket. */
export interface CustomerJobEvent {
  jobId: string;
  change: string;
  status?: string;
  scheduledStart?: string | null;
}

export interface CustomerFinanceEvent {
  documentId: string;
  change: string;
  status?: string;
  documentNumber?: string;
  total?: string;
  currency?: string;
}

export type CustomerEvent =
  | { kind: 'job'; customerId: string; companyId: string; event: CustomerJobEvent }
  | { kind: 'quote' | 'invoice'; customerId: string; companyId: string; event: CustomerFinanceEvent };

type Listener = (evt: CustomerEvent) => void;

/**
 * Subscribes to job + finance events and fans them out to the owning
 * customer's private room only.
 *
 * Every comms instance runs its own subscriber and serves its own connected
 * sockets, so fan-out happens at the Redis layer — which is why this path
 * needs no Socket.IO Redis adapter.
 */
@Injectable()
export class CustomerEventsSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerEventsSubscriber.name);
  private readonly client: Redis;
  private readonly listeners = new Set<Listener>();
  private warnedOnce = false;

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: MessagingGateway,
  ) {
    const common = {
      maxRetriesPerRequest: null as null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5_000),
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
    this.client.on('error', (err: Error) => {
      if (this.warnedOnce) return;
      this.warnedOnce = true;
      this.logger.warn(`Redis unavailable — customer realtime paused: ${err.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      await this.client.psubscribe(JOB_CHANNEL_PATTERN, FINANCE_CHANNEL_PATTERN);
      this.client.on('pmessage', (_pattern: string, channel: string, raw: string) => {
        this.handleMessage(channel, raw);
      });
      this.logger.log('Customer events subscriber started (assignment:* + finance:*)');
    } catch (err) {
      this.logger.warn(
        `Customer events subscriber failed to start: ${(err as Error).message}`,
      );
    }
  }

  /** Register an extra consumer (used by the push-trigger module). */
  onCustomerEvent(listener: Listener): void {
    this.listeners.add(listener);
  }

  /** Parsing + routing core. Split out from the Redis wiring so it is unit-testable. */
  handleMessage(channel: string, raw: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // A malformed message must never kill the subscriber.
    }

    const payload = parsed?.payload;
    const customerId: string | undefined = payload?.customerId;
    // No customerId means we cannot prove who owns this event. Dropping it is
    // the guard against fanning another customer's data out to the wrong room.
    if (!customerId) return;

    const companyId: string = parsed?.companyId ?? channel.split(':')[1] ?? '';

    if (channel.startsWith('assignment:')) {
      const event: CustomerJobEvent = {
        jobId: payload.jobId,
        change: payload.change,
        status: payload.status,
        scheduledStart: payload.scheduledStart ?? null,
      };
      this.dispatch('job_changed', customerId, event);
      this.notify({ kind: 'job', customerId, companyId, event });
      return;
    }

    if (channel.startsWith('finance:')) {
      const isInvoice = payload.type === 'INVOICE_CHANGED';
      const event: CustomerFinanceEvent = {
        documentId: payload.documentId,
        change: payload.change,
        status: payload.status,
        documentNumber: payload.documentNumber,
        total: payload.total,
        currency: payload.currency,
      };
      this.dispatch(isInvoice ? 'invoice_changed' : 'quote_changed', customerId, event);
      this.notify({ kind: isInvoice ? 'invoice' : 'quote', customerId, companyId, event });
    }
  }

  private dispatch(eventName: string, customerId: string, body: unknown): void {
    try {
      this.gateway.server?.of('/chat').to(`customer:${customerId}`).emit(eventName, body);
    } catch (err) {
      this.logger.debug?.(`customer emit skipped: ${(err as Error).message}`);
    }
  }

  private notify(evt: CustomerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(evt);
      } catch (err) {
        this.logger.warn(`customer event listener failed: ${(err as Error).message}`);
      }
    }
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
