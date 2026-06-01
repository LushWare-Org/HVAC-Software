import { IotAlertsService } from './iot-alerts.service'
import { JobsClient } from './jobs.client'

type Snap = {
  online: boolean
  hvacState: 'HEATING' | 'COOLING' | 'IDLE' | 'OFF'
  emergencyHeat: boolean
  currentTempF: number
  heatSetpointF: number
  coolSetpointF: number
}

const makeSnap = (overrides: Partial<Snap> = {}): Snap => ({
  online: true,
  hvacState: 'HEATING',
  emergencyHeat: false,
  currentTempF: 60,
  heatSetpointF: 72,
  coolSetpointF: 75,
  ...overrides,
})

const makeHistoryRow = (snap: Snap, minutesAgo = 5) => ({
  snapshot: snap,
  recordedAt: new Date(Date.now() - minutesAgo * 60_000),
})

function buildPrismaMock(opts: {
  devices?: any[]
  history?: any[]
  customerTags?: string[]
  customer?: any
} = {}) {
  return {
    customerIotDevice: {
      findMany: jest.fn().mockResolvedValue(opts.devices ?? []),
    },
    iotDeviceHistory: {
      findMany: jest.fn().mockResolvedValue(opts.history ?? []),
    },
    customer: {
      findUnique: jest.fn().mockImplementation(({ select }: any) => {
        if (select?.tags) return Promise.resolve({ tags: opts.customerTags ?? [] })
        return Promise.resolve(opts.customer ?? {
          firstName: 'Alice', lastName: 'Smith', email: 'a@b.com', phone: '555',
          address: '1 Main', city: 'NYC', state: 'NY', zipCode: '10001',
        })
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  } as any
}

function makeDevice(overrides: any = {}) {
  return {
    id: 'dev-row-1',
    name: 'Living Room',
    lastSnapshot: makeSnap(),
    lastSyncedAt: new Date(),
    connection: { companyId: 'co-1', customerId: 'cust-1', provider: 'honeywell' },
    ...overrides,
  }
}

describe('IotAlertsService', () => {
  let jobs: JobsClient
  let createJobSpy: jest.SpyInstance

  beforeEach(() => {
    jobs = new JobsClient()
    createJobSpy = jest.spyOn(jobs, 'createJob').mockResolvedValue({ id: 'job-x' })
  })

  describe('detectUnderperformance (Feature 3)', () => {
    it('returns true when 4+ consecutive HEATING readings show ≥4°F gap', async () => {
      const bad = makeSnap({ hvacState: 'HEATING', currentTempF: 60, heatSetpointF: 72 }) // gap 12
      const prisma = buildPrismaMock({
        history: [bad, bad, bad, bad, bad].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)
      const result = await (svc as any).detectUnderperformance('dev-row-1')
      expect(result).toBe(true)
    })

    it('returns false when gap is under threshold (within 3°F)', async () => {
      const ok = makeSnap({ hvacState: 'HEATING', currentTempF: 70, heatSetpointF: 72 }) // gap 2
      const prisma = buildPrismaMock({
        history: [ok, ok, ok, ok, ok].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)
      expect(await (svc as any).detectUnderperformance('dev-row-1')).toBe(false)
    })

    it('returns false when HVAC is IDLE (not actively running)', async () => {
      const idle = makeSnap({ hvacState: 'IDLE', currentTempF: 60, heatSetpointF: 72 })
      const prisma = buildPrismaMock({
        history: [idle, idle, idle, idle, idle].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)
      expect(await (svc as any).detectUnderperformance('dev-row-1')).toBe(false)
    })

    it('returns false with fewer than MIN_SAMPLES history rows', async () => {
      const bad = makeSnap({ hvacState: 'HEATING', currentTempF: 60, heatSetpointF: 72 })
      const prisma = buildPrismaMock({ history: [makeHistoryRow(bad), makeHistoryRow(bad)] })
      const svc = new IotAlertsService(prisma, jobs)
      expect(await (svc as any).detectUnderperformance('dev-row-1')).toBe(false)
    })

    it('resets consecutive-bad counter when an IDLE row breaks the streak', async () => {
      const bad = makeSnap({ hvacState: 'HEATING', currentTempF: 60, heatSetpointF: 72 })
      const idle = makeSnap({ hvacState: 'IDLE', currentTempF: 60, heatSetpointF: 72 })
      // 3 bad, then IDLE, then 2 more bad — never 4 consecutive
      const prisma = buildPrismaMock({
        history: [bad, bad, bad, idle, bad, bad].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)
      expect(await (svc as any).detectUnderperformance('dev-row-1')).toBe(false)
    })

    it('detects underperformance for COOLING mode (current > setpoint)', async () => {
      const bad = makeSnap({ hvacState: 'COOLING', currentTempF: 82, coolSetpointF: 75 }) // gap 7
      const prisma = buildPrismaMock({
        history: [bad, bad, bad, bad].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)
      expect(await (svc as any).detectUnderperformance('dev-row-1')).toBe(true)
    })
  })

  describe('upsertIotFlag dedup (Feature 1 trigger)', () => {
    it('returns true the first time, false when tag already present', async () => {
      const prisma = buildPrismaMock({ customerTags: [] })
      const svc = new IotAlertsService(prisma, jobs)
      const first = await (svc as any).upsertIotFlag('co-1', 'cust-1', 'dev-row-1', 'EMERGENCY_HEAT', 'note')
      expect(first).toBe(true)

      const prisma2 = buildPrismaMock({ customerTags: ['iot:emergency_heat:dev-row-1'] })
      const svc2 = new IotAlertsService(prisma2, jobs)
      const second = await (svc2 as any).upsertIotFlag('co-1', 'cust-1', 'dev-row-1', 'EMERGENCY_HEAT', 'note')
      expect(second).toBe(false)
    })
  })

  describe('checkAlerts integration (Features 1 & 3 end-to-end)', () => {
    it('creates an EMERGENCY job on first detection of emergency heat', async () => {
      const device = makeDevice({ lastSnapshot: makeSnap({ emergencyHeat: true }) })
      const prisma = buildPrismaMock({ devices: [device], customerTags: [] })
      const svc = new IotAlertsService(prisma, jobs)

      await svc.checkAlerts()

      expect(createJobSpy).toHaveBeenCalledTimes(1)
      expect(createJobSpy.mock.calls[0][0].priority).toBe('EMERGENCY')
      expect(createJobSpy.mock.calls[0][0].tags).toContain('iot:emergency_heat')
    })

    it('does NOT create a duplicate job when emergency_heat tag already exists', async () => {
      const device = makeDevice({ lastSnapshot: makeSnap({ emergencyHeat: true }) })
      const prisma = buildPrismaMock({
        devices: [device],
        customerTags: [`iot:emergency_heat:${device.id}`],
      })
      const svc = new IotAlertsService(prisma, jobs)

      await svc.checkAlerts()

      expect(createJobSpy).not.toHaveBeenCalled()
    })

    it('creates a HIGH-priority job on first detection of UNDERPERFORMING', async () => {
      const bad = makeSnap({ hvacState: 'HEATING', currentTempF: 60, heatSetpointF: 72 })
      const device = makeDevice({ lastSnapshot: bad })
      const prisma = buildPrismaMock({
        devices: [device],
        customerTags: [],
        history: [bad, bad, bad, bad, bad].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)

      await svc.checkAlerts()

      expect(createJobSpy).toHaveBeenCalledTimes(1)
      expect(createJobSpy.mock.calls[0][0].priority).toBe('HIGH')
      expect(createJobSpy.mock.calls[0][0].tags).toContain('iot:underperforming')
    })

    it('does nothing when device is healthy (no emergency, no underperformance)', async () => {
      const ok = makeSnap({ currentTempF: 71, heatSetpointF: 72 })
      const device = makeDevice({ lastSnapshot: ok })
      const prisma = buildPrismaMock({
        devices: [device],
        customerTags: [],
        history: [ok, ok, ok, ok, ok].map((s, i) => makeHistoryRow(s, i * 15)),
      })
      const svc = new IotAlertsService(prisma, jobs)

      await svc.checkAlerts()

      expect(createJobSpy).not.toHaveBeenCalled()
    })
  })
})
