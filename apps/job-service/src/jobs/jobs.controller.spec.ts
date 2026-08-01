import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '@tscrm/types';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CrmClient } from './crm.client';

const CO = 'co-1';
const CUSTOMER_ID = 'cust-1';
const OTHER_CUSTOMER_ID = 'cust-2';

function makeUser(overrides: Partial<{ role: Role; customerId: string | null }> = {}) {
  return {
    companyId: CO,
    userId: 'user-1',
    email: 'customer@example.com',
    role: overrides.role ?? Role.CUSTOMER,
    customerId: overrides.customerId === undefined ? CUSTOMER_ID : overrides.customerId,
  } as any;
}

function makeDto(overrides: Partial<{ houseId: string; projectId: string }> = {}) {
  return {
    customerId: CUSTOMER_ID,
    customerName: 'Jane Doe',
    serviceAddress: '123 Main St',
    title: 'AC repair',
    ...overrides,
  } as any;
}

describe('JobsController.create — customer projectId/houseId ownership + projectId auto-backfill', () => {
  let controller: JobsController;
  let jobsService: { create: jest.Mock };
  let crmClient: { getHouseDetails: jest.Mock; getProjectCustomerId: jest.Mock };

  beforeEach(() => {
    jobsService = { create: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    crmClient = { getHouseDetails: jest.fn(), getProjectCustomerId: jest.fn() };
    controller = new JobsController(jobsService as unknown as JobsService, crmClient as unknown as CrmClient);
  });

  it('rejects a houseId that does not belong to the calling customer', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: OTHER_CUSTOMER_ID, projectId: 'proj-house-1' });
    await expect(
      controller.create(makeUser(), makeDto({ houseId: 'house-1' })),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('rejects a houseId that does not exist', async () => {
    crmClient.getHouseDetails.mockResolvedValue(undefined);
    await expect(
      controller.create(makeUser(), makeDto({ houseId: 'missing-house' })),
    ).rejects.toThrow(BadRequestException);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('allows a houseId owned by the calling customer', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-house-1' });
    await controller.create(makeUser(), makeDto({ houseId: 'house-1' }));
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('rejects a projectId that does not belong to the calling customer', async () => {
    crmClient.getProjectCustomerId.mockResolvedValue(OTHER_CUSTOMER_ID);
    await expect(
      controller.create(makeUser(), makeDto({ projectId: 'proj-1' })),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('allows a projectId owned by the calling customer', async () => {
    crmClient.getProjectCustomerId.mockResolvedValue(CUSTOMER_ID);
    await controller.create(makeUser(), makeDto({ projectId: 'proj-1' }));
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('checks houseId (not projectId) when both are supplied — house is the more specific link', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-1' });
    await controller.create(makeUser(), makeDto({ houseId: 'house-1', projectId: 'proj-1' }));
    expect(crmClient.getHouseDetails).toHaveBeenCalled();
    expect(crmClient.getProjectCustomerId).not.toHaveBeenCalled();
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('staff callers skip the ownership check but still get the house looked up (for projectId backfill)', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: OTHER_CUSTOMER_ID, projectId: 'proj-house-1' });
    await controller.create(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), makeDto({ houseId: 'house-1' }));
    expect(crmClient.getHouseDetails).toHaveBeenCalled();
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('auto-backfills projectId from the house when the caller only supplied houseId — this is the actual bug: a job linked to a house but not its project never showed up in that project\'s Jobs tab', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-from-house' });
    const dto = makeDto({ houseId: 'house-1' });
    expect(dto.projectId).toBeUndefined();
    await controller.create(makeUser(), dto);
    expect(dto.projectId).toBe('proj-from-house');
    expect(jobsService.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ projectId: 'proj-from-house' }));
  });

  it('does not override an explicitly-supplied projectId even if it differs from the house\'s own project', async () => {
    crmClient.getHouseDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-house-actual' });
    const dto = makeDto({ houseId: 'house-1', projectId: 'proj-explicit' });
    await controller.create(makeUser(), dto);
    expect(dto.projectId).toBe('proj-explicit');
  });
});

describe('JobsController.findAll — customer houseId visibility', () => {
  let controller: JobsController;
  let jobsService: { findAll: jest.Mock };
  let crmClient: { getHouseOwnerCustomerId: jest.Mock; getProjectCustomerId: jest.Mock };

  beforeEach(() => {
    jobsService = { findAll: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 20, total: 0, totalPages: 0 }) };
    crmClient = { getHouseOwnerCustomerId: jest.fn(), getProjectCustomerId: jest.fn() };
    controller = new JobsController(jobsService as unknown as JobsService, crmClient as unknown as CrmClient);
  });

  it('drops the customerId filter for a house the customer actually owns — job.customerId may be the project\'s own customer, not theirs', async () => {
    crmClient.getHouseOwnerCustomerId.mockResolvedValue(CUSTOMER_ID);
    await controller.findAll(
      makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
    );
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: undefined, houseId: 'house-1' }),
    );
  });

  it('rejects a houseId query for a house the customer does not own', async () => {
    crmClient.getHouseOwnerCustomerId.mockResolvedValue(OTHER_CUSTOMER_ID);
    await expect(
      controller.findAll(
        makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.findAll).not.toHaveBeenCalled();
  });

  it('still force-filters by the caller\'s own customerId when no houseId is given', async () => {
    await controller.findAll(
      makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    );
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: CUSTOMER_ID }),
    );
  });

  it('staff callers querying by houseId are never ownership-checked', async () => {
    await controller.findAll(
      makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), 1, 20, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
    );
    expect(crmClient.getHouseOwnerCustomerId).not.toHaveBeenCalled();
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: undefined, houseId: 'house-1' }),
    );
  });
});
