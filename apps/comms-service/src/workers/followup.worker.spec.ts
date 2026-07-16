import type { Job } from 'bullmq';
import type { FollowupJobPayload } from '@tscrm/types';
import { FollowupWorker } from './followup.worker';
import { NotificationsService } from '../notifications/notifications.service';

const mockNotificationsService = {
  sendSms: jest.fn(),
  sendEmail: jest.fn(),
};

function makeJob(data: Partial<FollowupJobPayload>): Job<FollowupJobPayload> {
  return {
    id: 'job-1',
    data: {
      companyId: 'co-1',
      entityType: 'customer',
      entityId: 'cust-1',
      recipientId: 'cust-1',
      recipientName: 'Jane Doe',
      action: 'REENGAGEMENT',
      reason: 'No recent service in 120 days',
      triggeredAt: new Date().toISOString(),
      ...data,
    } as FollowupJobPayload,
  } as unknown as Job<FollowupJobPayload>;
}

describe('FollowupWorker', () => {
  let worker: FollowupWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new FollowupWorker(mockNotificationsService as unknown as NotificationsService);
  });

  it('sends the LLM-recommended message over SMS when recommendedChannel is SMS', async () => {
    mockNotificationsService.sendSms.mockResolvedValue({});

    const result = await worker.process(
      makeJob({
        recipientPhone: '+15551234567',
        recipientEmail: 'jane@example.com',
        recommendedChannel: 'SMS',
        recommendedMessage: 'Hi Jane, time for your HVAC tune-up!',
      }),
    );

    expect(result).toEqual({ channel: 'SMS' });
    expect(mockNotificationsService.sendSms).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Hi Jane, time for your HVAC tune-up!', recipientPhone: '+15551234567' }),
    );
    expect(mockNotificationsService.sendEmail).not.toHaveBeenCalled();
  });

  it('honors recommendedChannel EMAIL even when a phone number is available', async () => {
    mockNotificationsService.sendEmail.mockResolvedValue({});

    const result = await worker.process(
      makeJob({
        recipientPhone: '+15551234567',
        recipientEmail: 'jane@example.com',
        recommendedChannel: 'EMAIL',
        recommendedMessage: 'Hi Jane, following up by email.',
        recommendedSubject: 'A quick check-in',
      }),
    );

    expect(result).toEqual({ channel: 'EMAIL' });
    expect(mockNotificationsService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'A quick check-in', htmlBody: '<p>Hi Jane, following up by email.</p>' }),
    );
    expect(mockNotificationsService.sendSms).not.toHaveBeenCalled();
  });

  it('falls back to canned copy and phone-first default when no recommendation is present', async () => {
    mockNotificationsService.sendSms.mockResolvedValue({});

    await worker.process(makeJob({ recipientPhone: '+15551234567', action: 'REENGAGEMENT' }));

    expect(mockNotificationsService.sendSms).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining('It has been a while') }),
    );
  });

  it('uses the QUOTE_FOLLOWUP canned copy as a fallback', async () => {
    mockNotificationsService.sendEmail.mockResolvedValue({});

    await worker.process(makeJob({ recipientEmail: 'jane@example.com', action: 'QUOTE_FOLLOWUP' }));

    expect(mockNotificationsService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Any questions about your HVAC quote?' }),
    );
  });

  it('passes scheduledFor through as scheduledAt', async () => {
    mockNotificationsService.sendSms.mockResolvedValue({});
    const scheduledFor = new Date(Date.now() + 86400000).toISOString();

    await worker.process(makeJob({ recipientPhone: '+15551234567', scheduledFor }));

    const call = mockNotificationsService.sendSms.mock.calls[0][0];
    expect(call.scheduledAt).toEqual(new Date(scheduledFor));
  });

  it('skips when no delivery channel is available', async () => {
    const result = await worker.process(makeJob({}));

    expect(result).toEqual({ skipped: true });
    expect(mockNotificationsService.sendSms).not.toHaveBeenCalled();
    expect(mockNotificationsService.sendEmail).not.toHaveBeenCalled();
  });
});
