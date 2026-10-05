import type { Job, Technician } from '../../types/api'

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
