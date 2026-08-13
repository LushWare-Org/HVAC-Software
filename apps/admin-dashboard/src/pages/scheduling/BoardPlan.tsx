/**
 * BoardPlan — "Plan a day" cockpit: adapted from DayPlanner.tsx's body
 * (map + per-tech route rail + unassigned/opportunities queues + auto-schedule
 * + outreach). The date stepper itself now lives in the parent scope bar, so
 * this component receives `date` as a prop instead of owning it. Same data
 * sources and mutations as the original Day Planner — nothing reimplemented.
 */
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import TechAvatar, { TechChip } from '../../components/TechAvatar'
import {
  Loader2, MapPin, Send, X, Clock, AlertCircle, CheckCircle2, Maximize2, Minimize2,
} from 'lucide-react'
import { useJobs, useUpdateJobFields } from '../../hooks/useJobs'
import { useTechnicians, useManualAssign } from '../../hooks/useScheduling'
import { techOnProjectMessage, useRostersByDate, toDateKey } from '../projects/projectsApi'
import { useServiceAgreements, type Agreement } from '../../hooks/useAgreements'
import { useCreateThread, useSendThreadMessage } from '../../hooks/useComms'
import { useToast } from '../../contexts/ToastContext'
import type { Job, Technician } from '../../types/api'
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import type { PlannerJobPin, OpportunityPin } from '../planner/PlannerMap'
import TechnicianModal from '../planner/TechnicianModal'
import AgreementDrawer from '../agreements/AgreementDrawer'
import ProjectsTodayBand from '../projects/ProjectsTodayBand'
import { formatMoney } from '../../lib/format'
import {
  buildDayPlan, jobCoords,
  DAY_START_H, DAY_END_H, DEFAULT_DURATION_MIN,
  type ProposedAssignment,
} from '../../lib/dayPlan'

const PlannerMap = lazy(() => import('../planner/PlannerMap'))
const JobDetailModal = lazy(() => import('../jobs/JobDetailModal'))

const DAY_SPAN_MIN = (DAY_END_H - DAY_START_H) * 60
const OPPORTUNITY_WINDOW_DAYS = 5

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''

