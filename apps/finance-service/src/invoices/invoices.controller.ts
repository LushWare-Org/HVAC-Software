import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  Res, Req, Headers, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus, PaymentMethod } from '../prisma/generated';

class UpdateStatusDto {
  @IsEnum(InvoiceStatus) status!: InvoiceStatus;
}

class ManualPaymentDto {
  @IsNumber() @Min(0.01) amount!: number;
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsOptional() @IsString() notes?: string;
}

class CustomerInvoiceDecisionDto {
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all invoices for this company' })
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('jobId') jobId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.invoicesService.findAll(user.companyId, { status, customerId, jobId, page, limit });
  }

  // ── Single ────────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice with line items and payments' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.findOne(user.companyId, id);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.companyId, user.userId, dto);
  }
  // ── Update status / fields (PATCH) ───────────────────────────────────────
  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Partially update invoice (status, etc.)' })
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.invoicesService.updateStatus(user.companyId, id, dto.status);
  }
  // ── Send ──────────────────────────────────────────────────────────────────
  @Patch(':id/send')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Mark invoice as sent' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.send(user.companyId, id);
  }

  // ── Update Status ─────────────────────────────────────────────────────────
  @Patch(':id/status')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update invoice status' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.invoicesService.updateStatus(user.companyId, id, dto.status);
  }

  // ── Stripe: Create Payment Intent ─────────────────────────────────────────
  @Post(':id/payment-intent')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a Stripe payment intent for online payment' })
  createPaymentIntent(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.createPaymentIntent(user.companyId, id);
  }

  // ── Customer approve / decline actions ───────────────────────────────────
  @Post(':id/approve')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer approves invoice review (records decision)' })
  approveByCustomer(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.approveByCustomer(
      user.companyId,
      id,
      user.name ?? 'Customer',
      user.email ?? 'customer@portal.local',
    );
  }

  @Post(':id/decline')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer declines an invoice (marks as VOID with note)' })
  declineByCustomer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CustomerInvoiceDecisionDto,
  ) {
    return this.invoicesService.declineByCustomer(
      user.companyId,
      id,
      user.name ?? 'Customer',
      user.email ?? 'customer@portal.local',
      dto.reason,
    );
  }

  // ── Record Manual Payment ─────────────────────────────────────────────────
  @Post(':id/payments')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Record a manual payment (cash, check, ACH)' })
  recordManualPayment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ManualPaymentDto,
  ) {
    return this.invoicesService.recordManualPayment(
      user.companyId,
      id,
      dto.amount,
      dto.method,
      dto.notes,
    );
  }

  // ── Void ──────────────────────────────────────────────────────────────────
  @Patch(':id/void')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Void an invoice' })
  void(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.voidInvoice(user.companyId, id);
  }

  // ── PDF Download ──────────────────────────────────────────────────────────
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOne(user.companyId, id);
    const companyName = process.env.COMPANY_NAME ?? 'T&S Services';
    const companyAddress = process.env.COMPANY_ADDRESS ?? '';
    const pdf = await this.pdfService.generateInvoicePdf(invoice as any, companyName, companyAddress);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}

// ── Stripe Webhook (separate controller, no JWT guard) ────────────────────
@ApiTags('Stripe Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * POST /webhooks/stripe
   * Raw body MUST be preserved. In main.ts we use rawBody: true in NestFactory
   * options, and on this route we read req.rawBody.
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    return this.invoicesService.handleStripeWebhook(rawBody, sig);
  }
}
