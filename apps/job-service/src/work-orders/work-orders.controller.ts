import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { WorkOrdersService } from './work-orders.service';

enum PriceCategoryDto {
  LABOUR = 'LABOUR', PART = 'PART', MATERIAL = 'MATERIAL',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL', SUBCONTRACTOR = 'SUBCONTRACTOR', OTHER = 'OTHER',
}

class CreateWorkOrderDto {
  @IsString() jobId: string;
  @IsString() technicianId: string;
  @IsString() technicianName: string;
  @IsOptional() @IsString() scheduledStart?: string;
  @IsOptional() @IsString() scheduledEnd?: string;
}

class CompleteTaskDto {
  @IsBoolean() isCompleted: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() photoUrl?: string;
}

class CheckOutDto {
  @IsOptional() @IsString() notes?: string;
}

class AddLineItemDto {
  @IsOptional() @IsString() priceBookItemId?: string;
  @IsString() description: string;
  @IsEnum(PriceCategoryDto) category: PriceCategoryDto;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsBoolean() taxable?: boolean;
}

@ApiTags('Work Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly svc: WorkOrdersService) {}

  // ---- Create work order from a job ----
  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Create a work order for a job (pre-populates template tasks)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkOrderDto) {
    return this.svc.create(user.companyId, user, dto);
  }

  // ---- List by job ----
  @Get('by-job/:jobId')
  @ApiOperation({ summary: 'Get all work orders for a job' })
  findByJob(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.svc.findByJob(user.companyId, jobId);
  }

  // ---- Get one ----
  @Get(':id')
  @ApiOperation({ summary: 'Get a single work order' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user.companyId, id);
  }

  // ---- Invoice summary (used by finance-service) ----
  @Get('invoice-summary/:jobId')
  @ApiOperation({ summary: 'Get line item summary for invoice generation' })
  getInvoiceSummary(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.svc.getSummaryForInvoice(user.companyId, jobId);
  }

  // ---- Check-in (technician arrives on site) ----
  @Patch(':id/check-in')
  @Roles(Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Technician checks in — marks work order ON_SITE' })
  checkIn(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.checkIn(user.companyId, id, user.userId);
  }

  // ---- Check-out (technician completes work) ----
  @Patch(':id/check-out')
  @Roles(Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Technician checks out — marks work order COMPLETED' })
  checkOut(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CheckOutDto,
  ) {
    return this.svc.checkOut(user.companyId, id, dto.notes);
  }

  // ---- Mark task complete ----
  @Patch(':id/tasks/:taskCompletionId')
  @Roles(Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Mark a checklist task as complete/incomplete' })
  completeTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('taskCompletionId') taskCompletionId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.svc.completeTask(user.companyId, id, taskCompletionId, dto);
  }

  // ---- Add line item ----
  @Post(':id/line-items')
  @Roles(Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Add a part or labour line item to the work order' })
  addLineItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddLineItemDto,
  ) {
    return this.svc.addLineItem(user.companyId, id, dto);
  }

  // ---- Remove line item ----
  @Delete(':id/line-items/:lineItemId')
  @Roles(Role.TECHNICIAN, Role.DISPATCHER, Role.OFFICE_MANAGER, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a line item from a work order' })
  removeLineItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
  ) {
    return this.svc.removeLineItem(user.companyId, id, lineItemId);
  }
}
