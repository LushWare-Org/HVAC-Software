import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Role } from '@tscrm/types';

/**
 * Apply to any controller/route that requires a valid Auth0 JWT.
 *
 * ─── TEST / DEMO MODE ─────────────────────────────────────────────────────────
 * When BYPASS_AUTH=true AND NODE_ENV !== 'production', the guard accepts
 * requests that carry the header  x-test-company-id: <uuid>
 * and injects a synthetic AuthUser into request.user.
 *
 * This is used exclusively for integration / flow tests and client demos.
 * BYPASS_AUTH must NEVER be set to true in a production environment.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // ── Test / demo bypass ────────────────────────────────────────────────────
    // Only honored when the request carries NO real JWT — a Bearer token always
    // wins, otherwise stale x-test-* headers from a dev frontend can silently
    // impersonate the wrong tenant (e.g. co-demo-001 overriding a KASE login).
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.BYPASS_AUTH === 'true'
    ) {
      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers['authorization'] as string | undefined;
      const hasBearerToken = !!authHeader && authHeader.startsWith('Bearer ');
      const companyId = req.headers['x-test-company-id'] as string | undefined;

      if (companyId && !hasBearerToken) {
        const rawRole = (req.headers['x-test-user-role'] ?? 'COMPANY_ADMIN') as string;
        req.user = {
          userId:     req.headers['x-test-user-id']     ?? 'test-user-001',
          email:      req.headers['x-test-user-email']  ?? 'admin@demo.tscrm.dev',
          companyId,
          role:       rawRole.toLowerCase() as Role,
          name:       req.headers['x-test-user-name']   ?? 'Demo Admin',
          customerId: req.headers['x-test-customer-id'] as string | undefined,
        };
        return true;
      }
    }
    // ── Normal Auth0 JWT verification ─────────────────────────────────────────
    return super.canActivate(context);
  }
}
