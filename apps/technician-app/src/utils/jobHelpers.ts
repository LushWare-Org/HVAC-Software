import type { AssignmentStatus, JobStatus, WorkOrder } from '@/types/api'

/**
 * Determine the primary action button for a job based on its current status
 */
export interface JobAction {
  label: string
  color: string
  nextStatus: JobStatus
  assignmentStatus: AssignmentStatus
  icon: string
}

export function getJobAction(status: JobStatus): JobAction | null {
  switch (status) {
    case 'SCHEDULED':
    case 'ASSIGNED' as JobStatus:
      return {
        label: 'Start Route',
        color: '#2563EB',
        nextStatus: 'EN_ROUTE',
        assignmentStatus: 'EN_ROUTE',
        icon: 'navigation',
      }
    case 'EN_ROUTE':
      return {
        label: 'Arrived on Site',
        color: '#0891B2',
        nextStatus: 'ON_SITE',
        assignmentStatus: 'ON_SITE',
        icon: 'map-pin',
      }
    case 'ON_SITE':
    case 'IN_PROGRESS':
      return {
        label: 'Complete Job',
        color: '#16A34A',
        nextStatus: 'COMPLETED',
        assignmentStatus: 'COMPLETED',
        icon: 'check-circle',
      }
    default:
      return null
  }
}

/**
 * Check if all required tasks are completed in a work order
 */
export function areRequiredTasksComplete(workOrder?: WorkOrder): boolean {
  if (!workOrder?.tasks?.length) return true
  return workOrder.tasks
    .filter(t => t.isRequired)
    .every(t => t.isCompleted)
}

/**
 * Count completed vs total tasks
 */
export function getTaskProgress(workOrder?: WorkOrder): { completed: number; total: number } {
  if (!workOrder?.tasks?.length) return { completed: 0, total: 0 }
  return {
    completed: workOrder.tasks.filter(t => t.isCompleted).length,
    total: workOrder.tasks.length,
  }
}

/**
 * Calculate total from line items
 */
export function calculateLineItemsTotal(workOrder?: WorkOrder): number {
  if (!workOrder?.lineItems?.length) return 0
  return workOrder.lineItems.reduce((sum, item) => {
    const total = typeof item.total === 'string' ? parseFloat(item.total) : item.total
    return sum + (total || 0)
  }, 0)
}

/**
 * Check if a job is active (technician can interact with it)
 */
export function isActiveJob(status: JobStatus): boolean {
  return ['SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(status)
}

/**
 * Check if a job is completed (any completed state)
 */
export function isCompletedJob(status: JobStatus): boolean {
  return ['COMPLETED', 'INVOICED', 'PAID'].includes(status)
}

/** The device's calendar date as YYYY-MM-DD (not UTC: an 11 PM job in UTC+5:30 would carry tomorrow's date). */
export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const jobLocalDate = (iso?: string | null) => (iso ? localDateStr(new Date(iso)) : null)

/** Work the technician is doing right now. It stays on Today whatever its date. */
export const isInProgressJob = (status: JobStatus) => ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(status)

/**
 * A MISSED job: assigned and still open, but its day has passed without it being done.
 * Different from Today (do now), Upcoming (do later) and Completed (done), so it
 * gets its own place instead of hiding in any of them.
 */
export function isMissedJob(job: { status: JobStatus; scheduledStart?: string | null }, today = localDateStr(new Date())): boolean {
  if (isCompletedJob(job.status) || job.status === 'CANCELLED' || isInProgressJob(job.status)) return false
  const day = jobLocalDate(job.scheduledStart)
  return !!day && day < today
}

/** "Missed yesterday" / "Missed 3 days ago". */
export function missedLabel(scheduledStart: string | null | undefined, today = localDateStr(new Date())): string {
  const day = jobLocalDate(scheduledStart)
  if (!day) return 'Missed'
  const days = Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${day}T00:00:00`).getTime()) / 86_400_000)
  return days <= 1 ? 'Missed yesterday' : `Missed ${days} days ago`
}

/**
 * Sort jobs by scheduled start time
 */
export function sortByScheduledTime<T extends { scheduledStart?: string }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    if (!a.scheduledStart) return 1
    if (!b.scheduledStart) return -1
    return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
  })
}

/**
 * Open native maps for turn-by-turn navigation
 */
export function getNavigationUrl(address?: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    // Google Maps deep link with directions
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
  }
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
  }
  return ''
}
