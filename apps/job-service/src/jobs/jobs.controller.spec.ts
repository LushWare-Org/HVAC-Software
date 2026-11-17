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

function makeDto(overrides: Partial<{ componentId: string; projectId: string }> = {}) {
  return {
    customerId: CUSTOMER_ID,
    customerName: 'Jane Doe',
    serviceAddress: '123 Main St',
    title: 'AC repair',
    ...overrides,
  } as any;
}

describe('JobsController.create — customer projectId/componentId ownership + projectId auto-backfill', () => {
  let controller: JobsController;
  let jobsService: { create: jest.Mock };
  let crmClient: { getComponentDetails: jest.Mock; getProjectCustomerId: jest.Mock };

  beforeEach(() => {
    jobsService = { create: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    crmClient = { getComponentDetails: jest.fn(), getProjectCustomerId: jest.fn() };
    controller = new JobsController(jobsService as unknown as JobsService, crmClient as unknown as CrmClient);
  });

  it('rejects a componentId that does not belong to the calling customer', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: OTHER_CUSTOMER_ID, projectId: 'proj-house-1' });
    await expect(
      controller.create(makeUser(), makeDto({ componentId: 'house-1' })),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('rejects a componentId that does not exist', async () => {
    crmClient.getComponentDetails.mockResolvedValue(undefined);
    await expect(
      controller.create(makeUser(), makeDto({ componentId: 'missing-house' })),
    ).rejects.toThrow(BadRequestException);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('allows a componentId owned by the calling customer', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-house-1' });
    await controller.create(makeUser(), makeDto({ componentId: 'house-1' }));
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

  it('checks componentId (not projectId) when both are supplied — house is the more specific link', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-1' });
    await controller.create(makeUser(), makeDto({ componentId: 'house-1', projectId: 'proj-1' }));
    expect(crmClient.getComponentDetails).toHaveBeenCalled();
    expect(crmClient.getProjectCustomerId).not.toHaveBeenCalled();
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('staff callers skip the ownership check but still get the house looked up (for projectId backfill)', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: OTHER_CUSTOMER_ID, projectId: 'proj-house-1' });
    await controller.create(makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), makeDto({ componentId: 'house-1' }));
    expect(crmClient.getComponentDetails).toHaveBeenCalled();
    expect(jobsService.create).toHaveBeenCalled();
  });

  it('auto-backfills projectId from the house when the caller only supplied componentId — this is the actual bug: a job linked to a house but not its project never showed up in that project\'s Jobs tab', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-from-house' });
    const dto = makeDto({ componentId: 'house-1' });
    expect(dto.projectId).toBeUndefined();
    await controller.create(makeUser(), dto);
    expect(dto.projectId).toBe('proj-from-house');
    expect(jobsService.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ projectId: 'proj-from-house' }));
  });

  it('does not override an explicitly-supplied projectId even if it differs from the house\'s own project', async () => {
    crmClient.getComponentDetails.mockResolvedValue({ ownerCustomerId: CUSTOMER_ID, projectId: 'proj-house-actual' });
    const dto = makeDto({ componentId: 'house-1', projectId: 'proj-explicit' });
    await controller.create(makeUser(), dto);
    expect(dto.projectId).toBe('proj-explicit');
  });
});

describe('JobsController.findAll — customer componentId visibility', () => {
  let controller: JobsController;
  let jobsService: { findAll: jest.Mock };
  let crmClient: { getComponentOwnerCustomerId: jest.Mock; getProjectCustomerId: jest.Mock };

  beforeEach(() => {
    jobsService = { findAll: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 20, total: 0, totalPages: 0 }) };
    crmClient = { getComponentOwnerCustomerId: jest.fn(), getProjectCustomerId: jest.fn() };
    controller = new JobsController(jobsService as unknown as JobsService, crmClient as unknown as CrmClient);
  });

  it('drops the customerId filter for a house the customer actually owns — job.customerId may be the project\'s own customer, not theirs', async () => {
    crmClient.getComponentOwnerCustomerId.mockResolvedValue(CUSTOMER_ID);
    await controller.findAll(
      makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
    );
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: undefined, componentId: 'house-1' }),
    );
  });

  it('rejects a componentId query for a house the customer does not own', async () => {
    crmClient.getComponentOwnerCustomerId.mockResolvedValue(OTHER_CUSTOMER_ID);
    await expect(
      controller.findAll(
        makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.findAll).not.toHaveBeenCalled();
  });

  it('still force-filters by the caller\'s own customerId when no componentId is given', async () => {
    await controller.findAll(
      makeUser(), 1, 20, undefined, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    );
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: CUSTOMER_ID }),
    );
  });

  it('staff callers querying by componentId are never ownership-checked', async () => {
    await controller.findAll(
      makeUser({ role: Role.COMPANY_ADMIN, customerId: null }), 1, 20, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'house-1', undefined, undefined,
    );
    expect(crmClient.getComponentOwnerCustomerId).not.toHaveBeenCalled();
    expect(jobsService.findAll).toHaveBeenCalledWith(
      CO, 1, 20, expect.objectContaining({ customerId: undefined, componentId: 'house-1' }),
    );
  });
});

