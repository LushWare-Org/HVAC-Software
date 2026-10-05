import type { DispatchAssignment, Job, Technician } from '../../types/api'

const LATE_AFTER_MIN = 15

export type StageKey = 'DONE' | 'ON_SITE' | 'EN_ROUTE' | 'SCHEDULED' | 'UNASSIGNED'

export interface Stage {
  key: StageKey
  label: string
  count: number
  /** Where the segment leads: the jobs list or the board, already filtered. */
  href: string
}

export interface AttentionItem {
  id: string
  tone: 'urgent' | 'normal'
  kind: string
  title: string
  detail: string
  action: string
  href: string
  /** A phone number makes the action a real call link. */
  tel?: string
}

export type TechState = 'LATE' | 'ON_SITE' | 'EN_ROUTE' | 'NEXT' | 'FREE' | 'OFFLINE'

export interface TechRow {
  id: string
  name: string
  state: TechState
  detail: string
}

const DONE = new Set(['COMPLETED', 'INVOICED', 'PAID'])

export function sameLocalDay(iso: string | null | undefined, day: Date): boolean {
  if (!iso) return false
  const d = new Date(iso)
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
}

export function clock(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function minutesLate(job: Job, now: Date): number {
  if (!job.scheduledStart) return 0
  if (job.status !== 'SCHEDULED' && job.status !== 'EN_ROUTE') return 0
  const mins = Math.round((now.getTime() - new Date(job.scheduledStart).getTime()) / 60000)
  return mins > LATE_AFTER_MIN ? mins : 0
}

/** Today's jobs, the ones that matter on a dispatch day (cancelled and on-hold left out). */
export function todaysJobs(jobs: Job[], now: Date): Job[] {
  return jobs.filter(j => sameLocalDay(j.scheduledStart, now) && j.status !== 'CANCELLED')
}

export function buildStages(today: Job[]): Stage[] {
  const count = (pred: (j: Job) => boolean) => today.filter(pred).length
  return [
    { key: 'DONE', label: 'Done', count: count(j => DONE.has(j.status)), href: '/scheduling?view=completed' },
    { key: 'ON_SITE', label: 'On site', count: count(j => j.status === 'ON_SITE'), href: '/scheduling?view=active' },
    { key: 'EN_ROUTE', label: 'En route', count: count(j => j.status === 'EN_ROUTE'), href: '/scheduling?view=active' },
    { key: 'SCHEDULED', label: 'Scheduled', count: count(j => j.status === 'SCHEDULED'), href: '/jobs?status=SCHEDULED' },
    { key: 'UNASSIGNED', label: 'Unassigned', count: count(j => j.status === 'PENDING' || (!j.assignedToId && !DONE.has(j.status))), href: '/scheduling' },
  ]
}

export interface AttentionInputs {
  jobs: Job[]
  now: Date
  reschedules: number
  agingQuotes: number
  newLeads: number
  pendingTechs: number
  overdueCount?: number
  overdueAmountLabel?: string
}

/** Everything waiting on a person, most urgent first, each with one next step. */
export function buildAttention(i: AttentionInputs): AttentionItem[] {
  const items: AttentionItem[] = []
  const tomorrow = new Date(i.now); tomorrow.setDate(tomorrow.getDate() + 1)

  for (const job of i.jobs) {
    const late = minutesLate(job, i.now)
    if (late && sameLocalDay(job.scheduledStart, i.now)) {
      items.push({
        id: `late-${job.id}`, tone: 'urgent', kind: 'Running late',
        title: `${job.assignedToName ?? 'Technician'} is ${late} min late`,
        detail: `${job.jobNumber}, ${job.title}, due ${clock(job.scheduledStart)}`,
        action: job.customerPhone ? 'Call customer' : 'Open board',
        href: '/scheduling?view=active',
        tel: job.customerPhone ?? undefined,
      })
    }
  }

  const unassigned = i.jobs
    .filter(j => j.status === 'PENDING' && (sameLocalDay(j.scheduledStart, i.now) || sameLocalDay(j.scheduledStart, tomorrow)))
    .sort((a, b) => new Date(a.scheduledStart ?? 0).getTime() - new Date(b.scheduledStart ?? 0).getTime())
  if (unassigned.length) {
    const next = unassigned[0]
    const when = sameLocalDay(next.scheduledStart, i.now) ? `today ${clock(next.scheduledStart)}` : `tomorrow ${clock(next.scheduledStart)}`
    items.push({
      id: 'unassigned', tone: sameLocalDay(next.scheduledStart, i.now) ? 'urgent' : 'normal', kind: 'Unassigned',
      title: unassigned.length === 1 ? '1 job needs a technician' : `${unassigned.length} jobs need a technician`,
      detail: `Next: ${next.jobNumber}, ${next.title}, ${when}`,
      action: 'Assign', href: '/scheduling',
    })
  }

  const onHold = i.jobs.filter(j => j.status === 'ON_HOLD' || j.hasPartShortage)
  if (onHold.length) {
    items.push({
      id: 'on-hold', tone: 'normal', kind: 'On hold',
      title: onHold.length === 1 ? `${onHold[0].jobNumber} is on hold` : `${onHold.length} jobs are on hold`,
      detail: onHold.some(j => j.hasPartShortage) ? 'Waiting for parts' : 'Waiting on a decision',
      action: 'Review', href: '/jobs?status=ON_HOLD',
    })
  }

  if (i.reschedules) items.push({
    id: 'reschedules', tone: 'normal', kind: 'Reschedules',
    title: i.reschedules === 1 ? '1 reschedule request' : `${i.reschedules} reschedule requests`,
    detail: 'Customers asked for a different time', action: 'Review', href: '/scheduling?view=reschedules',
  })

  if (i.overdueCount) items.push({
    id: 'overdue', tone: 'normal', kind: 'Overdue',
    title: i.overdueCount === 1 ? '1 invoice is overdue' : `${i.overdueCount} invoices are overdue`,
    detail: i.overdueAmountLabel ? `${i.overdueAmountLabel} unpaid past the due date` : 'Unpaid past the due date',
    action: 'View', href: '/finance?tab=invoices&status=OVERDUE',
  })

  if (i.agingQuotes) items.push({
    id: 'quotes', tone: 'normal', kind: 'Quotes',
    title: i.agingQuotes === 1 ? '1 quote unanswered for over a week' : `${i.agingQuotes} quotes unanswered for over a week`,
    detail: 'A reminder often gets a reply', action: 'Follow up', href: '/finance?tab=quotes&filter=pending_quotes',
  })

  if (i.pendingTechs) items.push({
    id: 'approvals', tone: 'normal', kind: 'Approvals',
    title: i.pendingTechs === 1 ? '1 technician waiting for approval' : `${i.pendingTechs} technicians waiting for approval`,
    detail: 'They can sign in once approved', action: 'Review', href: '/team',
  })

  if (i.newLeads) items.push({
    id: 'leads', tone: 'normal', kind: 'New sign-ups',
    title: i.newLeads === 1 ? '1 new customer sign-up' : `${i.newLeads} new customer sign-ups`,
    detail: 'Not contacted yet', action: 'View', href: '/customers',
  })

  return items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'urgent' ? -1 : 1))
}

