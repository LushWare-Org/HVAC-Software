/**
 * keys.ts — central TanStack Query key factory for the customer portal.
 *
 * One factory means cache invalidations are unambiguous: hooks that mutate
 * profile data invalidate `keys.profile()`; the matching reader uses the
 * same key. Without this you get drift (`['customer','profile']` vs
 * `['customer-profile']`) and stale screens after writes.
 */
export const keys = {
  profile:        () => ['customer', 'profile'] as const,
  jobs:           (filters?: Record<string, any>) => ['customer', 'jobs', filters] as const,
  job:            (id: string) => ['customer', 'job', id] as const,
  invoices:       (filters?: Record<string, any>) => ['customer', 'invoices', filters] as const,
  invoice:        (id: string) => ['customer', 'invoice', id] as const,
  quotes:         (filters?: Record<string, any>) => ['customer', 'quotes', filters] as const,
  quote:          (id: string) => ['customer', 'quote', id] as const,
  jobAssignments: (jobId: string) => ['customer', 'job-assignments', jobId] as const,
  technician:     (id: string) => ['customer', 'technician', id] as const,
  threads:        () => ['customer', 'threads'] as const,
  thread:         (id: string) => ['customer', 'thread', id] as const,
  notifications:  () => ['customer', 'notifications'] as const,
  bookings:       () => ['customer', 'bookings'] as const,
}
