import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  PARTNER_REQUEST_KEY,
  PartnerContext,
} from '../auth/partner-context';
import { RateLimitService } from './rate-limit.service';

/**
 * Applies the calling key's per-minute limit. Runs after ApiKeyGuard so that
 * the limit is charged to a specific key rather than to an IP — an unauthed
 * request never reaches here.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimit: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const partner: PartnerContext | undefined = request[PARTNER_REQUEST_KEY];

    if (!partner) {
      return true; // public route — nothing to charge
    }

    const decision = await this.rateLimit.consume(
      partner.keyId,
      partner.rateLimitPerMin,
    );

    const response = http.getResponse();
    response.setHeader('X-RateLimit-Limit', String(decision.limit));
    response.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    response.setHeader('X-RateLimit-Reset', String(decision.resetAt));

    if (!decision.allowed) {
      response.setHeader('Retry-After', String(decision.retryAfterSec));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit of ${decision.limit} requests/minute exceeded. Retry in ${decision.retryAfterSec}s.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
