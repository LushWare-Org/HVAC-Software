/**
 * My Jobs: the same row-per-card table as the office dashboard. Tabs for what is on the way,
 * what is coming up and what is done; filter chips with counts; 15 per page. Hover (or press the
 * arrow) to see the address, the progress and the actions. Same data and modals as before.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase, CheckCircle, ChevronRight, Plus, Search, MapPin, Send, CalendarClock, XCircle,
} from 'lucide-react'
import { useConfirmVisit, useJobTechnicians, useMyJobs } from '../../hooks/useCustomerPortal'
import { canConfirm, isConfirmed } from '../../lib/confirm'
import { useMyProjects } from '../../hooks/useMyProjects'
import { useMyComponents } from '../../hooks/useMyComponent'
import JobDetailModal from './JobDetailModal.tsx'
import BookServiceModal from './BookServiceModal.tsx'
import CancelJobModal from './CancelJobModal.tsx'
import type { Job } from '../../types/api'
import { useSearchParams } from 'react-router-dom'
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import TechAvatar from '../../components/TechAvatar'
import RescheduleModal from '../../components/reschedule/RescheduleModal'
import EditPreferredTimeModal from './EditPreferredTimeModal.tsx'
import MarkLocationModal from './MarkLocationModal.tsx'
import { CUSTOMER_RESCHEDULABLE_STATUSES } from '../../lib/reschedule'
import FilterChips, { type FilterOption } from '../../components/rowtable/FilterChips'
import Pager, { PAGE_SIZE } from '../../components/rowtable/Pager'
import { StatusLabel } from '../../components/rowtable/labels'
import '../../components/rowtable/rowTable.css'

const LIVE_STATUSES = ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']
const OPEN_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD']
const TRACKER_STEPS = ['Booked', 'Confirmed', 'En route', 'On site', 'Done']
const REACHED: Record<string, number> = {
  PENDING: 0, ON_HOLD: 0, SCHEDULED: 1, EN_ROUTE: 2, ON_SITE: 3, IN_PROGRESS: 3,
  COMPLETED: 4, INVOICED: 4, PAID: 4,
}

type Tab = 'active' | 'upcoming' | 'past'
const WHEN: Array<[string, string]> = [['today', 'Today'], ['week', 'This week'], ['month', 'This month']]
const TAB_STATUSES: Record<Tab, string[]> = {
  active: ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'],
  upcoming: ['PENDING', 'SCHEDULED', 'ON_HOLD'],
  past: ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'],
}

function fmtDate(iso?: string) {
  if (!iso) return 'Date to be set'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtTime(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "Morning 8:00 AM – 12:00 PM" for a visit booked as an arrival window. */
function windowText(start?: string | null, end?: string | null): string {
  if (!start || !end) return ''
  const a = new Date(start), b = new Date(end)
  const t = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const h = a.getHours()
  const name = h === 8 ? 'Morning' : h === 12 ? 'Afternoon' : h === 16 ? 'Evening' : ''
  return `${name ? name + ' ' : ''}${t(a)} – ${t(b)}`
}

