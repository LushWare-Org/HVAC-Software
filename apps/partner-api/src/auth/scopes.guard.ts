import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PARTNER_REQUEST_KEY, PartnerContext } from './partner-context';
import { SCOPES_METADATA_KEY } from './scopes.decorator';
import { hasScope } from './scopes';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      SCOPES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const partner: PartnerContext | undefined = request[PARTNER_REQUEST_KEY];

    if (!partner) {
      throw new ForbiddenException('No partner context on request');
    }

    const missing = required.filter((scope) => !hasScope(partner.scopes, scope));
    if (missing.length) {
      throw new ForbiddenException(
        `API key is missing required scope(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
