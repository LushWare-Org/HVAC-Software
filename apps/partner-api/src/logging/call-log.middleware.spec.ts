import type { Request, Response } from 'express';
import { CallLogMiddleware } from './call-log.middleware';
import { PrismaService } from '../prisma/prisma.service';
import { PARTNER_REQUEST_KEY } from '../auth/partner-context';

function makePrisma() {
  return { partnerApiCall: { create: jest.fn().mockResolvedValue({}) } };
}

function makeReq(originalUrl: string, extra: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    originalUrl,
    url: originalUrl,
    path: '/',
    ip: '10.0.0.1',
    headers: { 'user-agent': 'acme-bot/1.0' },
    ...extra,
  } as unknown as Request;
}

function makeRes(statusCode: number) {
  const handlers: Array<() => void> = [];
  const res = {
    statusCode,
    once: (event: string, cb: () => void) => {
      if (event === 'finish') handlers.push(cb);
      return res;
    },
    finish: () => handlers.forEach((h) => h()),
  };
  return res as unknown as Response & { finish: () => void };
}

describe('CallLogMiddleware', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let middleware: CallLogMiddleware;

  beforeEach(() => {
    prisma = makePrisma();
    middleware = new CallLogMiddleware(prisma as unknown as PrismaService);
  });

  it('skips health probes so liveness checks do not flood the table', () => {
    const next = jest.fn();
    const res = makeRes(200);
    middleware.use(makeReq('/health'), res, next);
    res.finish();

    expect(next).toHaveBeenCalled();
    expect(prisma.partnerApiCall.create).not.toHaveBeenCalled();
  });

  it('ignores the query string when matching the health path', () => {
    const res = makeRes(200);
    middleware.use(makeReq('/health?probe=1'), res, jest.fn());
    res.finish();
    expect(prisma.partnerApiCall.create).not.toHaveBeenCalled();
  });

  it('records a successful authenticated call against its key and company', () => {
    const res = makeRes(200);
    const req = makeReq('/v1/whoami', {
      [PARTNER_REQUEST_KEY]: { keyId: 'k1', companyId: 'co-demo-001' },
      route: { path: '/v1/whoami' },
    });

    middleware.use(req, res, jest.fn());
    res.finish();

    expect(prisma.partnerApiCall.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        apiKeyId: 'k1',
        companyId: 'co-demo-001',
        method: 'GET',
        path: '/v1/whoami',
        statusCode: 200,
        errorCode: null,
      }),
    });
  });

  // Regression: guards run before interceptors, so an interceptor never sees
  // these. They are exactly the calls worth keeping for abuse detection.
  it.each([
    [401, 'rejected key'],
    [403, 'missing scope'],
    [429, 'rate limited'],
  ])('records a %i (%s)', (statusCode) => {
    const res = makeRes(statusCode);
    middleware.use(makeReq('/v1/whoami'), res, jest.fn());
    res.finish();

    expect(prisma.partnerApiCall.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        statusCode,
        path: '/v1/whoami',
        errorCode: String(statusCode),
        apiKeyId: null,
      }),
    });
  });

  it('does not throw when the log write fails', () => {
    prisma.partnerApiCall.create.mockRejectedValue(new Error('db down'));
    const res = makeRes(200);
    expect(() => {
      middleware.use(makeReq('/v1/whoami'), res, jest.fn());
      res.finish();
    }).not.toThrow();
  });
});
