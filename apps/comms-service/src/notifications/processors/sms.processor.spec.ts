/**
 * SmsProcessor — Unit Tests
 *
 * Verifies that the BullMQ SMS processor correctly:
 *  - Marks notification SENT → calls SmsService → marks DELIVERED + creates DeliveryLog
 *  - On failure: marks FAILED → creates DeliveryLog → throws (triggers BullMQ retry)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SmsProcessor } from './sms.processor';
import { SmsService } from '../../sms/sms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { SmsJobPayload } from '../notifications.service';
import { Job } from 'bullmq';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPrisma = {
  notification: { update: jest.fn() },
  deliveryLog: { create: jest.fn() },
};

const mockSmsService = {
  send: jest.fn(),
};

function makeJob(data: SmsJobPayload): Job<SmsJobPayload> {
  return { id: 'job-1', data } as unknown as Job<SmsJobPayload>;
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('SmsProcessor', () => {
  let processor: SmsProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsProcessor,
        { provide: SmsService, useValue: mockSmsService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    processor = module.get<SmsProcessor>(SmsProcessor);
  });

  it('marks notification DELIVERED and creates DeliveryLog on success', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockSmsService.send.mockResolvedValue({
      success: true,
      externalId: 'SM123',
      durationMs: 250,
    });

    const payload: SmsJobPayload = {
      notificationId: 'notif-1',
      companyId: 'co-1',
      to: '+1234567890',
      body: 'Your appointment is confirmed.',
    };

    await processor.process(makeJob(payload));

    // First update: SENT
    expect(mockPrisma.notification.update.mock.calls[0][0].data.status).toBe(DeliveryStatus.SENT);

    // Second update: DELIVERED
    const deliveredCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(deliveredCall.data.status).toBe(DeliveryStatus.DELIVERED);
    expect(deliveredCall.data.externalId).toBe('SM123');

    // DeliveryLog created with DELIVERED status
    const logCall = mockPrisma.deliveryLog.create.mock.calls[0][0];
    expect(logCall.data.status).toBe(DeliveryStatus.DELIVERED);
    expect(logCall.data.channel).toBe('SMS');
    expect(logCall.data.provider).toBe('twilio');
    expect(logCall.data.externalId).toBe('SM123');
  });

  it('marks notification FAILED and throws on delivery error', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockSmsService.send.mockResolvedValue({
      success: false,
      error: 'Invalid phone number',
      durationMs: 100,
    });

    const payload: SmsJobPayload = {
      notificationId: 'notif-2',
      companyId: 'co-1',
      to: '+0000000000',
      body: 'Test',
    };

    await expect(processor.process(makeJob(payload))).rejects.toThrow('SMS delivery failed');

    // Second update: FAILED
    const failedCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(failedCall.data.status).toBe(DeliveryStatus.FAILED);
    expect(failedCall.data.error).toBe('Invalid phone number');

    // DeliveryLog created with FAILED status
    const logCall = mockPrisma.deliveryLog.create.mock.calls[0][0];
    expect(logCall.data.status).toBe(DeliveryStatus.FAILED);
    expect(logCall.data.error).toBe('Invalid phone number');
  });
});
