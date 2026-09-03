import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PartnerPublic } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @PartnerPublic()
  @ApiExcludeEndpoint()
  check() {
    return { status: 'ok', service: 'partner-api' };
  }
}
