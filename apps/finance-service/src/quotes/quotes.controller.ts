import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus, Res, DefaultValuePipe, ParseIntPipe,
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
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all quotes for this company' })
  @ApiQuery({ name: 'status', enum: QuoteStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: QuoteStatus,
    @Query('customerId') customerId?: string,
    @Query('jobId') jobId?: string,
    @Query('projectId') projectId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.quotesService.findAll(user.companyId, { status, customerId, jobId, projectId, page, limit });
  }

  // ── Single ────────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single quote with line items' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.quotesService.findOne(user.companyId, id);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new quote' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuoteDto) {
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
    // TODO: pull real company info from company service / config
    const companyName = process.env.COMPANY_NAME ?? 'T&S Services';
    const companyAddress = process.env.COMPANY_ADDRESS ?? '';
    const settings = await this.companySettings.getSettings(user.companyId);
    const pdf = await this.pdfService.generateQuotePdf(quote as any, companyName, companyAddress, {
      currency: settings.currency,
      timezone: settings.timezone,
    });
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
