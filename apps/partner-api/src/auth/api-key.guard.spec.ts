import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { ScopesGuard } from './scopes.guard';
import { SCOPES_METADATA_KEY } from './scopes.decorator';
import { PARTNER_REQUEST_KEY, PartnerContext } from './partner-context';
import { ApiKeysService } from './api-keys.service';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ setHeader: jest.fn(), statusCode: 200 }),
    }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

const partner: PartnerContext = {
  keyId: 'key-1',
  companyId: 'co-demo-001',
  name: 'Acme Voice AI',
  environment: 'LIVE',
  scopes: ['customer:lookup', 'booking:create'],
  rateLimitPerMin: 60,
};

describe('ApiKeyGuard', () => {
  let verify: jest.Mock;
  let guard: ApiKeyGuard;
  let reflector: Reflector;

  beforeEach(() => {
    verify = jest.fn();
    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    guard = new ApiKeyGuard({ verify } as unknown as ApiKeysService, reflector);
  });

  it('rejects a request with no key', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects an unknown or revoked key', async () => {
    verify.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextFor({ headers: { 'x-api-key': 'pk_live_bogus' } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid key and attaches the partner context', async () => {
    verify.mockResolvedValue(partner);
    const request: Record<string, unknown> = {
      headers: { 'x-api-key': '  pk_live_good  ' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('pk_live_good');
    expect(request[PARTNER_REQUEST_KEY]).toEqual(partner);
  });

  it('lets a @PartnerPublic route through without a key', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(true);
  });
});

describe('ScopesGuard', () => {
  let reflector: Reflector;
  let guard: ScopesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ScopesGuard(reflector);
  });

  function withRequiredScopes(required: string[] | undefined) {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => (key === SCOPES_METADATA_KEY ? required : undefined));
  }

  it('allows a handler that declares no scopes', () => {
    withRequiredScopes(undefined);
    expect(guard.canActivate(contextFor({ [PARTNER_REQUEST_KEY]: partner }))).toBe(true);
  });

  it('allows a granted scope', () => {
    withRequiredScopes(['booking:create']);
    expect(guard.canActivate(contextFor({ [PARTNER_REQUEST_KEY]: partner }))).toBe(true);
  });

  it('refuses a scope the key was not granted', () => {
    withRequiredScopes(['payment_link:create']);
    expect(() =>
      guard.canActivate(contextFor({ [PARTNER_REQUEST_KEY]: partner })),
    ).toThrow(ForbiddenException);
  });

  it('refuses when only some required scopes are granted', () => {
    withRequiredScopes(['booking:create', 'payment_link:create']);
    expect(() =>
      guard.canActivate(contextFor({ [PARTNER_REQUEST_KEY]: partner })),
    ).toThrow(ForbiddenException);
  });

  it('refuses when there is no partner context at all', () => {
    withRequiredScopes(['booking:create']);
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
  });
});
