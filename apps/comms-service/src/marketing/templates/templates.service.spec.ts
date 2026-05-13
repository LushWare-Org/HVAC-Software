import { TemplatesService } from './templates.service';
import { DEFAULT_TEMPLATES } from './default-templates';

function makeDb(overrides: Record<string, any> = {}) {
  return {
    template: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 't-1', ...args.data })),
      createMany: jest.fn().mockResolvedValue({ count: DEFAULT_TEMPLATES.length }),
      update: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      ...overrides,
    },
  };
}

describe('TemplatesService', () => {
  it('lists templates ordered by default then date', async () => {
    const db = makeDb();
    const svc = new TemplatesService(db as any);
    await svc.list('co-1');
    expect(db.template.findMany).toHaveBeenCalledWith({
      where: { companyId: 'co-1' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('creates a template with correct fields', async () => {
    const db = makeDb();
    const svc = new TemplatesService(db as any);
    const dto = { name: 'Test SMS', channel: 'SMS' as const, smsBody: 'Hello {{customer.firstName}}' };
    const result = await svc.create('co-1', dto);
    expect(db.template.create).toHaveBeenCalledWith({
      data: { companyId: 'co-1', ...dto },
    });
    expect(result.name).toBe('Test SMS');
  });

  it('throws NotFoundException when template not found', async () => {
    const db = makeDb({ findFirst: jest.fn().mockResolvedValue(null) });
    const svc = new TemplatesService(db as any);
    await expect(svc.get('co-1', 'missing')).rejects.toThrow('Template missing not found');
  });

  it('seeds default templates and returns count', async () => {
    const db = makeDb({ count: jest.fn().mockResolvedValue(0) });
    const svc = new TemplatesService(db as any);
    const n = await svc.seedDefaults('co-1');
    expect(n).toBe(DEFAULT_TEMPLATES.length);
    expect(db.template.createMany).toHaveBeenCalledTimes(1);
  });

  it('skips seed if defaults already exist', async () => {
    const db = makeDb({ count: jest.fn().mockResolvedValue(6) });
    const svc = new TemplatesService(db as any);
    const n = await svc.seedDefaults('co-1');
    expect(n).toBe(0);
    expect(db.template.createMany).not.toHaveBeenCalled();
  });
});
