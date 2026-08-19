import type { QueryClient } from '@tanstack/react-query'

/**
 * Server events → query keys to invalidate.
 *
 * Names are exactly what comms-service emits to the customer's private room
 * (see M1's CustomerEventsSubscriber). Because those events only ever reach the
 * owning customer, an invalidation here is always about this user's own data.
 */
export const EVENT_TO_QUERY_KEYS: Record<string, string[][]> = {
  job_changed: [['jobs'], ['dashboard']],
  quote_changed: [['quotes'], ['dashboard']],
  invoice_changed: [['invoices'], ['dashboard']],
  message_new: [['threads'], ['notifications']],
}

export const CUSTOMER_EVENTS: string[] = Object.keys(EVENT_TO_QUERY_KEYS)

/** Invalidates the keys mapped to `eventName`; unknown events are ignored. */
export function invalidateForEvent(client: QueryClient, eventName: string): void {
  const keys = EVENT_TO_QUERY_KEYS[eventName]
  if (!keys) return
  for (const queryKey of keys) {
    client.invalidateQueries({ queryKey })
  }
}
