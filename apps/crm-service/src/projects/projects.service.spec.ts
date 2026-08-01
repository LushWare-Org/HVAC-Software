import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

const CO = 'co-1';
const OTHER_CO = 'co-2';

function makePrisma() {
  return {
    project: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    projectRosterDay: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    serviceAgreement: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const mod = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = mod.get(ProjectsService);
  });

  it('create rejects a customer from another company', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);
    await expect(
      service.create(CO, { customerId: 'cust-other', name: 'Tower' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'cust-other', companyId: CO },
      select: { id: true },
    });
  });

  it('create allows a missing customerId (project created without a customer)', async () => {
    prisma.project.create.mockResolvedValue({ id: 'p1', companyId: CO, customerId: null, name: 'Tower' });
    const result = await service.create(CO, { name: 'Tower' });
    expect(prisma.customer.findFirst).not.toHaveBeenCalled();
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ customerId: null }) }),
    );
    expect(result.customerId).toBeNull();
  });

  it('update sets customerId when provided and validates it belongs to the company', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1', companyId: CO });
    prisma.customer.findFirst.mockResolvedValue(null);
    await expect(
      service.update(CO, 'p1', { customerId: 'cust-other' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update persists a valid customerId', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1', companyId: CO });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
    prisma.project.update.mockResolvedValue({ id: 'p1', companyId: CO, customerId: 'cust-1' });
    await service.update(CO, 'p1', { customerId: 'cust-1' });
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ customerId: 'cust-1' }),
    });
  });

  it('create validates workingDays values', async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: 'c1' });
    await expect(
      service.create(CO, { customerId: 'c1', name: 'X', workingDays: ['MON', 'FUNDAY'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findOne scopes by companyId', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.findOne(OTHER_CO, 'p1')).rejects.toThrow(NotFoundException);
    expect(prisma.project.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', companyId: OTHER_CO } });
  });

  it('setRosterDay rejects past dates', async () => {
    await expect(
      service.setRosterDay(CO, 'p1', '2020-01-01', { techUserIds: ['u1'] }),
    ).rejects.toThrow('Past roster days are read-only');
    expect(prisma.projectRosterDay.upsert).not.toHaveBeenCalled();
  });

  it('setRosterDay reset deletes the override row', async () => {
    const future = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1', companyId: CO, status: 'ACTIVE', startDate: null, targetEndDate: null,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], baseTeamUserIds: ['u1'],
    });
    await service.setRosterDay(CO, 'p1', future, { reset: true });
    expect(prisma.projectRosterDay.deleteMany).toHaveBeenCalled();
    expect(prisma.projectRosterDay.upsert).not.toHaveBeenCalled();
  });

  it('setRosterDay isOff stores an empty crew', async () => {
    const future = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    prisma.project.findFirst.mockResolvedValue({
      id: 'p1', companyId: CO, status: 'ACTIVE', startDate: null, targetEndDate: null,
      workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], baseTeamUserIds: ['u1'],
    });
    await service.setRosterDay(CO, 'p1', future, { techUserIds: ['ignored'], isOff: true });
    const call = prisma.projectRosterDay.upsert.mock.calls[0][0];
    expect(call.create.isOff).toBe(true);
    expect(call.create.techUserIds).toEqual([]);
  });

  it('rostersByDate only returns projects with a crew or an off-marker', async () => {
    prisma.project.findMany.mockResolvedValue([
      {
        id: 'p1', companyId: CO, name: 'Tower', customerId: 'c1', status: 'ACTIVE',
        startDate: null, targetEndDate: null,
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        baseTeamUserIds: ['u1', 'u2'], siteAddress: null, latitude: null, longitude: null,
        requiredHeadcount: 3,
      },
      {
        id: 'p2', companyId: CO, name: 'Empty', customerId: 'c2', status: 'ACTIVE',
        startDate: null, targetEndDate: null,
        workingDays: ['MON'], baseTeamUserIds: [], siteAddress: null,
        latitude: null, longitude: null, requiredHeadcount: null,
      },
    ]);
    const rows = await service.rostersByDate(CO, '2026-07-08'); // WED
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ projectId: 'p1', techUserIds: ['u1', 'u2'], requiredHeadcount: 3 });
  });

  it('mine scopes by customerId and companyId', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    await service.mine(CO, 'cust-9');
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { companyId: CO, customerId: 'cust-9', status: { not: 'CANCELLED' } },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('remove soft-deletes to CANCELLED', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    await service.remove(CO, 'p1');
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' }, data: { status: 'CANCELLED' },
    });
  });
});
