import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from './api-keys.service';
import { PARTNER_REQUEST_KEY } from './partner-context';
import { IS_PUBLIC_KEY } from './public.decorator';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Authenticates a partner by API key. Runs before ScopesGuard and
 * RateLimitGuard, which both depend on the PartnerContext it attaches.
 *
 * Unknown, revoked and expired keys are all reported identically so a caller
 * cannot probe which of their keys still exists.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers?.[API_KEY_HEADER];
    const presented = Array.isArray(header) ? header[0] : header;

    if (!presented) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const partner = await this.apiKeys.verify(presented.trim());
    if (!partner) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request[PARTNER_REQUEST_KEY] = partner;
    return true;
  }
}
