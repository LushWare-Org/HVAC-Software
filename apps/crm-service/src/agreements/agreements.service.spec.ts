import { NotFoundException, BadRequestException } from '@nestjs/common'
import { AgreementsService, addServiceInterval } from './agreements.service'

const baseAgreement = {
  id: 'ag-1',
  companyId: 'co-1',
  customerId: 'cust-1',
  name: 'Annual AC Care',
  status: 'ACTIVE',
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: new Date('2027-01-01T00:00:00Z'),
  serviceInterval: 'QUARTERLY',
  serviceIntervalDays: null,
  visitsIncluded: 4,
  visitsUsed: 0,
  lastServiceDate: null,
  autoCreateJobs: true,
  leadDays: 7,
  autoRenew: false,
  confirmToken: null,
  signedAt: null,
  customer: { id: 'cust-1', firstName: 'Jo', lastName: 'Doe', email: 'jo@x.com', phone: null },
  amendments: [],
}

function prismaMock(over: any = {}) {
  return {
    serviceAgreement: {
      findFirst: jest.fn().mockResolvedValue('agreement' in over ? over.agreement : { ...baseAgreement }),
      findUnique: jest.fn().mockResolvedValue('agreement' in over ? over.agreement : { ...baseAgreement }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'ag-new', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...baseAgreement, ...data })),
    },
    agreementAmendment: {
      create: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({}),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue('customer' in over ? over.customer : { id: 'cust-1' }),
      findUnique: jest.fn().mockResolvedValue({ email: 'jo@x.com', firstName: 'Jo' }),
    },
  } as any
}

const emailMock = () => ({ sendMail: jest.fn().mockResolvedValue(undefined) }) as any

describe('addServiceInterval', () => {
  it('adds calendar months for named intervals', () => {
    expect(addServiceInterval(new Date('2026-01-15T00:00:00Z'), 'QUARTERLY')?.toISOString().slice(0, 10)).toBe('2026-04-15')
    expect(addServiceInterval(new Date('2026-01-15T00:00:00Z'), 'ANNUAL')?.toISOString().slice(0, 10)).toBe('2027-01-15')
  })

  it('adds days for CUSTOM interval', () => {
    expect(addServiceInterval(new Date('2026-01-01T00:00:00Z'), 'CUSTOM', 45)?.toISOString().slice(0, 10)).toBe('2026-02-15')
  })

  it('returns null when interval is missing or invalid', () => {
    expect(addServiceInterval(new Date(), null)).toBeNull()
    expect(addServiceInterval(new Date(), 'CUSTOM', null)).toBeNull()
    expect(addServiceInterval(new Date(), 'WEEKLY_ISH')).toBeNull()
  })
})

describe('AgreementsService', () => {
  it('create rejects customers outside the company', async () => {
    const svc = new AgreementsService(prismaMock({ customer: null }), emailMock())
    await expect(
      svc.create('co-2', { customerId: 'cust-1', name: 'X', startDate: '2026-01-01' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('create derives nextServiceDate from startDate + interval', async () => {
    const prisma = prismaMock()
    const svc = new AgreementsService(prisma, emailMock())
    await svc.create('co-1', {
      customerId: 'cust-1', name: 'X', startDate: '2026-01-01T00:00:00Z', serviceInterval: 'QUARTERLY',
    })
    const created = prisma.serviceAgreement.create.mock.calls[0][0].data
    expect(created.nextServiceDate.toISOString().slice(0, 10)).toBe('2026-04-01')
  })

  it('update on ACTIVE agreement records an amendment for material changes', async () => {
    const prisma = prismaMock()
    const svc = new AgreementsService(prisma, emailMock())
    await svc.update('co-1', 'ag-1', { visitsIncluded: 6 }, { id: 'u-1', name: 'Admin' })
    expect(prisma.agreementAmendment.create).toHaveBeenCalled()
    const amendment = prisma.agreementAmendment.create.mock.calls[0][0].data
    expect(amendment.changedFields.visitsIncluded).toEqual({ from: 4, to: 6 })
  })

  it('update on DRAFT agreement records no amendment', async () => {
    const prisma = prismaMock({ agreement: { ...baseAgreement, status: 'DRAFT' } })
    const svc = new AgreementsService(prisma, emailMock())
    await svc.update('co-1', 'ag-1', { visitsIncluded: 6 }, { id: 'u-1' })
    expect(prisma.agreementAmendment.create).not.toHaveBeenCalled()
  })

  it('send requires a customer email', async () => {
    const prisma = prismaMock({ agreement: { ...baseAgreement, customer: { ...baseAgreement.customer, email: null } } })
    const svc = new AgreementsService(prisma, emailMock())
    await expect(svc.send('co-1', 'ag-1')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('confirmByToken activates a SENT agreement and clears the token', async () => {
    const prisma = prismaMock({ agreement: { ...baseAgreement, status: 'SENT', confirmToken: 'tok' } })
    const svc = new AgreementsService(prisma, emailMock())
    await svc.confirmByToken('tok', 'Jo Doe')
    const updated = prisma.serviceAgreement.update.mock.calls[0][0].data
    expect(updated.status).toBe('ACTIVE')
    expect(updated.confirmToken).toBeNull()
    expect(updated.signedByName).toBe('Jo Doe')
    expect(prisma.agreementAmendment.updateMany).toHaveBeenCalled()
  })

  it('confirmByToken throws for an unknown token', async () => {
    const prisma = prismaMock({ agreement: null })
    const svc = new AgreementsService(prisma, emailMock())
    await expect(svc.confirmByToken('nope')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('recordVisit advances schedule and increments visitsUsed', async () => {
    const prisma = prismaMock()
    const svc = new AgreementsService(prisma, emailMock())
    await svc.recordVisit('co-1', 'ag-1', new Date('2026-04-01T00:00:00Z'))
    const updated = prisma.serviceAgreement.update.mock.calls[0][0].data
    expect(updated.visitsUsed).toBe(1)
    expect(updated.nextServiceDate.toISOString().slice(0, 10)).toBe('2026-07-01')
  })

  it('recordVisit flags exhausted agreements for renewal', async () => {
    const prisma = prismaMock({ agreement: { ...baseAgreement, visitsUsed: 3 } })
    const svc = new AgreementsService(prisma, emailMock())
    await svc.recordVisit('co-1', 'ag-1', new Date('2026-12-01T00:00:00Z'))
    const updated = prisma.serviceAgreement.update.mock.calls[0][0].data
    expect(updated.visitsUsed).toBe(4)
    expect(updated.status).toBe('PENDING_RENEWAL')
    expect(updated.nextServiceDate).toBeNull()
  })

  it('renew clones terms into a DRAFT linked by renewedFromId', async () => {
    const prisma = prismaMock()
    const svc = new AgreementsService(prisma, emailMock())
    await svc.renew('co-1', 'ag-1')
    const created = prisma.serviceAgreement.create.mock.calls[0][0].data
    expect(created.renewedFromId).toBe('ag-1')
    expect(created.startDate).toEqual(baseAgreement.endDate)
    expect(prisma.serviceAgreement.update.mock.calls[0][0].data.status).toBe('RENEWED')
  })
})
