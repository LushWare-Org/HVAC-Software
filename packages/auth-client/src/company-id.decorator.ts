import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@tscrm/types';

/**
 * Extract the companyId from the authenticated user on the request.
 *
 * @example
 * @Get('dashboard')
 * getDashboard(@CompanyId() companyId: string) {
 *   return this.service.getDashboard(companyId);
 * }
 */
export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return user?.companyId;
  },
);
