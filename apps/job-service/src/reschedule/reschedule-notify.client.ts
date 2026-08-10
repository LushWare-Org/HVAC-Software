import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const COMMS_URL = process.env.COMMS_SERVICE_URL ?? 'http://localhost:3005';

export type RescheduleEvent = 'OPENED' | 'RESPONDED' | 'APPLIED' | 'CLOSED' | 'NUDGE';

export interface RescheduleNotifyPayload {
  job: Record<string, unknown>;
  request: Record<string, unknown>;
}

/**
 * Bridge to comms-service's /notifications/reschedule.
 *
 * Every method resolves even on failure. A reschedule that reached the database
 * is done, and a notification outage must never make it look otherwise to the
 * caller — failures surface in comms-service's own logs and in the warning here.
 * This mirrors the fire-and-forget pattern used for invoice send and en-route.
 */
@Injectable()
export class RescheduleNotifyClient {
  private readonly logger = new Logger(RescheduleNotifyClient.name);

  requestOpened(companyId: string, p: RescheduleNotifyPayload) { return this.send(companyId, 'OPENED', p); }
  responded(companyId: string, p: RescheduleNotifyPayload)     { return this.send(companyId, 'RESPONDED', p); }
  applied(companyId: string, p: RescheduleNotifyPayload)       { return this.send(companyId, 'APPLIED', p); }
  closed(companyId: string, p: RescheduleNotifyPayload)        { return this.send(companyId, 'CLOSED', p); }
  nudge(companyId: string, p: RescheduleNotifyPayload)         { return this.send(companyId, 'NUDGE', p); }

  private async send(companyId: string, event: RescheduleEvent, p: RescheduleNotifyPayload): Promise<void> {
    try {
      await axios.post(
        `${COMMS_URL}/notifications/reschedule`,
        { event, job: p.job, request: p.request },
        { timeout: 8_000, headers: this.serviceHeaders(companyId) },
      );
    } catch (err: any) {
      this.logger.warn(
        `Reschedule ${event} notification failed: ${err?.response?.status ?? ''} ${err.message}`,
      );
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'job-service-reschedule-notify',
        'x-test-user-email': 'jobs-reschedule@tscrm.internal',
        'x-test-user-name': 'Job Service (reschedule)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
