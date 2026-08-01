import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { HousesService } from './houses.service';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { AuthService } from '../auth/auth.service';

const CO = 'co-1';
const PROJECT_ID = 'proj-1';
const HOUSE_ID = 'house-1';

function makePrisma() {
  return {
    project: { findFirst: jest.fn() },
    house: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    companyUser: { findMany: jest.fn().mockResolvedValue([]) },
    equipment: { count: jest.fn().mockResolvedValue(0), findFirst: jest.fn(), groupBy: jest.fn().mockResolvedValue([]) },
    houseIssueReport: {
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeEquipmentService() {
  return { resyncHouseEquipmentOwner: jest.fn().mockResolvedValue(undefined) };
}

function makeAuthService() {
  return { provisionHouseOwnerAccount: jest.fn() };
}

describe('HousesService', () => {
  let service: HousesService;
  let prisma: ReturnType<typeof makePrisma>;
  let equipment: ReturnType<typeof makeEquipmentService>;
  let auth: ReturnType<typeof makeAuthService>;

  beforeEach(async () => {
    prisma = makePrisma();
    equipment = makeEquipmentService();
    auth = makeAuthService();
    const mod = await Test.createTestingModule({
      providers: [
        HousesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EquipmentService, useValue: equipment },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();
    service = mod.get(HousesService);
  });

  describe('create', () => {
    it('rejects adding a house to a STANDARD (non-Housing-Scheme) project', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'STANDARD' });
      await expect(
        service.create(CO, PROJECT_ID, { label: 'House 1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a house with no owner required', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.house.create.mockResolvedValue({
        id: HOUSE_ID, companyId: CO, projectId: PROJECT_ID, label: 'House 1',
        ownerCustomerId: null, tags: [], address: null, notes: null,
      });
      const result = await service.create(CO, PROJECT_ID, { label: 'House 1' });
      expect(result.accountStatus).toBe('NO_OWNER');
      expect(prisma.house.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ companyId: CO, projectId: PROJECT_ID, label: 'House 1' }) }),
      );
    });

    it('sets the owner at creation when ownerCustomerId is provided and valid', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
      prisma.house.create.mockResolvedValue({
        id: HOUSE_ID, companyId: CO, projectId: PROJECT_ID, label: 'House 1',
        ownerCustomerId: 'cust-1', tags: [], address: null, notes: null,
      });

      await service.create(CO, PROJECT_ID, { label: 'House 1', ownerCustomerId: 'cust-1' });

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({ where: { id: 'cust-1', companyId: CO } });
      expect(prisma.house.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerCustomerId: 'cust-1' }) }),
      );
    });

    it('rejects an ownerCustomerId from another company at creation', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.create(CO, PROJECT_ID, { label: 'House 1', ownerCustomerId: 'cust-other' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.house.create).not.toHaveBeenCalled();
    });
  });

  describe('listForProject', () => {
    it('includes equipmentCount/openIssueCount per house (not just on findOne)', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, companyId: CO, templateType: 'HOUSING_SCHEME' });
      prisma.house.findMany.mockResolvedValue([
        { id: 'house-a', companyId: CO, projectId: PROJECT_ID, ownerCustomerId: null, tags: [] },
        { id: 'house-b', companyId: CO, projectId: PROJECT_ID, ownerCustomerId: null, tags: [] },
      ]);
      prisma.equipment.groupBy.mockResolvedValue([{ houseId: 'house-a', _count: { _all: 3 } }]);
      prisma.houseIssueReport.groupBy.mockResolvedValue([{ houseId: 'house-b', _count: { _all: 2 } }]);

      const [houseA, houseB] = await service.listForProject(CO, PROJECT_ID);

      expect(houseA).toMatchObject({ equipmentCount: 3, openIssueCount: 0 });
      expect(houseB).toMatchObject({ equipmentCount: 0, openIssueCount: 2 });
    });
  });

  describe('assignOwner', () => {
    it('rejects a customer from another company', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: null });
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.assignOwner(CO, HOUSE_ID, 'cust-other')).rejects.toThrow(BadRequestException);
    });

    it('resyncs equipment.customerId when the owner changes', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'old-owner' });
      prisma.customer.findFirst.mockResolvedValue({ id: 'new-owner' });
      prisma.house.update.mockResolvedValue({
        id: HOUSE_ID, companyId: CO, ownerCustomerId: 'new-owner', tags: [],
      });

      await service.assignOwner(CO, HOUSE_ID, 'new-owner');

      expect(equipment.resyncHouseEquipmentOwner).toHaveBeenCalledWith(CO, HOUSE_ID, 'new-owner');
    });

    it('does not resync when the owner is unchanged', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'same-owner' });
      prisma.customer.findFirst.mockResolvedValue({ id: 'same-owner' });
      prisma.house.update.mockResolvedValue({
        id: HOUSE_ID, companyId: CO, ownerCustomerId: 'same-owner', tags: [],
      });

      await service.assignOwner(CO, HOUSE_ID, 'same-owner');

      expect(equipment.resyncHouseEquipmentOwner).not.toHaveBeenCalled();
    });

    it('clears the owner when customerId is null, without a resync call', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'old-owner' });
      prisma.house.update.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: null, tags: [] });

      await service.assignOwner(CO, HOUSE_ID, null);

      expect(prisma.customer.findFirst).not.toHaveBeenCalled();
      expect(equipment.resyncHouseEquipmentOwner).not.toHaveBeenCalled();
      expect(prisma.house.update).toHaveBeenCalledWith({ where: { id: HOUSE_ID }, data: { ownerCustomerId: null } });
    });
  });

  describe('generateOwnerAccount', () => {
    it('requires an owner to be assigned first', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: null });
      await expect(service.generateOwnerAccount(CO, HOUSE_ID)).rejects.toThrow(BadRequestException);
      expect(auth.provisionHouseOwnerAccount).not.toHaveBeenCalled();
    });

    it('delegates to AuthService when an owner is assigned', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'cust-1' });
      auth.provisionHouseOwnerAccount.mockResolvedValue({ success: true });
      await service.generateOwnerAccount(CO, HOUSE_ID);
      expect(auth.provisionHouseOwnerAccount).toHaveBeenCalledWith(CO, 'cust-1');
    });
  });

  describe('createIssue (portal self-report)', () => {
    it('rejects a customer reporting an issue on a house they do not own', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'the-real-owner' });
      await expect(
        service.createIssue(CO, 'someone-else', HOUSE_ID, { errorCode: 'E5' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('requires either an error code or a description', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'cust-1' });
      await expect(
        service.createIssue(CO, 'cust-1', HOUSE_ID, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates an OPEN issue report for the owner', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'cust-1' });
      prisma.houseIssueReport.create.mockResolvedValue({ id: 'issue-1', status: 'OPEN' });

      await service.createIssue(CO, 'cust-1', HOUSE_ID, { errorCode: 'E5', description: 'blinking red light' });

      expect(prisma.houseIssueReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            houseId: HOUSE_ID, reportedByCustomerId: 'cust-1', errorCode: 'E5', status: 'OPEN',
          }),
        }),
      );
    });
  });

  describe('updateIssueStatus', () => {
    it('rejects an invalid status', async () => {
      await expect(
        service.updateIssueStatus(CO, 'issue-1', { status: 'BOGUS' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('404s when the issue does not belong to this company', async () => {
      prisma.houseIssueReport.findFirst.mockResolvedValue(null);
      await expect(
        service.updateIssueStatus(CO, 'issue-1', { status: 'RESOLVED' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('openIssuesForCompany', () => {
    it('returns [] with no extra queries when there are no open issues', async () => {
      prisma.houseIssueReport.findMany.mockResolvedValue([]);
      const result = await service.openIssuesForCompany(CO);
      expect(result).toEqual([]);
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
    });

    it('enriches issues with house/project/reporter context', async () => {
      prisma.houseIssueReport.findMany.mockResolvedValue([
        {
          id: 'issue-1', houseId: HOUSE_ID, equipmentId: null, errorCode: 'E5',
          description: 'blinking light', status: 'OPEN', reportedByCustomerId: 'cust-1',
          createdAt: new Date('2026-07-14'),
          house: { label: 'House 11', project: { id: PROJECT_ID, name: 'Homie Home Project' } },
        },
      ]);
      prisma.customer.findMany.mockResolvedValue([{ id: 'cust-1', firstName: 'Amara', lastName: 'Silva' }]);

      const [result] = await service.openIssuesForCompany(CO);

      expect(result).toMatchObject({
        id: 'issue-1', houseLabel: 'House 11', projectId: PROJECT_ID,
        projectName: 'Homie Home Project', reportedByName: 'Amara Silva', errorCode: 'E5',
      });
    });
  });

  describe('getOwnerCustomerId', () => {
    it('returns the ownerCustomerId (used for customer-facing equipment ownership checks)', async () => {
      prisma.house.findFirst.mockResolvedValue({ id: HOUSE_ID, companyId: CO, ownerCustomerId: 'cust-1' });
      await expect(service.getOwnerCustomerId(CO, HOUSE_ID)).resolves.toBe('cust-1');
    });
  });
});
