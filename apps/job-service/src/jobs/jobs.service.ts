import {
  Optional,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis-cache.service';
import { Prisma } from '../prisma/generated';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto, JobStatusDto, STATUS_TRANSITIONS } from './dto/update-job-status.dto';
import { AuthUser, PaginatedResponse, Role, clampPagination } from '@tscrm/types';
import { JobEventsPublisher } from '../realtime/job-events.publisher';
import { CrmClient } from './crm.client';
import { ScheduleNoticeService } from './schedule-notice.service';
import { serviceAuthHeaders } from '@tscrm/auth-client';

// Roles allowed to correct a job's status outside the normal forward-moving
// state machine (dto.force = true) — e.g. undoing a technician's mis-tap.
const STATUS_OVERRIDE_ROLES: Role[] = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER];

const CREATE_JOB_MAX_ATTEMPTS = 5;
const STATS_CACHE_TTL_S = 30;

/** Who made a change, carried into the realtime event for the board's toast. */
export interface JobActor { userId: string; name?: string }

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
    private readonly events: JobEventsPublisher,
    private readonly crmClient: CrmClient,
    @Optional() private readonly scheduleNotice?: ScheduleNoticeService,
  ) {}

  /** Same as announceSchedule, but waits for the outcome (used by the endpoint scheduling-service calls). */
  async announceScheduleNow(companyId: string, jobId: string) {
    return this.scheduleNotice ? this.scheduleNotice.announce(companyId, jobId) : { sent: false };
  }

  /** Tell the customer if their booked visit now has a different time or technician. Never blocks. */
  private announceSchedule(companyId: string, jobId: string) {
    void this.scheduleNotice?.announce(companyId, jobId);
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(user: AuthUser, dto: CreateJobDto) {
    const { customFields, currency, ...rest } = dto;
    const resolvedCurrency = currency || (await this.crmClient.getDefaultCurrency(user.companyId));

    for (let attempt = 1; attempt <= CREATE_JOB_MAX_ATTEMPTS; attempt += 1) {
      try {
        const job = await this.prisma.$transaction(async (tx) => {
          const jobNumber = await this.generateJobNumber(tx, user.companyId);

          const createdJob = await tx.job.create({
            data: {
              ...rest,
              companyId: user.companyId,
              jobNumber,
              currency: resolvedCurrency,
              priority: (rest.priority ?? 'NORMAL') as any,
              scheduledStart: rest.scheduledStart ? new Date(rest.scheduledStart) : undefined,
              scheduledEnd: rest.scheduledEnd ? new Date(rest.scheduledEnd) : undefined,
              windowStart: rest.windowStart ? new Date(rest.windowStart) : undefined,
              windowEnd: rest.windowEnd ? new Date(rest.windowEnd) : undefined,
              createdByUserId: user.userId,
              statusHistory: {
                create: {
                  toStatus: 'PENDING',
                  changedById: user.userId,
                  changedByName: user.name ?? user.email,
                  note: 'Job created',
                },
              },
              // If a template is specified, pre-create work order task completions
            },
            include: {
              jobType: true,
              template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } },
              customFieldValues: { include: { fieldDef: true } },
            },
          });

          if (customFields?.length) {
            await Promise.all(
              customFields.map((cf) =>
                tx.jobCustomFieldValue.upsert({
                  where: { jobId_fieldDefId: { jobId: createdJob.id, fieldDefId: cf.fieldDefId } },
                  update: { value: cf.value as any },
                  create: { jobId: createdJob.id, fieldDefId: cf.fieldDefId, value: cf.value as any },
                }),
              ),
            );
          }

          return createdJob;
        });

        await this.invalidateStatsCache(user.companyId);

        this.events.publish(user.companyId, {
          jobId: job.id, change: 'CREATED', status: job.status,
          customerId: job.customerId,
          scheduledStart: job.scheduledStart?.toISOString() ?? null,
          jobNumber: job.jobNumber, title: job.title,
          customerName: job.customerName, actorUserId: user.userId, actorName: user.name ?? user.email,
        });

        // Best-effort confirmation email to the customer — never blocks job creation.
        if (job.customerEmail) {
          const commsBase = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
          axios.post(`${commsBase}/automation/events/job-status-changed`, {
            companyId: user.companyId,
            jobId: job.id,
            jobStatus: 'PENDING',
            customerId: job.customerId,
            customerName: job.customerName,
            customerEmail: job.customerEmail,
            jobAddress: job.serviceAddress,
            jobTitle: job.title,
            jobNumber: job.jobNumber,
            scheduledAt: job.scheduledStart?.toISOString() ?? undefined,
          }, { headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '' } }).catch((err: unknown) => {
            this.logger.warn(`Failed to notify comms-service of job creation: ${err instanceof Error ? err.message : String(err)}`);
          });
        }

        return this.findOne(user.companyId, job.id);
      } catch (error) {
        if (!this.isJobNumberUniqueError(error) || attempt === CREATE_JOB_MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to create job with a unique job number');
  }

  // ============================================================
  // LIST (paginated, filterable)
  // ============================================================

  async findAll(
    companyId: string,
    pageInput: number | string = 1,
    limitInput: number | string = 20,
    filters: {
      status?: string;
      assignedToId?: string;
      /** Matches anyone in the crew, lead or not. assignedToId only matches the
       *  lead, so a helper would never see their own job without this. */
      crewUserId?: string;
      jobTypeId?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      agreementId?: string;
      projectId?: string;
      projectIds?: string[];
      componentId?: string;
      equipmentId?: string;
      isAgreementJob?: boolean;
    } = {},
  ): Promise<PaginatedResponse<unknown>> {
    // The admin Jobs page and Scheduling board both fetch the company's full
    // job list in one shot (limit: 200) rather than paging through a table —
    // the default 100-row cap silently truncated that request to 100, so any
    // job sorted past row 100 (including housing-scheme/project jobs with an
    // ordinary scheduledStart date) never made it into the response at all.
    // Batch (multi-project) requests get an even higher ceiling since they
    // cover many projects in one page.
    const { page, limit, skip } = clampPagination(
      { page: pageInput, limit: limitInput },
      { maxLimit: filters.projectIds?.length ? 500 : 250 },
    );
    const where: any = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.crewUserId) where.crewUserIds = { has: filters.crewUserId };
    if (filters.jobTypeId) where.jobTypeId = filters.jobTypeId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.agreementId) where.agreementId = filters.agreementId;
    if (filters.projectId) where.projectId = filters.projectId;
    // Batch form: one request for many projects' jobs (Projects page overview)
    // instead of one request per project.
    if (filters.projectIds?.length) where.projectId = { in: filters.projectIds };
    if (filters.componentId) where.componentId = filters.componentId;
    if (filters.equipmentId) where.equipmentId = filters.equipmentId;
    if (filters.isAgreementJob !== undefined) where.isAgreementJob = filters.isAgreementJob;
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledStart = {};
      if (filters.dateFrom) where.scheduledStart.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.scheduledStart.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.OR = [
        { jobNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { serviceAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        // Postgres/Prisma default NULLS LAST on an ascending sort would push
        // every unscheduled job (scheduledStart = null — e.g. a brand-new
        // customer-submitted booking, or any job not yet dispatched) behind
        // every job that has ever had a scheduled date, company-wide — with a
        // fixed page size and no default status filter, that silently drops
        // new unscheduled jobs off page 1 entirely once a company has more
        // historical scheduled jobs than the page limit. Unscheduled jobs need
        // triage first, so they sort to the front instead.
        orderBy: [{ scheduledStart: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
        include: {
          jobType: { select: { id: true, name: true, slug: true, color: true, icon: true } },
          _count: { select: { workOrders: true, photos: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // GET ONE (full detail)
  // ============================================================

  /** Existence and ownership only: one indexed query instead of the full job. */
  async findOwnership(companyId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, companyId },
      select: { id: true, customerId: true, status: true },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async findOne(companyId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, companyId },
      include: {
        jobType: true,
        template: { include: { tasks: { orderBy: { taskOrder: 'asc' } } } },
        customFieldValues: {
          include: { fieldDef: true },
          orderBy: { fieldDef: { sortOrder: 'asc' } },
        },
        workOrders: {
          include: {
            lineItems: true,
            taskCompletions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        photos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(companyId: string, id: string, actor?: JobActor) {
    const existing = await this.prisma.job.findFirst({
      where: { id, companyId },
      select: { id: true, status: true, customerId: true, jobNumber: true, title: true, customerName: true },
    });
    if (!existing) throw new NotFoundException(`Job ${id} not found`);

    // WorkOrder relation does not cascade on delete in this schema, and the
    // crew rows live in another schema with no foreign key, so both are
    // handled here. Cancelling (including completed rows) takes the job off
    // every technician's schedule and the Active/Completed boards. job_id is
    // TEXT in scheduling, so it is bound as plain text.
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `UPDATE scheduling.dispatch_assignments SET status = 'CANCELLED', updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status <> 'CANCELLED'`,
        id, companyId,
      );
      await tx.workOrder.deleteMany({ where: { jobId: id } });
      await tx.job.delete({ where: { id } });
    });

    await this.invalidateStatsCache(companyId);
    this.events.publish(companyId, {
      jobId: id, change: 'DELETED', status: existing.status,
      customerId: existing.customerId ?? undefined,
      jobNumber: existing.jobNumber, title: existing.title,
      customerName: existing.customerName, actorUserId: actor?.userId, actorName: actor?.name,
    });
    return { success: true, id };
  }

  // ============================================================
  // STATUS TRANSITION (state machine)
  // ============================================================

  async updateStatus(
    companyId: string,
    jobId: string,
    user: AuthUser,
    dto: UpdateJobStatusDto,
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId },
      select: {
        id: true, status: true, customerId: true,
        customerName: true, customerEmail: true,
        serviceAddress: true, assignedToName: true, scheduledStart: true,
        agreementId: true, title: true, jobNumber: true,
      },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const currentStatus = job.status as JobStatusDto;
    const newStatus = dto.status;

    // Assigning through the scheduling board already marks the job SCHEDULED. The board then
    // asks for SCHEDULED again; that is not an error, it is the moment to tell the customer.
    if (currentStatus === JobStatusDto.SCHEDULED && newStatus === JobStatusDto.SCHEDULED) {
      this.announceSchedule(companyId, jobId);
      return this.prisma.job.findFirst({ where: { id: jobId, companyId } });
    }

    // Guard: validate the transition is allowed — unless an admin is
    // deliberately correcting a mistake (dto.force). PAID stays immutable
    // either way: it means money has actually been received and recorded
    // against an invoice, and a status flip here can't undo that, so forcing
    // it would just make the job's status lie about its finance state.
    const allowed = STATUS_TRANSITIONS[currentStatus];
    const isOverride = !!dto.force && allowed && !allowed.includes(newStatus);
    if (isOverride) {
      if (!STATUS_OVERRIDE_ROLES.includes(user.role as Role)) {
        throw new ForbiddenException('Only an admin or office manager can correct a job status outside the normal flow.');
      }
      if (currentStatus === JobStatusDto.PAID || newStatus === JobStatusDto.PAID) {
        throw new BadRequestException('PAID reflects a recorded payment and cannot be set or cleared by a status override.');
      }
    } else if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition job from ${currentStatus} to ${newStatus}. ` +
        `Allowed: [${allowed.join(', ')}]`,
      );
    }

    const now = new Date();
    const extraData: Record<string, unknown> = {};
    if (newStatus === JobStatusDto.ON_SITE) extraData.actualStart = now;
    if (newStatus === JobStatusDto.COMPLETED) extraData.actualEnd = now;
    if (newStatus === JobStatusDto.COMPLETED) extraData.completedAt = now;
    if (newStatus === JobStatusDto.CANCELLED && dto.cancellationReason) {
      extraData.cancellationReason = dto.cancellationReason;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.job.update({
        where: { id: jobId },
        data: { status: newStatus as any, ...extraData },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: currentStatus as any,
          toStatus: newStatus as any,
          changedById: user.userId,
          changedByName: user.name ?? user.email,
          note: isOverride
            ? `[Admin correction] ${currentStatus} → ${newStatus}${dto.note ? ` — ${dto.note}` : ''}`
            : dto.note,
        },
      });

      return result;
    });

    await this.invalidateStatsCache(companyId);

    await this.syncAssignmentsToJobStatus(companyId, jobId, newStatus);

    this.events.publish(companyId, {
      jobId, change: 'STATUS', status: newStatus, previousStatus: currentStatus,
      customerId: job.customerId,
      assignedToId: (updated as any).assignedToId ?? null,
      assignedToName: (updated as any).assignedToName ?? null,
      jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId, actorName: user.name ?? user.email,
    });

    // EN_ROUTE uses its own richer pipeline (tech photo + real ETA window) via
    // scheduling-service → POST /notifications/en-route — not this one.
    // Every other customer-visible transition gets a status email from here.
    const NOTIFIABLE_STATUSES: JobStatusDto[] = [
      JobStatusDto.EN_ROUTE, JobStatusDto.SCHEDULED, JobStatusDto.ON_SITE,
      JobStatusDto.COMPLETED, JobStatusDto.CANCELLED, JobStatusDto.ON_HOLD,
    ];
    if (newStatus === JobStatusDto.SCHEDULED) this.announceSchedule(companyId, jobId);
    if (NOTIFIABLE_STATUSES.includes(newStatus)) {
      const commsBase = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
      const payload = {
        companyId,
        jobId,
        jobStatus: newStatus,
        customerId: job.customerId,
        customerName: job.customerName,
        customerEmail: job.customerEmail ?? undefined,
        jobAddress: job.serviceAddress,
        jobTitle: job.title,
        jobNumber: job.jobNumber,
        technicianName: job.assignedToName ?? undefined,
        scheduledAt: job.scheduledStart?.toISOString() ?? undefined,
        cancellationReason: dto.cancellationReason,
        statusNote: dto.note,
      };
      axios.post(`${commsBase}/automation/events/job-status-changed`, payload, {
        headers: { 'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '' },
      }).catch((err: unknown) => {
        this.logger.warn(`Failed to notify comms-service of ${newStatus}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }

    // Agreement jobs: completing a visit advances the agreement's service
    // schedule in crm-service (lastServiceDate, visitsUsed, nextServiceDate).
    if (newStatus === JobStatusDto.COMPLETED && job.agreementId) {
      const crmBase = process.env.CRM_SERVICE_URL || 'http://localhost:3001';
      const headers: Record<string, string> =
        process.env.BYPASS_AUTH === 'true'
          ? {
              'x-test-user-role': 'super_admin',
              'x-test-company-id': companyId,
              'x-test-user-id': 'job-service',
              'x-test-user-email': 'jobs@tscrm.internal',
              'x-test-user-name': 'Job Service',
            }
          : serviceAuthHeaders(companyId, 'job:status-notifier');
      axios
        .post(`${crmBase}/agreements/${job.agreementId}/record-visit`, { jobId }, { headers, timeout: 8_000 })
        .catch((err: unknown) => {
          this.logger.warn(
            `Failed to record agreement visit for ${job.agreementId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    return updated;
  }

  /**
   * Mirrors an EN_ROUTE / ON_SITE transition onto scheduling's assignment row.
   *
   * These two stores drift. Moving a job through this service updated
   * jobs.jobs and nothing else, so scheduling.dispatch_assignments kept a null
   * en_route_at for any trip that started here rather than in the dispatch
   * board. Measured on live data: only 13 of 33 assignments had the timestamp,
   * which left anything reasoning about when a trip began with no anchor.
   *
   * Written straight across the schema boundary rather than over HTTP because
   * both schemas live in the same database under the same role, so there is no
   * network call to fail and nothing to keep in sync afterwards.
   *
   * Deliberately outside the transaction and swallowed on failure: a technician
   * tapping "On my way" must not get an error because a denormalised timestamp
   * could not be written. The job status itself is the source of truth.
   */
  /**
   * Keeps the dispatch assignments in step with the job's status.
   *
   * Job.status is the truth and the lead drives it, but the scheduling board
   * reads assignment status. Anything that moved only the job (the admin job
   * modal, a status override) used to leave the assignment behind, so a
   * completed job could sit on the Active board as "en route" forever.
   *
   * Travel stages move the lead only (helpers keep their own); finishing or
   * cancelling the job closes every live crew row. A job with no lead recorded
   * (rows from before crews existed) treats all its live rows as the lead.
   */
  private async syncAssignmentsToJobStatus(companyId: string, jobId: string, newStatus: JobStatusDto) {
    const LEAD = `(is_lead OR NOT EXISTS (
        SELECT 1 FROM scheduling.dispatch_assignments l
         WHERE l.job_id = $1 AND l.company_id = $2 AND l.is_lead AND l.status <> 'CANCELLED'))`;
    const statements: string[] = [];
    switch (newStatus) {
      case JobStatusDto.EN_ROUTE:
        // A second trip overwrites the timestamp: the old one described a journey that ended.
        statements.push(`UPDATE scheduling.dispatch_assignments SET en_route_at = now(), updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status <> 'CANCELLED'`);
        statements.push(`UPDATE scheduling.dispatch_assignments SET status = 'EN_ROUTE', updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status <> 'CANCELLED' AND ${LEAD}`);
        break;
      case JobStatusDto.ON_SITE:
        statements.push(`UPDATE scheduling.dispatch_assignments SET on_site_at = now(), updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status <> 'CANCELLED'`);
        statements.push(`UPDATE scheduling.dispatch_assignments SET status = 'ON_SITE', updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status <> 'CANCELLED' AND ${LEAD}`);
        break;
      case JobStatusDto.SCHEDULED:
        statements.push(`UPDATE scheduling.dispatch_assignments SET status = 'ASSIGNED', updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status IN ('EN_ROUTE', 'ON_SITE', 'COMPLETED') AND ${LEAD}`);
        break;
      case JobStatusDto.COMPLETED:
        statements.push(`UPDATE scheduling.dispatch_assignments
            SET status = 'COMPLETED', completed_at = COALESCE(completed_at, now()), updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status NOT IN ('CANCELLED', 'COMPLETED')`);
        break;
      case JobStatusDto.CANCELLED:
        statements.push(`UPDATE scheduling.dispatch_assignments SET status = 'CANCELLED', updated_at = now()
          WHERE job_id = $1 AND company_id = $2 AND status NOT IN ('CANCELLED', 'COMPLETED')`);
        break;
      default:
        return;
    }

    try {
      // job_id is TEXT in scheduling; binding it as plain text matters. A
      // ::uuid cast here fails with "operator does not exist: text = uuid".
      for (const sql of statements) {
        await this.prisma.$executeRawUnsafe(sql, jobId, companyId);
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Could not sync assignments for job ${jobId} to ${newStatus}: ` +
        `${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ============================================================
  // CUSTOMER: change the requested time, before anyone has committed
  // ============================================================

  /**
   * Lets a customer move the time they asked for while the job is still
   * uncommitted — PENDING with no technician assigned.
   *
   * The distinction that makes this safe: on such a job `scheduledStart` is
   * only the preference typed at booking. Nobody has promised it and no
   * technician is holding the slot, so changing it costs the company nothing
   * and needs no approval. The moment a technician is assigned it becomes a
   * commitment, and the customer is redirected to the reschedule negotiation.
   *
   * Deliberately its own method rather than a field on the general PATCH: that
   * endpoint is locked down to a strict whitelist for customers precisely so a
   * customer can never write `scheduledStart` directly on a committed job.
   */
  /**
   * A customer's note for the technician on their own upcoming visit ("gate code
   * is 1234"). Appended to the job notes the technician sees, labelled as the
   * customer's; nothing else on the job can be changed this way.
   */
  async addCustomerNote(user: AuthUser, jobId: string, dto: { note?: string }) {
    if (user.role !== Role.CUSTOMER) throw new ForbiddenException('Notes from here are for customers');
    const note = String(dto?.note ?? '').replace(/\s+/g, ' ').trim();
    if (!note) throw new BadRequestException('The note is empty');
    if (note.length > 300) throw new BadRequestException('Keep the note under 300 characters');
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
      select: { id: true, status: true, customerId: true, notes: true },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (job.customerId !== user.customerId) throw new ForbiddenException('You can only add notes to your own visits');
    if (!['PENDING', 'SCHEDULED', 'EN_ROUTE'].includes(job.status as string)) {
      throw new BadRequestException('This visit has already happened, so a note can no longer be added');
    }
    const line = `From the customer (${new Date().toISOString().slice(0, 10)}): ${note}`;
    const notes = job.notes ? `${job.notes}\n\n${line}` : line;
    if (notes.length > 4000) throw new BadRequestException('The notes for this visit are full. Message the office instead.');
    const updated = await this.prisma.job.update({ where: { id: jobId }, data: { notes } });
    await this.invalidateStatsCache(user.companyId);
    return updated;
  }

  async updatePreferredTime(
    user: AuthUser,
    jobId: string,
    dto: {
      preferredStart: string;
      preferredEnd?: string;
      window?: string;
      note?: string;
    },
  ) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: user.companyId },
      select: {
        id: true, status: true, customerId: true, assignedToId: true,
        assignedToName: true, estimatedDurationMins: true, notes: true,
      },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    if (user.role === Role.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('You can only change your own bookings');
    }

    if (job.status !== JobStatusDto.PENDING) {
      throw new BadRequestException(
        job.status === JobStatusDto.SCHEDULED
          ? 'This visit is already scheduled — request a reschedule instead so we can confirm the new time with you.'
          : `A ${job.status} job's time cannot be changed here.`,
      );
    }

    // Assigned means a human has committed to it, even if the status has not
    // caught up yet. Negotiate rather than move it unilaterally.
    if (job.assignedToId) {
      throw new BadRequestException(
        'A technician has already been assigned — request a reschedule instead so we can confirm the new time.',
      );
    }

    const start = new Date(dto.preferredStart);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('That is not a valid date and time');
    }
    if (start.getTime() <= Date.now()) {
      throw new BadRequestException('Please choose a time in the future');
    }

    const end = dto.preferredEnd ? new Date(dto.preferredEnd) : null;
    if (end && Number.isNaN(end.getTime())) {
      throw new BadRequestException('That is not a valid end time');
    }
    if (end && end.getTime() <= start.getTime()) {
      throw new BadRequestException('The end time must be after the start time');
    }

    const resolvedEnd = end
      ?? new Date(start.getTime() + (job.estimatedDurationMins ?? 120) * 60_000);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.job.update({
        where: { id: jobId },
        data: dto.window
          ? { scheduledStart: start, scheduledEnd: resolvedEnd, timeMode: 'WINDOW', windowStart: start, windowEnd: resolvedEnd }
          : { scheduledStart: start, scheduledEnd: resolvedEnd, timeMode: 'EXACT', windowStart: null, windowEnd: null },
      });

      // Recorded in the job's own history so a dispatcher picking this up later
      // can see the customer moved it themselves, and when.
      await tx.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: JobStatusDto.PENDING as any,
          toStatus: JobStatusDto.PENDING as any,
          changedById: user.userId,
          changedByName: user.name ?? user.email,
          note: `Preferred time changed to ${start.toISOString()}`
            + (dto.window ? ` (${dto.window})` : '')
            + (dto.note ? ` — ${dto.note}` : ''),
        },
      });

      return result;
    });

    await this.invalidateStatsCache(user.companyId);

    this.events.publish(user.companyId, {
      jobId, change: 'SCHEDULE',
      status: job.status,
      customerId: job.customerId,
      scheduledStart: start.toISOString(),
      actorUserId: user.userId, actorName: user.name ?? user.email,
    });

    return updated;
  }

  /**
   * A job that was booked as an arrival window becomes an exact time once a dispatcher
   * moves its start. Saving a form that re-sends the same start changes nothing.
   */
  private async timeModeAfterMove(id: string, newStart?: string): Promise<'EXACT' | undefined> {
    if (!newStart) return undefined;
    const cur = await this.prisma.job.findFirst({ where: { id }, select: { scheduledStart: true, timeMode: true } });
    if (!cur || cur.timeMode !== 'WINDOW') return undefined;
    return cur.scheduledStart?.getTime() === new Date(newStart).getTime() ? undefined : 'EXACT';
  }

  // ============================================================
  // PATCH FIELDS  (used by combined PATCH /jobs/:id endpoint)
  // Accepts extra non-schema fields like gpsTrackingEnabled/completedAt
  // gracefully (they are silently ignored if not in DB schema).
  // ============================================================

  async patchFields(
    companyId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      assignedToId: string;
      assignedToName: string;
      scheduledStart: string;
      scheduledEnd: string;
      notes: string;
      internalNotes: string;
      tags: string[];
      gpsTrackingEnabled?: boolean;  // no DB column — ignored
      completedAt?: string;
      hasPartShortage?: boolean;
      partShortageNote?: string;
    }>,
    opts: { actor?: JobActor; silent?: boolean } = {},
  ) {
    await this.findOwnership(companyId, id);
    // Strip fields that don't exist on the Prisma Job model
    const { gpsTrackingEnabled: _gps, ...rest } = data;
    const timeMode = await this.timeModeAfterMove(id, rest.scheduledStart);
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        timeMode,
        priority: rest.priority as any,
        scheduledStart: rest.scheduledStart ? new Date(rest.scheduledStart) : undefined,
        scheduledEnd: rest.scheduledEnd ? new Date(rest.scheduledEnd) : undefined,
        completedAt: rest.completedAt ? new Date(rest.completedAt) : undefined,
      },
    });
    if (!opts.silent) this.publishEdit(companyId, updated, rest, opts.actor);
    if (rest.scheduledStart !== undefined || rest.assignedToId !== undefined) this.announceSchedule(companyId, id);
    return updated;
  }

  // ============================================================
  // UPDATE (general fields — not status)
  // ============================================================

  async update(
    companyId: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      assignedToId: string;
      assignedToName: string;
      scheduledStart: string;
      scheduledEnd: string;
      notes: string;
      internalNotes: string;
      tags: string[];
      projectId: string | null;
      componentId: string | null;
      equipmentId: string | null;
      currency: string;
      estimatedValue: number;
      /** Drives day-plan packing — see UpdateJobDto for why it's editable. */
      estimatedDurationMins: number;
      /** Target crew size. Guidance for the crew panel's "n of m" counter, not
       *  a constraint the server enforces. */
      requiredTechCount: number;
    }>,
    actor?: JobActor,
  ) {
    await this.findOne(companyId, id);
    const timeMode = await this.timeModeAfterMove(id, data.scheduledStart);
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        timeMode,
        priority: data.priority as any,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      },
    });
    // Generic PATCH can change status/scheduledStart (the admin UI's status
    // dropdown goes through here) — the cached stat counts must not lag it.
    await this.invalidateStatsCache(companyId);
    this.publishEdit(companyId, updated, data, actor);
    if (data.scheduledStart !== undefined || data.assignedToId !== undefined) this.announceSchedule(companyId, id);
    return updated;
  }

  /**
   * Puts a job on the map: from the customer's own pin (share-location link or
   * portal), so dispatch can measure distance. The address text is only filled
   * in when the job had none; the pin is what routing uses.
   */
  async setServiceLocation(
    companyId: string,
    jobId: string,
    loc: { lat: number; lng: number; address?: string },
    actor?: JobActor,
  ) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, companyId }, select: { id: true, serviceAddress: true, internalNotes: true } });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    const address = String(loc.address ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
    const line = `Location shared by the customer on the map (${new Date().toISOString().slice(0, 10)}).`;
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        serviceLatitude: loc.lat,
        serviceLongitude: loc.lng,
        ...(address && !job.serviceAddress?.trim() ? { serviceAddress: address } : {}),
        internalNotes: job.internalNotes ? `${job.internalNotes}\n${line}` : line,
      },
    });
    this.publishEdit(companyId, updated, { serviceLatitude: loc.lat }, actor);
    return updated;
  }

  /** Field edits publish too, or a job edited on one board goes stale on every other open board. */
  private publishEdit(
    companyId: string,
    job: { id: string; status: string; customerId: string | null; jobNumber: string; title: string;
      customerName: string | null; scheduledStart: Date | null; assignedToId: string | null; assignedToName: string | null },
    changed: Record<string, unknown>,
    actor?: JobActor,
  ) {
    const change = changed.assignedToId !== undefined ? 'ASSIGNMENT'
      : changed.scheduledStart !== undefined || changed.scheduledEnd !== undefined ? 'SCHEDULE'
      : 'UPDATED';
    this.events.publish(companyId, {
      jobId: job.id, change, status: job.status,
      customerId: job.customerId ?? undefined,
      scheduledStart: job.scheduledStart?.toISOString() ?? null,
      assignedToId: job.assignedToId, assignedToName: job.assignedToName,
      jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: actor?.userId, actorName: actor?.name,
    });
  }

  // ============================================================
  // CUSTOM FIELD VALUES — update on existing job
  // ============================================================

  async updateCustomFields(
    companyId: string,
    jobId: string,
    fields: Array<{ fieldDefId: string; value: unknown }>,
  ) {
    await this.findOne(companyId, jobId);
    await this.prisma.$transaction(
      fields.map((f) =>
        this.prisma.jobCustomFieldValue.upsert({
          where: { jobId_fieldDefId: { jobId, fieldDefId: f.fieldDefId } },
          update: { value: f.value as any },
          create: { jobId, fieldDefId: f.fieldDefId, value: f.value as any },
        }),
      ),
    );
    return this.findOne(companyId, jobId);
  }

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  async getStats(companyId: string) {
    const cacheKey = `jobs:stats:${companyId}`;
    const cached = await this.cache.get<{ byStatus: unknown[]; scheduledToday: number }>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // One GROUP BY for all status counts + one count for today's schedule —
    // this used to be 10 separate COUNT queries per request.
    const [grouped, scheduledToday] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.job.count({
        where: {
          companyId,
          status: { in: ['SCHEDULED', 'EN_ROUTE', 'ON_SITE'] as any },
          scheduledStart: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    const countByStatus = new Map(grouped.map((g) => [g.status as string, g._count._all]));
    const statuses = [
      'PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE',
      'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_HOLD',
    ];
    const result = {
      byStatus: statuses.map((status) => ({ status, count: countByStatus.get(status) ?? 0 })),
      scheduledToday,
    };
    await this.cache.set(cacheKey, result, STATS_CACHE_TTL_S);
    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async invalidateStatsCache(companyId: string) {
    await this.cache.del(`jobs:stats:${companyId}`);
  }

  private async generateJobNumber(
    tx: Prisma.TransactionClient,
    companyId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const [row] = await tx.$queryRaw<Array<{ maxNumber: number | bigint | null }>>`
      SELECT COALESCE(MAX(SUBSTRING("jobNumber" FROM ${`^JOB-${year}-([0-9]+)$`})::int), 0) AS "maxNumber"
      FROM "jobs"."jobs"
      WHERE "companyId" = ${companyId}
        AND "jobNumber" ~ ${`^JOB-${year}-[0-9]+$`}
    `;
    const maxNumber = Number(row?.maxNumber ?? 0);

    return `JOB-${year}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  private isJobNumberUniqueError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    return Array.isArray(target)
      && target.includes('companyId')
      && target.includes('jobNumber');
  }
}
