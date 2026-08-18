import { CompanyController } from './company.controller';

const serviceMock = {
  getCurrencies: jest.fn(),
  updateCurrencies: jest.fn(),
  listTaxRates: jest.fn(),
  createTaxRate: jest.fn(),
  updateTaxRate: jest.fn(),
  deleteTaxRate: jest.fn(),
  listPaymentTerms: jest.fn(),
  createPaymentTerms: jest.fn(),
  updatePaymentTerms: jest.fn(),
  deletePaymentTerms: jest.fn(),
};

const adminUser = { companyId: 'co-1', role: 'company_admin' } as never;

describe('CompanyController finance settings routes', () => {
  let controller: CompanyController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CompanyController(serviceMock as never);
  });

  it('getCurrencies delegates to the service', async () => {
    serviceMock.getCurrencies.mockResolvedValue({ enabled: ['USD'], default: 'USD' });
    const result = await controller.getCurrencies(adminUser);
    expect(serviceMock.getCurrencies).toHaveBeenCalledWith('co-1');
    expect(result).toEqual({ enabled: ['USD'], default: 'USD' });
  });

  it('updateCurrencies delegates to the service', async () => {
    await controller.updateCurrencies(adminUser, { enabled: ['USD', 'LKR'], default: 'LKR' });
    expect(serviceMock.updateCurrencies).toHaveBeenCalledWith('co-1', { enabled: ['USD', 'LKR'], default: 'LKR' });
  });

  it('createTaxRate delegates to the service', async () => {
    await controller.createTaxRate(adminUser, { name: 'VAT 15%', rate: 0.15 });
    expect(serviceMock.createTaxRate).toHaveBeenCalledWith('co-1', { name: 'VAT 15%', rate: 0.15 });
  });

  it('deleteTaxRate delegates to the service', async () => {
    await controller.deleteTaxRate(adminUser, 't1');
    expect(serviceMock.deleteTaxRate).toHaveBeenCalledWith('co-1', 't1');
  });

  it('createPaymentTerms delegates to the service', async () => {
    await controller.createPaymentTerms(adminUser, { name: 'Net 15', days: 15 });
    expect(serviceMock.createPaymentTerms).toHaveBeenCalledWith('co-1', { name: 'Net 15', days: 15 });
  });

  it('deletePaymentTerms delegates to the service', async () => {
    await controller.deletePaymentTerms(adminUser, 'p1');
    expect(serviceMock.deletePaymentTerms).toHaveBeenCalledWith('co-1', 'p1');
  });
});
