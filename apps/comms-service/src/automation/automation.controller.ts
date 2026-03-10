/**
 * AutomationController
 *
 * Two responsibilities:
 *  1. CRUD for AutomationRule records (company-scoped, JWT-guarded)
 *  2. Internal event endpoints called by job-service / finance-service
 *     These are protected by a shared internal API key (x-internal-api-key header)
 *     rather than a user JWT.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { AutomationService } from './automation.service';
import {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  AutomationTriggerEnum,
  JobStatusChangedEvent,
  InvoiceSentEvent,
  PaymentReceivedEvent,
  QuoteApprovedEvent,
  AppointmentBookedEvent,
} from './dto/automation.dto';
import { AutomationTrigger } from '../prisma/generated';

// ── Rule Management ───────────────────────────────────────────────────────

@ApiTags('Automation Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automation/rules')
export class AutomationRulesController {
  constructor(private readonly service: AutomationService) {}

  @Post()
  @ApiOperation({ summary: 'Create automation rule' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAutomationRuleDto) {
    return this.service.createRule(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List automation rules' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('trigger') trigger?: AutomationTrigger,
  ) {
    return this.service.findRules(user.companyId, { trigger });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation rule' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findRule(user.companyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update automation rule' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    return this.service.updateRule(user.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete automation rule' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeRule(user.companyId, id);
  }
}

// ── Internal Event Endpoints ──────────────────────────────────────────────

@ApiTags('Automation Events (Internal)')
@ApiSecurity('x-internal-api-key')
@Controller('automation/events')
export class AutomationEventsController {
  constructor(
    private readonly service: AutomationService,
    private readonly config: ConfigService,
  ) {}

  private verifyInternalKey(key: string) {
    const expected = this.config.get<string>('internalApiKey');
    if (!expected || key !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }
  }

  @Post('job-status-changed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger job status change automations (called by job-service)' })
  async onJobStatusChanged(
    @Headers('x-internal-api-key') key: string,
    @Body() event: JobStatusChangedEvent,
  ) {
    this.verifyInternalKey(key);
    await this.service.processJobStatusChanged(event);
    return { processed: true };
  }

  @Post('invoice-sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger invoice sent automations (called by finance-service)' })
  async onInvoiceSent(
    @Headers('x-internal-api-key') key: string,
    @Body() event: InvoiceSentEvent,
  ) {
    this.verifyInternalKey(key);
    await this.service.processInvoiceSent(event);
    return { processed: true };
  }

  @Post('payment-received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger payment received automations (called by finance-service)' })
  async onPaymentReceived(
    @Headers('x-internal-api-key') key: string,
    @Body() event: PaymentReceivedEvent,
  ) {
    this.verifyInternalKey(key);
    await this.service.processPaymentReceived(event);
    return { processed: true };
  }

  @Post('quote-approved')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger quote approved automations (called by finance-service)' })
  async onQuoteApproved(
    @Headers('x-internal-api-key') key: string,
    @Body() event: QuoteApprovedEvent,
  ) {
    this.verifyInternalKey(key);
    await this.service.processQuoteApproved(event);
    return { processed: true };
  }

  @Post('appointment-booked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger appointment booked automations (called by job-service)' })
  async onAppointmentBooked(
    @Headers('x-internal-api-key') key: string,
    @Body() event: AppointmentBookedEvent,
  ) {
    this.verifyInternalKey(key);
    await this.service.processAppointmentBooked(event);
    return { processed: true };
  }
}
