import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProjectTemplatesService } from './project-templates.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  projectTemplate: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  project: { count: jest.fn() },
};

describe('ProjectTemplatesService', () => {
  let service: ProjectTemplatesService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [ProjectTemplatesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ProjectTemplatesService);
  });

  it('rejects duplicate component type keys within one template', async () => {
    await expect(service.create('co-1', {
      name: 'Hotel',
      componentTypes: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'room', label: 'Suite', customerAssignable: true },
      ],
    })).rejects.toThrow(BadRequestException);
    expect(mockPrisma.projectTemplate.create).not.toHaveBeenCalled();
  });

  it('rejects an empty componentTypes array', async () => {
    await expect(service.create('co-1', { name: 'Empty', componentTypes: [] }))
      .rejects.toThrow(BadRequestException);
  });

  it('creates a template with valid unique keys', async () => {
    mockPrisma.projectTemplate.create.mockResolvedValue({ id: 't-1', companyId: 'co-1', name: 'Hotel' });
    await service.create('co-1', {
      name: 'Hotel',
      componentTypes: [
        { key: 'room', label: 'Room', customerAssignable: true },
        { key: 'lobby', label: 'Lobby', customerAssignable: false },
      ],
    });
    expect(mockPrisma.projectTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ companyId: 'co-1', name: 'Hotel' }),
    }));
  });

  it('blocks deleting a template that has projects referencing it', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: false });
    mockPrisma.project.count.mockResolvedValue(2);
    await expect(service.remove('co-1', 't-1')).rejects.toThrow(BadRequestException);
  });

  it('blocks editing a built-in template', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: true });
    await expect(service.update('co-1', 't-1', { name: 'New name' })).rejects.toThrow(BadRequestException);
  });

  it('blocks deleting a built-in template even if unused', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: true });
    mockPrisma.project.count.mockResolvedValue(0);
    await expect(service.remove('co-1', 't-1')).rejects.toThrow(BadRequestException);
  });

  it('deletes an unused, non-built-in template', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: false });
    mockPrisma.project.count.mockResolvedValue(0);
    const result = await service.remove('co-1', 't-1');
    expect(result).toEqual({ success: true });
    expect(mockPrisma.projectTemplate.delete).toHaveBeenCalledWith({ where: { id: 't-1' } });
  });

  it('always creates a template as DRAFT regardless of what the caller sends', async () => {
    mockPrisma.projectTemplate.create.mockResolvedValue({ id: 't-1' });
    await service.create('co-1', {
      name: 'Hotel',
      componentTypes: [{ key: 'room', label: 'Room', customerAssignable: true }],
      // @ts-expect-error — status is intentionally not part of the create() input type
      status: 'PUBLISHED',
    });
    expect(mockPrisma.projectTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DRAFT' }),
    }));
  });

  it('update() persists a valid status change on a non-built-in template', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: false });
    mockPrisma.projectTemplate.update.mockResolvedValue({ id: 't-1', status: 'PUBLISHED' });
    await service.update('co-1', 't-1', { status: 'PUBLISHED' });
    expect(mockPrisma.projectTemplate.update).toHaveBeenCalledWith({
      where: { id: 't-1' }, data: { status: 'PUBLISHED' },
    });
  });

  it('update() rejects a status change on a built-in template, same as other fields', async () => {
    mockPrisma.projectTemplate.findFirst.mockResolvedValue({ id: 't-1', companyId: 'co-1', isBuiltIn: true });
    await expect(service.update('co-1', 't-1', { status: 'PUBLISHED' })).rejects.toThrow(BadRequestException);
  });
});
