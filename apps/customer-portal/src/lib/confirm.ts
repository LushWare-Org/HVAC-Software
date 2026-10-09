import type { Job } from '../types/api'

/** The customer confirmed the time the visit has now (a moved visit is unconfirmed again). */
export const isConfirmed = (j: Pick<Job, 'scheduledStart' | 'confirmedFor'>) =>
  !!j.scheduledStart && !!j.confirmedFor && new Date(j.scheduledStart).getTime() === new Date(j.confirmedFor).getTime()

/** A booked visit with a technician and a time that the customer has not confirmed yet. */
export const canConfirm = (j: Job) =>
  j.status === 'SCHEDULED' && !!j.assignedToId && !!j.scheduledStart && !isConfirmed(j)
