/**
 * Day Planner — plan a full day of work geographically.
 *
 * Pick a date (defaults to tomorrow), see every job for that day and every
 * nearby agreement visit that could be pulled forward, batch-assign with
 * nearest-technician routing, and message customers about date changes.
 */
import { useMemo, useState, lazy, Suspense } from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, MapPin, Route, Send,
  Sparkles, User as UserIcon, X, Clock, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { useJobs, useUpdateJobFields } from '../../hooks/useJobs'
import { useTechnicians, useManualAssign } from '../../hooks/useScheduling'
import { techOnProjectMessage, useRostersByDate, toDateKey } from '../projects/projectsApi'
import { useServiceAgreements, type Agreement } from '../../hooks/useAgreements'
import { useCreateThread, useSendThreadMessage } from '../../hooks/useComms'
import { useToast } from '../../contexts/ToastContext'
import type { Job, Technician } from '../../types/api'
import type { PlannerJobPin, OpportunityPin } from './PlannerMap'
import TechnicianModal from './TechnicianModal'
import AgreementDrawer from '../agreements/AgreementDrawer'
import ProjectsTodayBand from '../projects/ProjectsTodayBand'
import { formatMoney } from '../../lib/format'

const PlannerMap = lazy(() => import('./PlannerMap'))
const JobDetailModal = lazy(() => import('../jobs/JobDetailModal'))

// ── Working day ──────────────────────────────────────────────────────────────
const DAY_START_H = 8
const DAY_END_H = 17
const DAY_SPAN_MIN = (DAY_END_H - DAY_START_H) * 60
const DEFAULT_DURATION_MIN = 90
const TRAVEL_BUFFER_MIN = 30
const OPPORTUNITY_WINDOW_DAYS = 5

// ── Helpers ──────────────────────────────────────────────────────────────────
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

const fmtDay = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''

function dayLabel(d: Date): string {
  const today = startOfDay(new Date())
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return fmtDay(d)
}

function jobCoords(j: Job): { lat: number; lng: number } | null {
  const lat = j.serviceLatitude != null ? Number(j.serviceLatitude) : NaN
  const lng = j.serviceLongitude != null ? Number(j.serviceLongitude) : NaN
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const OPEN_STATUSES = new Set(['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'ON_HOLD'])

interface ProposedAssignment {
  job: Job
  tech: Technician
  start: Date
  end: Date
  distanceKm: number | null
}

/**
 * Nearest-neighbour day builder: each unassigned job goes to the closest
 * technician (by last known location, falling back to even spread), then each
 * technician's jobs are ordered as a greedy route with travel buffers.
 */
function buildDayPlan(date: Date, jobs: Job[], techs: Technician[]): ProposedAssignment[] {
  if (techs.length === 0) return []
  const buckets = new Map<string, Job[]>(techs.map(t => [t.id, []]))

  jobs.forEach((job, i) => {
    const coords = jobCoords(job)
    let chosen: Technician
    if (coords) {
      const withLoc = techs.filter(t => t.currentLocation)
      chosen = withLoc.length
        ? withLoc.reduce((best, t) =>
            haversineKm(coords, t.currentLocation!) < haversineKm(coords, best.currentLocation!) ? t : best)
        : techs[i % techs.length]
    } else {
      chosen = techs[i % techs.length]
    }
    buckets.get(chosen.id)!.push(job)
  })

  const proposals: ProposedAssignment[] = []
  for (const tech of techs) {
    const pool = [...(buckets.get(tech.id) ?? [])]
    if (pool.length === 0) continue

    // Greedy route: start from the tech's location, always visit nearest next
    const ordered: Job[] = []
    let cursor = tech.currentLocation ?? null
    while (pool.length) {
      let nextIdx = 0
      if (cursor) {
        let bestD = Infinity
        pool.forEach((j, idx) => {
          const c = jobCoords(j)
          const d = c ? haversineKm(cursor!, c) : Infinity
          if (d < bestD) { bestD = d; nextIdx = idx }
        })
      }
      const [job] = pool.splice(nextIdx, 1)
      ordered.push(job)
      cursor = jobCoords(job) ?? cursor
    }

    let clock = new Date(date)
    clock.setHours(DAY_START_H, 0, 0, 0)
    let prev: { lat: number; lng: number } | null = tech.currentLocation ?? null
    for (const job of ordered) {
      const durMin = job.estimatedDurationMins ?? DEFAULT_DURATION_MIN
      const coords = jobCoords(job)
      const distanceKm = prev && coords ? haversineKm(prev, coords) : null
      const start = new Date(clock)
      const end = new Date(start.getTime() + durMin * 60_000)
      proposals.push({ job, tech, start, end, distanceKm })
      clock = new Date(end.getTime() + TRAVEL_BUFFER_MIN * 60_000)
      prev = coords ?? prev
    }
  }
  return proposals
}

// ── Small pieces ─────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    ['var(--blue)', false, 'Assigned'],
    ['#9ca3af', true, 'Unassigned'],
    ['var(--green)', false, 'Agreement (assigned)'],
    ['var(--green)', true, 'Agreement (unassigned)'],
    ['var(--amber)', false, 'Opportunity (due soon nearby)'],
  ] as const
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--t3)' }}>
      {items.map(([c, hollow, l]) => (
        <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: hollow ? 'transparent' : c,
            border: hollow ? `2px solid ${c}` : 'none',
            boxSizing: 'border-box',
          }} /> {l}
        </span>
      ))}
    </div>
  )
}

