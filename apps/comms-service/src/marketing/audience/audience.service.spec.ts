import { AudienceService } from './audience.service';

function makeDb(overrides: Record<string, any> = {}) {
  return {
    audience: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'aud-1', companyId: 'co-1', filtersJson: '[]', name: 'Test' }),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'aud-1', ...args.data })),
      update: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data })),
      delete: jest.fn().mockResolvedValue({}),
      ...overrides,
    },
  };
}

function makeCrm(count = 42, members: any[] = []) {
  return {
    countAudienceMembers: jest.fn().mockResolvedValue(count),
    resolveAudienceMembers: jest.fn().mockResolvedValue(members),
  };
}

describe('AudienceService', () => {
  it('preview count delegates to CrmClient', async () => {
    const crm = makeCrm(150);
    const svc = new AudienceService(makeDb() as any, crm as any);
    const result = await svc.previewCount('co-1', '[{"field":"state","op":"eq","value":"GA"}]');
    expect(result).toEqual({ count: 150 });
    expect(crm.countAudienceMembers).toHaveBeenCalledWith('co-1', '[{"field":"state","op":"eq","value":"GA"}]');
  });

  it('create stores live count from CRM', async () => {
    const db = makeDb();
    const crm = makeCrm(88);
    const svc = new AudienceService(db as any, crm as any);
    await svc.create('co-1', { name: 'GA customers', filtersJson: '[]' });
    const createCall = (db.audience.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.lastCount).toBe(88);
  });

  it('throws NotFoundException for missing audience', async () => {
    const db = makeDb({ findFirst: jest.fn().mockResolvedValue(null) });
    const svc = new AudienceService(db as any, makeCrm() as any);
    await expect(svc.get('co-1', 'missing')).rejects.toThrow('Audience missing not found');
  });

  it('resolveMembers delegates to CrmClient with audience filtersJson', async () => {
    const members = [{ id: 'c-1', firstName: 'Alice', email: 'alice@example.com' }];
    const crm = makeCrm(1, members);
    const svc = new AudienceService(makeDb() as any, crm as any);
    const result = await svc.resolveMembers('co-1', 'aud-1');
    expect(crm.resolveAudienceMembers).toHaveBeenCalledWith('co-1', '[]');
    expect(result).toEqual(members);
  });
});
