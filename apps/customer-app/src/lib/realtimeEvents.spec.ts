import { EVENT_TO_QUERY_KEYS, CUSTOMER_EVENTS, invalidateForEvent } from './realtimeEvents'

describe('realtime event mapping', () => {
  it('maps every M1 customer event', () => {
    expect([...CUSTOMER_EVENTS].sort()).toEqual(
      ['invoice_changed', 'job_changed', 'message_new', 'quote_changed'],
    )
  })

  it('invalidates jobs and dashboard for job_changed', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'job_changed')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['jobs'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('invalidates invoices and dashboard for invoice_changed', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'invoice_changed')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['invoices'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('invalidates threads and notifications for message_new', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'message_new')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['threads'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] })
  })

  it('ignores an unknown event rather than invalidating everything', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'something_else')
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('every mapped event name appears in CUSTOMER_EVENTS', () => {
    expect(Object.keys(EVENT_TO_QUERY_KEYS).sort()).toEqual([...CUSTOMER_EVENTS].sort())
  })
})
