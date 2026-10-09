/**
 * A project's jobs go to the crew rostered for that day: the people already
 * reserved for the site, so nobody has to pick them again on the board.
 */
import { toDateKey, type RosterDay } from './projectsApi'

export interface DayCrew {
  /** Scheduling technician ids, lead first: what the crew endpoint takes. */
  technicianIds: string[]
  leadTechnicianId: string
  /** The same people as user ids, for names and avatars. */
  userIds: string[]
}

/** The rostered crew for a job's day. Base team first; the first of them leads. null when there is none. */
export function dayCrewFor(
  job: { scheduledStart?: string | null },
  roster: RosterDay[],
  baseTeamUserIds: string[],
  schedIdByUser: Map<string, string>,
): DayCrew | null {
  if (!job.scheduledStart) return null
  const start = new Date(job.scheduledStart)
  if (Number.isNaN(start.getTime())) return null
  const day = roster.find(d => d.date === toDateKey(start))
  if (!day || day.isOff || !day.techUserIds.length) return null
  const base = new Set(baseTeamUserIds)
  const ordered = [...day.techUserIds.filter(u => base.has(u)), ...day.techUserIds.filter(u => !base.has(u))]
  const userIds = ordered.filter(u => schedIdByUser.has(u))
  if (!userIds.length) return null
  const technicianIds = userIds.map(u => schedIdByUser.get(u)!)
  return { technicianIds, leadTechnicianId: technicianIds[0], userIds }
}

/** A waiting, scheduled project job that nobody is on yet. */
export function needsCrew(job: { status: string; scheduledStart?: string | null; assignedToName?: string | null }): boolean {
  return ['PENDING', 'SCHEDULED'].includes(job.status) && !!job.scheduledStart && !job.assignedToName
}
