import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';

function prismaMock(rows: any[] = []) {
  return {
    contractorPost: {
      findMany: jest.fn().mockResolvedValue(rows),
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        const row = rows.find(r =>
          (!where.id || r.id === where.id) &&
          (!where.companyId || r.companyId === where.companyId),
        );
        return Promise.resolve(row ?? null);
      }),
      create: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'p-1', ...data }),
      ),
      update: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'p-1', ...data }),
      ),
      delete: jest.fn().mockResolvedValue({}),
    },
  } as any;
}

describe('PostsService', () => {
  it('listPublished filters by companyId and isPublished', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    await svc.listPublished('co-1');
    const where = prisma.contractorPost.findMany.mock.calls[0][0].where;
    expect(where.companyId).toBe('co-1');
    expect(where.isPublished).toBe(true);
  });

  it('listPublished passes type filter when provided', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    await svc.listPublished('co-1', 'OFFER');
    const where = prisma.contractorPost.findMany.mock.calls[0][0].where;
    expect(where.type).toBe('OFFER');
  });

  it('latestTip queries TIP and VIDEO types only', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    await svc.latestTip('co-1');
    const where = prisma.contractorPost.findFirst.mock.calls[0][0].where;
    expect(where.type).toEqual({ in: ['TIP', 'VIDEO'] });
  });

  it('create stamps companyId and defaults type to TIP', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    const out = await svc.create('co-1', { title: 'Change your filter' });
    expect(out.companyId).toBe('co-1');
    expect(out.type).toBe('TIP');
  });

  it('create sets publishedAt when isPublished=true', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    const before = new Date();
    const out = await svc.create('co-1', { title: 'Test', isPublished: true });
    expect(out.isPublished).toBe(true);
    expect((out.publishedAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('create leaves publishedAt null when isPublished=false', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    const out = await svc.create('co-1', { title: 'Draft', isPublished: false });
    expect(out.publishedAt).toBeNull();
  });

  it('update sets publishedAt when transitioning to published', async () => {
    const existing = { id: 'p-1', companyId: 'co-1', isPublished: false };
    const prisma = prismaMock([existing]);
    const svc = new PostsService(prisma);
    const before = new Date();
    await svc.update('co-1', 'p-1', { isPublished: true });
    const data = prisma.contractorPost.update.mock.calls[0][0].data;
    expect(data.isPublished).toBe(true);
    expect(new Date(data.publishedAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('update clears publishedAt when unpublishing', async () => {
    const existing = { id: 'p-1', companyId: 'co-1', isPublished: true };
    const prisma = prismaMock([existing]);
    const svc = new PostsService(prisma);
    await svc.update('co-1', 'p-1', { isPublished: false });
    const data = prisma.contractorPost.update.mock.calls[0][0].data;
    expect(data.publishedAt).toBeNull();
  });

  it('update throws NotFound for foreign companyId', async () => {
    const prisma = prismaMock([]);
    const svc = new PostsService(prisma);
    await expect(svc.update('co-EVIL', 'p-1', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws NotFound for foreign companyId', async () => {
    const prisma = prismaMock([]);
    const svc = new PostsService(prisma);
    await expect(svc.remove('co-EVIL', 'p-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listAll returns all posts regardless of isPublished', async () => {
    const prisma = prismaMock();
    const svc = new PostsService(prisma);
    await svc.listAll('co-1');
    const where = prisma.contractorPost.findMany.mock.calls[0][0].where;
    expect(where.isPublished).toBeUndefined();
    expect(where.companyId).toBe('co-1');
  });
});
