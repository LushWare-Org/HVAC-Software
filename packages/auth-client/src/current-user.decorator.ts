import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@tscrm/types';

/**
 * Extract the authenticated user from the request.
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
