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
}

// ---- Redis connection factory (shared config) ----
export function createRedisConnection(): IORedis {
  return new IORedis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
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

// ---- Worker factory (used inside comms-service processors) ----
export { Worker, Queue };
export type { QueueOptions };

