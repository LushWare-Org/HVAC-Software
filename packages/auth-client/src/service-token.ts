/**
 * Short-lived tokens for calls between our own services.
 *
 * Until now every outbound client did one of two things: send the x-test-*
 * identity headers (which only worked while the development auth bypass was
 * switched on in production — the hole that let anyone read any tenant's
 * data), or send `Bearer ${SERVICE_JWT}` where SERVICE_JWT was never set, so
 * the call failed with 401. With the bypass closed, the second path is all
 * that is left, and it does not work.
 *
 * A static shared token cannot replace it either: the receiving guard scopes
 * every query by the token's company_id claim, and that differs per call.
 *
 * So each call mints its own token, signed with the same JWT_SECRET every
 * service already verifies against, carrying the tenant it acts for. It lives
 * for two minutes, long enough for any request and short enough that a leaked
 * one is nearly worthless. The receiving side needs no change at all.
 */
import * as jwt from 'jsonwebtoken';
import { requireJwtSecret } from './secrets';

export interface ServiceTokenOptions {
  /** The tenant this call acts on behalf of. Required: nothing is cross-tenant. */
  companyId: string;
  /** A stable name for the caller, e.g. "comms:enroute-notifier". Shows up as the user id in logs. */
  actor: string;
  /** Defaults to super_admin, which is what the x-test-* headers claimed. */
  role?: string;
  /** Only for customer-facing flows that must be scoped to one customer. */
  customerId?: string;
  /** Seconds. Default 120. */
  ttlSeconds?: number;
}

export function mintServiceToken(opts: ServiceTokenOptions): string {
  if (!opts.companyId) throw new Error('mintServiceToken: companyId is required');
  const payload: Record<string, unknown> = {
    sub: `svc:${opts.actor}`,
    email: `${opts.actor.replace(/[^a-z0-9._-]/gi, '-')}@tscrm.internal`,
    company_id: opts.companyId,
    role: opts.role ?? 'super_admin',
    name: opts.actor,
    iss: 'tscrm-local',
    svc: true,
  };
  if (opts.customerId) payload['customer_id'] = opts.customerId;
  return jwt.sign(payload, requireJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: opts.ttlSeconds ?? 120,
  });
}

/** Ready-to-spread headers for axios/fetch. */
export function serviceAuthHeaders(companyId: string, actor: string, extra?: Partial<ServiceTokenOptions>): Record<string, string> {
  return { Authorization: `Bearer ${mintServiceToken({ companyId, actor, ...extra })}` };
}
