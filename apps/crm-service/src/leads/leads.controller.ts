import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { LeadsService } from './leads.service';
import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

class CreateLeadDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsNumber() estimatedValue?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

class UpdateLeadStatusDto {
  @IsString() status: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads (optionally filtered by status)' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.leadsService.findAll(user.companyId, status);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get lead count per pipeline stage' })
  getPipeline(@CurrentUser() user: AuthUser) {
    return this.leadsService.getPipelineSummary(user.companyId);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Create a lead' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.companyId, dto);
  }

  @Patch(':id/status')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Update lead status (advance pipeline stage)' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateStatus(user.companyId, id, dto.status, dto.notes);
  }
}
