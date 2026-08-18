import {
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

// Roles allowed to correct a job's status outside the normal forward-moving
// state machine (dto.force = true) — e.g. undoing a technician's mis-tap.
const STATUS_OVERRIDE_ROLES: Role[] = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER];

const CREATE_JOB_MAX_ATTEMPTS = 5;
const STATS_CACHE_TTL_S = 30;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
    private readonly events: JobEventsPublisher,
    private readonly crmClient: CrmClient,
  ) {}

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
          scheduledStart: job.scheduledStart?.toISOString() ?? null,
          jobNumber: job.jobNumber, title: job.title,
          customerName: job.customerName, actorUserId: user.userId,
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

  async remove(companyId: string, id: string) {
    const existing = await this.prisma.job.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Job ${id} not found`);

    // WorkOrder relation does not cascade on delete in this schema.
    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.deleteMany({ where: { jobId: id } });
      await tx.job.delete({ where: { id } });
    });

    await this.invalidateStatsCache(companyId);
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

    this.events.publish(companyId, {
      jobId, change: 'STATUS', status: newStatus, previousStatus: currentStatus,
      assignedToId: (updated as any).assignedToId ?? null,
      assignedToName: (updated as any).assignedToName ?? null,
      jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId,
    });

    // EN_ROUTE uses its own richer pipeline (tech photo + real ETA window) via
    // scheduling-service → POST /notifications/en-route — not this one.
    // Every other customer-visible transition gets a status email from here.
    const NOTIFIABLE_STATUSES: JobStatusDto[] = [
      JobStatusDto.EN_ROUTE, JobStatusDto.SCHEDULED, JobStatusDto.ON_SITE,
      JobStatusDto.COMPLETED, JobStatusDto.CANCELLED, JobStatusDto.ON_HOLD,
    ];
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
          : { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
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
        data: { scheduledStart: start, scheduledEnd: resolvedEnd },
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
      scheduledStart: start.toISOString(),
      actorUserId: user.userId,
    });

    return updated;
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
  ) {
    await this.findOne(companyId, id);
    // Strip fields that don't exist on the Prisma Job model
    const { gpsTrackingEnabled: _gps, ...rest } = data;
    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        priority: rest.priority as any,
        scheduledStart: rest.scheduledStart ? new Date(rest.scheduledStart) : undefined,
        scheduledEnd: rest.scheduledEnd ? new Date(rest.scheduledEnd) : undefined,
        completedAt: rest.completedAt ? new Date(rest.completedAt) : undefined,
      },
    });
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
    }>,
  ) {
    await this.findOne(companyId, id);
    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        priority: data.priority as any,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
      },
    });
    // Generic PATCH can change status/scheduledStart (the admin UI's status
    // dropdown goes through here) — the cached stat counts must not lag it.
    await this.invalidateStatsCache(companyId);
    return updated;
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
