import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsInt, IsBoolean, IsArray, IsEnum,
  IsHexColor, Min, MaxLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { TradeTemplatesService } from './trade-templates.service';

// ---- DTOs ----

class CreateJobTypeDto {
  @IsString() @MaxLength(80) name!: string;
  @IsString() @MaxLength(40) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

class UpdateJobTypeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class TaskDto {
  @IsString() taskName!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() taskOrder!: number;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsBoolean() photoRequired?: boolean;
  @IsOptional() @IsString() safetyNote?: string;
  @IsOptional() @IsInt() estimatedMins?: number;
}

class RequiredPartDto {
  @IsString() inventoryItemId!: string;
  @IsString() name!: string;
  @IsInt() @Min(1) qty!: number;
}

class CreateTemplateDto {
  @IsString() jobTypeId!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() estimatedDurationMins?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TaskDto) tasks?: TaskDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RequiredPartDto) requiredParts?: RequiredPartDto[];
}

class UpdateTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() estimatedDurationMins?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RequiredPartDto) requiredParts?: RequiredPartDto[];
}

class CreateCustomFieldDto {
  @IsString() fieldKey!: string;
  @IsString() label!: string;
  @IsString() fieldType!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsString() helpText?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

class ReorderTasksDto {
  @IsArray() @IsString({ each: true }) taskIds!: string[];
}

// ============================================================
// JOB TYPES
// ============================================================

@ApiTags('Trade — Job Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trade/job-types')
export class JobTypesController {
  constructor(private readonly svc: TradeTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all job types for this company' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.svc.findAllJobTypes(user.companyId);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new job type (e.g. Landscaping)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobTypeDto) {
    return this.svc.createJobType(user.companyId, dto);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a job type' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobTypeDto,
  ) {
    return this.svc.updateJobType(user.companyId, id, dto);
  }
}

// ============================================================
// TEMPLATES (nested under job type)
// ============================================================

@ApiTags('Trade — Job Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trade/job-types/:jobTypeId/templates')
export class JobTemplatesController {
  constructor(private readonly svc: TradeTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List templates for a job type' })
  findAll(@CurrentUser() user: AuthUser, @Param('jobTypeId') jobTypeId: string) {
    return this.svc.findTemplatesByType(user.companyId, jobTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single template with all tasks' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findTemplateById(user.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new job template with tasks' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.svc.createTemplate(user.companyId, dto);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update template details' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.svc.updateTemplate(user.companyId, id, dto);
  }
}

// ============================================================
// TASKS within a template
// ============================================================

@ApiTags('Trade — Template Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trade/templates/:templateId/tasks')
export class TemplateTasksController {
  constructor(private readonly svc: TradeTemplatesService) {}

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Add a task to a template' })
  addTask(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Body() dto: TaskDto,
  ) {
    return this.svc.addTask(user.companyId, templateId, dto);
  }

  @Put(':taskId')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a task' })
  updateTask(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Param('taskId') taskId: string,
    @Body() dto: Partial<TaskDto>,
  ) {
    return this.svc.updateTask(user.companyId, templateId, taskId, dto);
  }

  @Delete(':taskId')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a task from a template' })
  removeTask(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.svc.removeTask(user.companyId, templateId, taskId);
  }

  @Patch('reorder')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Reorder tasks by providing ordered array of task IDs' })
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    return this.svc.reorderTasks(user.companyId, templateId, dto.taskIds);
  }
}

// ============================================================
// CUSTOM FIELD DEFINITIONS per job type
// ============================================================

@ApiTags('Trade — Custom Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trade/job-types/:jobTypeId/custom-fields')
export class CustomFieldDefsController {
  constructor(private readonly svc: TradeTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List custom field definitions for a job type' })
  findAll(@CurrentUser() user: AuthUser, @Param('jobTypeId') jobTypeId: string) {
    return this.svc.findCustomFieldDefs(user.companyId, jobTypeId);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Add a custom field definition to a job type' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('jobTypeId') jobTypeId: string,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.svc.createCustomFieldDef(user.companyId, jobTypeId, dto);
  }

  @Put(':defId')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a custom field definition' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('defId') defId: string,
    @Body() dto: Partial<CreateCustomFieldDto>,
  ) {
    return this.svc.updateCustomFieldDef(user.companyId, defId, dto as any);
  }
}

