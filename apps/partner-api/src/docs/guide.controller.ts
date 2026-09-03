import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PartnerPublic } from '../auth/public.decorator';
import { ALL_PARTNER_SCOPES } from '../auth/scopes';
import { ALL_EVENT_TYPES } from '../webhooks/webhooks.service';
import { GUIDE_HTML } from './guide.html';

@Controller()
export class GuideController {
  @Get('guide')
  @PartnerPublic()
  @ApiExcludeEndpoint()
  @Header('content-type', 'text/html; charset=utf-8')
  guide(): string {
    return GUIDE_HTML;
  }

  /** Machine-readable capability summary, for integrators who prefer JSON. */
  @Get('capabilities')
  @PartnerPublic()
  @ApiExcludeEndpoint()
  capabilities() {
    return {
      name: 'T&S CRM Partner API',
      version: 'v1',
      authentication: {
        scheme: 'api-key',
        header: 'x-api-key',
        environments: ['LIVE', 'SANDBOX'],
        note: 'Sandbox keys begin pk_test_ and never deliver messages or take payments.',
      },
      scopes: ALL_PARTNER_SCOPES,
      events: ALL_EVENT_TYPES,
      rateLimit: {
        default: Number(process.env.PARTNER_RATE_LIMIT_PER_MIN ?? 60),
        unit: 'requests/minute/key',
        headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        exceeded: 429,
      },
      webhookSignature: {
        algorithm: 'HMAC-SHA256',
        signedPayload: '<x-tscrm-timestamp>.<raw request body>',
        header: 'x-tscrm-signature',
      },
      docs: { openapi: '/docs', guide: '/guide' },
    };
  }
}
