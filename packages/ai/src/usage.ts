import { QueueName, createQueue } from '@tscrm/queue';
import type { Queue } from 'bullmq';
import type { AiCallRecord } from './gateway';
import type { AiLogger } from './types';

/**
 * Sends each AI call record to the ai-usage queue, where analytics-service
 * stores it and enforces monthly budgets. Fire and forget: recording must
 * never slow down or fail the call it describes. The queue is opened on the
 * first record, so services that never call AI open no Redis connection.
 */
export function createQueueUsageRecorder(
  service: string,
  opts: { logger?: AiLogger; queue?: Pick<Queue, 'add'> } = {},
): (record: AiCallRecord) => void {
  let queue = opts.queue;
  let warned = false;
  return (record) => {
    try {
      queue ??= createQueue(QueueName.AI_USAGE, {
        defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: { count: 200 } },
      });
      queue.add('ai-call', { ...record, service }).catch((err: Error) => {
        if (!warned) { warned = true; opts.logger?.warn(`[ai] usage not recorded: ${err.message}`); }
      });
    } catch (err) {
      if (!warned) { warned = true; opts.logger?.warn(`[ai] usage not recorded: ${(err as Error).message}`); }
    }
  };
}
