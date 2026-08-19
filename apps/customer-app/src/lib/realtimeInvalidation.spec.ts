import { QueryClient } from '@tanstack/react-query'
import { invalidateForEvent } from './realtimeEvents'

/**
 * The sibling spec mocks invalidateQueries, so it proves the call is MADE but
 * not that the key it passes actually matches the query Home registers. These
 * tests use a real QueryClient so a prefix mismatch would fail here — that is
 * the failure mode where "realtime is connected" yet nothing on screen updates.
 */
function clientWithHomeQueries(customerId = 'cust-1') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  })
  // Exactly the keys useCustomerHome registers.
  client.setQueryData(['dashboard', 'jobs', customerId], { data: [] })
  client.setQueryData(['dashboard', 'invoices', customerId], { data: [] })
  client.setQueryData(['dashboard', 'quotes', customerId], { data: [] })
  return client
}

function isStale(client: QueryClient, key: unknown[]): boolean {
  const state = client.getQueryCache().find({ queryKey: key })?.state
  return state?.isInvalidated === true
}

describe('event invalidation reaches the real Home query keys', () => {
  it('job_changed invalidates the dashboard jobs query', () => {
    const client = clientWithHomeQueries()
    invalidateForEvent(client, 'job_changed')
    expect(isStale(client, ['dashboard', 'jobs', 'cust-1'])).toBe(true)
  })

  it('invoice_changed invalidates the dashboard invoices query', () => {
    const client = clientWithHomeQueries()
    invalidateForEvent(client, 'invoice_changed')
    expect(isStale(client, ['dashboard', 'invoices', 'cust-1'])).toBe(true)
  })

  it('quote_changed invalidates the dashboard quotes query', () => {
    const client = clientWithHomeQueries()
    invalidateForEvent(client, 'quote_changed')
    expect(isStale(client, ['dashboard', 'quotes', 'cust-1'])).toBe(true)
  })

  it('an unknown event leaves every Home query untouched', () => {
    const client = clientWithHomeQueries()
    invalidateForEvent(client, 'not_a_real_event')
    expect(isStale(client, ['dashboard', 'jobs', 'cust-1'])).toBe(false)
    expect(isStale(client, ['dashboard', 'invoices', 'cust-1'])).toBe(false)
    expect(isStale(client, ['dashboard', 'quotes', 'cust-1'])).toBe(false)
  })
})
