/**
 * PushProcessor — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PushProcessor } from './push.processor';
import { PushService } from '../../push/push.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { PushJobPayload } from '../notifications.service';
import { Job } from 'bullmq';

const mockPrisma = {
  notification: { update: jest.fn() },
  deliveryLog: { create: jest.fn() },
};

const mockPushService = { sendToToken: jest.fn() };

function makeJob(data: PushJobPayload): Job<PushJobPayload> {
  return { id: 'job-push-1', data } as unknown as Job<PushJobPayload>;
}

describe('PushProcessor', () => {
  let processor: PushProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushProcessor,
        { provide: PushService, useValue: mockPushService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    processor = module.get<PushProcessor>(PushProcessor);
  });

  it('marks notification DELIVERED and creates log on success', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockPushService.sendToToken.mockResolvedValue({
      success: true,
      externalId: 'projects/test/messages/fcm-001',
      durationMs: 180,
    });

    const payload: PushJobPayload = {
      notificationId: 'notif-push-1',
      companyId: 'co-1',
      token: 'fcm-device-token-abc',
      title: 'Job Update',
      body: 'Your technician is on the way.',
      data: { jobId: 'job-001' },
    };

    await processor.process(makeJob(payload));

    const deliveredCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(deliveredCall.data.status).toBe(DeliveryStatus.DELIVERED);
    expect(deliveredCall.data.externalId).toBe('projects/test/messages/fcm-001');

    const logCall = mockPrisma.deliveryLog.create.mock.calls[0][0];
    expect(logCall.data.channel).toBe('PUSH');
    expect(logCall.data.provider).toBe('fcm');
    expect(logCall.data.status).toBe(DeliveryStatus.DELIVERED);
  });

  it('marks notification FAILED and throws on push failure', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockPushService.sendToToken.mockResolvedValue({
      success: false,
      error: 'Invalid registration token',
      durationMs: 50,
    });

    const payload: PushJobPayload = {
      notificationId: 'notif-push-2',
      companyId: 'co-1',
      token: 'invalid-token',
      title: 'Test',
      body: 'Test body',
    };

    await expect(processor.process(makeJob(payload))).rejects.toThrow('Push delivery failed');

    const failedCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(failedCall.data.status).toBe(DeliveryStatus.FAILED);
    expect(failedCall.data.error).toBe('Invalid registration token');
  });
});