/** What each technician is doing right now, judged from today's jobs. */
export function buildTechRows(techs: Technician[], today: Job[], now: Date): TechRow[] {
  const order: Record<TechState, number> = { LATE: 0, ON_SITE: 1, EN_ROUTE: 2, NEXT: 3, FREE: 4, OFFLINE: 5 }
  const rows = techs.map((t): TechRow => {
    const mine = today.filter(j => j.assignedToId === t.userId || (j.crewUserIds ?? []).includes(t.userId))
    const onSite = mine.find(j => j.status === 'ON_SITE')
    const enRoute = mine.find(j => j.status === 'EN_ROUTE')
    const late = mine.find(j => minutesLate(j, now))
    const next = mine
      .filter(j => j.status === 'SCHEDULED' && j.scheduledStart && new Date(j.scheduledStart) > now)
      .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime())[0]
    const seen = t.lastSeenAt ?? t.locationUpdatedAt
    const offline = !t.isActive || !seen || now.getTime() - new Date(seen).getTime() > 12 * 3600_000

    if (late) return { id: t.id, name: t.name, state: 'LATE', detail: `${minutesLate(late, now)} min late for ${late.jobNumber}` }
    if (onSite) return { id: t.id, name: t.name, state: 'ON_SITE', detail: `On site, ${onSite.jobNumber}` }
    if (enRoute) return { id: t.id, name: t.name, state: 'EN_ROUTE', detail: `En route to ${enRoute.jobNumber}` }
    if (next) return { id: t.id, name: t.name, state: 'NEXT', detail: `Next job ${clock(next.scheduledStart)}` }
    if (offline) return { id: t.id, name: t.name, state: 'OFFLINE', detail: 'Not signed in today' }
    return { id: t.id, name: t.name, state: 'FREE', detail: 'Free' }
  })
  return rows.sort((a, b) => order[a.state] - order[b.state] || a.name.localeCompare(b.name))
}

