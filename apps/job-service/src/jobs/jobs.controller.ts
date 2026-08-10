import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  DefaultValuePipe, ParseIntPipe, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum, IsBoolean, IsDateString, IsNumber } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { JobsService } from './jobs.service';
import { CrmClient } from './crm.client';
import { CreateJobDto, JobPriorityDto } from './dto/create-job.dto';
import { UpdateJobStatusDto, JobStatusDto, UpdatePreferredTimeDto } from './dto/update-job-status.dto';

class UpdateJobDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(JobPriorityDto) priority?: JobPriorityDto;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() assignedToName?: string;
  @IsOptional() @IsString() scheduledStart?: string;
  @IsOptional() @IsString() scheduledEnd?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() internalNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsNumber() estimatedValue?: number;
  @IsOptional() @IsString() cancellationReason?: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() houseId?: string;
  @IsOptional() @IsString() equipmentId?: string;
}

// Combined PATCH DTO — allows updating fields AND status in one request
class PatchJobDto extends UpdateJobDto {
  @IsOptional() @IsEnum(JobStatusDto) status?: JobStatusDto;
  @IsOptional() @IsString() statusNote?: string;
  // Admin correction — see UpdateJobStatusDto.force. Re-validated by role in
  // JobsService.updateStatus regardless of what the client sends.
  @IsOptional() @IsBoolean() force?: boolean;
  @IsOptional() @IsBoolean() gpsTrackingEnabled?: boolean;
  @IsOptional() @IsString() completedAt?: string;
  @IsOptional() @IsBoolean() hasPartShortage?: boolean;
  @IsOptional() @IsString() partShortageNote?: string;
}

class UpdateCustomFieldsDto {
  @IsArray() fields!: Array<{ fieldDefId: string; value: unknown }>;
}

/**
 * The only PATCH fields a CUSTOMER may set on their own job.
 *
 * A whitelist, deliberately — the previous guard blacklisted `status` alone,
 * which let a customer write every other field on PatchJobDto: moving
 * `scheduledStart` on a committed appointment (bypassing the reschedule
 * negotiation entirely), assigning themselves a technician via
 * `assignedToId`/`assignedToName`, writing into staff-only `internalNotes`, and
 * rewriting `estimatedValue`, which feeds dashboards and forecasts.
 *
 * Keep this list minimal. Anything a customer legitimately needs to change gets
 * its own purpose-built, separately-authorised endpoint (see RescheduleModule
 * for how appointment times are negotiated) rather than being added here.
 */
