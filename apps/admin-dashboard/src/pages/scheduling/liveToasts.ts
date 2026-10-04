import type { DispatchEvent } from '../../hooks/useScheduling'
import { humanizeStatus } from '../../lib/format'

export interface LiveToast {
  key: string
  title: string
  message: string
  variant: 'success' | 'error' | 'info'
}

interface JobChangedPayload {
  jobId?: string
  change?: string
  status?: string
  previousStatus?: string
  scheduledStart?: string | null
  assignedToName?: string | null
  rescheduleState?: string | null
  jobNumber?: string
  title?: string
  customerName?: string | null
  crewChange?: 'CREW' | 'LEAD'
  actorUserId?: string
  actorName?: string
}

export interface JobRef { jobNumber?: string; title?: string }

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/**
 * Turns a realtime event into a toast for changes someone ELSE made.
 *
 * Your own actions already confirm themselves where you clicked, so an event
 * carrying your user id is skipped. Assignment-level events are skipped too:
 * every status move fires one for the assignment and one for the job, and only
 * the job event says what happened in words a dispatcher uses.
 */
export function describeLiveEvent(
  event: DispatchEvent,
  myUserId: string | undefined,
  lookupJob: (jobId: string) => JobRef | undefined,
): LiveToast | null {
  if (event.type !== 'JOB_CHANGED') return null
  const p = (event.payload ?? {}) as JobChangedPayload
  if (!p.jobId || !p.change) return null
  if (myUserId && p.actorUserId === myUserId) return null

  const known = lookupJob(p.jobId)
  const number = p.jobNumber ?? known?.jobNumber ?? 'A job'
  const title = p.title ?? known?.title
  const ref = title ? `${number} · ${title}` : number
  const by = p.actorName ? ` by ${p.actorName}` : ''
  const key = `${p.jobId}:${p.change}:${p.status ?? ''}:${p.scheduledStart ?? ''}:${p.rescheduleState ?? ''}`

  switch (p.change) {
    case 'STATUS': {
      if (!p.status) return null
      const done = p.status === 'COMPLETED'
      const cancelled = p.status === 'CANCELLED'
      return {
        key,
        title: p.actorName ?? 'Status update',
        message: `${ref} is now ${humanizeStatus(p.status)}${p.previousStatus ? ` (was ${humanizeStatus(p.previousStatus)})` : ''}`,
        variant: done ? 'success' : cancelled ? 'error' : 'info',
      }
    }
    case 'CREATED':
      return { key, title: 'New job', message: `${ref}${p.customerName ? ` for ${p.customerName}` : ''}${by}`, variant: 'info' }
    case 'DELETED':
      return { key, title: 'Job deleted', message: `${ref}${by}`, variant: 'error' }
    case 'SCHEDULE':
      return {
        key,
        title: 'Job rescheduled',
        message: p.scheduledStart ? `${ref} moved to ${when(p.scheduledStart)}${by}` : `${ref}${by}`,
        variant: 'info',
      }
    case 'RESCHEDULE':
      return {
        key,
        title: 'Reschedule request',
        message: `${ref}${p.rescheduleState ? `: ${humanizeStatus(p.rescheduleState)}` : ''}`,
        variant: 'info',
      }
    case 'ASSIGNMENT':
      if (p.crewChange) {
        return { key, title: p.crewChange === 'LEAD' ? 'Lead technician changed' : 'Crew updated', message: `${ref}${by}`, variant: 'info' }
      }
      return {
        key,
        title: 'Technician changed',
        message: p.assignedToName ? `${ref} is now with ${p.assignedToName}${by}` : `${ref}${by}`,
        variant: 'info',
      }
    case 'UPDATED':
      return { key, title: 'Job updated', message: `${ref}${by}`, variant: 'info' }
    default:
      return null
  }
}
