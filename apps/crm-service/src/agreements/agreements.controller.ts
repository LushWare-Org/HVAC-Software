import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
  ForbiddenException, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import {
  IsString, IsOptional, IsDateString, IsNumber, IsInt, IsBoolean, IsIn, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgreementsService } from './agreements.service';

const BILLING_CYCLES = ['UPFRONT', 'MONTHLY', 'QUARTERLY', 'ANNUAL'];
const SERVICE_INTERVALS = ['MONTHLY', 'BI_MONTHLY', 'QUARTERLY', 'BI_ANNUAL', 'ANNUAL', 'CUSTOM'];

class CreateAgreementDto {
  @IsString() customerId!: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() houseId?: string;
  @IsOptional() @IsString() componentId?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;

  @IsOptional() @Type(() => Number) @IsNumber() value?: number;
  @IsOptional() @IsIn(BILLING_CYCLES) billingCycle?: string;
  @IsOptional() @Type(() => Number) @IsNumber() billingAmount?: number;
  @IsOptional() @IsDateString() nextBillingDate?: string;

  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsIn(SERVICE_INTERVALS) serviceInterval?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) serviceIntervalDays?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) visitsIncluded?: number;
  @IsOptional() @IsDateString() nextServiceDate?: string;

  @IsOptional() @IsBoolean() autoCreateJobs?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) leadDays?: number;
  @IsOptional() @IsString() jobTemplateId?: string;
  @IsOptional() @IsBoolean() autoRenew?: boolean;
  @IsOptional() @IsString() templateId?: string;
}

class UpdateAgreementDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;

  @IsOptional() @Type(() => Number) @IsNumber() value?: number;
  @IsOptional() @IsIn(BILLING_CYCLES) billingCycle?: string;
  @IsOptional() @Type(() => Number) @IsNumber() billingAmount?: number;
  @IsOptional() @IsDateString() nextBillingDate?: string;

  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsIn(SERVICE_INTERVALS) serviceInterval?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) serviceIntervalDays?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) visitsIncluded?: number;
  @IsOptional() @IsDateString() nextServiceDate?: string;

  @IsOptional() @IsBoolean() autoCreateJobs?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) leadDays?: number;
  @IsOptional() @IsString() jobTemplateId?: string;
  @IsOptional() @IsBoolean() autoRenew?: boolean;
  @IsOptional() @IsString() templateId?: string;
}

class ConfirmAgreementDto {
  @IsOptional() @IsString() confirmedByName?: string;
}

const STAFF = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

@ApiTags('Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreements: AgreementsService) {}

  @Get()
  @Roles(...STAFF)
  @ApiOperation({ summary: 'List service agreements' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('projectId') projectId?: string,
    @Query('houseId') houseId?: string,
    @Query('componentId') componentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agreements.findAll(user.companyId, {
      status,
      customerId,
      projectId,
      houseId,
      componentId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('mine')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List my agreements (customer portal)' })
  findMine(@CurrentUser() user: AuthUser) {
    if (!user.customerId) throw new ForbiddenException('No customer profile linked');
    return this.agreements.findMine(user.companyId, user.customerId);
  }

  @Get(':id')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Get one agreement with amendment history' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agreements.findOne(user.companyId, id);
  }

  @Get(':id/pdf')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Download the agreement as PDF (generates + stores it)' })
  async downloadPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const agreement = await this.agreements.findOne(user.companyId, id);
    const pdf = await this.agreements.generatePdf(user.companyId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="agreement-${agreement.name.replace(/[^a-z0-9]+/gi, '-')}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Post()
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Create a service agreement' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAgreementDto) {
    return this.agreements.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Update an agreement (amendment trail on ACTIVE)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAgreementDto) {
    return this.agreements.update(user.companyId, id, dto, {
      id: user.userId,
      name: user.name,
    });
  }

  @Post(':id/send')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Email the agreement to the customer with a confirm link' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agreements.send(user.companyId, id);
  }

  @Post(':id/renew')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Renew: clone terms into a new DRAFT agreement' })
  renew(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agreements.renew(user.companyId, id);
  }

  @Post(':id/cancel')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Cancel an agreement' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agreements.cancel(user.companyId, id);
  }

  @Post(':id/record-visit')
  @Roles(...STAFF)
  @ApiOperation({ summary: 'Record a completed service visit (called by job-service on job completion)' })
  recordVisit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.agreements.recordVisit(user.companyId, id);
  }
}

/**
 * Public confirm endpoints — reached from the email link, no JWT required.
 * Access is gated by the unguessable one-time confirmToken.
 */
@ApiTags('Agreements')
@Controller('agreements/confirm')
export class AgreementsConfirmController {
  constructor(private readonly agreements: AgreementsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Preview an agreement by confirm token (public)' })
  preview(@Param('token') token: string) {
    return this.agreements.getByToken(token);
  }

  @Post(':token')
  @ApiOperation({ summary: 'Confirm an agreement by token (public)' })
  confirm(@Param('token') token: string, @Body() dto: ConfirmAgreementDto) {
    return this.agreements.confirmByToken(token, dto.confirmedByName);
  }
}
