import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import {
  AuthUser, Role, clampPagination,
  RescheduleActor, RescheduleMode, RescheduleState, RescheduleStatus,
  STAFF_RESCHEDULABLE_STATUSES, CUSTOMER_RESCHEDULABLE_STATUSES,
} from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventsPublisher } from '../realtime/job-events.publisher';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import {
  OpenRescheduleDto, RespondRescheduleDto, RescheduleResponseAction, SlotInputDto,
} from './dto/reschedule.dto';

/**
 * RescheduleService — the negotiation itself: opening a request, answering one,
 * withdrawing one, and the read models the UI needs.
 *
 * The calendar write lives in RescheduleApplyService, not here. That split keeps
 * the one piece that mutates a customer's appointment (and calls another
 * service) separate from the conversation around it.
 */
@Injectable()
export class RescheduleService {
  private readonly logger = new Logger(RescheduleService.name);

  /** Requests older than this with no answer are flagged red in the inbox. */
  private static readonly STALE_AFTER_MS = 5 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: RescheduleNotifyClient,
    private readonly events: JobEventsPublisher,
  ) {}

  /**
   * Tells every open dispatch board that this job's reschedule badge changed.
   * Best-effort — see JobEventsPublisher.
   */
  private emitRescheduleChange(
    companyId: string,
    job: { id: string; status: string; jobNumber?: string; title?: string; customerName?: string | null },
    rescheduleState: string | null,
    actorUserId?: string,
  ) {
    this.events.publish(companyId, {
      jobId: job.id, change: 'RESCHEDULE', status: job.status,
      rescheduleState, jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName ?? null, actorUserId,
    });
  }

  /** A customer JWT means the customer side; every staff role is the admin side. */
  actorFor(user: AuthUser): RescheduleActor {
    return user.role === Role.CUSTOMER ? RescheduleActor.CUSTOMER : RescheduleActor.ADMIN;
  }

  /** Opening a request always hands the ball to the other side. */
  stateAfterOpen(actor: RescheduleActor): RescheduleState {
    return actor === RescheduleActor.ADMIN
      ? RescheduleState.AWAITING_CUSTOMER
      : RescheduleState.AWAITING_ADMIN;
  }

  /** Who is allowed to answer: the side that did NOT open this round. */
  private ballHolder(request: { openedBy: RescheduleActor }): RescheduleActor {
    return request.openedBy === RescheduleActor.ADMIN
      ? RescheduleActor.CUSTOMER
      : RescheduleActor.ADMIN;
  }

  // ── Open ──────────────────────────────────────────────────────────────────

  async open(user: AuthUser, jobId: string, dto: OpenRescheduleDto) {
    const actor = this.actorFor(user);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    // A customer may only ever touch their own job.
    if (actor === RescheduleActor.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only reschedule your own jobs');
    }

    const allowed = actor === RescheduleActor.ADMIN
      ? STAFF_RESCHEDULABLE_STATUSES
      : CUSTOMER_RESCHEDULABLE_STATUSES;
    if (!(allowed as readonly string[]).includes(job.status)) {
      throw new BadRequestException(
        `A ${job.status} job cannot be rescheduled${
          actor === RescheduleActor.CUSTOMER ? ' — please contact us directly' : ''}.`,
      );
    }

    // The DB's partial unique index is the real guard; this is the friendly error.
    if (job.rescheduleState) {
      throw new BadRequestException(
        'This job already has an open reschedule request. Respond to it instead of opening another.',
      );
    }

    const slots = dto.mode === RescheduleMode.PROPOSE_SLOTS
      ? this.validateSlots(dto.slots ?? [])
      : [];

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rescheduleRequest.create({
        data: {
          companyId: user.companyId,
          jobId,
          openedBy: actor,
          openedByUserId: user.userId,
          openedByName: user.name ?? user.email,
          mode: dto.mode,
          reasonCode: dto.reasonCode,
          reason: dto.reason,
          status: RescheduleStatus.AWAITING_RESPONSE,
          slots: slots.length ? { create: slots } : undefined,
        },
        include: { slots: true },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { rescheduleState: this.stateAfterOpen(actor) },
      });

      return created;
    });

    this.emitRescheduleChange(user.companyId, job as any, this.stateAfterOpen(actor), user.userId);

    // Best-effort: a slow comms-service must never fail the request itself.
    this.notify.requestOpened(user.companyId, { job: job as any, request: request as any })
      .catch((err: unknown) => this.logger.warn(
        `Reschedule open notification failed for job ${jobId}: ${
          err instanceof Error ? err.message : String(err)}`));

    return request;
  }

  /**
   * Slots must be in the future and well-formed. Checked here as well as in the
   * DTO because a slot ultimately overwrites a real appointment — a request that
   * sat in an inbox for three days must not be applicable into the past.
   */
  validateSlots(slots: SlotInputDto[]): { startAt: Date; endAt: Date; window?: string }[] {
    if (slots.length === 0) throw new BadRequestException('Propose at least one time slot');
    const now = Date.now();
    return slots.map((s) => {
      const startAt = new Date(s.startAt);
      const endAt = new Date(s.endAt);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        throw new BadRequestException('Slot times must be valid dates');
      }
      if (endAt.getTime() <= startAt.getTime()) {
        throw new BadRequestException('A slot must end after it starts');
      }
      if (startAt.getTime() <= now) {
        throw new BadRequestException('Proposed slots must be in the future');
      }
      return { startAt, endAt, window: s.window };
    });
  }

  // ── Respond ───────────────────────────────────────────────────────────────

  async respond(user: AuthUser, requestId: string, dto: RespondRescheduleDto) {
    const actor = this.actorFor(user);
    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    if (actor === RescheduleActor.CUSTOMER && request.job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only respond to reschedule requests on your own jobs');
    }
    if (actor !== this.ballHolder(request as any)) {
      throw new ForbiddenException('This request is waiting on the other party, not you');
    }
    if (request.status !== RescheduleStatus.AWAITING_RESPONSE) {
      throw new ConflictException('This request has already been answered');
    }

    const responder = user.name ?? user.email;
    const now = new Date();

    if (dto.action === RescheduleResponseAction.PICK) {
      const slot = request.slots.find((s) => s.id === dto.pickedSlotId);
      if (!slot) throw new BadRequestException('That time slot is not part of this request');
      if (slot.startAt.getTime() <= Date.now()) {
        throw new BadRequestException('That time slot has already passed — please propose a new time');
      }

      // Staff picking IS the confirmation, so the controller applies it in the
      // same request. A customer picking parks at READY_TO_APPLY instead.
      const staffPicked = actor === RescheduleActor.ADMIN;

      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
          data: {
            status: RescheduleStatus.SLOT_PICKED,
            pickedSlotId: slot.id,
            responseNote: dto.note,
            respondedAt: now,
            respondedByName: responder,
          },
        });
        if (claimed.count === 0) {
          throw new ConflictException(
            'This request was just updated by someone else — reload and try again');
        }
        if (!staffPicked) {
          await tx.job.update({
            where: { id: request.jobId },
            data: { rescheduleState: RescheduleState.READY_TO_APPLY },
          });
        }
      });

      const updated = await this.findRequest(user.companyId, requestId);
      if (!staffPicked) {
        this.emitRescheduleChange(
          user.companyId, request.job as any, RescheduleState.READY_TO_APPLY, user.userId);
        this.notify.responded(user.companyId, { job: request.job as any, request: updated as any })
          .catch((err: unknown) => this.logger.warn(`Reschedule response notification failed: ${
            err instanceof Error ? err.message : String(err)}`));
      }
      return { request: updated, shouldApply: staffPicked };
    }

    if (dto.action === RescheduleResponseAction.COUNTER) {
      const slots = this.validateSlots(dto.slots ?? []);
      const created = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.rescheduleRequest.updateMany({
          where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
          data: {
            status: RescheduleStatus.SUPERSEDED,
            responseNote: dto.note,
            respondedAt: now,
            respondedByName: responder,
          },
        });
        if (claimed.count === 0) {
          throw new ConflictException(
            'This request was just updated by someone else — reload and try again');
        }

        const next = await tx.rescheduleRequest.create({
          data: {
            companyId: user.companyId,
            jobId: request.jobId,
            openedBy: actor,
            openedByUserId: user.userId,
            openedByName: responder,
            mode: RescheduleMode.PROPOSE_SLOTS,
            reasonCode: dto.reasonCode!,
            reason: dto.note,
            status: RescheduleStatus.AWAITING_RESPONSE,
            slots: { create: slots },
          },
          include: { slots: true },
        });

        await tx.job.update({
          where: { id: request.jobId },
          data: { rescheduleState: this.stateAfterOpen(actor) },
        });

        return next;
      });

      this.emitRescheduleChange(
        user.companyId, request.job as any, this.stateAfterOpen(actor), user.userId);

      this.notify.responded(user.companyId, { job: request.job as any, request: created as any })
        .catch((err: unknown) => this.logger.warn(`Reschedule counter notification failed: ${
          err instanceof Error ? err.message : String(err)}`));

      return { request: created, shouldApply: false };
    }

    // DECLINE — the negotiation ends and the existing appointment stands.
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: RescheduleStatus.AWAITING_RESPONSE },
        data: {
          status: RescheduleStatus.DECLINED,
          responseNote: dto.note,
          respondedAt: now,
          respondedByName: responder,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException(
          'This request was just updated by someone else — reload and try again');
      }
      await tx.job.update({ where: { id: request.jobId }, data: { rescheduleState: null } });
    });

    const declined = await this.findRequest(user.companyId, requestId);
    this.emitRescheduleChange(user.companyId, request.job as any, null, user.userId);
    this.notify.closed(user.companyId, { job: request.job as any, request: declined as any })
      .catch((err: unknown) => this.logger.warn(`Reschedule decline notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return { request: declined, shouldApply: false };
  }

  // ── Cancel / reads ────────────────────────────────────────────────────────

  async cancel(user: AuthUser, requestId: string) {
    const actor = this.actorFor(user);
    const request = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId: user.companyId },
      include: { slots: true, job: true },
    });
    if (!request) throw new NotFoundException(`Reschedule request ${requestId} not found`);

    // You may only withdraw your own ask. Staff withdrawing a customer's request
    // would silently erase what the customer asked for.
    if (request.openedBy !== actor) {
      throw new ForbiddenException('Only the party who opened a request can withdraw it');
    }
    if (actor === RescheduleActor.CUSTOMER && request.job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only withdraw requests on your own jobs');
    }
    const live: RescheduleStatus[] = [RescheduleStatus.AWAITING_RESPONSE, RescheduleStatus.SLOT_PICKED];
    if (!live.includes(request.status as RescheduleStatus)) {
      throw new ConflictException('This request is already closed');
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.rescheduleRequest.updateMany({
        where: { id: requestId, status: { in: live } },
        data: { status: RescheduleStatus.CANCELLED, respondedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException(
          'This request was just updated by someone else — reload and try again');
      }
      await tx.job.update({ where: { id: request.jobId }, data: { rescheduleState: null } });
    });

    const cancelled = await this.findRequest(user.companyId, requestId);
    this.emitRescheduleChange(user.companyId, request.job as any, null, user.userId);
    this.notify.closed(user.companyId, { job: request.job as any, request: cancelled as any })
      .catch((err: unknown) => this.logger.warn(`Reschedule cancel notification failed: ${
        err instanceof Error ? err.message : String(err)}`));

    return cancelled;
  }

  async findRequest(companyId: string, requestId: string) {
    const found = await this.prisma.rescheduleRequest.findFirst({
      where: { id: requestId, companyId },
      include: { slots: { orderBy: { startAt: 'asc' } } },
    });
    if (!found) throw new NotFoundException(`Reschedule request ${requestId} not found`);
    return found;
  }

  async history(user: AuthUser, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
      select: { id: true, customerId: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (this.actorFor(user) === RescheduleActor.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.rescheduleRequest.findMany({
      where: { companyId: user.companyId, jobId },
      orderBy: { createdAt: 'desc' },
      include: { slots: { orderBy: { startAt: 'asc' } } },
    });
  }

  /**
   * Everything waiting on a staff member: rounds a customer opened, plus rounds
   * where a customer has picked one of our slots.
   *
   * The "is this ours?" test lives in the WHERE clause rather than being applied
   * to the fetched page. Filtering after `take` would mean a company with more
   * than one page of staff-opened rounds (which are *not* staff work — the ball
   * is with the customer) could return an empty page 1 while real work sat on
   * page 2, and would report an inflated `total`.
   */
  async inbox(companyId: string, page: number | string = 1, limit: number | string = 20) {
    const { page: p, limit: l, skip } = clampPagination({ page, limit });
    const where = {
      companyId,
      OR: [
        { status: RescheduleStatus.SLOT_PICKED },
        { status: RescheduleStatus.AWAITING_RESPONSE, openedBy: RescheduleActor.CUSTOMER },
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.rescheduleRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' },   // oldest first — the ones at risk float up
        skip,
        take: l,
        include: {
          slots: { orderBy: { startAt: 'asc' } },
          job: {
            select: {
              id: true, jobNumber: true, title: true, customerName: true,
              customerEmail: true, scheduledStart: true, status: true, assignedToName: true,
            },
          },
        },
      }),
      this.prisma.rescheduleRequest.count({ where }),
    ]);

    const now = Date.now();
    return {
      data: rows.map((r) => ({
        request: r,
        job: (r as any).job,
        isStale: now - r.createdAt.getTime() > RescheduleService.STALE_AFTER_MS,
      })),
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    };
  }

  async stats(companyId: string, from?: string, to?: string) {
    const createdAt = from || to
      ? { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) }
      : undefined;
    const where = { companyId, ...(createdAt ? { createdAt } : {}) };

    const [byReasonRows, byActorRows, total, applied, declined] = await Promise.all([
      this.prisma.rescheduleRequest.groupBy({ by: ['reasonCode'], where, _count: { _all: true } }),
      this.prisma.rescheduleRequest.groupBy({ by: ['openedBy'], where, _count: { _all: true } }),
      this.prisma.rescheduleRequest.count({ where }),
      this.prisma.rescheduleRequest.count({ where: { ...where, status: RescheduleStatus.APPLIED } }),
      this.prisma.rescheduleRequest.count({ where: { ...where, status: RescheduleStatus.DECLINED } }),
    ]);

    return {
      byReason: Object.fromEntries(byReasonRows.map((r: any) => [r.reasonCode, r._count._all])),
      byActor: Object.fromEntries(byActorRows.map((r: any) => [r.openedBy, r._count._all])),
      total, applied, declined,
    };
  }
}
