import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import {
  RescheduleService, RESCHEDULE_INBOX_SCOPES, type RescheduleInboxScope,
} from './reschedule.service';
import { RescheduleApplyService } from './reschedule-apply.service';
import { OpenRescheduleDto, RespondRescheduleDto, ApplyRescheduleDto } from './dto/reschedule.dto';

const STAFF_ROLES = [
  Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER,
] as const;

/**
 * Reachable from the frontends as /jobs/reschedule/* through the gateway prefix.
 *
 * Route order matters: `inbox` and `stats` are declared before the `:id/…`
 * routes so Nest does not match the literal "inbox" as an :id param.
 */
@ApiTags('Rescheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reschedule')
export class RescheduleController {
  constructor(
    private readonly reschedule: RescheduleService,
    private readonly applyService: RescheduleApplyService,
  ) {}

  @Get('inbox')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Reschedule rounds, filtered by scope (defaults to those needing staff)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'scope', required: false, enum: RESCHEDULE_INBOX_SCOPES,
    description: 'action = needs staff (default), waiting = asked customer, closed = applied/cancelled, all = everything',
  })
  inbox(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: string,
  ) {
    // Unknown values fall back to the original behaviour rather than 400 —
    // this is a view filter, not something worth failing a page load over.
    const safeScope = (RESCHEDULE_INBOX_SCOPES as readonly string[]).includes(scope ?? '')
      ? (scope as RescheduleInboxScope)
      : 'action';
    return this.reschedule.inbox(user.companyId, page ?? 1, limit ?? 20, safeScope);
  }

  @Get('inbox/counts')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'How many reschedules sit in each scope — drives the tab badges' })
  inboxCounts(@CurrentUser() user: AuthUser) {
    return this.reschedule.inboxCounts(user.companyId);
  }

  @Get('stats')
  @Roles(...STAFF_ROLES)
  @ApiOperation({ summary: 'Reschedule counts by reason and by who opened them' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  stats(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reschedule.stats(user.companyId, from, to);
  }

  @Post('jobs/:jobId')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @ApiOperation({ summary: 'Open a reschedule request (propose slots, or ask openly)' })
  open(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Body() dto: OpenRescheduleDto) {
    return this.reschedule.open(user, jobId, dto);
  }

  @Get('jobs/:jobId')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @ApiOperation({ summary: 'Full reschedule history for a job, newest round first' })
  history(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.reschedule.history(user, jobId);
  }

  @Post(':id/respond')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pick a slot, counter with your own, or decline' })
  async respond(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondRescheduleDto,
  ) {
    const { request, shouldApply } = await this.reschedule.respond(user, id, dto);
    // A staff member picking a slot IS the confirmation, so it lands on the
    // calendar in the same request rather than parking in their own inbox.
    if (shouldApply) return this.applyService.apply(user, id, {});
    return request;
  }

  @Post(':id/apply')
  @Roles(...STAFF_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit the agreed time to the calendar (staff only)' })
  apply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApplyRescheduleDto) {
    return this.applyService.apply(user, id, dto);
  }

  @Post(':id/cancel')
  @Roles(...STAFF_ROLES, Role.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a request you opened' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reschedule.cancel(user, id);
  }
}