describe('JobsController.patch — customer field whitelist', () => {
  let controller: JobsController;
  let jobsService: {
    findOne: jest.Mock; patchFields: jest.Mock; updateStatus: jest.Mock;
  };

  beforeEach(() => {
    jobsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'job-1', customerId: CUSTOMER_ID, status: 'SCHEDULED' }),
      patchFields: jest.fn().mockResolvedValue({}),
      updateStatus: jest.fn().mockResolvedValue({}),
    };
    controller = new JobsController(
      jobsService as unknown as JobsService,
      {} as unknown as CrmClient,
    );
  });

  // ── What a customer legitimately does ────────────────────────────────────

  it('lets a customer cancel their own job with a reason', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', {
        status: 'CANCELLED', statusNote: 'no longer needed',
        cancellationReason: 'plans changed',
      } as any),
    ).resolves.toBeDefined();
    expect(jobsService.updateStatus).toHaveBeenCalled();
  });

  // ── The hole this closes ─────────────────────────────────────────────────

  it('refuses a customer moving their own appointment via scheduledStart', async () => {
    // Was HTTP 200 and silently moved a committed appointment, bypassing the
    // whole reschedule negotiation.
    await expect(
      controller.patch(makeUser(), 'job-1', { scheduledStart: '2026-12-25T09:00:00Z' } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.patchFields).not.toHaveBeenCalled();
  });

  it('refuses a customer assigning themselves a technician', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', {
        assignedToId: 'tech-x', assignedToName: 'Chosen Tech',
      } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.patchFields).not.toHaveBeenCalled();
  });

  it('refuses a customer writing staff-only internalNotes', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', { internalNotes: 'injected' } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuses a customer rewriting estimatedValue (feeds dashboards/forecasts)', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', { estimatedValue: 1 } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([
    'title', 'description', 'priority', 'scheduledEnd', 'notes',
    'projectId', 'componentId', 'equipmentId', 'hasPartShortage',
    'partShortageNote', 'completedAt', 'gpsTrackingEnabled', 'force',
  ])('refuses a customer setting %s', async (field) => {
    await expect(
      controller.patch(makeUser(), 'job-1', { [field]: 'x' } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.patchFields).not.toHaveBeenCalled();
  });

  it('refuses a forbidden field even when bundled with a legitimate cancel', async () => {
    // The interesting smuggling case: a valid cancellation carrying a payload.
    await expect(
      controller.patch(makeUser(), 'job-1', {
        status: 'CANCELLED', scheduledStart: '2026-12-25T09:00:00Z',
      } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(jobsService.updateStatus).not.toHaveBeenCalled();
    expect(jobsService.patchFields).not.toHaveBeenCalled();
  });

  it('names the offending fields so the client can be fixed', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', { internalNotes: 'x', estimatedValue: 2 } as any),
    ).rejects.toThrow(/internalNotes.*estimatedValue|estimatedValue.*internalNotes/);
  });

  it('ignores explicitly-undefined fields rather than rejecting them', async () => {
    // Clients commonly spread optional values; undefined is not an attempt to write.
    await expect(
      controller.patch(makeUser(), 'job-1', {
        status: 'CANCELLED', scheduledStart: undefined, internalNotes: undefined,
      } as any),
    ).resolves.toBeDefined();
  });

  it('still blocks a customer touching another customer\'s job', async () => {
    jobsService.findOne.mockResolvedValue({ id: 'job-1', customerId: OTHER_CUSTOMER_ID });
    await expect(
      controller.patch(makeUser(), 'job-1', { status: 'CANCELLED' } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('still blocks a customer setting a status other than CANCELLED', async () => {
    await expect(
      controller.patch(makeUser(), 'job-1', { status: 'COMPLETED' } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  // ── Staff are unaffected ─────────────────────────────────────────────────

  it.each([Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN])(
    'leaves %s free to patch operational fields', async (role) => {
      await expect(
        controller.patch(makeUser({ role, customerId: null }), 'job-1', {
          scheduledStart: '2026-12-25T09:00:00Z',
          assignedToName: 'Miguel',
          internalNotes: 'staff note',
        } as any),
      ).resolves.toBeDefined();
      expect(jobsService.patchFields).toHaveBeenCalled();
    });
});
