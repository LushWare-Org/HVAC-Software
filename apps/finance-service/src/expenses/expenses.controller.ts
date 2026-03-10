import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString, Min,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { ExpensesService } from './expenses.service';
import { ExpenseCategory } from '../prisma/generated';

class CreateExpenseBodyDto {
  @IsOptional() @IsString() jobId?: string;
  @IsOptional() @IsString() technicianId?: string;
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @IsString() description!: string;
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() vendor?: string;
  @IsOptional() @IsString() receiptUrl?: string;
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsBoolean() isReimbursable?: boolean;
}

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses for this company' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'category', enum: ExpenseCategory, required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('jobId') jobId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.expensesService.findAll(user.companyId, { jobId, technicianId, category, page, limit });
  }

  @Get('job/:jobId/summary')
  @ApiOperation({ summary: 'Get total expense cost for a specific job' })
  getJobSummary(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.expensesService.getJobExpenseSummary(user.companyId, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense record' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.findOne(user.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an expense record (any authenticated user can submit)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseBodyDto) {
    return this.expensesService.create(user.companyId, user.userId, dto);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update an expense record' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateExpenseBodyDto>,
  ) {
    return this.expensesService.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense record' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.remove(user.companyId, id);
  }
}
