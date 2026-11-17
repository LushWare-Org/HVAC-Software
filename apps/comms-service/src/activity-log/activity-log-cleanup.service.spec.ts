import { ActivityLogCleanupService } from './activity-log-cleanup.service';

describe('ActivityLogCleanupService', () => {
  it('deletes rows older than 90 days', async () => {
    const prisma = { activityLog: { deleteMany: jest.fn().mockResolvedValue({ count: 12 }) } } as any;
    const service = new ActivityLogCleanupService(prisma);

    const result = await service.runCleanup();

    expect(prisma.activityLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
    const cutoff = prisma.activityLog.deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    const daysAgo = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysAgo).toBeGreaterThan(89.9);
    expect(daysAgo).toBeLessThan(90.1);
    expect(result).toEqual({ deleted: 12 });
  });
});
