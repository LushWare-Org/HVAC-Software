import {
  availableActions, canCancel, canChangePreferredTime, canRequestReschedule, isTerminal,
} from './jobActions'

const job = (patch: Record<string, unknown> = {}) =>
  ({ status: 'PENDING', assignedToId: null, rescheduleState: null, ...patch }) as never

describe('canChangePreferredTime', () => {
  it('allows it on a PENDING job with nobody assigned', () => {
    expect(canChangePreferredTime(job())).toBe(true)
  })

  it('refuses once a technician is assigned, even while PENDING', () => {
    expect(canChangePreferredTime(job({ assignedToId: 'tech-1' }))).toBe(false)
  })

  it('refuses once SCHEDULED — that is the reschedule flow instead', () => {
    expect(canChangePreferredTime(job({ status: 'SCHEDULED' }))).toBe(false)
  })
})

describe('canRequestReschedule', () => {
  it('allows it on a SCHEDULED job', () => {
    expect(canRequestReschedule(job({ status: 'SCHEDULED' }))).toBe(true)
  })

  it('refuses when a request is already pending, so it cannot be duplicated', () => {
    expect(
      canRequestReschedule(job({ status: 'SCHEDULED', rescheduleState: 'CUSTOMER_REQUESTED' })),
    ).toBe(false)
  })

  it('refuses on a PENDING job — that uses preferred-time', () => {
    expect(canRequestReschedule(job())).toBe(false)
  })
})

describe('canCancel', () => {
  it('allows cancelling a PENDING or SCHEDULED job', () => {
    expect(canCancel(job())).toBe(true)
    expect(canCancel(job({ status: 'SCHEDULED' }))).toBe(true)
  })

  it('refuses once the technician is on the way or on site', () => {
    expect(canCancel(job({ status: 'EN_ROUTE' }))).toBe(false)
    expect(canCancel(job({ status: 'ON_SITE' }))).toBe(false)
  })

  it('refuses on a finished or already-cancelled job', () => {
    expect(canCancel(job({ status: 'COMPLETED' }))).toBe(false)
    expect(canCancel(job({ status: 'CANCELLED' }))).toBe(false)
    expect(canCancel(job({ status: 'PAID' }))).toBe(false)
  })
})

describe('isTerminal', () => {
  it('treats billing states as finished for the customer', () => {
    expect(isTerminal(job({ status: 'INVOICED' }))).toBe(true)
    expect(isTerminal(job({ status: 'PAID' }))).toBe(true)
    expect(isTerminal(job({ status: 'SCHEDULED' }))).toBe(false)
  })
})

describe('availableActions', () => {
  it('offers time change and cancel on a fresh request', () => {
    expect(availableActions(job())).toEqual(['CHANGE_PREFERRED_TIME', 'CANCEL'])
  })

  it('offers reschedule and cancel once scheduled', () => {
    expect(availableActions(job({ status: 'SCHEDULED' }))).toEqual([
      'REQUEST_RESCHEDULE', 'CANCEL',
    ])
  })

  it('offers nothing at all once work has started or finished', () => {
    expect(availableActions(job({ status: 'ON_SITE' }))).toEqual([])
    expect(availableActions(job({ status: 'COMPLETED' }))).toEqual([])
  })

  it('never offers both time-change paths at once', () => {
    for (const status of ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'COMPLETED']) {
      const actions = availableActions(job({ status }))
      const both =
        actions.includes('CHANGE_PREFERRED_TIME') && actions.includes('REQUEST_RESCHEDULE')
      expect(both).toBe(false)
    }
  })
})
