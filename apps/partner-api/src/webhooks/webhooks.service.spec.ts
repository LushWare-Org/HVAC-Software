import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrisma() {
  return {
    partnerWebhook: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'wh-1',
        status: 'ACTIVE',
        createdAt: new Date(),
        ...data,
      })),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    },
    partnerWebhookDelivery: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('WebhooksService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: WebhooksService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.PARTNER_WEBHOOK_ALLOW_HTTP;
    delete process.env.PARTNER_WEBHOOK_ALLOW_PRIVATE_HOST;
    prisma = makePrisma();
    service = new WebhooksService(prisma as unknown as PrismaService);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('register', () => {
    it('issues a signing secret once', async () => {
      const result = await service.register('co-1', 'key-1', {
        url: 'https://acme-voice.example.com/hooks',
        events: ['job.completed'],
      });

      expect(result.secret).toMatch(/^whsec_[0-9a-f]{64}$/);
      expect(result.events).toEqual(['job.completed']);
    });

    it('refuses unknown event types', async () => {
      await expect(
        service.register('co-1', 'key-1', {
          url: 'https://acme-voice.example.com/hooks',
          events: ['job.completed', 'customer.exported'],
        }),
      ).rejects.toThrow(/Unknown event type/);
      expect(prisma.partnerWebhook.create).not.toHaveBeenCalled();
    });

    it('requires https', async () => {
      await expect(
        service.register('co-1', 'key-1', {
          url: 'http://acme-voice.example.com/hooks',
          events: ['job.completed'],
        }),
      ).rejects.toThrow(/https/);
    });

    // A partner-supplied URL pointed at our own network is the classic SSRF
    // shape — the delivery would run from inside the perimeter.
    it.each([
      'https://localhost/hooks',
      'https://127.0.0.1/hooks',
      'https://10.0.0.5/hooks',
      'https://192.168.1.10/hooks',
      'https://169.254.169.254/latest/meta-data',
      'https://172.16.4.4/hooks',
      'https://redis.internal/hooks',
    ])('refuses the internal address %s', async (url) => {
      await expect(
        service.register('co-1', 'key-1', { url, events: ['job.completed'] }),
      ).rejects.toThrow(/publicly reachable/);
    });

    // Regression: these were once the same flag, so enabling http for a local
    // test also silently allowed delivery to internal addresses.
    it('still refuses internal addresses when only http is allowed', async () => {
      process.env.PARTNER_WEBHOOK_ALLOW_HTTP = 'true';

      await expect(
        service.register('co-1', 'key-1', {
          url: 'http://169.254.169.254/latest/meta-data',
          events: ['job.completed'],
        }),
      ).rejects.toThrow(/publicly reachable/);

      await expect(
        service.register('co-1', 'key-1', {
          url: 'https://10.0.0.5/hooks',
          events: ['job.completed'],
        }),
      ).rejects.toThrow(/publicly reachable/);
    });

    it('allows a local endpoint only when the private-host flag is set', async () => {
      process.env.PARTNER_WEBHOOK_ALLOW_HTTP = 'true';
      process.env.PARTNER_WEBHOOK_ALLOW_PRIVATE_HOST = 'true';

      const result = await service.register('co-1', 'key-1', {
        url: 'http://localhost:4999/hooks',
        events: ['job.completed'],
      });
      expect(result.url).toBe('http://localhost:4999/hooks');
    });

    it('refuses a non-URL', async () => {
      await expect(
        service.register('co-1', 'key-1', {
          url: 'not a url',
          events: ['job.completed'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('list', () => {
    it('never returns the signing secret', async () => {
      prisma.partnerWebhook.findMany.mockResolvedValue([
        {
          id: 'wh-1',
          url: 'https://acme.example.com/hooks',
          secret: 'whsec_topsecret',
          events: ['job.completed'],
          status: 'ACTIVE',
          description: null,
          failureCount: 0,
          lastSuccessAt: null,
          lastFailureAt: null,
          createdAt: new Date(),
        },
      ]);

      const [row] = await service.list('co-1');
      expect(JSON.stringify(row)).not.toContain('topsecret');
      expect(row).not.toHaveProperty('secret');
    });
  });

  describe('remove', () => {
    it('will not delete another company’s webhook', async () => {
      prisma.partnerWebhook.findFirst.mockResolvedValue(null);
      await expect(service.remove('co-other', 'wh-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.partnerWebhook.delete).not.toHaveBeenCalled();
    });
  });
});
