import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus, Res, DefaultValuePipe, ParseIntPipe,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { QuotesService } from './quotes.service';
import { PdfService } from '../pdf/pdf.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { DocumentTemplateClient } from '../document-templates/document-template.client';
import { PrismaService } from '../prisma/prisma.service';
import { CrmClient } from '../crm/crm.client';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteStatus } from '../prisma/generated';

class ApproveDto {
  @IsString() name!: string;
  @IsString() email!: string;
}

class ApproveByIdDto {
  @IsOptional() @IsString() approvedByName?: string;
  @IsOptional() @IsString() approvedByEmail?: string;
  @IsOptional() @IsString() approvalToken?: string;  // accepted but not used here
}

class DeclineByIdDto {
  @IsOptional() @IsString() declinedByName?: string;
  @IsOptional() @IsString() declinedByEmail?: string;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
    private readonly companySettings: CompanySettingsClient,
    private readonly documentTemplates: DocumentTemplateClient,
    private readonly crmClient: CrmClient,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all quotes for this company' })
  @ApiQuery({ name: 'status', enum: QuoteStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'houseId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'pendingAging', required: false, type: Boolean, description: 'Restrict to SENT/VIEWED quotes older than 7 days — matches the "Pending Quotes at Risk" AI recommendation' })
  findAll(
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date — filters by createdAt >= start of this day' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'ISO date — filters by createdAt <= end of this day' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: QuoteStatus,
    @Query('customerId') customerId?: string,
    @Query('jobId') jobId?: string,
    @Query('projectId') projectId?: string,
    @Query('projectIds') projectIds?: string,
    @Query('houseId') houseId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('pendingAging') pendingAging?: string,
  ) {
    return this.quotesService.findAll(user.companyId, { status, customerId, jobId, projectId, page, limit, pendingAging: pendingAging === 'true' });
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // CUSTOMER role: force-filter to their own customerId for security — this
    // was previously NOT enforced at all (any customer JWT could pass an
    // arbitrary ?customerId= and see another customer's quotes). Same
    // house-ownership carve-out as jobs: a house-linked quote's customerId may
    // be the project's own top-level customer, not the individual house owner.
    let effectiveCustomerId = user.role === Role.CUSTOMER ? user.customerId : customerId;
    if (user.role === Role.CUSTOMER && houseId) {
      const house = await this.crmClient.getHouseDetails(user.companyId, houseId);
      if (!house) throw new BadRequestException('House not found');
      if (house.ownerCustomerId === user.customerId) {
        effectiveCustomerId = undefined;
      } else {
        throw new ForbiddenException('You can only view quotes for your own house');
      }
    }

    return this.quotesService.findAll(user.companyId, {
      status, customerId: effectiveCustomerId, jobId, projectId, houseId,
      projectIds: projectIds ? projectIds.split(',').filter(Boolean) : undefined,
      page, limit, dateFrom, dateTo,
    });
  }

  // ── Single ────────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single quote with line items' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const quote = await this.quotesService.findOne(user.companyId, id);
    if (user.role === Role.CUSTOMER) {
      const ownsDirectly = (quote as any).customerId === user.customerId;
      const ownsHouse = (quote as any).houseId
        ? (await this.crmClient.getHouseDetails(user.companyId, (quote as any).houseId))?.ownerCustomerId === user.customerId
        : false;
      if (!ownsDirectly && !ownsHouse) throw new ForbiddenException('Access denied');
    }
    return quote;
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new quote' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuoteDto) {
    // Housing Scheme: a quote created for a specific house auto-inherits that
    // house's project — a house-linked quote with no projectId would otherwise
    // never show up in that project's own Finances tab (same fix as Job/Agreement).
    if (dto.houseId && !dto.projectId) {
      const house = await this.crmClient.getHouseDetails(user.companyId, dto.houseId);
      if (!house) throw new BadRequestException('House not found');
      dto.projectId = house.projectId;
    }
    return this.quotesService.create(user.companyId, user.userId, dto);
  }

  // ── Update (PUT) ─────────────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a quote (incl. line items and status)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(user.companyId, id, dto);
  }

  // ── Update (PATCH — alias for PUT, accepts same DTO) ─────────────────────
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Partially update a quote status or fields' })
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(user.companyId, id, dto);
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  @Patch(':id/send')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Mark quote as sent (generates approval token)' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.quotesService.send(user.companyId, id);
  }

  // ── Approve by ID (test/admin endpoint) ──────────────────────────────────
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Approve a quote directly by ID (no token required)' })
  approveById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApproveByIdDto,
  ) {
    return this.quotesService.approveById(
      user.companyId,
      id,
      dto.approvedByName ?? 'Unknown',
      dto.approvedByEmail ?? 'noreply@example.com',
      user.role === Role.CUSTOMER ? user.customerId : undefined,
    );
  }

  // ── Decline by ID (portal/customer endpoint) ────────────────────────────
  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Decline a quote directly by ID' })
  declineById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DeclineByIdDto,
  ) {
    return this.quotesService.declineById(
      user.companyId,
      id,
      dto.declinedByName ?? 'Unknown',
      dto.declinedByEmail ?? 'noreply@example.com',
      user.role === Role.CUSTOMER ? user.customerId : undefined,
      dto.reason,
    );
  }

  // ── Approve (public endpoint — called from customer email link) ───────────
  @Patch('approve/:token')
  @ApiOperation({ summary: 'Customer approves the quote via email token link' })
  approve(@Param('token') token: string, @Body() dto: ApproveDto) {
    return this.quotesService.approve(token, dto.name, dto.email);
  }

  // ── Convert to Invoice ────────────────────────────────────────────────────
  @Post(':id/convert')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Convert an accepted quote to an invoice' })
  convertToInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.quotesService.convertToInvoice(user.companyId, id, user.userId);
  }

  // ── PDF Download ──────────────────────────────────────────────────────────
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download quote as PDF' })
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const quote = await this.quotesService.findOne(user.companyId, id);
    const settings = await this.companySettings.getSettings(user.companyId);
    const companyName = settings.name || process.env.COMPANY_NAME || 'HVACtor.ai';
    const companyAddress = settings.address || process.env.COMPANY_ADDRESS || '';
    const template = await this.documentTemplates.resolve(user.companyId, 'QUOTE', (quote as any).templateId);
    const pdf = await this.pdfService.generateQuotePdf(quote as any, companyName, companyAddress, {
      currency: settings.currency,
      timezone: settings.timezone,
    }, template);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft quote' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.quotesService.remove(user.companyId, id);
  }
}
