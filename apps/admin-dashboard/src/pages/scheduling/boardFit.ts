/**
 * Rules behind the docked decision cards: which waiting job comes first, how
 * its timing reads, and which technician fits it best. Pure, so they are tested.
 *
 * "Best fit" is a quick, local judgement (nearest, least busy, not offline) so
 * every card can show one at once without asking the server 17 times. The
 * card's Smart button still runs the server's full scoring for a second opinion.
 */
import type { DispatchAssignment, Job, Technician } from '../../types/api'
import { getTechAvailability } from './availability'

export type Urgency = 'emergency' | 'high' | 'normal'
export interface Ranked { tech: Technician; km: number | null; load: number; busyNow: boolean; why: string }
export interface Fit { ranked: Ranked[]; unavailable: Technician[] }

export function jobUrgency(job: Pick<Job, 'priority'>): Urgency {
  const p = String(job.priority ?? '').toUpperCase()
  return p === 'EMERGENCY' ? 'emergency' : p === 'HIGH' || p === 'URGENT' ? 'high' : 'normal'
}

const RANK: Record<Urgency, number> = { emergency: 0, high: 1, normal: 2 }

/** Emergencies, then high priority, then the rest; within each, the soonest (or most overdue) first, undated last. */
export function sortByUrgency<T extends Pick<Job, 'priority' | 'scheduledStart'>>(jobs: T[]): T[] {
  const t = (j: T) => (j.scheduledStart ? new Date(j.scheduledStart).getTime() : Number.POSITIVE_INFINITY)
  return [...jobs].sort((a, b) => RANK[jobUrgency(a)] - RANK[jobUrgency(b)] || t(a) - t(b))
}

const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
const dayStart = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

/** "Today · 2:00 pm", "Overdue · was Tue 6 Oct", "Emergency · needed now"… and a tone for its colour. */
export function whenNeeded(job: Pick<Job, 'priority' | 'scheduledStart'>, now = new Date()): { label: string; tone: 'red' | 'amber' | 'blue' | 'grey' } {
  const urgent = jobUrgency(job) === 'emergency'
  if (!job.scheduledStart) return urgent ? { label: 'Emergency · needed now', tone: 'red' } : { label: 'No date yet', tone: 'grey' }
  const at = new Date(job.scheduledStart)
  const days = Math.round((dayStart(at).getTime() - dayStart(now).getTime()) / 86_400_000)
  if (urgent && at.getTime() <= now.getTime() + 60 * 60_000) return { label: 'Emergency · needed now', tone: 'red' }
  const prefix = urgent ? 'Emergency · ' : ''
  if (days < 0) return { label: `Overdue · was ${at.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`, tone: urgent ? 'red' : 'amber' }
  if (days === 0) return { label: `${prefix || 'Today · '}${time(at)}`, tone: urgent ? 'red' : 'amber' }
  if (days === 1) return { label: `${prefix}Tomorrow · ${time(at)}`, tone: urgent ? 'red' : 'blue' }
  return { label: `${prefix}${at.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time(at)}`, tone: urgent ? 'red' : 'grey' }
}

export function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const ACTIVE = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE']

/** For each job: technicians from best to worst fit, and those offline (still choosable by hand). */
export function bestFits(jobs: Job[], techs: Technician[], loginMap: Record<string, string>, assignments: DispatchAssignment[]): Record<string, Fit> {
  const load = new Map<string, number>()
  const busy = new Set<string>()
  for (const a of assignments) {
    if (!a || !ACTIVE.includes(a.status)) continue
    load.set(a.technicianId, (load.get(a.technicianId) ?? 0) + 1)
    if (a.status === 'EN_ROUTE' || a.status === 'ON_SITE') busy.add(a.technicianId)
  }
  const usable = techs.filter(t => t.isActive !== false && getTechAvailability(t, loginMap[t.userId]) !== 'OFFLINE')
  const unavailable = techs.filter(t => t.isActive !== false && !usable.includes(t))
  const out: Record<string, Fit> = {}
  for (const job of jobs) {
    const lat = Number(job.serviceLatitude), lng = Number(job.serviceLongitude)
    const spot = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null
    const ranked = usable.map(t => {
      const km = spot && t.currentLocation ? kmBetween(t.currentLocation, spot) : null
      const n = load.get(t.id) ?? 0
      const busyNow = busy.has(t.id)
      const why = [
        km != null ? `${km < 1 ? '<1' : Math.round(km)} km away` : null,
        busyNow ? 'on a job now' : 'free now',
        n ? `${n} job${n === 1 ? '' : 's'} booked` : 'nothing booked',
      ].filter(Boolean).join(' · ')
      return { tech: t, km, load: n, busyNow, why, score: (km ?? 25) + n * 6 + (busyNow ? 8 : 0) }
    }).sort((a, b) => a.score - b.score).map(({ score: _score, ...r }) => r)
    out[job.id] = { ranked, unavailable }
  }
  return out
}
