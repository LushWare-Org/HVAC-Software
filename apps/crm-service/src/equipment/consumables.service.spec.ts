import { NotFoundException } from '@nestjs/common'
import { ConsumablesService } from './consumables.service'

function prismaMock(over: any = {}) {
  return {
    equipment: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          'equipment' in over
            ? over.equipment
            : { id: 'eq-1', companyId: 'co-1', customerId: 'cust-1', installDate: new Date('2026-01-01') },
        ),
    },
    equipmentConsumable: {
      findMany: jest.fn().mockResolvedValue(over.consumables ?? []),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c-1', ...data })),
      findFirst: jest.fn().mockResolvedValue(over.consumable ?? null),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c-1', ...data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  } as any
}

describe('ConsumablesService', () => {
  it('create scopes the equipment lookup by companyId', async () => {
    const prisma = prismaMock()
    const svc = new ConsumablesService(prisma)
    await svc.create('co-1', 'eq-1', { kind: 'FILTER', partNumber: 'X6673', intervalDays: 90 })
    expect(prisma.equipment.findFirst.mock.calls[0][0].where).toEqual({ id: 'eq-1', companyId: 'co-1' })
    expect(prisma.equipmentConsumable.create.mock.calls[0][0].data.companyId).toBe('co-1')
  })

  it('create throws NotFound for equipment outside the company', async () => {
    const prisma = prismaMock({ equipment: null })
    const svc = new ConsumablesService(prisma)
    await expect(svc.create('co-2', 'eq-1', {})).rejects.toBeInstanceOf(NotFoundException)
  })

  it('computes nextDueAt from lastReplacedAt + intervalDays', () => {
    const svc = new ConsumablesService(prismaMock())
    const due = svc.computeNextDue({ lastReplacedAt: new Date('2026-06-01T00:00:00Z'), intervalDays: 90 } as any, null)
    expect(due?.toISOString().slice(0, 10)).toBe('2026-08-30')
  })

  it('falls back to equipment installDate when never replaced', () => {
    const svc = new ConsumablesService(prismaMock())
    const due = svc.computeNextDue({ lastReplacedAt: null, intervalDays: 90 } as any, new Date('2026-01-01T00:00:00Z'))
    expect(due?.toISOString().slice(0, 10)).toBe('2026-04-01')
  })

  it('returns null nextDueAt when neither anchor exists', () => {
    const svc = new ConsumablesService(prismaMock())
    expect(svc.computeNextDue({ lastReplacedAt: null, intervalDays: 90 } as any, null)).toBeNull()
  })

  it('markReplaced sets lastReplacedAt and is company-scoped', async () => {
    const prisma = prismaMock({ consumable: { id: 'c-1', companyId: 'co-1' } })
    const svc = new ConsumablesService(prisma)
    await svc.markReplaced('co-1', 'c-1')
    expect(prisma.equipmentConsumable.findFirst.mock.calls[0][0].where).toEqual({ id: 'c-1', companyId: 'co-1' })
    expect(prisma.equipmentConsumable.update.mock.calls[0][0].data.lastReplacedAt).toBeInstanceOf(Date)
  })

  it('update throws NotFound for a foreign-company consumable', async () => {
    const prisma = prismaMock({ consumable: null })
    const svc = new ConsumablesService(prisma)
    await expect(svc.update('co-2', 'c-1', { partNumber: 'Y1' })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('listForEquipment returns consumables with nextDueAt + dueInDays attached', async () => {
    const prisma = prismaMock({
      consumables: [
        {
          id: 'c-1',
          intervalDays: 90,
          lastReplacedAt: new Date('2026-06-01'),
          equipment: { installDate: null },
        },
      ],
    })
    const svc = new ConsumablesService(prisma)
    const out = await svc.listForEquipment('co-1', 'eq-1')
    expect(out[0].nextDueAt).toBeInstanceOf(Date)
    expect(typeof out[0].dueInDays).toBe('number')
    expect((out[0] as any).equipment).toBeUndefined() // helper join stripped from response
  })
})
