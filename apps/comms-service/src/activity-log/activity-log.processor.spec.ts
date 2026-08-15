import { ActivityLogProcessor } from './activity-log.processor';
import type { ActivityLogEvent } from '@tscrm/types';

describe('ActivityLogProcessor', () => {
  const baseEvent: ActivityLogEvent = {
    companyId: 'co-1',
    service: 'jobs',
    method: 'POST',
    path: '/jobs',
    actorUserId: 'u1',
    actorName: 'Jane',
    actorRole: 'dispatcher',
    action: 'job.created',
    description: 'Created job "Fix AC"',
    status: 'SUCCESS',
    statusCode: 201,
    durationMs: 42,
  };

  it('writes a row with the resolved company name and broadcasts it', async () => {
    const created = { id: 'log-1', ...baseEvent, companyName: 'Acme HVAC', createdAt: new Date() };
    const prisma = { activityLog: { create: jest.fn().mockResolvedValue(created) } } as any;
    const companyNames = { resolve: jest.fn().mockResolvedValue('Acme HVAC') } as any;
    const broadcast = jest.fn();

    const stubWorker = { on: jest.fn(), close: jest.fn() };
    const processor = new ActivityLogProcessor(
      prisma,
      companyNames,
      { broadcastActivity: broadcast } as any,
      stubWorker as any,
    );
    const result = await processor.handleEvent(baseEvent);

    expect(companyNames.resolve).toHaveBeenCalledWith('co-1');
    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: 'co-1', companyName: 'Acme HVAC', action: 'job.created' }),
    });
    expect(broadcast).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });
});
