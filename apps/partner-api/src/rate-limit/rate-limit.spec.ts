import { ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// The service opens a Redis connection in its constructor; stub the driver so
// the suite exercises the in-memory fallback path deterministically.
jest.mock('ioredis', () => ({
  __esModule: true,
  default: class RedisStub {
    connect() {
      return Promise.reject(new Error('no redis in tests'));
    }
    disconnect() {}
  },
}));

import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';
import { PARTNER_REQUEST_KEY, PartnerContext } from '../auth/partner-context';

const config = {
  get: (_key: string, fallback?: unknown) => fallback,
} as unknown as ConfigService;

const partner: PartnerContext = {
  keyId: 'key-1',
  companyId: 'co-demo-001',
  name: 'Acme Voice AI',
  environment: 'LIVE',
  scopes: [],
  rateLimitPerMin: 3,
};

describe('RateLimitService', () => {
  it('allows requests up to the limit, then refuses', async () => {
    const service = new RateLimitService(config);

    const first = await service.consume('key-a', 3);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    await service.consume('key-a', 3);
    const third = await service.consume('key-a', 3);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = await service.consume('key-a', 3);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);

    service.onModuleDestroy();
  });

  it('counts each key separately', async () => {
    const service = new RateLimitService(config);
    await service.consume('key-b', 1);
    const other = await service.consume('key-c', 1);
    expect(other.allowed).toBe(true);
    service.onModuleDestroy();
  });
});

describe('RateLimitGuard', () => {
  function contextFor(request: Record<string, unknown>, setHeader = jest.fn()) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;
  }

  it('sets rate limit headers and throws 429 once over', async () => {
    const service = new RateLimitService(config);
    const guard = new RateLimitGuard(service);
    const setHeader = jest.fn();
    const ctx = contextFor({ [PARTNER_REQUEST_KEY]: partner }, setHeader);

    await guard.canActivate(ctx);
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '3');
    expect(setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');

    await guard.canActivate(ctx);
    await guard.canActivate(ctx);

    await expect(guard.canActivate(ctx)).rejects.toThrow(HttpException);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));

    service.onModuleDestroy();
  });

  it('skips public routes that carry no partner context', async () => {
    const service = new RateLimitService(config);
    const guard = new RateLimitGuard(service);
    await expect(guard.canActivate(contextFor({}))).resolves.toBe(true);
    service.onModuleDestroy();
  });
});
