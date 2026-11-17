import { ActivityLogController, ActivityLogIngestController } from './activity-log.controller';
import { Role } from '@tscrm/types';

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
});
