import { Test, TestingModule } from '@nestjs/testing';
import { SuppressionService } from './suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { MarketingChannel, SuppressionReason } from '../prisma/generated';

const mockPrisma = {
  suppression: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('SuppressionService', () => {
  let service: SuppressionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppressionService,
        { provide: MarketingPrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SuppressionService);
  });

  describe('isSuppressed', () => {
    it('returns true when a suppression record exists', async () => {
      mockPrisma.suppression.findUnique.mockResolvedValue({ id: 'sup-1' });
      const result = await service.isSuppressed('co-1', MarketingChannel.EMAIL, 'User@Example.com');
      expect(result).toBe(true);
      expect(mockPrisma.suppression.findUnique).toHaveBeenCalledWith({
        where: { companyId_channel_address: { companyId: 'co-1', channel: MarketingChannel.EMAIL, address: 'user@example.com' } },
        select: { id: true },
      });
    });

    it('returns false when no suppression record exists', async () => {
      mockPrisma.suppression.findUnique.mockResolvedValue(null);
      const result = await service.isSuppressed('co-1', MarketingChannel.SMS, '+15551234567');
      expect(result).toBe(false);
    });

    it('normalises email to lowercase before lookup', async () => {
      mockPrisma.suppression.findUnique.mockResolvedValue(null);
      await service.isSuppressed('co-1', MarketingChannel.EMAIL, '  HELLO@EXAMPLE.COM  ');
      expect(mockPrisma.suppression.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId_channel_address: expect.objectContaining({ address: 'hello@example.com' }) },
        }),
      );
    });
  });

  describe('addSuppression', () => {
    it('upserts a suppression record', async () => {
      mockPrisma.suppression.upsert.mockResolvedValue({});
      await service.addSuppression('co-1', MarketingChannel.EMAIL, 'test@example.com', SuppressionReason.BOUNCED);
      expect(mockPrisma.suppression.upsert).toHaveBeenCalledWith({
        where: { companyId_channel_address: { companyId: 'co-1', channel: MarketingChannel.EMAIL, address: 'test@example.com' } },
        create: { companyId: 'co-1', channel: MarketingChannel.EMAIL, address: 'test@example.com', reason: SuppressionReason.BOUNCED },
        update: { reason: SuppressionReason.BOUNCED },
      });
    });
  });

  describe('removeSuppression', () => {
    it('deletes a suppression record', async () => {
      mockPrisma.suppression.deleteMany.mockResolvedValue({ count: 1 });
      await service.removeSuppression('co-1', MarketingChannel.SMS, '+15551234567');
      expect(mockPrisma.suppression.deleteMany).toHaveBeenCalledWith({
        where: { companyId: 'co-1', channel: MarketingChannel.SMS, address: '+15551234567' },
      });
    });
  });
});
