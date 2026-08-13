import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { AuthUser, Role, RescheduleStatus } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { RescheduleService } from './reschedule.service';
import { SchedulingClient } from './scheduling.client';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { ApplyRescheduleDto } from './dto/reschedule.dto';
import { JobEventsPublisher } from '../realtime/job-events.publisher';

/** Roles that may move a job on the calendar. Dispatchers run the schedule. */
const APPLY_ROLES: Role[] = [
  Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER,
];

/** Applying to any of these would resurrect a finished or dead job. */
const TERMINAL_STATUSES = ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_SITE'];

/**
 * RescheduleApplyService — commits an agreed time to the calendar.
 *
 * The only code in the feature that mutates a customer's appointment, which is
 * why it lives apart from the negotiation. Four writes in one transaction, then
 * two best-effort follow-ups (release the technician, tell the customer).
 */
@Injectable()
export class RescheduleApplyService {
  private readonly logger = new Logger(RescheduleApplyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: RescheduleService,
    private readonly scheduling: SchedulingClient,
    private readonly notify: RescheduleNotifyClient,
    private readonly events: JobEventsPublisher,
  ) {}

  async apply(user: AuthUser, requestId: string, dto: ApplyRescheduleDto) {
    // Re-checked here, not just in the @Roles guard — the calendar is the one
    // thing in this feature a customer must never be able to move.
    if (!APPLY_ROLES.includes(user.role as Role)) {
      throw new ForbiddenException('Only staff can apply a reschedule to the calendar');
    }

    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    if (request.status !== RescheduleStatus.SLOT_PICKED || !request.pickedSlotId) {
      throw new BadRequestException('No time has been agreed on this request yet');
    }

    const slot = request.slots.find((s) => s.id === request.pickedSlotId);
    if (!slot) throw new BadRequestException('The agreed slot no longer exists on this request');
    if (slot.startAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'The agreed time has already passed — propose a new time instead');
    }

    const job = request.job;

    if (TERMINAL_STATUSES.includes(job.status)) {
      // Auto-close so it stops sitting in the inbox forever.
      await this.prisma.$transaction(async (tx) => {
        await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.SLOT_PICKED },
          data: { status: RescheduleStatus.CANCELLED },
        });
        await tx.job.update({ where: { id: job.id }, data: { rescheduleState: null } });
      });
      throw new BadRequestException(
        `This job is already ${job.status} and can no longer be rescheduled. ` +
        'The request has been closed.',
      );
    }

    // A technician may have set off after the customer picked a slot. Cancelling
    // them mid-drive is a decision a human has to make explicitly — the inbox's
    // one-click Apply never sends confirmEnRoute.
    if (job.status === 'EN_ROUTE' && !dto.confirmEnRoute) {
      throw new ConflictException(
        `${job.assignedToName ?? 'A technician'} is already on the way to this job. ` +
        'Confirm the reschedule to cancel that visit, or handle it as a no-show.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Conditional claim: two staff applying at once must not both write the
      // calendar and both email the customer a different time.
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: RescheduleStatus.SLOT_PICKED },
        data: { status: RescheduleStatus.APPLIED, appliedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException('This reschedule was just applied by someone else');
      }

      await tx.job.update({
        where: { id: job.id },
        data: {
          scheduledStart: slot.startAt,
          scheduledEnd: slot.endAt,
          // Auto-unassign: the agreed time may not suit whoever was booked, so
          // the job returns to the dispatch queue to be re-assigned.
          assignedToId: null,
          assignedToName: null,
          status: 'PENDING' as any,
          rescheduleState: null,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId: job.id,
          fromStatus: job.status as any,
          toStatus: 'PENDING' as any,
          changedById: user.userId,
          changedByName: user.name ?? user.email,
          note: `Rescheduled to ${slot.startAt.toISOString()} — returned to the dispatch queue`,
        },
      });
    });

    // The board must reflect this immediately: the job jumped to a new time, lost
    // its technician, and reappeared in the unassigned queue. A dispatcher
    // watching a stale board would otherwise still see it booked.
    this.events.publish(user.companyId, {
      jobId: job.id, change: 'RESCHEDULE',
      status: 'PENDING', previousStatus: job.status,
      scheduledStart: slot.startAt.toISOString(),
      assignedToId: null, assignedToName: null,
      rescheduleState: null,
      jobNumber: (job as any).jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId,
    });

    // Best-effort, after the transaction. A stale assignment is visible on the
    // dispatch board and fixable; a rolled-back calendar change is not.
    await this.scheduling.cancelAssignmentForJob(user.companyId, job.id);

    const applied = await this.core.findRequest(user.companyId, requestId);

    this.notify.applied(user.companyId, { job: job as any, request: applied as any })
      .catch((err: unknown) => this.logger.warn(`Reschedule applied notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return applied;
  }
}
