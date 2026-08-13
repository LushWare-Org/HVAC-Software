import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  Res, Req, Headers, DefaultValuePipe, ParseIntPipe,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { DocumentTemplateClient } from '../document-templates/document-template.client';
import { CrmClient } from '../crm/crm.client';
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
    private readonly companySettings: CompanySettingsClient,
    private readonly documentTemplates: DocumentTemplateClient,
    private readonly crmClient: CrmClient,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all invoices for this company' })
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'houseId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date — filters by createdAt >= start of this day' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'ISO date — filters by createdAt <= end of this day' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('jobId') jobId?: string,
    @Query('projectId') projectId?: string,
    @Query('projectIds') projectIds?: string,
    @Query('houseId') houseId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Same security fix as quotes: enforce customerId server-side for the
    // CUSTOMER role instead of trusting the query param, with a house-ownership
    // carve-out (a house-linked invoice's own customerId may be the project's
    // top-level customer, not the individual house owner).
    let effectiveCustomerId = user.role === Role.CUSTOMER ? user.customerId : customerId;
    if (user.role === Role.CUSTOMER && houseId) {
      const house = await this.crmClient.getHouseDetails(user.companyId, houseId);
      if (!house) throw new BadRequestException('House not found');
      if (house.ownerCustomerId === user.customerId) {
        effectiveCustomerId = undefined;
      } else {
        throw new ForbiddenException('You can only view invoices for your own house');
      }
    }

    return this.invoicesService.findAll(user.companyId, {
      status, customerId: effectiveCustomerId, jobId, projectId, houseId,
      projectIds: projectIds ? projectIds.split(',').filter(Boolean) : undefined,
      page, limit, dateFrom, dateTo,
    });
  }

  // ── Single ────────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice with line items and payments' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const invoice = await this.invoicesService.findOne(user.companyId, id);
    if (user.role === Role.CUSTOMER) {
      const ownsDirectly = (invoice as any).customerId === user.customerId;
      const ownsHouse = (invoice as any).houseId
        ? (await this.crmClient.getHouseDetails(user.companyId, (invoice as any).houseId))?.ownerCustomerId === user.customerId
        : false;
      if (!ownsDirectly && !ownsHouse) throw new ForbiddenException('Access denied');
    }
    return invoice;
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    // Housing Scheme: an invoice created for a specific house auto-inherits
    // that house's project, same fix as Job/Agreement/Quote.
    if (dto.houseId && !dto.projectId) {
      const house = await this.crmClient.getHouseDetails(user.companyId, dto.houseId);
      if (!house) throw new BadRequestException('House not found');
      dto.projectId = house.projectId;
    }
    return this.invoicesService.create(user.companyId, user.userId, dto);
  }
  // ── Update status / fields (PATCH) ───────────────────────────────────────
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Mark invoice as sent' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.send(user.companyId, id);
  }

  // ── Update Status ─────────────────────────────────────────────────────────
  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a Stripe payment intent for online payment' })
  createPaymentIntent(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoicesService.createPaymentIntent(user.companyId, id);
  }

  // ── Customer approve / decline actions ───────────────────────────────────
  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
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
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
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
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
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
    const settings = await this.companySettings.getSettings(user.companyId);
    const companyName = settings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
    const companyAddress = settings.address || process.env.COMPANY_ADDRESS || '';
    const template = await this.documentTemplates.resolve(user.companyId, 'INVOICE', (invoice as any).templateId);
    const pdf = await this.pdfService.generateInvoicePdf(invoice as any, companyName, companyAddress, {
      currency: settings.currency,
      timezone: settings.timezone,
    }, template);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  // ── Payment Receipt (view / download) ────────────────────────────────────
  @Get(':id/payments/:paymentId/receipt.pdf')
  @ApiOperation({ summary: 'Download a payment receipt as PDF — proof of payment for a specific recorded payment' })
  async downloadReceiptPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOne(user.companyId, id);
    const payment = (invoice as any).payments?.find((p: any) => p.id === paymentId);
    if (!payment) throw new BadRequestException('Payment not found on this invoice');

    const settings = await this.companySettings.getSettings(user.companyId);
    const companyName = settings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
    const companyAddress = settings.address || process.env.COMPANY_ADDRESS || '';
    const template = await this.documentTemplates.resolve(user.companyId, 'PAYMENT_RECEIPT');

    // Balance remaining on the invoice as of right now — a receipt for an older
    // payment still shows the invoice's current balance, not a stale snapshot.
    const balanceDue = parseFloat(invoice.balanceDue.toString());

    const pdf = await this.pdfService.generatePaymentReceiptPdf(
      {
        receiptNumber: payment.receiptNumber ?? `RCPT-${payment.id.slice(0, 8).toUpperCase()}`,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt ?? payment.createdAt,
        notes: payment.notes,
        customerName: invoice.customerName ?? 'Customer',
        customerEmail: invoice.customerEmail ?? '',
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: invoice.total,
        balanceDue,
      },
      companyName,
      companyAddress,
      { currency: settings.currency, timezone: settings.timezone },
      template,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${payment.receiptNumber ?? 'receipt'}.pdf"`,
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
