/**
 * Day-plan scheduling algorithm — extracted from BoardPlan.tsx so it can be
 * exercised directly. It decides which technician takes which job and at what
 * time, so a bug here misbooks real customers.
 */
import type { Job, Technician } from '../types/api'

export const DAY_START_H = 8
export const DAY_END_H = 17
export const DEFAULT_DURATION_MIN = 90
export const TRAVEL_BUFFER_MIN = 30

/** Common visit lengths offered in job forms; anything else is typed in. */
export const DURATION_PRESETS = [30, 45, 60, 90, 120, 180, 240, 480]

/** 90 → "1h 30m", 60 → "1h", 45 → "45m". Used in forms and the plan preview. */
export function formatDurationLabel(mins: number): string {
  if (!Number.isFinite(mins) || mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function jobCoords(j: Job): { lat: number; lng: number } | null {
  const lat = j.serviceLatitude != null ? Number(j.serviceLatitude) : NaN
  const lng = j.serviceLongitude != null ? Number(j.serviceLongitude) : NaN
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export interface ProposedAssignment {
  job: Job
  tech: Technician
  start: Date
  end: Date
  distanceKm: number | null
  /** True when `start` is the time the customer actually asked for. */
  honoursRequestedTime?: boolean
  /**
   * Set when the customer's requested time could not be honoured — the plan had
   * to move them. Shown in the preview so a dispatcher can see it and decide,
   * rather than the system quietly overriding a promise.
   */
  requestedTimeConflict?: { requested: Date; reason: string }
}

/**
 * A job carries a customer-requested time when `scheduledStart` falls on the
 * planned day. On a PENDING job that value is the time the customer asked for
 * at booking (BookServiceModal writes their preferred slot straight into it), so
 * it is a commitment to honour, not a hint to discard.
 */
export function requestedStartOn(job: Job, date: Date): Date | null {
  if (!job.scheduledStart) return null
  const d = new Date(job.scheduledStart)
  if (Number.isNaN(d.getTime())) return null
  return d.getFullYear() === date.getFullYear()
    && d.getMonth() === date.getMonth()
    && d.getDate() === date.getDate()
    ? d
    : null
}

const durationOf = (job: Job) => job.estimatedDurationMins ?? DEFAULT_DURATION_MIN

/**
 * Build the day's proposed assignments.
 *
 * Two classes of job, handled in this order on purpose:
 *
 *  1. **Time-anchored** — the customer asked for a specific time. These are
 *     placed first, at exactly the requested time, and block out that slot.
 *     Where two anchored jobs collide for the nearest technician, the next
 *     free technician takes it; only if every technician is busy does the job
 *     get moved, and then it is flagged as a conflict rather than moved
 *     silently.
 *  2. **Flexible** — no requested time. These fill the gaps around the anchors,
 *     nearest-neighbour by travel distance, as before.
 *
 * The previous version ignored `scheduledStart` entirely and packed every job
 * from 08:00 in geographic order, so a customer who asked for 10am was quietly
 * booked for 08:00. Honouring the request is what makes the output usable
 * without hand-editing every row.
 */
export function buildDayPlan(date: Date, jobs: Job[], techs: Technician[]): ProposedAssignment[] {
  if (techs.length === 0) return []

  // Busy intervals per technician, so anchored and flexible work never overlap.
  const busy = new Map<string, { start: number; end: number }[]>(techs.map(t => [t.id, []]))
  const proposals: ProposedAssignment[] = []

  const overlaps = (techId: string, start: number, end: number) =>
    (busy.get(techId) ?? []).some(b => start < b.end && end > b.start)

  const claim = (techId: string, start: number, end: number) => {
    // Reserve the visit plus travel time after it, so the next job cannot be
    // stacked onto the same minute the previous one ends.
    busy.get(techId)!.push({ start, end: end + TRAVEL_BUFFER_MIN * 60_000 })
  }

  /** Technicians ordered by travel distance to the job — nearest first. */
  const byProximity = (job: Job): Technician[] => {
    const coords = jobCoords(job)
    if (!coords) return techs
    const located = techs.filter(t => t.currentLocation)
    const unlocated = techs.filter(t => !t.currentLocation)
    return [
      ...located.sort((a, b) =>
        haversineKm(coords, a.currentLocation!) - haversineKm(coords, b.currentLocation!)),
      ...unlocated,
    ]
  }

  const distanceFor = (job: Job, tech: Technician): number | null => {
    const coords = jobCoords(job)
    return coords && tech.currentLocation ? haversineKm(coords, tech.currentLocation) : null
  }

  // ── Pass 1: anchored jobs, at the time the customer asked for ─────────────

  const anchored: { job: Job; requested: Date }[] = []
  const flexible: Job[] = []
  for (const job of jobs) {
    const requested = requestedStartOn(job, date)
    if (requested) anchored.push({ job, requested })
    else flexible.push(job)
  }

  // Earliest request first, so the day fills in chronological order and an
  // early slot is never blocked by a later one that was processed first.
  anchored.sort((a, b) => a.requested.getTime() - b.requested.getTime())

  for (const { job, requested } of anchored) {
    const durMs = durationOf(job) * 60_000
    const start = requested.getTime()
    const end = start + durMs

    const candidate = byProximity(job).find(t => !overlaps(t.id, start, end))
    if (candidate) {
      claim(candidate.id, start, end)
      proposals.push({
        job, tech: candidate,
        start: new Date(start), end: new Date(end),
        distanceKm: distanceFor(job, candidate),
        honoursRequestedTime: true,
      })
      continue
    }

    // Every technician is busy at the requested time. Rather than drop the job,
    // offer the soonest slot that does exist and flag that the promise moved.
    const fallbackTech = byProximity(job)[0]
    let cursor = start
    const dayEndMs = new Date(date).setHours(DAY_END_H, 0, 0, 0)
    while (cursor + durMs <= dayEndMs && overlaps(fallbackTech.id, cursor, cursor + durMs)) {
      cursor += 15 * 60_000
    }
    claim(fallbackTech.id, cursor, cursor + durMs)
    proposals.push({
      job, tech: fallbackTech,
      start: new Date(cursor), end: new Date(cursor + durMs),
      distanceKm: distanceFor(job, fallbackTech),
      honoursRequestedTime: false,
      requestedTimeConflict: {
        requested,
        reason: 'Every technician was already booked at the requested time',
      },
    })
  }

  // ── Pass 2: flexible jobs fill the gaps around the anchors ───────────────

  const buckets = new Map<string, Job[]>(techs.map(t => [t.id, []]))
  flexible.forEach((job, i) => {
    const nearest = byProximity(job)[0] ?? techs[i % techs.length]
    buckets.get(nearest.id)!.push(job)
  })

  for (const tech of techs) {
    const pool = [...(buckets.get(tech.id) ?? [])]
    if (pool.length === 0) continue

    // Nearest-neighbour ordering from wherever the technician currently is.
    const ordered: Job[] = []
    let cursorLoc = tech.currentLocation ?? null
    while (pool.length) {
      let nextIdx = 0
      if (cursorLoc) {
        let bestD = Infinity
        pool.forEach((j, idx) => {
          const c = jobCoords(j)
          const d = c ? haversineKm(cursorLoc!, c) : Infinity
          if (d < bestD) { bestD = d; nextIdx = idx }
        })
      }
      const [job] = pool.splice(nextIdx, 1)
      ordered.push(job)
      cursorLoc = jobCoords(job) ?? cursorLoc
    }

    let clock = new Date(date).setHours(DAY_START_H, 0, 0, 0)
    const dayEndMs = new Date(date).setHours(DAY_END_H, 0, 0, 0)
    let prev: { lat: number; lng: number } | null = tech.currentLocation ?? null

    for (const job of ordered) {
      const durMs = durationOf(job) * 60_000
      // Skip past anything already claimed by an anchored job.
      while (clock + durMs <= dayEndMs && overlaps(tech.id, clock, clock + durMs)) {
        clock += 15 * 60_000
      }
      const coords = jobCoords(job)
      const distanceKm = prev && coords ? haversineKm(prev, coords) : null
      claim(tech.id, clock, clock + durMs)
      proposals.push({
        job, tech,
        start: new Date(clock), end: new Date(clock + durMs),
        distanceKm,
      })
      clock = clock + durMs + TRAVEL_BUFFER_MIN * 60_000
      prev = coords ?? prev
    }
  }

  return proposals.sort((a, b) => a.start.getTime() - b.start.getTime())
}
