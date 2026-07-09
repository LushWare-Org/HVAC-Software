import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';

const prismaMock = {
  company: {
    findUnique: jest.fn(),
  },
  tableExists: jest.fn().mockResolvedValue(true),
  columnExists: jest.fn().mockResolvedValue(true),
  tableRef: jest.fn().mockReturnValue('"crm"."companies"'),
  $queryRawUnsafe: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

describe('CompanyService settings', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tableExists.mockResolvedValue(true);
    prismaMock.columnExists.mockResolvedValue(true);
    service = new CompanyService(prismaMock as never);
  });

  it('getSettings returns settings shape', async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: 'co-1',
      name: 'KASE Engineering',
      logoUrl: null,
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      features: { onlinePayments: false, sms: false },
    });
    const s = await service.getSettings('co-1');
    expect(s).toEqual({
      id: 'co-1',
      name: 'KASE Engineering',
      logoUrl: null,
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      features: { onlinePayments: false, sms: false },
    });
    expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
      where: { id: 'co-1' },
      select: expect.objectContaining({ currency: true, timezone: true, features: true }),
    });
  });

  it('getSettings normalizes null features to {}', async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      id: 'co-1',
      name: 'Demo',
      logoUrl: null,
      currency: 'USD',
      timezone: 'America/New_York',
      features: null,
    });
    const s = await service.getSettings('co-1');
    expect(s.features).toEqual({});
  });

  it('getSettings throws NotFound for unknown company', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    await expect(service.getSettings('nope')).rejects.toThrow(NotFoundException);
  });

  it('update rejects settings keys with 400', async () => {
    await expect(
      service.update('co-1', { currency: 'LKR' } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update('co-1', { features: {} } as never),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update('co-1', { timezone: 'Asia/Colombo' } as never),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
  });
});
