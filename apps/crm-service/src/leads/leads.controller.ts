import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { LeadsService } from './leads.service';
import { IsString, IsOptional, IsNumber, IsEmail, IsDateString } from 'class-validator';

class CreateLeadDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() serviceInterest?: string;
  @IsOptional() @IsNumber() estimatedValue?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

class UpdateLeadStatusDto {
  @IsString() status!: string;
  @IsOptional() @IsString() notes?: string;
}

class PatchLeadDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsappNo?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() serviceInterest?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() estimatedValue?: number;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() convertedAt?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() lastContactedAt?: string;
  @IsOptional() @IsString() qualificationNotes?: string;
}

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?: number,
    @Query('limit')  limit?: number,
  ) {
    return this.leadsService.findAll(user.companyId, { status, search, page, limit });
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get lead count per pipeline stage' })
  getPipeline(@CurrentUser() user: AuthUser) {
    return this.leadsService.getPipelineSummary(user.companyId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Create a lead' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Partially update a lead (status, estimated value, notes, etc.)' })
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PatchLeadDto,
  ) {
    return this.leadsService.patch(user.companyId, id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Update lead status (advance pipeline stage)' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(user.companyId, id, dto.status, dto.notes);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.leadsService.remove(user.companyId, id);
  }
}
