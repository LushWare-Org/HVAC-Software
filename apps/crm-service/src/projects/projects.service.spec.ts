import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

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
    projectTemplate: {
      findFirst: jest.fn(),
    },
    projectComponent: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
    componentIssueReport: {
      count: jest.fn().mockResolvedValue(0),
    },
  };
}

const mockEmail = { sendMail: jest.fn() };

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = makePrisma();
    const mod = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: mockEmail },
      ],
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

  describe('template-based creation', () => {
    it('snapshots the template componentTypes and defaults componentCustomerSettings from them', async () => {
      prisma.projectTemplate.findFirst.mockResolvedValue({
        id: 'tpl-1', companyId: CO,
        componentTypes: [
          { key: 'room', label: 'Room', customerAssignable: true },
          { key: 'pool', label: 'Pool', customerAssignable: false },
        ],
      });
      prisma.project.create.mockResolvedValue({ id: 'p-1' });

      await service.create(CO, { name: 'Grand Hotel', templateId: 'tpl-1' } as any);

      expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          templateId: 'tpl-1',
          componentTypesSnapshot: [
            { key: 'room', label: 'Room', customerAssignable: true },
            { key: 'pool', label: 'Pool', customerAssignable: false },
          ],
          componentCustomerSettings: { room: true, pool: false },
        }),
      }));
    });

    it('creates a freeform project with no template', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p-2' });
      await service.create(CO, { name: 'One-off job' });
      expect(prisma.projectTemplate.findFirst).not.toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ templateId: null, componentTypesSnapshot: null }),
      }));
    });

    it('rejects a templateId that does not belong to this company', async () => {
      prisma.projectTemplate.findFirst.mockResolvedValue(null);
      await expect(service.create(CO, { name: 'X', templateId: 'not-mine' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('freeform: true creates a project with an empty (non-null) component type registry', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p-3' });
      await service.create(CO, { name: 'Boutique Build', freeform: true } as any);
      expect(prisma.projectTemplate.findFirst).not.toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          templateId: null, componentTypesSnapshot: [], componentCustomerSettings: {},
        }),
      }));
    });

    it('rejects freeform: true combined with a templateId', async () => {
      await expect(service.create(CO, { name: 'X', freeform: true, templateId: 'tpl-1' } as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCustomerSettings', () => {
    it('rejects an unknown component type key', async () => {
      prisma.project.findFirst.mockResolvedValue({
        id: 'p-1', companyId: CO,
        componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
        componentCustomerSettings: { room: true },
      });
      await expect(service.updateCustomerSettings(CO, 'p-1', { pool: true }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects turning on a type the template marked not customer-assignable', async () => {
      prisma.project.findFirst.mockResolvedValue({
        id: 'p-1', companyId: CO,
        componentTypesSnapshot: [{ key: 'pool', label: 'Pool', customerAssignable: false }],
        componentCustomerSettings: { pool: false },
      });
      await expect(service.updateCustomerSettings(CO, 'p-1', { pool: true }))
        .rejects.toThrow(BadRequestException);
    });

    it('merges a valid partial update rather than replacing the whole settings object', async () => {
      prisma.project.findFirst.mockResolvedValue({
        id: 'p-1', companyId: CO,
        componentTypesSnapshot: [
          { key: 'room', label: 'Room', customerAssignable: true },
          { key: 'lobby', label: 'Lobby', customerAssignable: true },
        ],
        componentCustomerSettings: { room: true, lobby: true },
      });
      prisma.project.update.mockResolvedValue({});
      await service.updateCustomerSettings(CO, 'p-1', { lobby: false });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { componentCustomerSettings: { room: true, lobby: false } },
      });
    });
  });
});
