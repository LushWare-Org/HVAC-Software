import { NotFoundException } from '@nestjs/common'
import { AnnouncementsService } from './announcements.service'

function prismaMock(rows: any[] = []) {
  return {
    companyAnnouncement: {
      findMany: jest.fn().mockResolvedValue(rows),
      findFirst: jest.fn().mockResolvedValue(rows[0] ?? null),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'a-1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'a-1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  } as any
}

describe('AnnouncementsService', () => {
  it('getActiveMany filters by companyId, isActive and date window', async () => {
    const prisma = prismaMock()
    const svc = new AnnouncementsService(prisma)
    await svc.getActiveMany('co-1')
    const where = prisma.companyAnnouncement.findMany.mock.calls[0][0].where
    expect(where.companyId).toBe('co-1')
    expect(where.isActive).toBe(true)
    expect(where.OR).toBeDefined() // activeFrom null-or-started
    expect(where.AND).toBeDefined() // activeTo null-or-not-ended
  })

  it('create stamps companyId from the caller, never the body', async () => {
    const prisma = prismaMock()
    const svc = new AnnouncementsService(prisma)
    const out = await svc.create('co-1', { title: 'Summer tune-up special', companyId: 'co-EVIL' } as any)
    expect(out.companyId).toBe('co-1')
  })

  it('create defaults accentColor and isActive', async () => {
    const prisma = prismaMock()
    const svc = new AnnouncementsService(prisma)
    const out = await svc.create('co-1', { title: 'Hello' })
    expect(out.accentColor).toBe('#1a73e8')
    expect(out.isActive).toBe(true)
  })

  it('update is company-scoped (foreign id → NotFound)', async () => {
    const prisma = prismaMock([])
    const svc = new AnnouncementsService(prisma)
    await expect(svc.update('co-2', 'a-1', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('remove is company-scoped (foreign id → NotFound)', async () => {
    const prisma = prismaMock([])
    const svc = new AnnouncementsService(prisma)
    await expect(svc.remove('co-2', 'a-1')).rejects.toBeInstanceOf(NotFoundException)
  })
})
