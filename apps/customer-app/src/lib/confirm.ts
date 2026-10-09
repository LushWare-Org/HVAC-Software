import type { Job } from '@/types/api'

/** The customer confirmed the time the visit has now (a moved visit is unconfirmed again). */
export function isConfirmed(j: Pick<Job, 'scheduledStart' | 'confirmedFor'>): boolean {
  return (
    !!j.scheduledStart && !!j.confirmedFor &&
    new Date(j.scheduledStart).getTime() === new Date(j.confirmedFor).getTime()
  )
}

/** A booked visit with a technician and a time that the customer has not confirmed yet. */
export function canConfirm(j: Pick<Job, 'status' | 'assignedToId' | 'scheduledStart' | 'confirmedFor'>): boolean {
  return j.status === 'SCHEDULED' && !!j.assignedToId && !!j.scheduledStart && !isConfirmed(j)
}
