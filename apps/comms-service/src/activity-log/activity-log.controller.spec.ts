import { ActivityLogController, ActivityLogIngestController } from './activity-log.controller';
import { Role } from '@tscrm/types';
import { InternalApiKeyGuard } from '@tscrm/auth-client';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UnauthorizedException } from '@nestjs/common';

function makePrisma() {
  return {
    activityLog: {
      findMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
      count: jest.fn().mockResolvedValue(1),
    },
  } as any;
}

describe('ActivityLogController', () => {
  it('lists activity, applying company/service/status/date filters and clamped pagination', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma);

    const result = await controller.list({
      companyId: 'co-1', service: 'jobs', status: 'FAILURE', page: '1', limit: '20',
    } as any);

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'co-1', service: 'jobs', status: 'FAILURE' }),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      }),
    );
    expect(result.items).toEqual([{ id: 'log-1' }]);
    expect(result.total).toBe(1);
  });

  it('omits the companyId filter when companyId is "all" or absent', async () => {
    const prisma = makePrisma();
    const controller = new ActivityLogController(prisma);

    await controller.list({ companyId: 'all' } as any);

    const where = prisma.activityLog.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBeUndefined();
  });

  it('lists distinct companies seen in the log', async () => {
    const prisma = makePrisma();
    prisma.activityLog.findMany.mockResolvedValueOnce([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
    const controller = new ActivityLogController(prisma);

    const result = await controller.companies();

    expect(result).toEqual([
      { companyId: 'co-1', companyName: 'Acme' },
      { companyId: 'co-2', companyName: 'Bolt Co' },
    ]);
  });

  it('is annotated for Role.SUPER_ADMIN only (guarded at the class level)', () => {
    const roles = Reflect.getMetadata('roles', ActivityLogController);
    expect(roles).toEqual([Role.SUPER_ADMIN]);
  });
});

describe('ActivityLogIngestController', () => {
  it('hands the event to the processor and returns accepted', async () => {
    const handleEvent = jest.fn().mockResolvedValue({ id: 'log-9' });
    const controller = new ActivityLogIngestController({ handleEvent } as any);

    const result = await controller.ingest({ service: 'scheduling', action: 'technician.assigned' } as any);

    expect(handleEvent).toHaveBeenCalledWith(expect.objectContaining({ service: 'scheduling' }));
    expect(result).toEqual({ accepted: true });
  });

  it('carries no @Roles metadata (service-to-service, not user-guarded)', () => {
    const roles = Reflect.getMetadata('roles', ActivityLogIngestController);
    expect(roles).toBeUndefined();
  });

  // This route was reachable with zero credentials until this fix — verified
  // live: a fabricated event posted with no auth landed in the real activity
  // log. No @Roles here is still correct (there's no user JWT to check a role
  // against), but the route must not be bare; InternalApiKeyGuard is the
  // credential that replaces it.
  it('applies InternalApiKeyGuard to the ingest method, and nothing weaker', () => {
    const method = ActivityLogIngestController.prototype.ingest;
    const guards = Reflect.getMetadata(GUARDS_METADATA, method);
    expect(guards).toEqual([InternalApiKeyGuard]);
  });

  it('the guard rejects a request with no key, and one with the wrong key', () => {
    const guard = new InternalApiKeyGuard();
    process.env.INTERNAL_API_KEY = 'the-real-key';
    const contextWith = (key?: string) => ({
      switchToHttp: () => ({ getRequest: () => ({ headers: key ? { 'x-internal-api-key': key } : {} }) }),
    }) as any;

    expect(() => guard.canActivate(contextWith(undefined))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWith('wrong-key'))).toThrow(UnauthorizedException);
    expect(guard.canActivate(contextWith('the-real-key'))).toBe(true);
  });
});