/** Status enum → progress bar the customer instantly understands. */
function ProgressTracker({ status }: { status: string }) {
  const reached = REACHED[status] ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {TRACKER_STEPS.map((label, i) => {
        const done = i < reached
        const current = i === reached
        return (
          <div key={label} style={{ display: 'contents' }}>
            {i > 0 && (
              <div style={{
                flex: 1, height: 3, marginTop: 12,
                background: i <= reached ? 'var(--blue)' : 'var(--bd)',
                borderRadius: 2, margin: '12px 4px 0',
              }} />
            )}
            <div style={{ textAlign: 'center', width: 54, flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', margin: '0 auto',
                background: done ? 'var(--green)' : current ? 'var(--blue)' : 'var(--bg-card)',
                border: done || current ? 'none' : '2px solid var(--bd)',
                boxShadow: current ? '0 0 0 4px var(--blue-dim)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                {done && <CheckCircle size={13} />}
                {current && <Send size={12} />}
              </div>
              <div style={{
                fontSize: 10, fontWeight: current ? 700 : 600, marginTop: 5,
                color: done ? 'var(--green)' : current ? 'var(--blue)' : 'var(--t4)',
              }}>
                {label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** An open visit with no map pin: the technician has nowhere to route to. */
const needsLocation = (job: Job) =>
  ['PENDING', 'SCHEDULED', 'ON_HOLD'].includes(job.status) && (job.serviceLatitude == null || job.serviceLongitude == null || Number(job.serviceLatitude) === 0)

export default function MyJobs() {
  const [tab, setTab] = useState<Tab | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusSel, setStatusSel] = useState<string[]>([])
  const [whenSel, setWhenSel] = useState<string[]>([])
  const [page, setPage] = useState(1)
  // Rows kept open with the arrow, and rows folded with the arrow while the pointer is still on them.
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [shut, setShut] = useState<Set<string>>(new Set())

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null)
  const [editTimeJob, setEditTimeJob] = useState<Job | null>(null)
  const [locationJob, setLocationJob] = useState<Job | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCancel, setShowCancel] = useState(false)
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null)

  const { data, isLoading, refetch } = useMyJobs({ page: 1, limit: 200 })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const allJobs = data?.data ?? []
  const technicians = useJobTechnicians(allJobs)

  // Reschedule emails link to /jobs?reschedule=<jobId>. Open that job's modal
  // directly — someone who clicked "Choose a time" should not have to hunt for
  // the right card. The param is cleared so a refresh doesn't reopen it.
  useEffect(() => {
    const target = searchParams.get('reschedule')
    if (!target || rescheduleJob) return
    const match = allJobs.find(j => j.id === target)
    if (!match) return
    setRescheduleJob(match)
    // Copy rather than mutating the instance the hook handed us — mutating it
    // in place can leave React Router's internal state disagreeing with the URL.
    const next = new URLSearchParams(searchParams)
    next.delete('reschedule')
    setSearchParams(next, { replace: true })
  }, [searchParams, allJobs, rescheduleJob, setSearchParams])

  // Booking emails and messages link to /jobs?confirm=<jobId>: confirm that visit's time straight away.
  const confirmVisit = useConfirmVisit()
  const [confirmedNote, setConfirmedNote] = useState<string | null>(null)
  useEffect(() => {
    const target = searchParams.get('confirm')
    if (!target || !allJobs.length || confirmVisit.isPending) return
    const match = allJobs.find(j => j.id === target)
    const next = new URLSearchParams(searchParams)
    next.delete('confirm')
    setSearchParams(next, { replace: true })
    if (!match) return
    if (!canConfirm(match)) { if (isConfirmed(match)) setConfirmedNote(`${match.title} is already confirmed. Thank you.`); return }
    confirmVisit.mutate(match.id, {
      onSuccess: () => setConfirmedNote(`Thank you. Your visit for ${match.title} is confirmed.`),
      onError: () => setConfirmedNote('We could not confirm that visit just now. Please try the Confirm button on the visit.'),
    })
  }, [searchParams, allJobs]) // eslint-disable-line react-hooks/exhaustive-deps

  // A portal customer has at most a handful of projects/components — cheap to map
  // once rather than resolve per-row, unlike the admin Jobs page's much larger scale.
  const { data: myProjects } = useMyProjects()
  const { data: myComponents } = useMyComponents()
  const jobContext = (job: Job): string | null => {
    if (!job.projectId) return null
    const projectName = myProjects?.find(p => p.id === job.projectId)?.name
    const componentLabel = job.componentId ? myComponents?.find(c => c.id === job.componentId)?.label : undefined
    if (!projectName) return null
    return componentLabel ? `${projectName} — ${componentLabel}` : projectName
  }

  const grouped = useMemo(() => {
    const active = allJobs
      .filter(j => LIVE_STATUSES.includes(j.status))
      .sort((a, b) => new Date(a.scheduledStart ?? a.createdAt).getTime() - new Date(b.scheduledStart ?? b.createdAt).getTime())
    const upcoming = allJobs
      .filter(j => OPEN_STATUSES.includes(j.status) && (!j.scheduledStart || new Date(j.scheduledStart) >= startOfToday))
      .sort((a, b) => {
        if (!a.scheduledStart && !b.scheduledStart) return 0
        if (!a.scheduledStart) return 1
        if (!b.scheduledStart) return -1
        return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      })
    const activeIds = new Set([...active, ...upcoming].map(j => j.id))
    const past = allJobs
      .filter(j => !activeIds.has(j.id))
      .sort((a, b) => new Date(b.scheduledStart ?? b.createdAt).getTime() - new Date(a.scheduledStart ?? a.createdAt).getTime())
    return { active, upcoming, past }
  }, [allJobs])

  // First load: land on the tab that has something to show.
  const effectiveTab: Tab = tab ?? (grouped.active.length ? 'active' : grouped.upcoming.length ? 'upcoming' : 'past')

  const tabJobs = grouped[effectiveTab]

  const whenOf = (job: Job): string[] => {
    const d = job.scheduledStart ? new Date(job.scheduledStart) : null
    if (!d) return []
    const out: string[] = []
    if (d >= startOfToday && d < new Date(startOfToday.getTime() + 86400000)) out.push('today')
    if (d >= startOfWeek) out.push('week')
    if (d >= startOfMonth) out.push('month')
    return out
  }
  const matches = (job: Job, skip?: 'status' | 'when') => {
    const who = technicians[job.id]?.name ?? job.assignedToName ?? ''
    const text = `${job.title} ${job.jobNumber} ${who} ${job.description ?? ''}`.toLowerCase()
    if (searchQuery && !text.includes(searchQuery.toLowerCase())) return false
    if (skip !== 'status' && statusSel.length && !statusSel.includes(job.status)) return false
    if (skip !== 'when' && whenSel.length && !whenOf(job).some(w => whenSel.includes(w))) return false
    return true
  }
  const filtered = useMemo(() => tabJobs.filter(j => matches(j)), [tabJobs, searchQuery, statusSel, whenSel, technicians]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const countBy = (pick: (j: Job) => string[], skip: 'status' | 'when') => {
    const m: Record<string, number> = {}
    for (const j of tabJobs) if (matches(j, skip)) for (const k of pick(j)) m[k] = (m[k] ?? 0) + 1
    return m
  }
  const statusCounts = countBy(j => [j.status], 'status')
  const whenCounts = countBy(whenOf, 'when')
  const statusOptions: FilterOption[] = TAB_STATUSES[effectiveTab].map(v => ({ value: v, node: <StatusLabel status={v} bare />, count: statusCounts[v] ?? 0 }))
  const whenOptions: FilterOption[] = WHEN.map(([v, label]) => ({ value: v, node: <span>{label}</span>, count: whenCounts[v] ?? 0 }))

  const switchTab = (t: Tab) => { setTab(t); setStatusSel([]); setPage(1) }
  useEffect(() => { setPage(1) }, [statusSel, whenSel, searchQuery])
  const flip = (set: Set<string>, id: string, on: boolean) => { const n = new Set(set); if (on) n.add(id); else n.delete(id); return n }
  const pin = (id: string) => { const was = pinned.has(id); setPinned(p => flip(p, id, !was)); setShut(x => flip(x, id, was)) }
  const openDetail = (job: Job) => { setSelectedJob(job); setShowDetail(true) }
  const openCancel = (job: Job) => { setJobToCancel(job); setShowCancel(true) }

  const hasFilters = !!searchQuery || statusSel.length > 0 || whenSel.length > 0
  const clearAll = () => { setSearchQuery(''); setStatusSel([]); setWhenSel([]) }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'On the way', count: grouped.active.length },
    { key: 'upcoming', label: 'Upcoming', count: grouped.upcoming.length },
    { key: 'past', label: 'Past', count: grouped.past.length },
  ]

  return (
    <div className="anim-fade-up">
      {confirmedNote && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 14, borderRadius: 10, background: 'var(--green-dim)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
          {confirmedNote}
          <button type="button" onClick={() => setConfirmedNote(null)} aria-label="Dismiss" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--canvas-t1)', letterSpacing: '-0.01em' }}>My Jobs</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--canvas-t2)' }}>
            Every visit — live, scheduled and completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBook(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 18px' }}>
          <Plus size={14} /> New service
        </button>
      </div>

      <div className="pt-card" style={{ marginBottom: 16 }}>
        <div className="jt-tabs">
          <div className="jt-tablist" role="tablist" aria-label="My jobs">
            {tabs.map(t => (
              <button key={t.key} type="button" role="tab" aria-selected={effectiveTab === t.key} className={`jt-tab${effectiveTab === t.key ? ' is-on' : ''}`} onClick={() => switchTab(t.key)}>
                {t.label} <span className="jt-n">{isLoading ? '…' : t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="jf-bar">
          <label className="jf-search">
            <Search size={14} aria-hidden="true" />
            <input placeholder="Search jobs, services, technicians" aria-label="Search jobs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </label>
          {hasFilters && <button type="button" className="jf-clear" onClick={clearAll}>Clear all filters</button>}
        </div>
        <div className="jc-wrap">
          <FilterChips label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} loading={isLoading} />
          <FilterChips label="When" options={whenOptions} selected={whenSel} onChange={setWhenSel} loading={isLoading} />
        </div>

        <div className="jt-wrap">
          <div className="jt" role="table" aria-label="My jobs">
            <div className="jt-grid pt-jobs jt-head" role="row">
              <span />
              <span className="jt-th" role="columnheader">Service</span>
              <span className="jt-th pt-hide-sm" role="columnheader">Technician</span>
              <span className="jt-th" role="columnheader">When</span>
              <span className="jt-th" role="columnheader">Status</span>
              <span className="jt-th is-right pt-hide-sm" role="columnheader">Actions</span>
            </div>

            {isLoading && [1, 2, 3].map(i => (
              <div key={i} className="jt-row" aria-hidden="true"><div className="jt-main jt-grid pt-jobs"><span /><span style={{ gridColumn: '2 / -1', height: 14, borderRadius: 6, background: 'var(--bg-hover)' }} /></div></div>
            ))}

            {!isLoading && paginated.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)' }}>
                <Briefcase size={26} style={{ opacity: 0.35, display: 'block', margin: '0 auto 10px' }} aria-hidden="true" />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>{hasFilters ? 'No jobs match your filters' : `No ${effectiveTab === 'active' ? 'jobs on the way' : effectiveTab} jobs`}</div>
                {hasFilters
                  ? <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearAll}>Clear filters</button>
                  : effectiveTab !== 'past' && <button className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => setShowBook(true)}><Plus size={13} /> Book a service</button>}
              </div>
            )}

            {!isLoading && paginated.map(job => {
              const who = technicians[job.id]?.name ?? job.assignedToName
              const whoAvatar = technicians[job.id]?.avatarUrl
              // "and 2 others" rather than a list: the customer needs to know how many people are
              // arriving, and the email carries the names.
              const crewExtra = Math.max(0, (job.crewUserIds?.length ?? 1) - 1)
              const crewSuffix = crewExtra > 0 ? ` and ${crewExtra} other${crewExtra === 1 ? '' : 's'}` : ''
              const startT = fmtTime(job.scheduledStart)
              const isWin = job.timeMode === 'WINDOW' && !!job.windowStart && !!job.windowEnd
              const addr = job.serviceAddress
              const ctx = jobContext(job)
              const isPinned = pinned.has(job.id)
              const canChange = job.status === 'PENDING' && !job.assignedToId
              const canResched = !canChange && CUSTOMER_RESCHEDULABLE_STATUSES.includes(job.status)
              const canCancel = ['PENDING', 'SCHEDULED'].includes(job.status)
              const needsPin = needsLocation(job)
              // The one thing worth doing right now sits in the row; the rest is in the open row.
              const primary = canConfirm(job)
                ? <button type="button" className="jt-act" style={{ background: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }} disabled={confirmVisit.isPending}
                    onClick={e => { e.stopPropagation(); confirmVisit.mutate(job.id, { onSuccess: () => setConfirmedNote(`Thank you. Your visit for ${job.title} is confirmed.`) }) }}>Confirm this time</button>
                : needsPin
                  ? <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setLocationJob(job) }}><MapPin size={13} /> Mark location</button>
                  : canResched
                    ? <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setRescheduleJob(job) }}><CalendarClock size={13} /> Reschedule</button>
                    : canChange
                      ? <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setEditTimeJob(job) }}><CalendarClock size={13} /> Change time</button>
                      : null
              return (
                <div key={job.id} role="row" className={`jt-row${isPinned ? ' is-pinned' : ''}${shut.has(job.id) ? ' is-shut' : ''}`}
                  onClick={() => openDetail(job)}
                  onMouseLeave={() => { if (shut.has(job.id)) setShut(x => flip(x, job.id, false)) }}>
                  <div className="jt-main jt-grid pt-jobs">
                    <button type="button" className="jt-chev" aria-label={isPinned ? 'Hide details' : 'Keep details open'} aria-expanded={isPinned}
                      onClick={e => { e.stopPropagation(); pin(job.id) }}>
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                    <div className="jt-c" role="cell">
                      <div className="jt-t1 jt-svc" title={job.title}>{job.title}</div>
                      <div className="jt-t2">{job.jobNumber}{ctx ? ` · ${ctx}` : ''}</div>
                    </div>
                    <div className="jt-c jt-tech pt-hide-sm" role="cell">
                      {who
                        ? <><TechAvatar name={who} avatarUrl={whoAvatar} size={30} /><span className="jt-t1 is-soft" title={`${who}${crewSuffix}`}>{who}{crewSuffix}</span></>
                        : <><span className="jt-tech-none" aria-hidden="true" /><span className="jt-t2">To be assigned</span></>}
                    </div>
                    <div className="jt-c" role="cell">
                      <div className="jt-t1 is-soft">{fmtDate(job.scheduledStart)}</div>
                      <div className="jt-t2" title={isWin ? 'An arrival window. We will tell you the exact time on the day.' : undefined}>
                        {isWin ? windowText(job.windowStart, job.windowEnd) : startT ?? '\u00a0'}
                      </div>
                      {job.status === 'SCHEDULED' && job.assignedToId && (
                        isConfirmed(job)
                          ? <span className="jt-conf is-yes">Confirmed</span>
                          : <span className="jt-conf">Please confirm</span>
                      )}
                    </div>
                    <div role="cell"><StatusLabel status={job.status} /></div>
                    <div className="jt-actions pt-hide-sm" role="cell">
                      {primary}
                      {canCancel && <button type="button" className="jt-act jt-icon" aria-label={`Cancel ${job.title}`} title="Cancel this visit" onClick={e => { e.stopPropagation(); openCancel(job) }}><XCircle size={15} aria-hidden="true" /></button>}
                    </div>
                  </div>

                  <div className="jt-more">
                    <div className="jt-more-in">
                      <div className="jt-detail">
                        {(LIVE_STATUSES.includes(job.status) || job.status === 'SCHEDULED') && <ProgressTracker status={job.status} />}
                        <div className="jt-facts">
                          {addr && <span className="jt-fact"><MapPin size={13} aria-hidden="true" />{addr}</span>}
                          {who && <span className="jt-fact"><span className="k">Technician</span> {who}{crewSuffix}</span>}
                          <RescheduleBadge state={job.rescheduleState} size="sm" />
                        </div>
                        {job.description && <div className="jt-desc">{job.description}</div>}
                        <div className="jt-facts">
                          {canConfirm(job) && <button type="button" className="jt-act" style={{ background: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }} onClick={e => { e.stopPropagation(); confirmVisit.mutate(job.id, { onSuccess: () => setConfirmedNote(`Thank you. Your visit for ${job.title} is confirmed.`) }) }}>Confirm this time</button>}
                          {needsPin && <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setLocationJob(job) }}><MapPin size={13} /> Mark location</button>}
                          {canResched && <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setRescheduleJob(job) }}><CalendarClock size={13} /> Reschedule</button>}
                          {canChange && <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); setEditTimeJob(job) }}><CalendarClock size={13} /> Change time</button>}
                          {canCancel && <button type="button" className="jt-act" onClick={e => { e.stopPropagation(); openCancel(job) }}>Cancel visit</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Pager total={filtered.length} page={safePage} onPage={setPage} noun="jobs" />
      </div>

      {showDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => { setShowDetail(false); setSelectedJob(null) }}
          onCancel={() => {
            setShowDetail(false)
            setJobToCancel(selectedJob)
            setShowCancel(true)
          }}
        />
      )}
      {showBook && <BookServiceModal onClose={() => { setShowBook(false); refetch() }} />}

      {locationJob && (
        <MarkLocationModal job={locationJob} onClose={() => { setLocationJob(null); refetch() }} />
      )}

      {editTimeJob && (
        <EditPreferredTimeModal
          job={{ id: editTimeJob.id, title: editTimeJob.title, scheduledStart: editTimeJob.scheduledStart }}
          onClose={() => { setEditTimeJob(null); refetch() }}
        />
      )}

      {rescheduleJob && (
        <RescheduleModal
          job={{
            id: rescheduleJob.id, title: rescheduleJob.title,
            scheduledStart: rescheduleJob.scheduledStart, status: rescheduleJob.status,
            rescheduleState: rescheduleJob.rescheduleState,
          }}
          isOpen
          onClose={() => { setRescheduleJob(null); refetch() }}
        />
      )}
      {showCancel && jobToCancel && (
        <CancelJobModal
          job={jobToCancel}
          onClose={() => { setShowCancel(false); setJobToCancel(null); refetch() }}
        />
      )}
    </div>
  )
}
