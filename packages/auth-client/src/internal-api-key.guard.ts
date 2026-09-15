import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Guards routes that other services call without a user context.
 *
 * A guard, not a check inside the handler: guards run before validation
 * pipes, so an unauthenticated caller gets 401 and learns nothing about the
 * body shape. Fails closed when INTERNAL_API_KEY is unset — an unset key
 * rejects everyone rather than accepting everyone.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-internal-api-key'] as string | undefined;
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected || !key || key !== expected) {
      throw new UnauthorizedException('Invalid internal API key');
    }
    return true;
  }
}
