import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PartnerContext {
  keyId: string;
  companyId: string;
  name: string;
  environment: 'LIVE' | 'SANDBOX';
  scopes: string[];
  rateLimitPerMin: number;
}

export const PARTNER_REQUEST_KEY = 'partner';

/** Injects the PartnerContext into a controller handler. */
export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PartnerContext => {
    const request = ctx.switchToHttp().getRequest();
    return request[PARTNER_REQUEST_KEY];
  },
);
