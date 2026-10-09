/**
 * Tells the customer when their visit gets a technician and a time, and again when either
 * changes. One place decides: it compares the job with what the customer was last told
 * (notifiedStart / notifiedTechId), so repeated triggers (scheduling-service, the status
 * call, an edit form) send one message, and only when something really changed.
 *
 * comms-service does the sending: email, an in-app message (portal and app), a push, and
 * Telegram when the customer linked it. This never throws into the caller.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CrmClient } from './crm.client';

export type ScheduleChange = 'SCHEDULED' | 'TIME_CHANGED' | 'TECH_CHANGED' | 'TIME_AND_TECH_CHANGED';

/** Pure: what changed since the customer was last told, or null when nothing needs saying. */
export function scheduleChangeKind(
  now: { start: Date | null; techId: string | null; status: string },
  told: { start: Date | null; techId: string | null },
): ScheduleChange | null {
  // Only a booked visit is announced: it needs a technician, a time, and the SCHEDULED status.
  if (now.status !== 'SCHEDULED' || !now.techId || !now.start) return null;
  if (!told.techId || !told.start) return 'SCHEDULED';
  const time = told.start.getTime() !== now.start.getTime();
  const tech = told.techId !== now.techId;
  if (time && tech) return 'TIME_AND_TECH_CHANGED';
  if (time) return 'TIME_CHANGED';
  if (tech) return 'TECH_CHANGED';
  return null;
}

@Injectable()
export class ScheduleNoticeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleNoticeService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService, @Optional() private readonly crm?: CrmClient) {}

  onModuleInit() {
    // Set on a standby copy of this service, so two copies never both send.
    if (process.env.DISABLE_SCHEDULED_TASKS === 'true' || process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      this.sendDue().catch((err: Error) => this.logger.warn(`queued notices failed: ${err.message}`));
    }, 15_000);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Called whenever a job's time, technician or status might have changed. The customer is
   * told after things have been quiet for a while (SCHEDULE_NOTICE_DELAY_SECONDS, default 120),
   * so a dispatcher fixing a time in three drags sends one message about the final time.
   * With the delay at 0 the message goes straight away.
   */
  async announce(companyId: string, jobId: string): Promise<{ sent: boolean; queued?: boolean; change?: ScheduleChange }> {
    try {
      const delay = Number(process.env.SCHEDULE_NOTICE_DELAY_SECONDS ?? 120);
      if (!(delay > 0)) return await this.run(companyId, jobId);
      const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId } });
      if (!job) return { sent: false };
      const due = scheduleChangeKind(
        { start: job.scheduledStart ?? null, techId: job.assignedToId ?? null, status: String(job.status) },
        { start: job.notifiedStart ?? null, techId: job.notifiedTechId ?? null },
      );
      if (!due) {
        // Nothing to say (or the technician was taken off): settle the record now, drop any queued message.
        if (job.noticeDueAt) await this.prisma.job.updateMany({ where: { id: jobId, companyId }, data: { noticeDueAt: null } });
        return await this.run(companyId, jobId);
      }
      await this.prisma.job.updateMany({ where: { id: jobId, companyId }, data: { noticeDueAt: new Date(Date.now() + delay * 1000) } });
      return { sent: false, queued: true, change: due };
    } catch (err) {
      this.logger.warn(`schedule notice for ${jobId} failed: ${err instanceof Error ? err.message : String(err)}`);
      return { sent: false };
    }
  }

  /** Sends every queued message whose quiet period is over. Run on a timer. */
  async sendDue(): Promise<number> {
    const due = await this.prisma.job.findMany({ where: { noticeDueAt: { lte: new Date() } }, select: { id: true, companyId: true }, take: 50 });
    let sent = 0;
    for (const j of due) {
      // Claim it first: another copy of this service must not send the same message.
      const claimed = await this.prisma.job.updateMany({ where: { id: j.id, noticeDueAt: { lte: new Date() } }, data: { noticeDueAt: null } });
      if (claimed.count === 0) continue;
      try {
        if ((await this.run(j.companyId, j.id)).sent) sent += 1;
      } catch (err) {
        this.logger.warn(`queued schedule notice for ${j.id} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return sent;
  }

  private async run(companyId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) return { sent: false };

    const told = { start: job.notifiedStart ?? null, techId: job.notifiedTechId ?? null };
    // Taken off the technician: forget what we told them, so the next booking reads as new.
    if (!job.assignedToId) {
      if (told.start || told.techId) {
        await this.prisma.job.updateMany({ where: { id: jobId, companyId }, data: { notifiedStart: null, notifiedTechId: null } });
      }
      return { sent: false };
    }

    const change = scheduleChangeKind({ start: job.scheduledStart ?? null, techId: job.assignedToId, status: String(job.status) }, told);
    if (!change || !job.customerId) return { sent: false };

    // Claim the change first: two triggers at once must not both send.
    const claimed = await this.prisma.job.updateMany({
      where: { id: jobId, companyId, notifiedStart: told.start, notifiedTechId: told.techId },
      data: { notifiedStart: job.scheduledStart, notifiedTechId: job.assignedToId, notifiedAt: new Date(), noticeDueAt: null },
    });
    if (claimed.count === 0) return { sent: false };

    let email = job.customerEmail ?? undefined;
    let name = job.customerName ?? undefined;
    if ((!email || !name) && this.crm) {
      const c = await this.crm.getCustomerContact(companyId, job.customerId).catch(() => undefined);
      email = email ?? c?.email ?? undefined;
      name = name ?? c?.name ?? undefined;
    }

    const isWindow = job.timeMode === 'WINDOW' && !!job.windowStart && !!job.windowEnd;
    const base = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
    try {
      await axios.post(`${base}/automation/events/job-schedule-changed`, {
        companyId, jobId, change,
        customerId: job.customerId, customerName: name ?? 'there', customerEmail: email,
        jobTitle: job.title, jobNumber: job.jobNumber, jobAddress: job.serviceAddress,
        technicianName: job.assignedToName ?? undefined,
        scheduledAt: job.scheduledStart?.toISOString(),
        scheduledEnd: job.scheduledEnd?.toISOString(),
        windowStart: isWindow ? job.windowStart!.toISOString() : undefined,
        windowEnd: isWindow ? job.windowEnd!.toISOString() : undefined,
        previousScheduledAt: told.start?.toISOString(),
        technicianUserId: job.assignedToId,
        previousTechnicianUserId: told.techId ?? undefined,
      }, { headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '' }, timeout: 10_000 });
    } catch (err) {
      // Not delivered: hand the claim back so the next trigger tries again.
      await this.prisma.job.updateMany({
        where: { id: jobId, companyId },
        data: { notifiedStart: told.start, notifiedTechId: told.techId },
      }).catch(() => undefined);
      throw err;
    }
    return { sent: true, change };
  }
}
