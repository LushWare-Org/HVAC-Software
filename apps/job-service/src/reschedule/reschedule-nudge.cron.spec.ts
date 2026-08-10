/**
 * The claim-before-send behaviour is the point of these tests. Cloud Run runs
 * several instances, each firing the same interval — without the conditional
 * claim a customer receives one reminder per instance.
 */
import { Test } from '@nestjs/testing';
import { RescheduleStatus } from '@tscrm/types';
import { RescheduleNudgeCron } from './reschedule-nudge.cron';
import { RescheduleNotifyClient } from './reschedule-notify.client';
import { PrismaService } from '../prisma/prisma.service';

const stale = {
  id: 'req-1', companyId: 'co-1', jobId: 'job-1',
  status: RescheduleStatus.AWAITING_RESPONSE, openedBy: 'ADMIN',
  createdAt: new Date(Date.now() - 3 * 86_400_000), nudgedAt: null,
  slots: [], job: { id: 'job-1', title: 'AC', customerEmail: 'a@b.c' },
};

describe('RescheduleNudgeCron', () => {
  let cron: RescheduleNudgeCron;

  const prisma: any = {
    rescheduleRequest: { findMany: jest.fn(), updateMany: jest.fn() },
  };
  const notify = { nudge: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.rescheduleRequest.findMany.mockResolvedValue([stale]);
    prisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 1 });
    notify.nudge.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        RescheduleNudgeCron,
        { provide: PrismaService, useValue: prisma },
        { provide: RescheduleNotifyClient, useValue: notify },
      ],
    }).compile();
    cron = module.get(RescheduleNudgeCron);
  });

  afterEach(() => cron.onModuleDestroy());

  it('only considers unanswered requests older than 48h that were never nudged', async () => {
    await cron.sweep();
    const where = prisma.rescheduleRequest.findMany.mock.calls[0][0].where;
    expect(where.status).toBe(RescheduleStatus.AWAITING_RESPONSE);
    expect(where.nudgedAt).toBeNull();
    expect(where.createdAt.lt).toBeInstanceOf(Date);
    expect(Date.now() - where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(48 * 3_600_000 - 5_000);
  });

  it('claims each request before notifying, so a second instance sends nothing', async () => {
    prisma.rescheduleRequest.updateMany.mockResolvedValue({ count: 0 });
    const sent = await cron.sweep();
    expect(sent).toBe(0);
    expect(notify.nudge).not.toHaveBeenCalled();
  });

  it('the claim is conditional on nudgedAt still being null', async () => {
    await cron.sweep();
    expect(prisma.rescheduleRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'req-1', nudgedAt: null },
      data: { nudgedAt: expect.any(Date) },
    });
  });

  it('sends one nudge per claimed request', async () => {
    const sent = await cron.sweep();
    expect(sent).toBe(1);
    expect(notify.nudge).toHaveBeenCalledTimes(1);
    expect(notify.nudge).toHaveBeenCalledWith('co-1', expect.objectContaining({
      job: expect.objectContaining({ id: 'job-1' }),
    }));
  });

  it('keeps going when a single notification throws', async () => {
    prisma.rescheduleRequest.findMany.mockResolvedValue([stale, { ...stale, id: 'req-2' }]);
    notify.nudge.mockRejectedValueOnce(new Error('boom'));
    const sent = await cron.sweep();
    expect(sent).toBe(1);              // the failed one is not counted
    expect(notify.nudge).toHaveBeenCalledTimes(2); // but the batch continued
  });

  it('does nothing when nothing is stale', async () => {
    prisma.rescheduleRequest.findMany.mockResolvedValue([]);
    expect(await cron.sweep()).toBe(0);
    expect(prisma.rescheduleRequest.updateMany).not.toHaveBeenCalled();
    expect(notify.nudge).not.toHaveBeenCalled();
  });

  it('caps the batch so one sweep cannot run away', async () => {
    await cron.sweep();
    expect(prisma.rescheduleRequest.findMany.mock.calls[0][0].take).toBe(200);
  });
});
