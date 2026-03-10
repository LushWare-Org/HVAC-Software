/**
 * EmailProcessor — Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryStatus } from '../../prisma/generated';
import type { EmailJobPayload } from '../notifications.service';
import { Job } from 'bullmq';

const mockPrisma = {
  notification: { update: jest.fn() },
  deliveryLog: { create: jest.fn() },
};

const mockEmailService = { send: jest.fn() };

function makeJob(data: EmailJobPayload): Job<EmailJobPayload> {
  return { id: 'job-email-1', data } as unknown as Job<EmailJobPayload>;
}

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EmailService, useValue: mockEmailService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('marks notification DELIVERED and creates log on success', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockEmailService.send.mockResolvedValue({
      success: true,
      externalId: 'SG_MSG_001',
      durationMs: 300,
    });

    const payload: EmailJobPayload = {
      notificationId: 'notif-email-1',
      companyId: 'co-1',
      to: 'customer@test.com',
      toName: 'Jane Doe',
      subject: 'Your invoice',
      htmlBody: '<p>Hello Jane</p>',
    };

    await processor.process(makeJob(payload));

    const deliveredCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(deliveredCall.data.status).toBe(DeliveryStatus.DELIVERED);
    expect(deliveredCall.data.externalId).toBe('SG_MSG_001');

    const logCall = mockPrisma.deliveryLog.create.mock.calls[0][0];
    expect(logCall.data.channel).toBe('EMAIL');
    expect(logCall.data.provider).toBe('sendgrid');
    expect(logCall.data.status).toBe(DeliveryStatus.DELIVERED);
  });

  it('marks notification FAILED and throws on delivery failure', async () => {
    mockPrisma.notification.update.mockResolvedValue({});
    mockPrisma.deliveryLog.create.mockResolvedValue({});
    mockEmailService.send.mockResolvedValue({
      success: false,
      error: 'Bounce: user not found',
      durationMs: 150,
    });

    const payload: EmailJobPayload = {
      notificationId: 'notif-email-2',
      companyId: 'co-1',
      to: 'bounce@test.com',
      toName: 'Ghost',
      subject: 'Invoice',
      htmlBody: '<p>Hi</p>',
    };

    await expect(processor.process(makeJob(payload))).rejects.toThrow('Email delivery failed');

    const failedCall = mockPrisma.notification.update.mock.calls[1][0];
    expect(failedCall.data.status).toBe(DeliveryStatus.FAILED);
    expect(failedCall.data.error).toBe('Bounce: user not found');
  });
});
