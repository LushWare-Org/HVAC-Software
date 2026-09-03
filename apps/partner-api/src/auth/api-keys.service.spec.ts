import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrisma() {
  return {
    partnerApiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'k1', status: 'REVOKED', keyPrefix: 'pk_live_aaaa' }),
    },
  };
}

const config = {
  get: (_key: string, fallback: unknown) => fallback,
} as unknown as ConfigService;

function activeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'k1',
    companyId: 'co-demo-001',
    name: 'Acme Voice AI',
    environment: 'LIVE',
    keyPrefix: 'pk_live_aaaa',
    keyHash: '',
    scopes: ['customer:lookup'],
    rateLimitPerMin: 60,
    status: 'ACTIVE',
    lastUsedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

describe('ApiKeysService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: ApiKeysService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ApiKeysService(prisma as unknown as PrismaService, config);
  });

  describe('create', () => {
    it('issues a key, stores only its hash, and returns the plaintext once', async () => {
      prisma.partnerApiKey.create.mockImplementation(({ data }: any) => ({
        ...activeRow(),
        ...data,
      }));

      const issued = await service.create({
        companyId: 'co-demo-001',
        name: 'Acme Voice AI',
        scopes: ['customer:lookup', 'booking:create'],
      });

      expect(issued.key).toMatch(/^pk_live_[0-9a-f]{64}$/);

      const stored = prisma.partnerApiKey.create.mock.calls[0][0].data;
      expect(stored.keyHash).toBe(ApiKeysService.hashKey(issued.key));
      expect(stored.keyHash).not.toContain(issued.key);
      expect(stored.keyPrefix).toBe(issued.key.slice(0, 16));
    });

    it('tags sandbox keys distinctly', async () => {
      prisma.partnerApiKey.create.mockImplementation(({ data }: any) => ({
        ...activeRow(),
        ...data,
      }));

      const issued = await service.create({
        companyId: 'co-demo-001',
        name: 'Sandbox',
        scopes: ['customer:lookup'],
        environment: 'SANDBOX',
      });

      expect(issued.key.startsWith('pk_test_')).toBe(true);
    });

    it('refuses scopes outside the catalogue', async () => {
      await expect(
        service.create({
          companyId: 'co-demo-001',
          name: 'Sneaky',
          scopes: ['customer:list'],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.partnerApiKey.create).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('resolves an active key to its company and scopes', async () => {
      const plaintext = 'pk_live_' + 'a'.repeat(64);
      prisma.partnerApiKey.findUnique.mockResolvedValue(
        activeRow({ keyHash: ApiKeysService.hashKey(plaintext) }),
      );

      const partner = await service.verify(plaintext);
      expect(partner).toMatchObject({
        keyId: 'k1',
        companyId: 'co-demo-001',
        scopes: ['customer:lookup'],
      });
    });

    it('rejects an unknown key', async () => {
      prisma.partnerApiKey.findUnique.mockResolvedValue(null);
      expect(await service.verify('pk_live_nope')).toBeNull();
    });

    it('rejects a revoked key', async () => {
      const plaintext = 'pk_live_' + 'b'.repeat(64);
      prisma.partnerApiKey.findUnique.mockResolvedValue(
        activeRow({ keyHash: ApiKeysService.hashKey(plaintext), status: 'REVOKED' }),
      );
      expect(await service.verify(plaintext)).toBeNull();
    });

    it('rejects an expired key', async () => {
      const plaintext = 'pk_live_' + 'c'.repeat(64);
      prisma.partnerApiKey.findUnique.mockResolvedValue(
        activeRow({
          keyHash: ApiKeysService.hashKey(plaintext),
          expiresAt: new Date(Date.now() - 1000),
        }),
      );
      expect(await service.verify(plaintext)).toBeNull();
    });

    it('rejects empty input without hitting the database', async () => {
      expect(await service.verify('')).toBeNull();
      expect(prisma.partnerApiKey.findUnique).not.toHaveBeenCalled();
    });

    it('writes lastUsedAt at most once per interval', async () => {
      const plaintext = 'pk_live_' + 'd'.repeat(64);
      prisma.partnerApiKey.findUnique.mockResolvedValue(
        activeRow({ keyHash: ApiKeysService.hashKey(plaintext) }),
      );

      await service.verify(plaintext);
      await service.verify(plaintext);
      await service.verify(plaintext);

      expect(prisma.partnerApiKey.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('revoke', () => {
    it('will not revoke a key belonging to another company', async () => {
      prisma.partnerApiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke('co-other-002', 'k1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.partnerApiKey.update).not.toHaveBeenCalled();
    });

    it('revokes a key owned by the caller’s company', async () => {
      prisma.partnerApiKey.findFirst.mockResolvedValue(activeRow());
      const result = await service.revoke('co-demo-001', 'k1');
      expect(result.status).toBe('REVOKED');
    });
  });

  describe('list', () => {
    it('never returns the key hash', async () => {
      prisma.partnerApiKey.findMany.mockResolvedValue([
        activeRow({ keyHash: 'secret-hash', createdAt: new Date(), revokedAt: null }),
      ]);
      const [row] = await service.list('co-demo-001');
      expect(JSON.stringify(row)).not.toContain('secret-hash');
      expect(row).not.toHaveProperty('keyHash');
    });
  });
});
