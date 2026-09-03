import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentPartner, PartnerContext } from '../../auth/partner-context';
import { Scopes } from '../../auth/scopes.decorator';
import { PARTNER_SCOPES } from '../../auth/scopes';
import { CallersService } from './callers.service';
import { MatchCallerDto } from './dto/match-caller.dto';

@ApiTags('v1 — Callers')
@ApiSecurity('partner-key')
@Controller('v1/callers')
export class CallersController {
  constructor(private readonly callers: CallersService) {}

  @Get('lookup')
  @Scopes(PARTNER_SCOPES.CUSTOMER_LOOKUP)
  @ApiOperation({
    summary: 'Identify an inbound caller from their number',
    description:
      'Returns result "found", "not_found" or "ambiguous". "ambiguous" means the number ' +
      'is shared by more than one customer — ask the caller for their name and use ' +
      'POST /v1/callers/match instead of guessing. On "found", the summary carries a ' +
      '`degraded` list naming anything that could not be loaded; do not assert a zero ' +
      'for a section listed there.',
  })
  @ApiQuery({ name: 'phone', required: true, example: '+94771234567' })
  lookup(@CurrentPartner() partner: PartnerContext, @Query('phone') phone: string) {
    return this.callers.lookupByPhone(partner.companyId, phone ?? '');
  }

  @Post('match')
  @HttpCode(HttpStatus.OK)
  @Scopes(PARTNER_SCOPES.CUSTOMER_MATCH)
  @ApiOperation({
    summary: 'Confirm an existing customer calling from an unrecognised number',
    description:
      'Confirms or denies one specific person from a name plus address. Never returns ' +
      'candidates. Use before creating a new customer, so a regular caller phoning from ' +
      'their mobile does not become a duplicate record.',
  })
  match(@CurrentPartner() partner: PartnerContext, @Body() dto: MatchCallerDto) {
    return this.callers.matchByNameAndAddress(partner.companyId, dto);
  }
}
