import { Queue, Worker, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

// ============================================================
// @tscrm/queue â€” BullMQ queue names, factory, job type defs
// ============================================================

// ---- Named queues (one per domain concern) ----
export enum QueueName {
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  SEND_PUSH = 'send-push',
  GENERATE_PDF = 'generate-pdf',
  PROCESS_PAYMENT = 'process-payment',
  SEND_INVOICE = 'send-invoice',
  APPOINTMENT_REMINDER = 'appointment-reminder',
  REVIEW_REQUEST = 'review-request',
  JOB_STATUS_NOTIFICATION = 'job-status-notification',
  FOLLOWUP = 'followup-queue',
  MARKETING_SEND = 'marketing-send',
  EQUIPMENT_AUTOMATION = 'equipment-automation',
  ACTIVITY_LOG = 'activity-log',
  // Separate from ACTIVITY_LOG on purpose: two Workers listening on the same
  // BullMQ queue COMPETE for jobs rather than each seeing every job, so the
  // nightly retention sweep must run on its own queue — sharing one would
  // risk a real log-event job being silently swallowed by the cleanup
  // worker (or vice versa) depending on which Worker happens to grab it.
  ACTIVITY_LOG_CLEANUP = 'activity-log-cleanup',
  PARTNER_EVENTS = 'partner-events',
}
// ---- Partner event contract ----
/** Business events partners can subscribe to. */
export enum PartnerEventType {
  JOB_COMPLETED = 'job.completed',
  INVOICE_PAID = 'invoice.paid',
  QUOTE_ACCEPTED = 'quote.accepted',
  BOOKING_CONFIRMED = 'booking.confirmed',
}

export interface PartnerEventJob {
  type: PartnerEventType;
  companyId: string;
  /** The subject of the event (job id, invoice id, …). */
  entityId: string;
  /** When it actually happened, not when it was delivered. */
  occurredAt: string;
  /** Small, flat, and safe to send outside — no internal ids or PII beyond
   * what a partner already resolved for this caller. */
  data: Record<string, unknown>;
}

// ---- Redis connection factory (shared config) ----
// Supports both REDIS_URL (full URL, e.g. Upstash rediss://:pass@host:6379)
// and legacy REDIS_HOST + REDIS_PORT + REDIS_PASSWORD env vars.
export function createRedisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    // IORedis handles rediss:// TLS automatically when URL is passed as first arg
    return new IORedis(redisUrl, { maxRetriesPerRequest: null });
  }
  return new IORedis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // required by BullMQ
  });
}

// ---- Queue factory ----
export function createQueue(
  name: QueueName,
  opts?: Partial<QueueOptions>,
): Queue {
  return new Queue(name, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
    ...opts,
  });
}

// ---- Partner event emitter ----

let partnerEventQueue: Queue | null = null;
export async function emitPartnerEvent(event: PartnerEventJob): Promise<void> {
  try {
    if (!partnerEventQueue) {
      partnerEventQueue = createQueue(QueueName.PARTNER_EVENTS);
    }
    await partnerEventQueue.add(event.type, event);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[queue] failed to emit partner event ${event.type} for ${event.entityId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

// ---- Worker factory (used inside comms-service processors) ----
export { Worker, Queue };
export type { QueueOptions };

