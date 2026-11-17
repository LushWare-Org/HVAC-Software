import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectComponentsService } from './project-components.service';

function makePrisma() {
  return {
    project: { findFirst: jest.fn(), update: jest.fn() },
    projectComponent: {
      create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
    customer: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    companyUser: { findMany: jest.fn().mockResolvedValue([]) },
    equipment: { groupBy: jest.fn().mockResolvedValue([]) },
    componentIssueReport: {
      groupBy: jest.fn().mockResolvedValue([]), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(),
    },
  };
}
function makeEquipment() { return { resyncComponentEquipmentOwner: jest.fn() }; }
function makeAuth() { return { provisionHouseOwnerAccount: jest.fn() }; }

describe('ProjectComponentsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: ProjectComponentsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ProjectComponentsService(prisma as any, makeEquipment() as any, makeAuth() as any);
  });

  it('rejects an owner on a component whose type is not customer-assignable on the template', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'pool', label: 'Pool', customerAssignable: false }],
      componentCustomerSettings: { pool: false },
    });
    await expect(service.create('co-1', 'p-1', { typeLabel: 'Pool', label: 'Pool Deck', ownerCustomerId: 'cust-1' } as any))
      .rejects.toThrow(BadRequestException);
  });

  it('rejects an owner when the template allows it but this project turned it off', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: false },
    });
    await expect(service.create('co-1', 'p-1', { typeLabel: 'Room', label: 'Room 1', ownerCustomerId: 'cust-1' } as any))
      .rejects.toThrow(BadRequestException);
  });

  it('creates a component with a valid existing type and no owner', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-1', componentTypeKey: 'room', label: 'Room 1', ownerCustomerId: null });
    const result = await service.create('co-1', 'p-1', { typeLabel: 'Room', label: 'Room 1' } as any);
    expect(result.id).toBe('c-1');
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('creates a component with a valid, allowed owner', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', companyId: 'co-1' });
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-1', componentTypeKey: 'room', label: 'Room 1', ownerCustomerId: 'cust-1' });
    const result = await service.create('co-1', 'p-1', { typeLabel: 'Room', label: 'Room 1', ownerCustomerId: 'cust-1' } as any);
    expect(result.ownerCustomerId).toBe('cust-1');
  });

  it('404s when the project does not exist in this company', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    await expect(service.create('co-1', 'missing', { typeLabel: 'Room', label: 'X' } as any))
      .rejects.toThrow(NotFoundException);
  });

  it('rejects a label-less component', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    await expect(service.create('co-1', 'p-1', { typeLabel: 'Room', label: '' } as any))
      .rejects.toThrow(BadRequestException);
  });

  it('rejects a type-less component', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    await expect(service.create('co-1', 'p-1', { typeLabel: '', label: 'Room 1' } as any))
      .rejects.toThrow(BadRequestException);
  });

  it('assignOwner resyncs equipment owner when a real owner is set', async () => {
    prisma.projectComponent.findFirst.mockResolvedValue({ id: 'c-1', companyId: 'co-1', projectId: 'p-1', componentTypeKey: 'room', ownerCustomerId: null });
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', companyId: 'co-1' });
    prisma.projectComponent.update.mockResolvedValue({ id: 'c-1', ownerCustomerId: 'cust-1' });
    const equipment = makeEquipment();
    const svc = new ProjectComponentsService(prisma as any, equipment as any, makeAuth() as any);
    await svc.assignOwner('co-1', 'c-1', 'cust-1');
    expect(equipment.resyncComponentEquipmentOwner).toHaveBeenCalledWith('co-1', 'c-1', 'cust-1');
  });

  it('getOwnerCustomerId 404s for a component outside the company', async () => {
    prisma.projectComponent.findFirst.mockResolvedValue(null);
    await expect(service.getOwnerCustomerId('co-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  // ── Growable type registry (resolveOrRegisterType) ─────────────────────────

  it('resolves an existing type case-insensitively and ignores a passed typeAssignable', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-1', componentTypeKey: 'room', label: 'Room 5', ownerCustomerId: null });
    await service.create('co-1', 'p-1', { typeLabel: 'room', typeAssignable: false, label: 'Room 5' } as any);
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(prisma.projectComponent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ componentTypeKey: 'room' }),
    }));
  });

  it('registers a brand-new type on the project and uses it for the new component', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room', label: 'Room', customerAssignable: true }],
      componentCustomerSettings: { room: true },
    });
    prisma.project.update.mockResolvedValue({});
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-2', componentTypeKey: 'pool_deck', label: 'Pool Deck', ownerCustomerId: null });
    await service.create('co-1', 'p-1', { typeLabel: 'Pool Deck', typeAssignable: false, label: 'Pool Deck' } as any);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: {
        componentTypesSnapshot: [
          { key: 'room', label: 'Room', customerAssignable: true },
          { key: 'pool_deck', label: 'Pool Deck', customerAssignable: false },
        ],
        componentCustomerSettings: { room: true, pool_deck: false },
      },
    });
    expect(prisma.projectComponent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ componentTypeKey: 'pool_deck' }),
    }));
  });

  it('new type defaults typeAssignable to true when omitted', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1', componentTypesSnapshot: [], componentCustomerSettings: {},
    });
    prisma.project.update.mockResolvedValue({});
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-3', componentTypeKey: 'lobby', label: 'Lobby' });
    await service.create('co-1', 'p-1', { typeLabel: 'Lobby', label: 'Lobby' } as any);
    expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        componentTypesSnapshot: [{ key: 'lobby', label: 'Lobby', customerAssignable: true }],
      }),
    }));
  });

  it('slugify collision within one project gets a numeric suffix', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'p-1', companyId: 'co-1',
      componentTypesSnapshot: [{ key: 'room_1', label: 'Room #1', customerAssignable: true }],
      componentCustomerSettings: { room_1: true },
    });
    prisma.project.update.mockResolvedValue({});
    prisma.projectComponent.create.mockResolvedValue({ id: 'c-4', componentTypeKey: 'room_1-2', label: 'Room-1' });
    await service.create('co-1', 'p-1', { typeLabel: 'Room-1', label: 'Room-1' } as any);
    expect(prisma.project.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        componentTypesSnapshot: [
          { key: 'room_1', label: 'Room #1', customerAssignable: true },
          { key: 'room_1-2', label: 'Room-1', customerAssignable: true },
        ],
      }),
    }));
  });

  it('rejects a new type on a project with no template at all (componentTypesSnapshot null)', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'p-1', companyId: 'co-1', componentTypesSnapshot: null, componentCustomerSettings: null });
    await expect(service.create('co-1', 'p-1', { typeLabel: 'Room', label: 'Room 1' } as any))
      .rejects.toThrow(BadRequestException);
  });
});
