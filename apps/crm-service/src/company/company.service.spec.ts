import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';

const prismaMock = {
  company: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  taxRatePreset: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(prismaMock)),
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

describe('CompanyService tax rates', () => {
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock));
    service = new CompanyService(prismaMock as never);
  });

  it('listTaxRates returns presets ordered by sortOrder', async () => {
    prismaMock.taxRatePreset.findMany.mockResolvedValue([{ id: 't1', sortOrder: 0 }]);
    const result = await service.listTaxRates('co-1');
    expect(prismaMock.taxRatePreset.findMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1' },
      orderBy: { sortOrder: 'asc' },
    });
    expect(result).toEqual([{ id: 't1', sortOrder: 0 }]);
  });

  it('createTaxRate unsets the prior default when isDefault:true', async () => {
    prismaMock.taxRatePreset.create.mockResolvedValue({ id: 't2', isDefault: true });
    await service.createTaxRate('co-1', { name: 'VAT 15%', rate: 0.15, isDefault: true });
    expect(prismaMock.taxRatePreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.taxRatePreset.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', name: 'VAT 15%', rate: 0.15, isDefault: true },
    });
  });

  it('createTaxRate does not touch other defaults when isDefault is falsy', async () => {
    prismaMock.taxRatePreset.create.mockResolvedValue({ id: 't3', isDefault: false });
    await service.createTaxRate('co-1', { name: 'No Tax', rate: 0 });
    expect(prismaMock.taxRatePreset.updateMany).not.toHaveBeenCalled();
  });

  it('updateTaxRate rejects deactivating the current default', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(
      service.updateTaxRate('co-1', 't1', { isActive: false }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.taxRatePreset.update).not.toHaveBeenCalled();
  });

  it('updateTaxRate rejects unsetting isDefault with no replacement', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(
      service.updateTaxRate('co-1', 't1', { isDefault: false }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateTaxRate promotes a new default and unsets the old one', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't2', companyId: 'co-1', isDefault: false });
    prismaMock.taxRatePreset.update.mockResolvedValue({ id: 't2', isDefault: true });
    await service.updateTaxRate('co-1', 't2', { isDefault: true });
    expect(prismaMock.taxRatePreset.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', isDefault: true },
      data: { isDefault: false },
    });
    expect(prismaMock.taxRatePreset.update).toHaveBeenCalledWith({
      where: { id: 't2' },
      data: { isDefault: true },
    });
  });

  it('updateTaxRate throws NotFound for a preset outside the caller company', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-OTHER', isDefault: false });
    await expect(
      service.updateTaxRate('co-1', 't1', { name: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deleteTaxRate rejects deleting the current default', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't1', companyId: 'co-1', isDefault: true });
    await expect(service.deleteTaxRate('co-1', 't1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.taxRatePreset.delete).not.toHaveBeenCalled();
  });

  it('deleteTaxRate deletes a non-default preset', async () => {
    prismaMock.taxRatePreset.findUnique.mockResolvedValue({ id: 't2', companyId: 'co-1', isDefault: false });
    await service.deleteTaxRate('co-1', 't2');
    expect(prismaMock.taxRatePreset.delete).toHaveBeenCalledWith({ where: { id: 't2' } });
  });
});