function dayLabel(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dd = new Date(d); dd.setHours(0, 0, 0, 0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return fmtDay(d)
}

const OPEN_STATUSES = new Set(['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'ON_HOLD'])

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
    <div style={{ position: 'relative', height: 24, background: 'var(--bg-card-2)', borderRadius: 6, overflow: 'hidden' }}>
      {[...Array(DAY_END_H - DAY_START_H)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(i / (DAY_END_H - DAY_START_H)) * 100}%`, top: 0, bottom: 0, borderLeft: i === 0 ? 'none' : '1px solid var(--bd)', opacity: 0.5 }} />
      ))}
      {jobs.map(j => {
        if (!j.scheduledStart) return null
        const s = new Date(j.scheduledStart)
        const startMin = (s.getHours() - DAY_START_H) * 60 + s.getMinutes()
        const durMin = j.scheduledEnd ? (new Date(j.scheduledEnd).getTime() - s.getTime()) / 60_000 : (j as any).estimatedDurationMins ?? DEFAULT_DURATION_MIN
        const left = Math.max(0, (startMin / DAY_SPAN_MIN) * 100)
        const width = Math.min(100 - left, (durMin / DAY_SPAN_MIN) * 100)
        if (width <= 0 || left >= 100) return null
        return (
          <button key={j.id} onClick={() => onSelect(j)} title={`${j.title} — ${fmtTime(j.scheduledStart)}`}
            style={{ position: 'absolute', left: `${left}%`, width: `${Math.max(width, 3)}%`, top: 3, bottom: 3, borderRadius: 4, border: 'none', cursor: 'pointer', background: j.isAgreementJob ? 'var(--green)' : 'var(--blue)', opacity: 0.9 }} />
        )
      })}
    </div>
  )
}

export interface PlanStats { jobs: number; unassigned: number; opportunities: number; backlog: number }

export default function BoardPlan({
  date, onStatsChange, autoScheduleRequestId,
}: {
  date: Date
  onStatsChange: (stats: PlanStats) => void
  autoScheduleRequestId: number
}) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [viewJob, setViewJob] = useState<Job | null>(null)
  const [viewTech, setViewTech] = useState<Technician | null>(null)
  const [viewAgreementId, setViewAgreementId] = useState<string | null>(null)
  const [assignTech, setAssignTech] = useState('')
  const [assignTime, setAssignTime] = useState('08:00')
  const [outreachTarget, setOutreachTarget] = useState<Agreement | null>(null)
  const [outreachText, setOutreachText] = useState('')
  const [planPreview, setPlanPreview] = useState<ProposedAssignment[] | null>(null)
  const [previewEdits, setPreviewEdits] = useState<Record<string, { techId: string; time: string }>>({})
  const [applying, setApplying] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)

  // Leaflet only recalculates its tile layout on a real `window resize`
  // event — toggling mapExpanded resizes the container via CSS, which
  // Leaflet has no way to notice on its own (PlannerMap is reused as-is, no
  // invalidateSize() hook exposed). Firing a synthetic resize during and
  // after the 0.2s CSS transition covers both the mid-transition and final
  // container size, fixing tiles that otherwise never load past the map's
  // original bounds.
  const toggleMapExpanded = () => {
    setMapExpanded(e => !e)
    window.dispatchEvent(new Event('resize'))
    setTimeout(() => window.dispatchEvent(new Event('resize')), 220)
  }

  const toast = useToast()
  const jobsQuery = useJobs({ limit: 200 })
  const techsQuery = useTechnicians()
  const agreementsQuery = useServiceAgreements({ status: 'ACTIVE', limit: 100 })
  const updateJob = useUpdateJobFields()
  const manualAssign = useManualAssign()

  const { data: dayRosters } = useRostersByDate(toDateKey(date))
  const rosteredBy = useMemo(() => {
    const m = new Map<string, string>()
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
    const isOnDay = (j: Job) => !!j.scheduledStart && new Date(j.scheduledStart) >= dayStart && new Date(j.scheduledStart) <= dayEnd
    const dayJobs = open.filter(isOnDay)
    const unassigned = dayJobs.filter(j => !j.assignedToId)
    const backlog = open.filter(j => !j.scheduledStart)

    const jobPins: PlannerJobPin[] = dayJobs.flatMap(j => {
      const c = jobCoords(j)
      if (!c) return []
      const kind = j.isAgreementJob ? (j.assignedToId ? 'agreement-assigned' : 'agreement-unassigned') : (j.assignedToId ? 'assigned' : 'unassigned')
      return [{ job: j, ...c, kind }] as PlannerJobPin[]
    })

    const windowEnd = addDays(dayStart, OPPORTUNITY_WINDOW_DAYS)
    const agreements = agreementsQuery.data?.data ?? []
    const dayAgreementIds = new Set(dayJobs.map(j => j.agreementId).filter(Boolean))
    const opportunities = agreements.filter(a => {
      if (!a.nextServiceDate || dayAgreementIds.has(a.id)) return false
      const due = new Date(a.nextServiceDate)
      return due > dayEnd && due <= windowEnd
    })

    const customerCoords = new Map<string, { lat: number; lng: number }>()
    for (const j of [...all].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime())) {
      const c = jobCoords(j)
      if (c && j.customerId) customerCoords.set(j.customerId, c)
    }
    const opportunityPins: OpportunityPin[] = opportunities.flatMap(a => {
      const c = customerCoords.get(a.customerId)
      if (!c) return []
      return [{ agreement: a, ...c, dueInDays: Math.ceil((new Date(a.nextServiceDate!).getTime() - dayStart.getTime()) / 86_400_000) }]
    })

    return { dayJobs, unassigned, backlog, jobPins, opportunityPins, opportunities }
  }, [jobsQuery.data, agreementsQuery.data, dayStart, dayEnd])

  useEffect(() => {
    onStatsChange({ jobs: dayJobs.length, unassigned: unassigned.length, opportunities: opportunities.length, backlog: backlog.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayJobs.length, unassigned.length, opportunities.length, backlog.length])

  // "Auto-schedule day" lives in the page's tabs row (outside this
  // component), so it signals this component via an incrementing id prop.
  // Track the last id this mounted instance has already acted on, seeded
  // from whatever the id already was at mount time — without this, toggling
  // the scope switch back to "Plan a day" remounts BoardPlan, and a naive
  // `if (id > 0)` effect would re-fire using the stale id from a previous
  // click, popping the preview open just from switching scope.
  const lastAppliedAutoScheduleId = useRef(autoScheduleRequestId)
  useEffect(() => {
    if (autoScheduleRequestId !== lastAppliedAutoScheduleId.current) {
      lastAppliedAutoScheduleId.current = autoScheduleRequestId
      const plan = buildDayPlan(date, unassigned, techs)
      setPlanPreview(plan)
      // Seed edits from the optimal computed plan — the default shown is
      // always the algorithm's best guess; editing a row only overrides it.
      setPreviewEdits(Object.fromEntries(plan.map(p => [
        p.job.id,
        { techId: p.tech.id, time: `${String(p.start.getHours()).padStart(2, '0')}:${String(p.start.getMinutes()).padStart(2, '0')}` },
      ])))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScheduleRequestId])

  const techJobs = useMemo(() => {
    const m = new Map<string, Job[]>()
    for (const t of techs) m.set(t.userId, [])
    for (const j of dayJobs) if (j.assignedToId && m.has(j.assignedToId)) m.get(j.assignedToId)!.push(j)
    return m
  }, [dayJobs, techs])

  const sortedTechs = useMemo(() => [...techs].sort((a, b) => {
    const diff = (techJobs.get(b.userId)?.length ?? 0) - (techJobs.get(a.userId)?.length ?? 0)
    return diff !== 0 ? diff : a.name.localeCompare(b.name)
  }), [techs, techJobs])

  const assignJob = async (job: Job, tech: Technician, start: Date, end: Date) => {
    const coords = jobCoords(job)
    await manualAssign.mutateAsync({
      jobId: job.id, technicianId: tech.id,
      jobLatitude: coords?.lat ?? 0, jobLongitude: coords?.lng ?? 0,
      scheduledStart: start.toISOString(), scheduledEnd: end.toISOString(),
      notes: 'Assigned via Scheduling — Plan a day',
    })
    await updateJob.mutateAsync({ id: job.id, scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() } as any)
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
      const edit = previewEdits[p.job.id]
      const tech = (edit ? techs.find(t => t.id === edit.techId) : null) ?? p.tech
      let start = p.start, end = p.end
      if (edit?.time) {
        const [h, m] = edit.time.split(':').map(Number)
        if (Number.isFinite(h) && Number.isFinite(m)) {
          start = new Date(date); start.setHours(h, m, 0, 0)
          const durMin = p.job.estimatedDurationMins ?? DEFAULT_DURATION_MIN
          end = new Date(start.getTime() + durMin * 60_000)
        }
      }
      try { await assignJob(p.job, tech, start, end); ok += 1 } catch { failed += 1 }
    }
    setApplying(false)
    setPlanPreview(null)
    setPreviewEdits({})
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
      await sendMessage.mutateAsync({ threadId: thread.id, body: outreachText, notifyEmail: true, emailSubject: `Service date offer — ${fmtDay(date)}` })
      toast.showSuccess('Message sent — watch Communications for their reply')
      setOutreachTarget(null)
    } catch (e: any) {
      toast.showError(e?.response?.data?.message ?? 'Could not send the message')
    }
  }

  const loading = jobsQuery.isLoading || techsQuery.isLoading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ProjectsTodayBand date={date} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <Legend />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mapExpanded ? '1fr' : 'minmax(0, 1fr) 360px', gap: 14, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, height: mapExpanded ? '82vh' : 460, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'height 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 10px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
            <button
              onClick={toggleMapExpanded}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 600, color: 'var(--t2)', cursor: 'pointer',
              }}
            >
              {mapExpanded ? <><Minimize2 size={13} /> Exit full view</> : <><Maximize2 size={13} /> Full view</>}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
                  onSelectJob={j => { setSelectedJob(j); setAssignTech('') }}
                  onViewJob={setViewJob}
                  onSelectOpportunity={openOutreach}
                  onViewOpportunity={a => setViewAgreementId(a.id)}
                  onSelectTech={setViewTech}
                />
              </Suspense>
            )}
          </div>
        </div>

        {!mapExpanded && (
          <div className="card" style={{ padding: 14, height: 460, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', flexShrink: 0 }}>
              Routes · {DAY_START_H}:00–{DAY_END_H}:00
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
                        <button onClick={() => setViewTech(t)} title={`View ${t.name}'s day`} style={{ fontWeight: 600, color: jobs.length ? 'var(--t1)' : 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12 }}>
                          <TechAvatar id={t.id} name={t.name} avatarUrl={t.avatarUrl} size={20} /> {t.name}
                        </button>
                        {onProject ? (
                          <span title={`Reserved by ${onProject}`} style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 99, background: 'var(--violet-dim)', color: 'var(--violet)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
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
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 16, minHeight: 260, maxHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Unassigned this day</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: unassigned.length ? 'color-mix(in srgb, var(--amber) 18%, transparent)' : 'color-mix(in srgb, var(--green) 18%, transparent)', color: unassigned.length ? 'var(--amber)' : 'var(--green)' }}>
              {unassigned.length}
            </span>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {unassigned.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <CheckCircle2 size={14} /> Everything is assigned for this day
              </p>
            ) : unassigned.map(j => (
              <div key={j.id} onClick={() => setViewJob(j)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setViewJob(j) }}
                style={{ display: 'flex', width: '100%', textAlign: 'left', marginBottom: 10, padding: '12px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer', border: '1px solid var(--bd)', background: 'var(--bg-card-2)', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                    {j.title}
                    {j.isAgreementJob && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'color-mix(in srgb, var(--green) 18%, transparent)', color: 'var(--green)', verticalAlign: 'middle' }}>AGREEMENT</span>}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    {j.customerName && <span>{j.customerName} · </span>}
                    <MapPin size={11} /> {j.serviceAddress ?? '—'}
                    {j.scheduledStart && <> · <Clock size={11} /> {fmtTime(j.scheduledStart)}</>}
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); setSelectedJob(j); setAssignTech('') }}>Assign</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16, minHeight: 260, maxHeight: 360, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Pull-forward opportunities</p>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)' }}>{opportunities.length}</span>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            {opportunities.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>Nothing due soon after this date.</p>
            ) : opportunities.map(a => {
              const dueIn = a.nextServiceDate ? Math.max(0, Math.ceil((new Date(a.nextServiceDate).getTime() - date.getTime()) / 86_400_000)) : null
              return (
                <div key={a.id} onClick={() => setViewAgreementId(a.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setViewAgreementId(a.id) }}
                  style={{ marginBottom: 10, padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid color-mix(in srgb, var(--amber) 45%, var(--bd))', background: 'color-mix(in srgb, var(--amber) 6%, var(--bg-card-2))', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{a.customer?.firstName} {a.customer?.lastName}</p>
                      <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '3px 0 0' }}>
                        {a.serviceType ?? a.name}{a.billingAmount != null && <span style={{ color: 'var(--t3)' }}> · {formatMoney(a.billingAmount, { decimals: 0 })}/cycle</span>}
                      </p>
                    </div>
                    {dueIn != null && (
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)', whiteSpace: 'nowrap' }}>
                        due in {dueIn} day{dueIn === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); openOutreach(a) }}>
                    <Send size={12} /> Offer {dayLabel(date).toLowerCase()} to {a.customer?.firstName ?? 'customer'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {viewJob && <Suspense fallback={null}><JobDetailModal isOpen={!!viewJob} onClose={() => setViewJob(null)} job={viewJob} /></Suspense>}
      {viewTech && (
        <TechnicianModal tech={viewTech} jobs={techJobs.get(viewTech.userId) ?? []} dayLabel={dayLabel(date)} onClose={() => setViewTech(null)} onSelectJob={j => { setViewTech(null); setViewJob(j) }} />
      )}
      {viewAgreementId && <AgreementDrawer id={viewAgreementId} variant="modal" onClose={() => setViewAgreementId(null)} />}

      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedJob(null)}>
          <div className="card anim-fade-up" style={{ width: 620, maxWidth: '92vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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
                  Currently: <TechChip id={selectedJob.assignedToId} name={selectedJob.assignedToName} size={20} />
                  {selectedJob.scheduledStart ? ` at ${fmtTime(selectedJob.scheduledStart)}` : ''}
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Technician</label>
                <select className="form-input" value={assignTech} onChange={e => setAssignTech(e.target.value)}>
                  <option value="">Pick a technician…</option>
                  {techs.map(t => {
                    const onProject = rosteredBy.get(t.userId)
                    return <option key={t.id} value={t.id} disabled={!!onProject}>{t.name}{onProject ? ` — on ${onProject}` : ''}</option>
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

      {planPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }} onClick={() => !applying && setPlanPreview(null)}>
          <div className="card anim-fade-up" style={{ width: 980, maxWidth: '96vw', maxHeight: '88vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title">Proposed schedule — {dayLabel(date)}</div>
                <div className="card-subtitle">Customer-requested times are kept as-is; jobs with no requested time fill the gaps around them (nearest technician, routes ordered by proximity). Adjust any row before applying — nothing is saved until you apply.</div>
              </div>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', padding: 0 }}>
              {planPreview.some(p => p.requestedTimeConflict) && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, margin: '14px 16px 0',
                  padding: '11px 13px', borderRadius: 10,
                  background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.28)',
                }}>
                  <AlertCircle size={14} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)' }}>
                    <b>{planPreview.filter(p => p.requestedTimeConflict).length}</b>{' '}
                    job{planPreview.filter(p => p.requestedTimeConflict).length === 1 ? '' : 's'} could not
                    keep the time the customer asked for — every technician was already booked. Those rows are
                    marked below. Consider rescheduling them with the customer rather than moving them silently.
                  </p>
                </div>
              )}
              {planPreview.length === 0 ? (
                <div style={{ padding: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><AlertCircle size={14} /> Nothing to schedule — no unassigned jobs with locations.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
                      {['Job', 'Technician', 'Time', 'Est. leg'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {planPreview.map(p => {
                      const edit = previewEdits[p.job.id] ?? { techId: p.tech.id, time: `${String(p.start.getHours()).padStart(2, '0')}:${String(p.start.getMinutes()).padStart(2, '0')}` }
                      const changed = edit.techId !== p.tech.id
                      return (
                        <tr key={p.job.id} style={{ borderBottom: '1px solid var(--bd)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {p.job.title}
                              <RescheduleBadge state={p.job.rescheduleState} size="sm" />
                            </p>
                            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '2px 0 0' }}>{p.job.customerName ?? ''} {p.job.serviceAddress ? `· ${p.job.serviceAddress}` : ''}</p>
                          </td>
                          <td style={{ padding: '12px 16px', minWidth: 220 }}>
                            <select
                              className="form-input"
                              style={{ fontSize: 12.5, padding: '7px 10px', height: 36, borderColor: changed ? 'var(--blue)' : undefined }}
                              value={edit.techId}
                              onChange={e => setPreviewEdits(prev => ({ ...prev, [p.job.id]: { ...edit, techId: e.target.value } }))}
                            >
                              {techs.map(t => {
                                const onProject = rosteredBy.get(t.userId)
                                return <option key={t.id} value={t.id} disabled={!!onProject}>{t.name}{onProject ? ` — on ${onProject}` : ''}</option>
                              })}
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', minWidth: 150 }}>
                            <input
                              type="time"
                              className="form-input"
                              style={{
                                fontSize: 12.5, padding: '7px 10px', height: 36,
                                borderColor: p.requestedTimeConflict ? 'var(--amber)' : undefined,
                              }}
                              value={edit.time}
                              onChange={e => setPreviewEdits(prev => ({ ...prev, [p.job.id]: { ...edit, time: e.target.value } }))}
                            />
                            {p.honoursRequestedTime && (
                              <span title="This is the time the customer asked for" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4,
                                fontSize: 10, fontWeight: 700, color: '#047857',
                              }}>
                                <CheckCircle2 size={10} /> Customer's time
                              </span>
                            )}
                            {p.requestedTimeConflict && (
                              <span title={p.requestedTimeConflict.reason} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4,
                                fontSize: 10, fontWeight: 700, color: '#B45309',
                              }}>
                                <AlertCircle size={10} /> asked for {fmtTime(p.requestedTimeConflict.requested.toISOString())}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--t3)' }}>{p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setPlanPreview(null); setPreviewEdits({}) }} disabled={applying}>Discard</button>
              <button className="btn btn-primary btn-sm" onClick={applyPlan} disabled={applying || planPreview.length === 0}>
                {applying ? <><Loader2 size={12} className="spin" /> Applying…</> : <>Apply {planPreview.length} assignment{planPreview.length === 1 ? '' : 's'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {outreachTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setOutreachTarget(null)}>
          <div className="card anim-fade-up" style={{ width: 720, maxWidth: '95vw', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ fontSize: 16 }}>Offer {dayLabel(date).toLowerCase()} to {outreachTarget.customer?.firstName} {outreachTarget.customer?.lastName}</div>
                <div className="card-subtitle" style={{ fontSize: 13 }}>{outreachTarget.serviceType ?? 'Service visit'} · due {outreachTarget.nextServiceDate ? new Date(outreachTarget.nextServiceDate).toLocaleDateString() : 'soon'}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setOutreachTarget(null)} aria-label="Close"><X size={14} /></button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              {(outreachTarget.customer?.email || outreachTarget.customer?.phone) && (
                <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 10px' }}>Goes to: {[outreachTarget.customer?.email, outreachTarget.customer?.phone].filter(Boolean).join(' · ')}</p>
              )}
              <label className="form-label" style={{ fontSize: 12 }}>Message</label>
              <textarea className="form-input" rows={9} style={{ resize: 'vertical', width: '100%', fontSize: 13.5, lineHeight: 1.65, padding: '12px 14px', minHeight: 180 }} value={outreachText} onChange={e => setOutreachText(e.target.value)} />
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: '8px 0 0' }}>Edit freely before sending — the reply lands in Communications.</p>
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
