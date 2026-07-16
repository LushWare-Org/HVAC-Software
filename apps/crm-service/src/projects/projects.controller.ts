import {
  Controller, Get, Post, Patch, Put, Delete, Param, Query, Body,
  UseGuards, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import {
  IsString, IsOptional, IsNumber, IsArray, IsBoolean, MaxLength,
} from 'class-validator';
import { ProjectsService } from './projects.service';

class CreateProjectDto {
  @IsString() customerId!: string;
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  // Immutable after creation — omitted entirely from UpdateProjectDto below.
  @IsOptional() @IsString() templateType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() targetEndDate?: string;
  @IsOptional() @IsNumber() budget?: number;
  @IsOptional() @IsNumber() requiredHeadcount?: number;
  @IsOptional() @IsString() siteAddress?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsArray() workingDays?: string[];
  @IsOptional() @IsArray() baseTeamUserIds?: string[];
  @IsOptional() @IsString() notes?: string;
}

class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(60) category?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() targetEndDate?: string;
  @IsOptional() @IsNumber() budget?: number;
  @IsOptional() @IsNumber() requiredHeadcount?: number;
  @IsOptional() @IsString() siteAddress?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsArray() workingDays?: string[];
  @IsOptional() @IsArray() baseTeamUserIds?: string[];
  @IsOptional() @IsString() notes?: string;
}

class SetRosterDayDto {
  @IsOptional() @IsArray() techUserIds?: string[];
  @IsOptional() @IsBoolean() isOff?: boolean;
  @IsOptional() @IsBoolean() reset?: boolean;
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  // Static routes MUST precede ':id'.

  @Get('rosters')
  @ApiOperation({ summary: 'All projects with a crew rostered on a date (Day Planner band)' })
  rostersByDate(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.projects.rostersByDate(user.companyId, date);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Customer-scoped projects for the portal (role=CUSTOMER)' })
  mine(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('Customer account required');
    return this.projects.mine(user.companyId, user.customerId);
  }

  @Get()
  @ApiOperation({ summary: 'List projects (filters: status, customerId, search)' })
  list(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projects.list(user.companyId, {
      status, customerId, search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a project' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Project detail (includes linked agreements)' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a project' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Cancel a project (soft delete)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projects.remove(user.companyId, id);
  }

  @Get(':id/roster')
  @ApiOperation({ summary: 'Effective roster per date for a range' })
  roster(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.projects.rosterRange(user.companyId, id, from, to);
  }

  @Put(':id/roster/:date')
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Override / mark off / reset the roster for one date' })
  setRosterDay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('date') date: string,
    @Body() dto: SetRosterDayDto,
  ) {
    return this.projects.setRosterDay(user.companyId, id, date, dto, user.userId);
  }

  @Post(':id/agreements/:agreementId')
  @Roles(...STAFF_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link a service agreement to the project' })
  linkAgreement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('agreementId') agreementId: string,
  ) {
    return this.projects.linkAgreement(user.companyId, id, agreementId);
  }

  @Delete(':id/agreements/:agreementId')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Unlink a service agreement from the project' })
  unlinkAgreement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('agreementId') agreementId: string,
  ) {
    return this.projects.unlinkAgreement(user.companyId, id, agreementId);
  }
}
