import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

function makePrisma() {
  return {
    equipment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    equipmentErrorCode: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    projectComponent: {
      findFirst: jest.fn(),
    },
  };
}

function makeStorage() {
  return { putPublicObject: jest.fn().mockResolvedValue('https://cdn.example.com/equipment/co-1/eq-1-abc.jpg') };
}

function makeScan() {
  return { scanAndStore: jest.fn().mockResolvedValue(undefined) };
}

describe('EquipmentService — image upload', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let storage: ReturnType<typeof makeStorage>;
  let scan: ReturnType<typeof makeScan>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = makePrisma();
    storage = makeStorage();
    scan = makeScan();
    service = new EquipmentService(prisma as any, storage as any, scan as any);
  });

  it('rejects an upload for equipment outside the company', async () => {
    prisma.equipment.findFirst.mockResolvedValue(null);
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 100 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a non-image mimetype', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 100 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a file over the size limit', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(
      service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 6 * 1024 * 1024 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploads, sets status SCANNING, and fires the scan without awaiting it', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipment.update.mockResolvedValue({ id: 'eq-1', companyId: 'co-1', imageScanStatus: 'SCANNING' });

    const result = await service.uploadImage('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg', size: 100 });

    expect(storage.putPublicObject).toHaveBeenCalled();
    expect(prisma.equipment.update).toHaveBeenCalledWith({
      where: { id: 'eq-1' },
      data: expect.objectContaining({
        imageUrl: 'https://cdn.example.com/equipment/co-1/eq-1-abc.jpg',
        imageScanStatus: 'SCANNING',
        imageScanError: null,
      }),
    });
    expect(scan.scanAndStore).toHaveBeenCalledWith('co-1', 'eq-1', { buffer: Buffer.from('x'), mimetype: 'image/jpeg' });
    expect(result.imageScanStatus).toBe('SCANNING');
  });
});

describe('EquipmentService — error codes', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EquipmentService(prisma as any, makeStorage() as any, makeScan() as any);
  });

  it('addErrorCode 404s for equipment outside the company', async () => {
    prisma.equipment.findFirst.mockResolvedValue(null);
    await expect(service.addErrorCode('co-1', 'eq-1', { code: 'E4' })).rejects.toThrow(NotFoundException);
  });

  it('addErrorCode requires a non-empty code', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    await expect(service.addErrorCode('co-1', 'eq-1', { code: '  ' })).rejects.toThrow(BadRequestException);
  });

  it('addErrorCode defaults source to MANUAL', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipmentErrorCode.create.mockResolvedValue({ id: 'c-1' });
    await service.addErrorCode('co-1', 'eq-1', { code: 'E4', meaning: 'Igniter failure' });
    expect(prisma.equipmentErrorCode.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', equipmentId: 'eq-1', code: 'E4', meaning: 'Igniter failure', source: 'MANUAL' },
    });
  });

  it('addErrorCode accepts source AI_SCAN when passed explicitly', async () => {
    prisma.equipment.findFirst.mockResolvedValue({ id: 'eq-1', companyId: 'co-1' });
    prisma.equipmentErrorCode.create.mockResolvedValue({ id: 'c-1' });
    await service.addErrorCode('co-1', 'eq-1', { code: 'E4', source: 'AI_SCAN' });
    expect(prisma.equipmentErrorCode.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', equipmentId: 'eq-1', code: 'E4', meaning: null, source: 'AI_SCAN' },
    });
  });

  it('removeErrorCode 404s for a code outside the company', async () => {
    prisma.equipmentErrorCode.findFirst.mockResolvedValue(null);
    await expect(service.removeErrorCode('co-1', 'c-1')).rejects.toThrow(NotFoundException);
  });
});

describe('EquipmentService — project components', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: EquipmentService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new EquipmentService(prisma as any, makeStorage() as any, makeScan() as any);
  });

  it('findByComponent lists equipment for a component', async () => {
    prisma.equipment.findMany.mockResolvedValue([{ id: 'eq-1', componentId: 'c-1' }]);
    const result = await service.findByComponent('co-1', 'c-1');
    expect(prisma.equipment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { companyId: 'co-1', componentId: 'c-1' },
    }));
    expect(result[0].id).toBe('eq-1');
  });

  it('createForComponent 404s when the component does not exist in this company', async () => {
    prisma.projectComponent.findFirst.mockResolvedValue(null);
    await expect(service.createForComponent('co-1', 'c-1', {})).rejects.toThrow(NotFoundException);
  });

  it('createForComponent rejects when the component has no owner', async () => {
    prisma.projectComponent.findFirst.mockResolvedValue({ id: 'c-1', companyId: 'co-1', ownerCustomerId: null });
    await expect(service.createForComponent('co-1', 'c-1', {})).rejects.toThrow(BadRequestException);
  });

  it('createForComponent derives customerId from the component owner', async () => {
    prisma.projectComponent.findFirst.mockResolvedValue({ id: 'c-1', companyId: 'co-1', ownerCustomerId: 'cust-1' });
    prisma.equipment.create.mockResolvedValue({ id: 'eq-1' });
    await service.createForComponent('co-1', 'c-1', { type: 'Thermostat' });
    expect(prisma.equipment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ companyId: 'co-1', customerId: 'cust-1', componentId: 'c-1', type: 'Thermostat' }),
    }));
  });

  it('resyncComponentEquipmentOwner updates customerId for all of a component\'s equipment', async () => {
    await service.resyncComponentEquipmentOwner('co-1', 'c-1', 'cust-2');
    expect(prisma.equipment.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1', componentId: 'c-1' },
      data: { customerId: 'cust-2' },
    });
  });
});
