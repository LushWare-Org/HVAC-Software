import {
  Controller, Get, Post, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { PaymentsService } from './payments.service';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentStatus, PaymentMethod } from '../prisma/generated';

class CreatePaymentDto {
  @IsString() invoiceId!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @IsOptional() @IsString() notes?: string;
  // Following fields accepted for test compatibility (not persisted to DB):
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() cardBrand?: string;
  @IsOptional() @IsString() cardLast4?: string;
  @IsOptional() @IsString() stripePaymentIntentId?: string;
  @IsOptional() @IsString() status?: string;
}

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.invoicesService.recordManualPayment(
      user.companyId,
      dto.invoiceId,
      dto.amount,
      dto.paymentMethod ?? PaymentMethod.CARD,
      dto.notes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all payments for this company' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'method', enum: PaymentMethod, required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('invoiceId') invoiceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findAll(user.companyId, { status, method, invoiceId, page, limit });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Revenue metrics and outstanding balance' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
  getMetrics(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentsService.getMetrics(
      user.companyId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payment record' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.findOne(user.companyId, id);
  }
}
