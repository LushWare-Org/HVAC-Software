import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  DefaultValuePipe, ParseIntPipe, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { JobsService } from './jobs.service';
import { CreateJobDto, JobPriorityDto } from './dto/create-job.dto';
import { UpdateJobStatusDto, JobStatusDto } from './dto/update-job-status.dto';

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
}

// Combined PATCH DTO — allows updating fields AND status in one request
class PatchJobDto extends UpdateJobDto {
  @IsOptional() @IsEnum(JobStatusDto) status?: JobStatusDto;
  @IsOptional() @IsString() statusNote?: string;
  @IsOptional() @IsBoolean() gpsTrackingEnabled?: boolean;
  @IsOptional() @IsString() completedAt?: string;
}

class UpdateCustomFieldsDto {
  @IsArray() fields!: Array<{ fieldDefId: string; value: unknown }>;
}

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

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
  findAll(
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
  ) {
    // CUSTOMER role: force-filter to their own customerId for security
    const effectiveCustomerId = user.role === Role.CUSTOMER
      ? user.customerId
      : customerId;

    return this.jobsService.findAll(user.companyId, page, limit, {
      status, assignedToId, jobTypeId, search, dateFrom, dateTo,
      customerId: effectiveCustomerId,
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
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new job' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
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
    }
    return this.jobsService.create(user, dto);
  }

  // ---- Update general fields (PUT) ----
  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
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
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN, Role.CUSTOMER)
  @ApiOperation({ summary: 'Patch job: update fields and/or transition status in one request' })
  async patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchJobDto,
  ) {
    const job = await this.jobsService.findOne(user.companyId, id) as any;

    // CUSTOMER role: can only cancel their own jobs
    if (user.role === Role.CUSTOMER) {
      if (job.customerId !== user.customerId) {
        throw new ForbiddenException('Access denied');
      }
      if (dto.status && dto.status !== 'CANCELLED') {
        throw new ForbiddenException('Customers may only cancel jobs');
      }
    }

    const { status, statusNote, gpsTrackingEnabled, completedAt, ...fields } = dto;
    const hasFields = Object.values(fields).some((v) => v !== undefined);
    if (hasFields || gpsTrackingEnabled !== undefined || completedAt !== undefined) {
      await this.jobsService.patchFields(user.companyId, id, {
        ...fields, gpsTrackingEnabled, completedAt,
      });
    }
    if (status) {
      return this.jobsService.updateStatus(
        user.companyId, id, user, { status, note: statusNote },
      );
    }
    return this.jobsService.findOne(user.companyId, id);
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

  // ---- Custom field values ----
  @Patch(':id/custom-fields')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Update trade-specific custom field values for a job' })
  updateCustomFields(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldsDto,
  ) {
    return this.jobsService.updateCustomFields(user.companyId, id, dto.fields);
  }
}