const CUSTOMER_PATCHABLE_FIELDS = ['status', 'statusNote', 'cancellationReason'] as const;

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly crmClient: CrmClient,
  ) {}

  // ---- Stats (dashboard) ----
  @Get('stats')
  @ApiOperation({ summary: 'Get job counts by status + today\'s schedule' })
  getStats(@CurrentUser() user: AuthUser) {
    return this.jobsService.getStats(user.companyId);
  }

  // ---- List ----
  @Get()
  @ApiOperation({ summary: 'List jobs (paginated, filterable by status/technician/date)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: JobStatusDto })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'jobTypeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date e.g. 2024-01-01' })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('jobTypeId') jobTypeId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('customerId') customerId?: string,
    @Query('agreementId') agreementId?: string,
    @Query('projectId') projectId?: string,
    @Query('projectIds') projectIds?: string,
    @Query('houseId') houseId?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('isAgreementJob') isAgreementJob?: string,
  ) {
    // CUSTOMER role: force-filter to their own customerId for security — EXCEPT
    // when querying a specific houseId they actually own. A house-linked job's
    // customerId is whoever was picked when the job was created (often the
    // Housing Scheme project's own top-level customer, not the individual house
    // owner), so AND-ing customerId with houseId would silently hide a
    // homeowner's own service history for jobs booked under the project's
    // customer instead of theirs. Ownership of the house is what actually
    // authorizes seeing its jobs, not a customerId match on each job row.
    let effectiveCustomerId = user.role === Role.CUSTOMER ? user.customerId : customerId;
    if (user.role === Role.CUSTOMER && houseId) {
      const ownerCustomerId = await this.crmClient.getHouseOwnerCustomerId(user.companyId, houseId);
      if (ownerCustomerId && ownerCustomerId === user.customerId) {
        effectiveCustomerId = undefined;
      } else {
        throw new ForbiddenException('You can only view jobs for your own house');
      }
    }

    return this.jobsService.findAll(user.companyId, page, limit, {
      status, assignedToId, jobTypeId, search, dateFrom, dateTo,
      customerId: effectiveCustomerId,
      agreementId,
      projectId,
      projectIds: projectIds ? projectIds.split(',').filter(Boolean) : undefined,
      houseId,
      equipmentId,
      isAgreementJob: isAgreementJob === undefined ? undefined : isAgreementJob === 'true',
    });
  }

  // ---- Get one ----
  @Get(':id')
  @ApiOperation({ summary: 'Get full job detail (with work orders, custom fields, history)' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const job = await this.jobsService.findOne(user.companyId, id) as any;
    // CUSTOMER: verify they own this job
    if (user.role === Role.CUSTOMER && job.customerId !== user.customerId) {
      throw new ForbiddenException('Access denied');
    }
    return job;
  }

  // ---- Create ----
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new job' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    // Auto-backfill projectId from the house, for EVERY caller (staff or
    // customer) — regardless of role. A house-linked job with no projectId is
    // correctly attached to the house but invisible in that project's own Jobs
    // tab (which is scoped by projectId), a silent gap no caller should have to
    // remember to avoid by hand. Runs before the customer ownership check below
    // so that check also benefits from a single fetch.
    let houseDetails: { ownerCustomerId: string | null; projectId: string } | undefined;
    if (dto.houseId) {
      houseDetails = await this.crmClient.getHouseDetails(user.companyId, dto.houseId);
      if (houseDetails === undefined) {
        throw new BadRequestException('House not found');
      }
      if (!dto.projectId) dto.projectId = houseDetails.projectId;
    }

    if (user.role === Role.CUSTOMER) {
      if (!user.customerId) {
        throw new ForbiddenException('Customer account is not linked to a customer profile');
      }
      if (dto.customerId !== user.customerId) {
        throw new ForbiddenException('Customers may only create jobs for their own account');
      }
      if (!dto.serviceAddress?.trim()) {
        throw new BadRequestException('Service address is required');
      }
      // A customer may only book against a project/house that is actually theirs —
      // otherwise a crafted request could attach a job (and its visibility) to any
      // project or house in the company. houseId is checked in preference to
      // projectId when both are present, since a house's own owner is the more
      // specific and authoritative link for a Housing Scheme booking.
      if (houseDetails) {
        if (houseDetails.ownerCustomerId !== user.customerId) {
          throw new ForbiddenException('You can only book a service for your own house');
        }
      } else if (dto.projectId) {
        const projectCustomerId = await this.crmClient.getProjectCustomerId(user.companyId, dto.projectId);
        if (projectCustomerId === undefined) {
          throw new BadRequestException('Project not found');
        }
        if (projectCustomerId !== user.customerId) {
          throw new ForbiddenException('You can only book a service for your own project');
        }
      }
    }
    return this.jobsService.create(user, dto);
  }

  // ---- Update general fields (PUT) ----
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Update job fields (not status — use /status for that)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user.companyId, id, dto);
  }

  // ---- Combined PATCH (fields + optional status in one call) ----
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Patch job: update fields and/or transition status in one request' })
  async patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchJobDto,
  ) {
    const job = await this.jobsService.findOne(user.companyId, id) as any;

    // CUSTOMER role: their own job, cancellation only, and nothing else.
    if (user.role === Role.CUSTOMER) {
      if (job.customerId !== user.customerId) {
        throw new ForbiddenException('Access denied');
      }
      if (dto.status && dto.status !== 'CANCELLED') {
        throw new ForbiddenException('Customers may only cancel jobs');
      }
      // Whitelist, not blacklist: every field absent from
      // CUSTOMER_PATCHABLE_FIELDS is rejected outright, so adding a new field to
      // PatchJobDto can never silently become customer-writable.
      const forbidden = Object.keys(dto).filter(
        (key) => (dto as Record<string, unknown>)[key] !== undefined
          && !(CUSTOMER_PATCHABLE_FIELDS as readonly string[]).includes(key),
      );
      if (forbidden.length > 0) {
        throw new ForbiddenException(
          `Customers cannot change: ${forbidden.join(', ')}. `
          + 'To move an appointment, request a reschedule instead.',
        );
      }
    }

    const { status, statusNote, force, gpsTrackingEnabled, completedAt, ...fields } = dto;
    const hasFields = Object.values(fields).some((v) => v !== undefined);
    if (hasFields || gpsTrackingEnabled !== undefined || completedAt !== undefined) {
      await this.jobsService.patchFields(user.companyId, id, {
        ...fields, gpsTrackingEnabled, completedAt,
      });
    }
    if (status) {
      return this.jobsService.updateStatus(
        user.companyId, id, user, { status, note: statusNote, force },
      );
    }
    return this.jobsService.findOne(user.companyId, id);
  }

  // ---- Customer: change the requested time on an uncommitted job ----
  @Patch(':id/preferred-time')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Change the customer's requested time (PENDING, unassigned jobs only)",
    description:
      'A booking nobody has committed to yet — no approval needed. Once a technician '
      + 'is assigned, or the job is SCHEDULED, this returns 400 and the caller must use '
      + 'the reschedule negotiation instead.',
  })
  updatePreferredTime(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePreferredTimeDto,
  ) {
    return this.jobsService.updatePreferredTime(user, id, dto);
  }

  // ---- Status transition (state machine) ----
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Transition job status (enforces valid state machine transitions)',
  })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(user.companyId, id, user, dto);
  }

  // ---- Delete ----
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a job (admin/office manager only)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobsService.remove(user.companyId, id);
  }

  // ---- Custom field values ----
  @Patch(':id/custom-fields')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Update trade-specific custom field values for a job' })
  updateCustomFields(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldsDto,
  ) {
    return this.jobsService.updateCustomFields(user.companyId, id, dto.fields);
  }
}
