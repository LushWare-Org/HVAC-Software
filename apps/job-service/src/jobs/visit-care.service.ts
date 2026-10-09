/**
 * Looking after a booked visit: the customer confirming the time, reminders the evening before
 * and a few hours ahead (to the customer and the technician), and reminders sent on request
 * (Kelvin, the office). comms-service does the sending on every channel.
 */
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventsPublisher } from '../realtime/job-events.publisher';
import { Role, type AuthUser } from '@tscrm/types';
import { CrmClient } from './crm.client';
import { isConfirmed, reminderDue, visitStart } from './visit-care';

export type ReminderAudience = 'customer' | 'technician' | 'both';
export type ReminderChannel = 'message' | 'email' | 'push';
const SOON_HOURS = () => Number(process.env.REMINDER_SOON_HOURS ?? 3) || 3;

@Injectable()
export class VisitCareService {
  private readonly logger = new Logger(VisitCareService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly crm?: CrmClient,
    @Optional() private readonly events?: JobEventsPublisher,
  ) {}

  /** The customer (or the office, on their behalf) confirms the time the visit has now. */
  async confirm(companyId: string, jobId: string, user: AuthUser) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (user.role === Role.CUSTOMER && job.customerId !== user.customerId) throw new ForbiddenException('You can only confirm your own visits');
    if (!job.scheduledStart || !['SCHEDULED', 'PENDING'].includes(String(job.status))) {
      throw new BadRequestException('There is no booked time to confirm yet');
    }
    if (isConfirmed(job)) return { confirmed: true, already: true };
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.job.update({ where: { id: jobId }, data: { confirmedAt: now, confirmedFor: job.scheduledStart } }),
      this.prisma.jobStatusHistory.create({
        data: {
          jobId, fromStatus: job.status as any, toStatus: job.status as any,
          changedById: user.userId, changedByName: user.name ?? user.email,
          note: user.role === Role.CUSTOMER ? 'Customer confirmed the visit time' : `Visit time confirmed with the customer by ${user.name ?? user.email}`,
        },
      }),
    ]);
    this.events?.publish(companyId, {
      jobId, change: 'UPDATED', status: String(job.status), customerId: job.customerId ?? undefined,
      scheduledStart: job.scheduledStart.toISOString(), jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId, actorName: user.name ?? user.email,
    });
    return { confirmed: true, confirmedAt: now.toISOString() };
  }

  /** Sends one reminder now, on the channels asked for. Returns what happened per person and channel. */
  async sendReminder(
    companyId: string, jobId: string,
    opts: { kind?: 'EVE' | 'SOON' | 'MANUAL'; audience?: ReminderAudience; channels?: ReminderChannel[] } = {},
  ): Promise<Record<string, unknown>> {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (!job.scheduledStart || !['SCHEDULED', 'PENDING', 'ON_HOLD'].includes(String(job.status))) {
      throw new BadRequestException('This visit is not waiting for a reminder');
    }
    let email = job.customerEmail ?? undefined;
    let name = job.customerName ?? undefined;
    if ((!email || !name) && job.customerId && this.crm) {
      const c = await this.crm.getCustomerContact(companyId, job.customerId).catch(() => undefined);
      email = email ?? c?.email ?? undefined;
      name = name ?? c?.name ?? undefined;
    }
    const isWindow = job.timeMode === 'WINDOW' && !!job.windowStart && !!job.windowEnd;
    const base = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
    const { data } = await axios.post(`${base}/automation/events/visit-reminder`, {
      companyId, jobId, kind: opts.kind ?? 'MANUAL', audience: opts.audience ?? 'both', channels: opts.channels,
      customerId: job.customerId, customerName: name, jobTitle: job.title, jobNumber: job.jobNumber, jobAddress: job.serviceAddress,
      technicianUserId: job.assignedToId, technicianName: job.assignedToName,
      scheduledAt: job.scheduledStart.toISOString(),
      windowStart: isWindow ? job.windowStart!.toISOString() : undefined, windowEnd: isWindow ? job.windowEnd!.toISOString() : undefined,
      confirmed: isConfirmed(job),
    }, { headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '' }, timeout: 20_000 });
    return data ?? {};
  }

  /** Looks at every booked visit in the next day and a half and sends the reminders that have come due. */
  async sweep(now = new Date()): Promise<{ scanned: number; sent: number }> {
    const jobs = await this.prisma.job.findMany({
      where: { status: 'SCHEDULED', assignedToId: { not: null }, scheduledStart: { gte: new Date(now.getTime() - 60_000), lte: new Date(now.getTime() + 40 * 3_600_000) } },
      take: 500,
    });
    const zones = new Map<string, string>();
    let sent = 0;
    for (const job of jobs) {
      try {
        if (!zones.has(job.companyId)) zones.set(job.companyId, (await this.crm?.getTimezone(job.companyId)) ?? 'UTC');
        const kind = reminderDue(job, now, zones.get(job.companyId)!, { soonHours: SOON_HOURS() });
        if (!kind) continue;
        const start = visitStart(job)!;
        // Claim it for this start time first, so a second sweep (or a second copy of the service) skips it.
        const field = kind === 'EVE' ? 'remindedEveFor' : 'remindedSoonFor';
        const before = (kind === 'EVE' ? job.remindedEveFor : job.remindedSoonFor) ?? null;
        const claimed = await this.prisma.job.updateMany({
          where: { id: job.id, [field]: before },
          data: { [field]: start },
        });
        if (claimed.count === 0) continue;
        try {
          await this.sendReminder(job.companyId, job.id, { kind, audience: 'both' });
          sent += 1;
        } catch (err) {
          await this.prisma.job.updateMany({ where: { id: job.id }, data: { [field]: before } }).catch(() => undefined);
          throw err;
        }
      } catch (err) {
        this.logger.warn(`reminder for job ${job.id} failed: ${(err as Error).message}`);
      }
    }
    return { scanned: jobs.length, sent };
  }
}