function TimelineBar({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  return (
    <div style={{ position: 'relative', height: 26, background: 'var(--bg-card-2)', borderRadius: 6, overflow: 'hidden' }}>
      {[...Array(DAY_END_H - DAY_START_H)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${(i / (DAY_END_H - DAY_START_H)) * 100}%`,
          top: 0, bottom: 0, borderLeft: i === 0 ? 'none' : '1px solid var(--bd)', opacity: 0.5,
        }} />
      ))}
      {jobs.map(j => {
        if (!j.scheduledStart) return null
        const s = new Date(j.scheduledStart)
        const startMin = (s.getHours() - DAY_START_H) * 60 + s.getMinutes()
        const durMin = j.scheduledEnd
          ? (new Date(j.scheduledEnd).getTime() - s.getTime()) / 60_000
          : (j as any).estimatedDurationMins ?? DEFAULT_DURATION_MIN
        const left = Math.max(0, (startMin / DAY_SPAN_MIN) * 100)
        const width = Math.min(100 - left, (durMin / DAY_SPAN_MIN) * 100)
        if (width <= 0 || left >= 100) return null
        return (
          <button
            key={j.id}
            onClick={() => onSelect(j)}
            title={`${j.title} — ${fmtTime(j.scheduledStart)}`}
            style={{
              position: 'absolute', left: `${left}%`, width: `${Math.max(width, 3)}%`, top: 3, bottom: 3,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: j.isAgreementJob ? 'var(--green)' : 'var(--blue)',
              opacity: 0.9,
            }}
          />
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DayPlanner() {
  const [date, setDate] = useState(() => addDays(startOfDay(new Date()), 1))
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [viewJob, setViewJob] = useState<Job | null>(null)
  const [viewTech, setViewTech] = useState<Technician | null>(null)
  const [viewAgreementId, setViewAgreementId] = useState<string | null>(null)
  const [assignTech, setAssignTech] = useState('')
  const [assignTime, setAssignTime] = useState('08:00')
  const [outreachTarget, setOutreachTarget] = useState<Agreement | null>(null)
  const [outreachText, setOutreachText] = useState('')
  const [planPreview, setPlanPreview] = useState<ProposedAssignment[] | null>(null)
  const [applying, setApplying] = useState(false)

  const toast = useToast()
  const jobsQuery = useJobs({ limit: 200 })
  const techsQuery = useTechnicians()
  const agreementsQuery = useServiceAgreements({ status: 'ACTIVE', limit: 100 })
  const updateJob = useUpdateJobFields()
  const manualAssign = useManualAssign()

  // Project rosters for this day — rostered techs are reserved capacity
  const { data: dayRosters } = useRostersByDate(toDateKey(date))
  const rosteredBy = useMemo(() => {
    const m = new Map<string, string>() // tech userId -> project name
    for (const r of dayRosters ?? []) for (const uid of r.techUserIds) m.set(uid, r.name)
    return m
  }, [dayRosters])
  const createThread = useCreateThread()
  const sendMessage = useSendThreadMessage()

  const techs = techsQuery.data ?? []
  const dayStart = date
  const dayEnd = useMemo(() => { const e = new Date(date); e.setHours(23, 59, 59, 999); return e }, [date])

  const { dayJobs, unassigned, backlog, jobPins, opportunityPins, opportunities } = useMemo(() => {
    const all: Job[] = jobsQuery.data?.data ?? []
    const open = all.filter(j => OPEN_STATUSES.has(j.status))

    const isOnDay = (j: Job) =>
      !!j.scheduledStart &&
      new Date(j.scheduledStart) >= dayStart &&
      new Date(j.scheduledStart) <= dayEnd

    const dayJobs = open.filter(isOnDay)
    const unassigned = dayJobs.filter(j => !j.assignedToId)
    const backlog = open.filter(j => !j.scheduledStart)

    const jobPins: PlannerJobPin[] = dayJobs.flatMap(j => {
      const c = jobCoords(j)
      if (!c) return []
      const kind = j.isAgreementJob
        ? (j.assignedToId ? 'agreement-assigned' : 'agreement-unassigned')
        : (j.assignedToId ? 'assigned' : 'unassigned')
      return [{ job: j, ...c, kind }] as PlannerJobPin[]
    })

    // Opportunities: active agreements whose next visit lands within the
    // window right after the selected day — candidates to pull forward.
    const windowEnd = addDays(dayStart, OPPORTUNITY_WINDOW_DAYS)
    const agreements = agreementsQuery.data?.data ?? []
    const dayAgreementIds = new Set(dayJobs.map(j => j.agreementId).filter(Boolean))
    const opportunities = agreements.filter(a => {
      if (!a.nextServiceDate || dayAgreementIds.has(a.id)) return false
      const due = new Date(a.nextServiceDate)
      return due > dayEnd && due <= windowEnd
    })

    // Customers aren't geocoded — locate opportunities via the customer's most
    // recent job that has coordinates.
    const customerCoords = new Map<string, { lat: number; lng: number }>()
    for (const j of [...all].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime())) {
      const c = jobCoords(j)
      if (c && j.customerId) customerCoords.set(j.customerId, c)
    }
    const opportunityPins: OpportunityPin[] = opportunities.flatMap(a => {
      const c = customerCoords.get(a.customerId)
      if (!c) return []
      return [{
        agreement: a, ...c,
        dueInDays: Math.ceil((new Date(a.nextServiceDate!).getTime() - dayStart.getTime()) / 86_400_000),
      }]
    })

    return { dayJobs, unassigned, backlog, jobPins, opportunityPins, opportunities }
  }, [jobsQuery.data, agreementsQuery.data, dayStart, dayEnd])

  const techJobs = useMemo(() => {
    const m = new Map<string, Job[]>()
    for (const t of techs) m.set(t.userId, [])
    for (const j of dayJobs) {
      if (j.assignedToId && m.has(j.assignedToId)) m.get(j.assignedToId)!.push(j)
    }
    return m
  }, [dayJobs, techs])

  // Busy techs float to the top so the day's routes are visible without scrolling
  const sortedTechs = useMemo(() =>
    [...techs].sort((a, b) => {
      const diff = (techJobs.get(b.userId)?.length ?? 0) - (techJobs.get(a.userId)?.length ?? 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    }),
  [techs, techJobs])

  // ── Actions ────────────────────────────────────────────────────────────────
  // Assignment goes through the scheduling service (dispatch assignment record,
  // WS broadcast, tech push notification, job sync) — the same path the
  // Dispatch board uses — then the job's schedule times are patched.
  const assignJob = async (job: Job, tech: Technician, start: Date, end: Date) => {
    const coords = jobCoords(job)
    await manualAssign.mutateAsync({
      jobId: job.id,
      technicianId: tech.id,
      jobLatitude: coords?.lat ?? 0,
      jobLongitude: coords?.lng ?? 0,
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      notes: 'Assigned via Day Planner',
    })
    await updateJob.mutateAsync({
      id: job.id,
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
    } as any)
  }

  const assignSelected = async () => {
    if (!selectedJob || !assignTech) return
    const tech = techs.find(t => t.id === assignTech)
    if (!tech) return
    const [h, m] = assignTime.split(':').map(Number)
    const start = new Date(date); start.setHours(h, m, 0, 0)
    const durMin = selectedJob.estimatedDurationMins ?? DEFAULT_DURATION_MIN
    const end = new Date(start.getTime() + durMin * 60_000)
    try {
      await assignJob(selectedJob, tech, start, end)
      toast.showSuccess(`Assigned to ${tech.name} at ${assignTime}`)
      setSelectedJob(null)
    } catch (e: any) {
      toast.showError(techOnProjectMessage(e, tech.name) ?? e?.response?.data?.message ?? e?.response?.data?.error ?? 'Could not assign')
    }
  }

  const applyPlan = async () => {
    if (!planPreview) return
    setApplying(true)
    let ok = 0, failed = 0
    for (const p of planPreview) {
      try {
        await assignJob(p.job, p.tech, p.start, p.end)
        ok += 1
      } catch { failed += 1 }
    }
    setApplying(false)
    setPlanPreview(null)
    if (failed) toast.showError(`${ok} assigned, ${failed} failed — check and retry`)
    else toast.showSuccess(`${ok} job${ok === 1 ? '' : 's'} scheduled`)
  }

  const openOutreach = (a: Agreement) => {
    const first = a.customer?.firstName ?? 'there'
    const svc = a.serviceType ?? 'service visit'
    setOutreachText(
      `Hi ${first}, our team will be working in your area on ${fmtDay(date)}. ` +
      `We could fit in your ${svc} that day instead of ${a.nextServiceDate ? new Date(a.nextServiceDate).toLocaleDateString() : 'the scheduled date'} — ` +
      `would that work for you? Reply YES and we'll lock it in, or keep your current date, no problem.`,
    )
    setOutreachTarget(a)
  }

  const sendOutreach = async () => {
    const a = outreachTarget
    if (!a?.customer) return
    try {
      const thread = await createThread.mutateAsync({
        customerId: a.customerId,
        customerName: `${a.customer.firstName} ${a.customer.lastName}`.trim(),
        customerEmail: a.customer.email ?? undefined,
        customerPhone: a.customer.phone ?? undefined,
        subject: `Service date offer — ${fmtDay(date)}`,
      })
      await sendMessage.mutateAsync({
        threadId: thread.id,
        body: outreachText,
        notifyEmail: true,
        emailSubject: `Service date offer — ${fmtDay(date)}`,
      })
      toast.showSuccess('Message sent — watch Communications for their reply')
      setOutreachTarget(null)
    } catch (e: any) {
      toast.showError(e?.response?.data?.message ?? 'Could not send the message')
    }
  }

  const loading = jobsQuery.isLoading || techsQuery.isLoading

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          {/* On-canvas header: the page canvas is dark navy in every theme, so this
              text must always be light (var(--t1) is near-black in light theme). */}
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Route size={20} style={{ color: 'var(--blue)' }} /> Day Planner
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            Build efficient routes — see the whole day on the map and fill it geographically
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setDate(d => addDays(d, -1))} aria-label="Previous day"><ChevronLeft size={14} /></button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)',
            fontSize: 13, fontWeight: 600, color: 'var(--t1)', minWidth: 170, justifyContent: 'center',
          }}>
            <CalendarDays size={14} style={{ color: 'var(--blue)' }} />
            {dayLabel(date)}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setDate(d => addDays(d, 1))} aria-label="Next day"><ChevronRight size={14} /></button>
          <button
            className="btn btn-primary btn-sm"
            disabled={unassigned.length === 0 || techs.length === 0}
            onClick={() => setPlanPreview(buildDayPlan(date, unassigned, techs))}
            title={unassigned.length === 0 ? 'No unassigned jobs on this day' : 'Propose assignments for all unassigned jobs'}
          >
            <Sparkles size={13} /> Auto-schedule day
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--t2)' }}>
          <strong style={{ color: 'var(--t1)' }}>{dayJobs.length}</strong> jobs this day ·{' '}
          <strong style={{ color: unassigned.length ? 'var(--amber)' : 'var(--green)' }}>{unassigned.length}</strong> unassigned ·{' '}
          <strong style={{ color: 'var(--t1)' }}>{opportunities.length}</strong> pull-forward opportunit{opportunities.length === 1 ? 'y' : 'ies'} ·{' '}
          <strong style={{ color: 'var(--t1)' }}>{backlog.length}</strong> undated backlog
        </span>
        <Legend />
      </div>

      {/* Projects running this day — crews are reserved capacity */}
      <ProjectsTodayBand date={date} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 14, alignItems: 'start' }}>
        {/* Map */}
        <div className="card" style={{ padding: 0, height: 560, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : (
            <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} /></div>}>
              <PlannerMap
                jobPins={jobPins}
                opportunityPins={opportunityPins}
                technicians={techs}
                onSelectJob={j => { setSelectedJob(j); setAssignTech(''); }}
                onViewJob={setViewJob}
                onSelectOpportunity={openOutreach}
                onViewOpportunity={a => setViewAgreementId(a.id)}
                onSelectTech={setViewTech}
              />
            </Suspense>
          )}
        </div>

        {/* Right rail — technicians only, full map height */}
        <div className="card" style={{ padding: 14, height: 560, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', flexShrink: 0 }}>
            Technicians — {DAY_START_H}:00 to {DAY_END_H}:00
          </p>
          {techs.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--t4)' }}>No technicians registered.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
              {sortedTechs.map(t => {
                const jobs = techJobs.get(t.userId) ?? []
                const onProject = rosteredBy.get(t.userId)
                return (
                  <div key={t.id} style={{ flexShrink: 0, opacity: onProject ? 0.55 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <button
                        onClick={() => setViewTech(t)}
                        title={`View ${t.name}'s day`}
                        style={{
                          fontWeight: 600, color: jobs.length ? 'var(--t1)' : 'var(--t3)',
                          display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                          border: 'none', padding: 0, cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        <UserIcon size={11} style={{ color: 'var(--t3)' }} /> <span style={{ textDecoration: 'underline', textDecorationColor: 'transparent' }} className="hover-underline">{t.name}</span>
                      </button>
                      {onProject ? (
                        <span title={`Reserved by ${onProject} — manage on the project's roster`} style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 99,
                          background: 'var(--violet-dim)', color: 'var(--violet)', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                        }}>
                          On {onProject}
                        </span>
                      ) : (
                        <span style={{ color: jobs.length ? 'var(--t2)' : 'var(--t4)' }}>{jobs.length} job{jobs.length === 1 ? '' : 's'}</span>
                      )}
                    </div>
                    <TimelineBar jobs={jobs} onSelect={setViewJob} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Work queues — the two lists dispatchers act on, side by side with room to breathe */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14, alignItems: 'stretch' }}>
        {/* Unassigned */}
        <div className="card" style={{ padding: 16, minHeight: 300, maxHeight: 440, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Unassigned this day
            </p>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
              background: unassigned.length ? 'color-mix(in srgb, var(--amber) 18%, transparent)' : 'color-mix(in srgb, var(--green) 18%, transparent)',
              color: unassigned.length ? 'var(--amber)' : 'var(--green)',
            }}>
              {unassigned.length}
            </span>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {unassigned.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <CheckCircle2 size={14} /> Everything is assigned for this day
              </p>
            ) : unassigned.map(j => (
              <div
                key={j.id}
                onClick={() => setViewJob(j)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') setViewJob(j) }}
                style={{
                  display: 'flex', width: '100%', textAlign: 'left', marginBottom: 10,
                  padding: '12px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
                  justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                    {j.title}
                    {j.isAgreementJob && (
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'color-mix(in srgb, var(--green) 18%, transparent)', color: 'var(--green)', verticalAlign: 'middle' }}>
                        AGREEMENT
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    {j.customerName && <span>{j.customerName} · </span>}
                    <MapPin size={11} /> {j.serviceAddress ?? '—'}
                    {j.scheduledStart && <> · <Clock size={11} /> {fmtTime(j.scheduledStart)}</>}
                  </p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); setSelectedJob(j); setAssignTech('') }}
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div className="card" style={{ padding: 16, minHeight: 300, maxHeight: 440, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Pull-forward opportunities
            </p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)' }}>
              {opportunities.length}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '0 0 12px', flexShrink: 0 }}>
            Agreement visits due within {OPPORTUNITY_WINDOW_DAYS} days after this date — offer the customer this day and fill the route while a tech is nearby.
          </p>
          <div style={{ overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {opportunities.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>
                Nothing due soon after this date. Try another day, or check the Agreements page for upcoming visits.
              </p>
            ) : opportunities.map(a => {
              const dueIn = a.nextServiceDate
                ? Math.max(0, Math.ceil((new Date(a.nextServiceDate).getTime() - date.getTime()) / 86_400_000))
                : null
              return (
                <div
                  key={a.id}
                  onClick={() => setViewAgreementId(a.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') setViewAgreementId(a.id) }}
                  style={{
                    marginBottom: 10, padding: '14px 16px', borderRadius: 'var(--r-md)',
                    border: '1px solid color-mix(in srgb, var(--amber) 45%, var(--bd))',
                    background: 'color-mix(in srgb, var(--amber) 6%, var(--bg-card-2))',
                    cursor: 'pointer',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                        {a.customer?.firstName} {a.customer?.lastName}
                      </p>
                      <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '3px 0 0' }}>
                        {a.serviceType ?? a.name}
                        {a.billingAmount != null && <span style={{ color: 'var(--t3)' }}> · {formatMoney(a.billingAmount, { decimals: 0 })}/cycle</span>}
                      </p>
                      {(a.customer?.address || a.customer?.city) && (
                        <p style={{ fontSize: 12, color: 'var(--t3)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {[a.customer?.address, a.customer?.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {dueIn != null && (
                      <span style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                        background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)', whiteSpace: 'nowrap',
                      }}>
                        due in {dueIn} day{dueIn === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); openOutreach(a) }}
                  >
                    <Send size={12} /> Offer {dayLabel(date).toLowerCase()} to {a.customer?.firstName ?? 'customer'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Job detail (system-wide JobDetailModal) ── */}
      {viewJob && (
        <Suspense fallback={null}>
          <JobDetailModal isOpen={!!viewJob} onClose={() => setViewJob(null)} job={viewJob} />
        </Suspense>
      )}

      {/* ── Technician detail ── */}
      {viewTech && (
        <TechnicianModal
          tech={viewTech}
          jobs={techJobs.get(viewTech.userId) ?? []}
          dayLabel={dayLabel(date)}
          onClose={() => setViewTech(null)}
          onSelectJob={j => { setViewTech(null); setViewJob(j) }}
        />
      )}

      {/* ── Agreement detail — centered modal, consistent with JobDetailModal ── */}
      {viewAgreementId && (
        <AgreementDrawer id={viewAgreementId} variant="modal" onClose={() => setViewAgreementId(null)} />
      )}

      {/* ── Assign modal ── */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedJob(null)}>
          <div className="card anim-fade-up" style={{ width: 440, maxWidth: '92vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title">{selectedJob.title}</div>
                <div className="card-subtitle">{selectedJob.customerName} · {selectedJob.serviceAddress}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedJob(null)} aria-label="Close"><X size={14} /></button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedJob.assignedToName && (
                <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
                  Currently: <strong>{selectedJob.assignedToName}</strong>{selectedJob.scheduledStart ? ` at ${fmtTime(selectedJob.scheduledStart)}` : ''}
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Technician</label>
                <select className="form-input" value={assignTech} onChange={e => setAssignTech(e.target.value)}>
                  <option value="">Pick a technician…</option>
                  {techs.map(t => {
                    const onProject = rosteredBy.get(t.userId)
                    return (
                      <option key={t.id} value={t.id} disabled={!!onProject}>
                        {t.name}{onProject ? ` — on ${onProject}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label className="form-label">Start time</label>
                <input type="time" className="form-input" value={assignTime} onChange={e => setAssignTime(e.target.value)} min="06:00" max="18:00" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedJob(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={assignSelected} disabled={!assignTech || manualAssign.isPending || updateJob.isPending}>
                {(manualAssign.isPending || updateJob.isPending) ? <><Loader2 size={12} className="spin" /> Assigning…</> : 'Assign for this day'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-schedule preview ── */}
      {planPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => !applying && setPlanPreview(null)}>
          <div className="card anim-fade-up" style={{ width: 560, maxWidth: '95vw', maxHeight: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title">Proposed schedule — {dayLabel(date)}</div>
                <div className="card-subtitle">Nearest technician first, routes ordered by proximity. Nothing is saved until you apply.</div>
              </div>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              {planPreview.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> Nothing to schedule — no unassigned jobs with locations.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                      {['Job', 'Technician', 'Time', 'Leg'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planPreview.map(p => (
                      <tr key={p.job.id} style={{ borderBottom: '1px solid var(--bd)' }}>
                        <td style={{ padding: '8px' }}>
                          <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{p.job.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>{p.job.serviceAddress}</p>
                        </td>
                        <td style={{ padding: '8px', color: 'var(--t2)' }}>{p.tech.name}</td>
                        <td style={{ padding: '8px', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                          {p.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--t3)' }}>{p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPlanPreview(null)} disabled={applying}>Discard</button>
              <button className="btn btn-primary btn-sm" onClick={applyPlan} disabled={applying || planPreview.length === 0}>
                {applying ? <><Loader2 size={12} className="spin" /> Applying…</> : <>Apply {planPreview.length} assignment{planPreview.length === 1 ? '' : 's'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Outreach modal ── */}
      {outreachTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setOutreachTarget(null)}>
          <div className="card anim-fade-up" style={{ width: 620, maxWidth: '95vw', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ fontSize: 16 }}>
                  Offer {dayLabel(date).toLowerCase()} to {outreachTarget.customer?.firstName} {outreachTarget.customer?.lastName}
                </div>
                <div className="card-subtitle" style={{ fontSize: 13 }}>
                  {outreachTarget.serviceType ?? 'Service visit'} · due {outreachTarget.nextServiceDate ? new Date(outreachTarget.nextServiceDate).toLocaleDateString() : 'soon'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setOutreachTarget(null)} aria-label="Close"><X size={14} /></button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              {(outreachTarget.customer?.email || outreachTarget.customer?.phone) && (
                <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 10px' }}>
                  Goes to: {[outreachTarget.customer?.email, outreachTarget.customer?.phone].filter(Boolean).join(' · ')}
                </p>
              )}
              <label className="form-label" style={{ fontSize: 12 }}>Message</label>
              <textarea
                className="form-input"
                rows={9}
                style={{ resize: 'vertical', width: '100%', fontSize: 13.5, lineHeight: 1.65, padding: '12px 14px', minHeight: 180 }}
                value={outreachText}
                onChange={e => setOutreachText(e.target.value)}
              />
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: '8px 0 0' }}>
                Edit freely before sending — the reply lands in Communications.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
              <button className="btn btn-secondary" onClick={() => setOutreachTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendOutreach} disabled={createThread.isPending || sendMessage.isPending || !outreachText.trim()}>
                {(createThread.isPending || sendMessage.isPending) ? <><Loader2 size={13} className="spin" /> Sending…</> : <><Send size={13} /> Send offer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
