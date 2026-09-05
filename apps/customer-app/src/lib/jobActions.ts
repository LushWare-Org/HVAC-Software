import type { Job } from '@/types/api'

/**
 * Which actions a customer may take on their own job.
 *
 * These mirror what job-service enforces, deliberately — the server rejects a
 * preferred-time change once a job is SCHEDULED and points at the negotiated
 * reschedule flow instead, so offering the wrong button here would produce an
 * error the customer cannot act on. Same rule, stated once, on both sides.
 */

/** Nothing can be changed once a job reaches one of these. */
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'INVOICED', 'PAID']

/** Work is under way — too late to self-serve a change. */
const IN_FLIGHT_STATUSES = ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']

export type JobAction = 'CHANGE_PREFERRED_TIME' | 'REQUEST_RESCHEDULE' | 'CANCEL'

export function isTerminal(job: Pick<Job, 'status'>): boolean {
  return TERMINAL_STATUSES.includes(job.status)
}

/**
 * A PENDING job with no technician assigned is still just a request, so the
 * customer can move it directly. Once dispatch has scheduled or assigned it,
 * moving it becomes a negotiation instead.
 */
export function canChangePreferredTime(job: Pick<Job, 'status' | 'assignedToId'>): boolean {
  return job.status === 'PENDING' && !job.assignedToId
}

export function canRequestReschedule(
  job: Pick<Job, 'status' | 'rescheduleState'>,
): boolean {
  if (job.status !== 'SCHEDULED') return false
  // A request already awaiting a dispatcher must not be duplicated.
  return !job.rescheduleState || job.rescheduleState === 'NONE'
}

export function canCancel(job: Pick<Job, 'status'>): boolean {
  if (isTerminal(job)) return false
  return !IN_FLIGHT_STATUSES.includes(job.status)
}

/** Every action currently offerable, in the order they should be shown. */
export function availableActions(
  job: Pick<Job, 'status' | 'assignedToId' | 'rescheduleState'>,
): JobAction[] {
  const actions: JobAction[] = []
  if (canChangePreferredTime(job)) actions.push('CHANGE_PREFERRED_TIME')
  if (canRequestReschedule(job)) actions.push('REQUEST_RESCHEDULE')
  if (canCancel(job)) actions.push('CANCEL')
  return actions
}
