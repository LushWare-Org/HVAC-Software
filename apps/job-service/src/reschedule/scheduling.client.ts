import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const SCHEDULING_URL = process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003';

/** Assignment states that still hold a technician to the job. */
const LIVE_ASSIGNMENT_STATUSES = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'];

/**
 * Releases a technician when a job's appointment moves.
 *
 * Deliberately never throws: by the time this runs the calendar change has
 * already been committed and promised to the customer, so a scheduling-service
 * blip must not roll it back. A failure leaves a stale assignment, which the
 * dispatch board shows and a human can fix — strictly better than a
 * half-applied reschedule.
 *
 * Endpoint shapes come from apps/scheduling-service/cmd/server/main.go:133-138.
 */
@Injectable()
export class SchedulingClient {
  private readonly logger = new Logger(SchedulingClient.name);

  async cancelAssignmentForJob(companyId: string, jobId: string): Promise<boolean> {
    try {
      const res = await axios.get(
        `${SCHEDULING_URL}/dispatch/assignments/job/${encodeURIComponent(jobId)}`,
        { timeout: 8_000, headers: this.serviceHeaders(companyId) },
      );

      // The Go handler wraps the list as { data: [...] }; tolerate a bare array too.
      const assignments: Array<{ id: string; status: string }> = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];
      const live = assignments.find((a) => LIVE_ASSIGNMENT_STATUSES.includes(a.status));
      if (!live) return false;

      await axios.patch(
        `${SCHEDULING_URL}/dispatch/assignments/${live.id}/status`,
        { status: 'CANCELLED' },
        { timeout: 8_000, headers: this.serviceHeaders(companyId) },
      );
      this.logger.log(`Cancelled dispatch assignment ${live.id} for rescheduled job ${jobId}`);
      return true;
    } catch (err: any) {
      this.logger.warn(
        `Could not cancel dispatch assignment for job ${jobId}: ${
          err?.response?.status ?? ''} ${err.message}`,
      );
      return false;
    }
  }

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'job-service-reschedule',
        'x-test-user-email': 'jobs-reschedule@tscrm.internal',
        'x-test-user-name': 'Job Service (reschedule)',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }
}
