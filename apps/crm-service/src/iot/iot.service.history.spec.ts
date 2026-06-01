import { NotFoundException } from '@nestjs/common'
import { IotService } from './iot.service'

function buildPrismaMock(opts: {
  device?: { id: string } | null
  history?: Array<{ recordedAt: Date; snapshot: any }>
  conn?: { companyId: string; customerId: string } | null
} = {}) {
  return {
    customerIotDevice: {
      findFirst: jest.fn().mockResolvedValue(opts.device ?? null),
    },
    iotDeviceHistory: {
      findMany: jest.fn().mockResolvedValue(opts.history ?? []),
      create: jest.fn().mockResolvedValue({}),
    },
    customerIotConnection: {
      findUnique: jest.fn().mockResolvedValue(opts.conn ?? null),
    },
  } as any
}

function makeService(prisma: any): IotService {
  // IotService(prisma, honeywell, nest, email) — only prisma is exercised in these tests
  return new IotService(prisma, {} as any, {} as any, {} as any)
}

describe('IotService — Feature 2: history', () => {
  describe('getDeviceHistory', () => {
    it('throws NotFoundException when external deviceId not found for company', async () => {
      const prisma = buildPrismaMock({ device: null })
      const svc = makeService(prisma)
      await expect(svc.getDeviceHistory('co-1', 'missing-device', 24)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('scopes lookup by companyId AND external deviceId (multi-tenancy)', async () => {
      const prisma = buildPrismaMock({ device: { id: 'internal-1' }, history: [] })
      const svc = makeService(prisma)
      await svc.getDeviceHistory('co-1', 'mock-honeywell-001', 24)

      const where = prisma.customerIotDevice.findFirst.mock.calls[0][0].where
      expect(where.deviceId).toBe('mock-honeywell-001')
      expect(where.connection.companyId).toBe('co-1')
    })

    it('returns history rows serialized with ISO recordedAt', async () => {
      const now = new Date('2026-05-30T12:00:00Z')
      const snap = { currentTempF: 70, hvacState: 'HEATING' }
      const prisma = buildPrismaMock({
        device: { id: 'internal-1' },
        history: [{ recordedAt: now, snapshot: snap }],
      })
      const svc = makeService(prisma)
      const out = await svc.getDeviceHistory('co-1', 'mock-honeywell-001', 24)
      expect(out).toEqual([{ recordedAt: now.toISOString(), snapshot: snap }])
    })

    it('queries history within the requested hours window', async () => {
      const prisma = buildPrismaMock({ device: { id: 'internal-1' }, history: [] })
      const svc = makeService(prisma)
      const before = Date.now()
      await svc.getDeviceHistory('co-1', 'mock-honeywell-001', 6)
      const where = prisma.iotDeviceHistory.findMany.mock.calls[0][0].where
      const gte = where.recordedAt.gte as Date
      const ageMs = before - gte.getTime()
      // 6h window: should be ~6h ago (allow ±1s slack)
      expect(ageMs).toBeGreaterThanOrEqual(6 * 3600_000 - 1000)
      expect(ageMs).toBeLessThanOrEqual(6 * 3600_000 + 1000)
    })
  })

  describe('recordHistory (private)', () => {
    it('writes a row scoped by companyId/customerId looked up from the connection', async () => {
      const prisma = buildPrismaMock({
        conn: { companyId: 'co-1', customerId: 'cust-1' },
      })
      const svc = makeService(prisma)
      const snap = { online: true, currentTempF: 70 } as any
      await (svc as any).recordHistory('dev-row-1', 'conn-1', snap)

      expect(prisma.iotDeviceHistory.create).toHaveBeenCalledWith({
        data: {
          deviceId: 'dev-row-1',
          companyId: 'co-1',
          customerId: 'cust-1',
          snapshot: snap,
        },
      })
    })

    it('silently skips when the connection is missing (no crash)', async () => {
      const prisma = buildPrismaMock({ conn: null })
      const svc = makeService(prisma)
      await (svc as any).recordHistory('dev-row-1', 'conn-missing', {} as any)
      expect(prisma.iotDeviceHistory.create).not.toHaveBeenCalled()
    })
  })
})
