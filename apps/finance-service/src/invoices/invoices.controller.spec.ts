import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '@tscrm/types';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { CrmClient } from '../crm/crm.client';

const CO = 'co-1';
const CUSTOMER_ID = 'cust-1';
const OTHER_CUSTOMER_ID = 'cust-2';

function makeUser(overrides: Partial<{ role: Role; customerId: string | null }> = {}) {
  return {
    companyId: CO,
    userId: 'user-1',
    role: overrides.role ?? Role.CUSTOMER,
    customerId: overrides.customerId === undefined ? CUSTOMER_ID : overrides.customerId,
  } as any;
}

function makeController() {
  const invoicesService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'invoice-1' }),
  };
  const crmClient = { getComponentDetails: jest.fn() };
  const controller = new InvoicesController(
    invoicesService as unknown as InvoicesService,
    {} as any,
    {} as any,
    {} as any,
    crmClient as unknown as CrmClient,
  );
  return { controller, invoicesService, crmClient };
}

describe('InvoicesController.findAll — customer scoping security fix', () => {
  it('forces customerId to the caller for CUSTOMER role, ignoring an arbitrary ?customerId=', async () => {
    const { controller, invoicesService } = makeController();
    await controller.findAll(makeUser(), undefined, OTHER_CUSTOMER_ID);
    expect(invoicesService.findAll).toHaveBeenCalledWith(
      CO,
      expect.objectContaining({ customerId: CUSTOMER_ID }),
    );
  });

  it('drops the customerId filter when the customer owns the requested house', async () => {
    const { controller, invoicesService, crmClient } = makeController();
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-1' });
    await controller.findAll(makeUser(), undefined, undefined, undefined, undefined, undefined, 'house-1');
    expect(invoicesService.findAll).toHaveBeenCalledWith(
      CO,
      expect.objectContaining({ customerId: undefined, componentId: 'house-1' }),
    );
  });

  it('rejects a componentId owned by another customer', async () => {
    const { controller, crmClient } = makeController();
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: OTHER_CUSTOMER_ID, projectId: 'proj-1' });
    await expect(
      controller.findAll(makeUser(), undefined, undefined, undefined, undefined, undefined, 'house-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not force customerId for staff roles', async () => {
    const { controller, invoicesService } = makeController();
    await controller.findAll(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), undefined, 'any-customer');
    expect(invoicesService.findAll).toHaveBeenCalledWith(
      CO,
      expect.objectContaining({ customerId: 'any-customer' }),
    );
  });
});

describe('InvoicesController.findOne — ownership check', () => {
  it('rejects a customer fetching an invoice that is neither their own nor their house\'s', async () => {
    const { controller, invoicesService } = makeController();
    invoicesService.findOne.mockResolvedValue({ id: 'inv-1', customerId: OTHER_CUSTOMER_ID, componentId: null });
    await expect(controller.findOne(makeUser(), 'inv-1')).rejects.toThrow(ForbiddenException);
  });

  it('allows a customer fetching their own invoice', async () => {
    const { controller, invoicesService } = makeController();
    invoicesService.findOne.mockResolvedValue({ id: 'inv-1', customerId: CUSTOMER_ID, componentId: null });
    await expect(controller.findOne(makeUser(), 'inv-1')).resolves.toBeDefined();
  });

  it('allows a customer fetching an invoice linked to a house they own, even if customerId differs', async () => {
    const { controller, invoicesService, crmClient } = makeController();
    invoicesService.findOne.mockResolvedValue({ id: 'inv-1', customerId: OTHER_CUSTOMER_ID, componentId: 'house-1' });
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-1' });
    await expect(controller.findOne(makeUser(), 'inv-1')).resolves.toBeDefined();
  });
});

describe('InvoicesController.create — componentId auto-backfills projectId', () => {
  it('backfills projectId from the house when componentId is set but projectId is not', async () => {
    const { controller, invoicesService, crmClient } = makeController();
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-from-house' });
    const dto: any = { componentId: 'house-1', customerId: CUSTOMER_ID, customerName: 'Jane', customerEmail: 'j@x.com' };
    await controller.create(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), dto);
    expect(dto.projectId).toBe('proj-from-house');
    expect(invoicesService.create).toHaveBeenCalled();
  });

  it('keeps an explicitly-supplied projectId even if it differs from the house\'s own project', async () => {
    const { controller, invoicesService, crmClient } = makeController();
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-from-house' });
    const dto: any = { componentId: 'house-1', projectId: 'explicit-proj', customerId: CUSTOMER_ID, customerName: 'Jane', customerEmail: 'j@x.com' };
    await controller.create(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), dto);
    expect(dto.projectId).toBe('explicit-proj');
    expect(crmClient.getComponentDetails).not.toHaveBeenCalled();
  });

  it('rejects a componentId that does not exist', async () => {
    const { controller, invoicesService, crmClient } = makeController();
    crmClient.getComponentDetails.mockResolvedValue(undefined);
    const dto: any = { componentId: 'missing', customerId: CUSTOMER_ID, customerName: 'Jane', customerEmail: 'j@x.com' };
    await expect(controller.create(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), dto)).rejects.toThrow(BadRequestException);
    expect(invoicesService.create).not.toHaveBeenCalled();
  });
});
