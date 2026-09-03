import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentPartner, PartnerContext } from '../auth/partner-context';

@ApiTags('v1')
@ApiSecurity('partner-key')
@Controller('v1')
export class WhoamiController {
  @Get('whoami')
  @ApiOperation({ summary: 'Confirm the API key and inspect its grants' })
  whoami(@CurrentPartner() partner: PartnerContext) {
    return {
      companyId: partner.companyId,
      keyName: partner.name,
      environment: partner.environment,
      scopes: partner.scopes,
      rateLimitPerMin: partner.rateLimitPerMin,
    };
  }
}
