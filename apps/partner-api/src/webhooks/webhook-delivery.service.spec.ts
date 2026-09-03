import axios from 'axios';
import { PartnerEventType } from '@tscrm/queue';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const EVENT = {
  type: PartnerEventType.JOB_COMPLETED,
  companyId: 'co-1',
  entityId: 'job-1',
  occurredAt: '2026-09-03T10:00:00.000Z',
  data: { jobNumber: 'JOB-1', customerName: 'Sarah Jones' },
};

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wh-1',
    companyId: 'co-1',
    url: 'https://acme.example.com/hooks',
    secret: 'whsec_test',
    events: ['job.completed'],
    status: 'ACTIVE',
    failureCount: 0,
    ...overrides,
  };
}

function makePrisma(subs: any[]) {
  return {
    partnerWebhook: {
      findMany: jest.fn().mockResolvedValue(subs),
      update: jest.fn(async ({ data }: any) => ({
        id: 'wh-1',
        failureCount: data?.failureCount?.increment ?? 0,
      })),
    },
    partnerWebhookDelivery: { create: jest.fn().mockResolvedValue({}) },
  };
}

describe('WebhookDeliveryService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('signing', () => {
    it('round-trips a signature', () => {
      const sig = WebhookDeliveryService.sign('secret', '1000', '{"a":1}');
      expect(WebhookDeliveryService.verify('secret', '1000', '{"a":1}', sig)).toBe(true);
    });

    it('rejects a tampered body', () => {
      const sig = WebhookDeliveryService.sign('secret', '1000', '{"a":1}');
      expect(WebhookDeliveryService.verify('secret', '1000', '{"a":2}', sig)).toBe(false);
    });

    // Signing the timestamp is what stops a captured request being replayed.
    it('rejects a replayed timestamp', () => {
      const sig = WebhookDeliveryService.sign('secret', '1000', '{"a":1}');
      expect(WebhookDeliveryService.verify('secret', '2000', '{"a":1}', sig)).toBe(false);
    });

    it('rejects the wrong secret', () => {
      const sig = WebhookDeliveryService.sign('secret', '1000', '{"a":1}');
      expect(WebhookDeliveryService.verify('other', '1000', '{"a":1}', sig)).toBe(false);
    });
  });

  it('delivers a signed payload the partner can verify', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200 } as any);
    const prisma = makePrisma([subscription()]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    const result = await service.dispatch(EVENT);

    expect(result.delivered).toBe(1);
    const [url, body, config] = mockedAxios.post.mock.calls[0] as any[];
    expect(url).toBe('https://acme.example.com/hooks');
    expect(
      WebhookDeliveryService.verify(
        'whsec_test',
        config.headers['x-tscrm-timestamp'],
        body,
        config.headers['x-tscrm-signature'],
      ),
    ).toBe(true);
    expect(JSON.parse(body)).toMatchObject({ type: 'job.completed' });
  });

  it('sends nothing when no subscription matches', async () => {
    const prisma = makePrisma([]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    const result = await service.dispatch(EVENT);
    expect(result).toEqual({ delivered: 0, failed: 0 });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  // A 4xx is the partner rejecting the payload; resending the identical body
  // cannot succeed and just burns their rate limit.
  it('does not retry a 400', async () => {
    mockedAxios.post.mockResolvedValue({ status: 400 } as any);
    const prisma = makePrisma([subscription()]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    const result = await service.dispatch(EVENT);

    expect(result.failed).toBe(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('retries a 500 and succeeds on a later attempt', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ status: 500 } as any)
      .mockResolvedValueOnce({ status: 200 } as any);
    const prisma = makePrisma([subscription()]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    const result = await service.dispatch(EVENT);

    expect(result.delivered).toBe(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  }, 20000);

  it('records every attempt for later troubleshooting', async () => {
    mockedAxios.post.mockResolvedValue({ status: 400 } as any);
    const prisma = makePrisma([subscription()]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    await service.dispatch(EVENT);

    expect(prisma.partnerWebhookDelivery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        webhookId: 'wh-1',
        eventType: 'job.completed',
        entityId: 'job-1',
        statusCode: 400,
        success: false,
      }),
    });
  });

  it('keeps delivering to other partners when one endpoint is down', async () => {
    mockedAxios.post.mockImplementation(async (url: any) =>
      url.includes('broken') ? { status: 500 } : ({ status: 200 } as any),
    );
    const prisma = makePrisma([
      subscription({ id: 'wh-good' }),
      subscription({ id: 'wh-bad', url: 'https://broken.example.com/hooks' }),
    ]);
    const service = new WebhookDeliveryService(prisma as unknown as PrismaService);

    const result = await service.dispatch(EVENT);

    expect(result.delivered).toBe(1);
    expect(result.failed).toBe(1);
  }, 30000);
});
