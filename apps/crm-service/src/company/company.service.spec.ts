import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';

const prismaMock = {
  company: {
    findUnique: jest.fn(),
    update: jest.fn(),
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
      address: '123 Galle Rd',
      logoUrl: null,
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      features: { onlinePayments: false, sms: false },
    });
    const s = await service.getSettings('co-1');
    expect(s).toEqual({
      id: 'co-1',
      name: 'KASE Engineering',
      address: '123 Galle Rd',
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
      address: null,
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

describe('CompanyService currencies', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.tableExists.mockResolvedValue(true);
    prismaMock.columnExists.mockResolvedValue(true);
    service = new CompanyService(prismaMock as never);
  });

  it('getCurrencies returns enabled list + default', async () => {
    prismaMock.company.findUnique.mockResolvedValue({ currency: 'USD', enabledCurrencies: ['USD', 'LKR'] });
    const result = await service.getCurrencies('co-1');
    expect(result).toEqual({ enabled: ['USD', 'LKR'], default: 'USD' });
  });

  it('getCurrencies throws NotFound for unknown company', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null);
    await expect(service.getCurrencies('nope')).rejects.toThrow(NotFoundException);
  });

  it('updateCurrencies rejects when enabled list is empty', async () => {
    await expect(
      service.updateCurrencies('co-1', { enabled: [], default: 'USD' }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it('updateCurrencies rejects when default is not in enabled list', async () => {
    await expect(
      service.updateCurrencies('co-1', { enabled: ['USD'], default: 'LKR' }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.company.update).not.toHaveBeenCalled();
  });

  it('updateCurrencies saves and returns the new settings', async () => {
    prismaMock.company.update.mockResolvedValue({ currency: 'LKR', enabledCurrencies: ['USD', 'LKR'] });
    const result = await service.updateCurrencies('co-1', { enabled: ['USD', 'LKR'], default: 'LKR' });
    expect(prismaMock.company.update).toHaveBeenCalledWith({
      where: { id: 'co-1' },
      data: { currency: 'LKR', enabledCurrencies: ['USD', 'LKR'] },
      select: { currency: true, enabledCurrencies: true },
    });
    expect(result).toEqual({ enabled: ['USD', 'LKR'], default: 'LKR' });
  });
});
