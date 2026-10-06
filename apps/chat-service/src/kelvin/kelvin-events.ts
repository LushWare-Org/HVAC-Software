import { Logger } from '@nestjs/common';
import { QueueName, createQueue, type Queue } from '@tscrm/queue';

export type KelvinEventType = 'SHOWN' | 'SPOKE' | 'DISMISSED' | 'FIX_USED' | 'ACTION_DONE' | 'ACTION_FAILED';
export interface KelvinEventInput {
  companyId: string;
  userId: string;
  type: KelvinEventType;
  itemId?: string;
  action?: string;
  recordRef?: string;
  summary: string;
  confirmedBy?: string;
}

const logger = new Logger('KelvinEvents');
let queue: Pick<Queue, 'add'> | null = null;

/** Tests swap the queue; production creates it on first use. */
export function setKelvinQueueForTests(q: Pick<Queue, 'add'> | null) {
  queue = q;
}

/** Fire and forget: Kelvin's memory must never slow down or break a request. */
export function publishKelvinEvent(e: KelvinEventInput): void {
  try {
    if (!queue) {
      if (!process.env.REDIS_URL) return;
      queue = createQueue(QueueName.KELVIN_EVENTS);
    }
    void queue.add('event', e).catch((err: Error) => logger.warn(`Kelvin event not queued: ${err.message}`));
  } catch (err) {
    logger.warn(`Kelvin event not queued: ${(err as Error).message}`);
  }
}