// ─── Live now: who is driving or on site ─────────────────────────────────────

export interface LiveMove {
  techId: string
  name: string
  state: 'EN_ROUTE' | 'ON_SITE'
  job: { id: string; jobNumber: string; customer: string; address: string }
  /** When this stage started: the en-route time, or the arrival time. */
  since: string | null
  enRouteAt: string | null
  techPos: [number, number] | null
  jobPos: [number, number] | null
  /** Straight-line distance left, en route only. */
  distanceKm: number | null
  /** Rough minutes to arrive, en route only. */
  etaMin: number | null
  /** When the last GPS fix arrived, null when there has never been one. */
  gpsAt: string | null
}

/** City driving: roads run about 1.3x the straight line, at about 30 km/h. */
const ROAD_FACTOR = 1.3
const CITY_KMH = 30

export function distanceKm(a: [number, number], b: [number, number]): number {
  const r = (d: number) => (d * Math.PI) / 180
  const dLat = r(b[0] - a[0])
  const dLng = r(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

function jobPin(j: Job): [number, number] | null {
  const lat = Number.parseFloat(j.serviceLatitude ?? '')
  const lng = Number.parseFloat(j.serviceLongitude ?? '')
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
}

/**
 * One row per technician who is driving to a job or working at one, newest
 * activity first within each group (driving before on site).
 *
 * A technician can hold more than one job in progress when an old one was
 * never closed. The most recent trip or arrival wins, so the row shows what
 * they are doing now rather than whatever job happened to come first.
 *
 * The job status decides the stage, because that is what the technician app
 * sets and what the customer is told. The lead's assignment row supplies the
 * start times, falling back to any live crew row, then to the job's assignee.
 */
export function buildLiveMoves(jobs: Job[], techs: Technician[], assignments: DispatchAssignment[]): LiveMove[] {
  const techById = new Map(techs.map(t => [t.id, t]))
  const techByUser = new Map(techs.map(t => [t.userId, t]))
  const byTech = new Map<string, LiveMove>()
  const t = (r: LiveMove) => (r.since ? new Date(r.since).getTime() : 0)

  for (const j of jobs) {
    if (j.status !== 'EN_ROUTE' && j.status !== 'ON_SITE') continue
    const live = assignments.filter(a => a.jobId === j.id && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
    const a = live.find(x => x.isLead) ?? live[0]
    const tech = (a && techById.get(a.technicianId)) ?? (j.assignedToId ? techByUser.get(j.assignedToId) : undefined)
    if (!tech) continue

    const state = j.status as LiveMove['state']
    const techPos: [number, number] | null = tech.currentLocation ? [tech.currentLocation.lat, tech.currentLocation.lng] : null
    const jobPos = jobPin(j)
    const km = state === 'EN_ROUTE' && techPos && jobPos ? distanceKm(techPos, jobPos) : null
    const row: LiveMove = {
      techId: tech.id,
      name: tech.name,
      state,
      job: { id: j.id, jobNumber: j.jobNumber ?? 'Job', customer: j.customerName ?? '', address: j.serviceAddress ?? '' },
      since: (state === 'EN_ROUTE' ? a?.enRouteAt : a?.onSiteAt) ?? null,
      enRouteAt: a?.enRouteAt ?? null,
      techPos, jobPos,
      distanceKm: km,
      etaMin: km === null ? null : Math.max(1, Math.round((km * ROAD_FACTOR / CITY_KMH) * 60)),
      // Live updates carry locationUpdatedAt; a fresh load only has lastSeenAt.
      gpsAt: tech.locationUpdatedAt ?? tech.lastSeenAt ?? null,
    }
    const held = byTech.get(tech.id)
    if (!held || t(row) > t(held) || (t(row) === t(held) && row.state === 'EN_ROUTE')) byTech.set(tech.id, row)
  }

  return [...byTech.values()].sort((x, y) => (x.state === y.state ? t(y) - t(x) : x.state === 'EN_ROUTE' ? -1 : 1))
}

/** "just now", "45s ago", "3 min ago", "2 h ago", "26 days ago". */
export function ago(seconds: number | null): string {
  if (seconds === null) return 'no GPS yet'
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 48 * 3600) return `${Math.floor(seconds / 3600)} h ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

/** Minutes between an ISO time and now, for "on the road 12 min". */
export function minutesSince(iso: string | null, now: Date): number | null {
  if (!iso) return null
  return Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60_000))
}
