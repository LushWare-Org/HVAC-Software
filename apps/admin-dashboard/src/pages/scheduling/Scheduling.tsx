/**
 * Scheduling — unified Dispatch + Day Planner cockpit.
 *
 * Design: approved Claude Design mockup "Scheduling Unified Redesign"
 * (option 1 · Time-scope cockpit). A single scope switch — "See all jobs"
 * (live, = today's Dispatch experience) vs "Plan a day" (= Day Planner) —
 * morphs the primary action and the Board tab's content. Active/Completed/
 * Calendar live as tabs alongside Board, all in one page.
 *
 * This page reuses the real Dispatch/Planner business logic wholesale
 * (WebSocket live updates, smart-assign scoring, the day-plan route
 * optimizer, quote/invoice creation, technician CRUD) via the same hooks
 * and several of the same modal components DispatchBoard.tsx and
 * DayPlanner.tsx use — it does not reimplement any of that. DispatchBoard
 * and DayPlanner themselves are untouched and stay live at /dispatch and
 * /planner for side-by-side comparison until this page is verified to have
 * full parity.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays, Users, CheckCircle2, AlertCircle, X, LayoutGrid, Activity, Sparkles,
} from 'lucide-react'
import {
  useTechnicians, useSmartAssign, useManualAssign,
  useUpdateAssignmentStatus, useAllTechAssignments,
  useDispatchWebSocket, useTechnicianLoginMap,
} from '../../hooks/useScheduling'
import { useJobs, useUpdateJobStatus } from '../../hooks/useJobs'
import type { Job, Technician, AssignResponse, ScoredTechnician } from '../../types/api'
import AddTechnicianModal from '../../components/AddTechnicianModal'
import CreateJobModal from '../dispatch/CreateJobModal'
import JobDetailPanel from '../dispatch/JobDetailPanel'
import TechnicianDetailPanel from '../dispatch/TechnicianDetailPanel'
import AddQuoteModal from '../finance/AddQuoteModal'
import AddInvoiceModal from '../finance/AddInvoiceModal'
import DispatchCalendar from '../dispatch/DispatchCalendar'
import { techOnProjectMessage } from '../projects/projectsApi'

import BoardLive from './BoardLive'
import BoardPlan, { type PlanStats } from './BoardPlan'
import ActiveControlTower from './ActiveControlTower'
import CompletedLedger from './CompletedLedger'

type Scope = 'live' | 'plan'
type SubTab = 'board' | 'active' | 'completed' | 'calendar'

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function dayLabel(d: Date): string {
  const today = startOfDay(new Date())
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Scheduling() {
  const [searchParams] = useSearchParams()
  const [scope, setScope] = useState<Scope>('live')
  const [subTab, setSubTab] = useState<SubTab>(() => (searchParams.get('view') === 'calendar' ? 'calendar' : 'board'))
  const [planDate, setPlanDate] = useState(() => addDays(startOfDay(new Date()), 1))
  const [planStats, setPlanStats] = useState<PlanStats>({ jobs: 0, unassigned: 0, opportunities: 0, backlog: 0 })
  const [autoScheduleRequestId, setAutoScheduleRequestId] = useState(0)

  const [showAddTech, setShowAddTech] = useState(false)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [suggestions, setSuggestions] = useState<AssignResponse['suggestions'] | null>(null)
  const [pendingJobId, setPendingJobId] = useState<string | null>(null)
  const [pendingJobLat, setPendingJobLat] = useState(0)
  const [pendingJobLng, setPendingJobLng] = useState(0)
  const [noTechsWarning, setNoTechsWarning] = useState('')

  const ws = useDispatchWebSocket()

  // Header actions (Add Technician / Create Job) and the live-status pill now
  // live in the Topbar for this page — it triggers these via CustomEvents,
  // matching the app's existing cross-component event pattern.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scheduling-ws-status', { detail: ws.status }))
  }, [ws.status])

  useEffect(() => {
    const openCreateJob = () => setShowCreateJob(true)
    const openAddTech = () => setShowAddTech(true)
    window.addEventListener('scheduling-open-create-job', openCreateJob)
    window.addEventListener('scheduling-open-add-technician', openAddTech)
    return () => {
      window.removeEventListener('scheduling-open-create-job', openCreateJob)
      window.removeEventListener('scheduling-open-add-technician', openAddTech)
    }
  }, [])

  // The "See all jobs ↔ Plan a day" toggle and (in Plan mode) the date
  // stepper now live in the Topbar next to the page title. This page still
  // owns `scope`/`planDate`; it broadcasts the current state so the Topbar
  // can highlight the right button, show the date label, and know whether
  // to show either control at all (Board-tab only), and listens for the
  // Topbar's button clicks to actually change scope or step the date.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scheduling-nav-state', { detail: { scope, subTab, dateLabel: dayLabel(planDate) } }))
  }, [scope, subTab, planDate])

  useEffect(() => {
    const setScopeHandler = (e: Event) => setScope((e as CustomEvent).detail)
    const stepDateHandler = (e: Event) => setPlanDate(d => addDays(d, (e as CustomEvent).detail))
    window.addEventListener('scheduling-set-scope', setScopeHandler)
    window.addEventListener('scheduling-date-step', stepDateHandler)
    return () => {
      window.removeEventListener('scheduling-set-scope', setScopeHandler)
      window.removeEventListener('scheduling-date-step', stepDateHandler)
    }
  }, [])

  const techsQuery = useTechnicians()
  const techs: Technician[] = techsQuery.data ?? []
  const loginMap = useTechnicianLoginMap()
  const techIds = useMemo(() => techs.map(t => t.id), [techs])

  const pendingJobsQuery = useJobs({ status: 'PENDING', limit: 50 })
  const pendingJobs: Job[] = pendingJobsQuery.data?.data ?? []
  const allJobsQuery = useJobs({ limit: 200 })
  const allJobs: Job[] = allJobsQuery.data?.data ?? []

  const allAssignmentsQuery = useAllTechAssignments(techIds)
  const allAssignments = allAssignmentsQuery.data ?? []

  const assignmentByJobId = useMemo(() => {
    return allAssignments.reduce<Record<string, typeof allAssignments[number]>>((acc, assignment) => {
      const current = acc[assignment.jobId]
      if (!current) { acc[assignment.jobId] = assignment; return acc }
      const currentTime = new Date(current.updatedAt ?? current.assignedAt ?? 0).getTime()
      const nextTime = new Date(assignment.updatedAt ?? assignment.assignedAt ?? 0).getTime()
      if (nextTime >= currentTime) acc[assignment.jobId] = assignment
      return acc
    }, {})
  }, [allAssignments])

  const activeAssignments = useMemo(
    () => Object.values(assignmentByJobId).filter(a => ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)),
    [assignmentByJobId],
  )

  const TERMINAL = ['CANCELLED', 'COMPLETED', 'INVOICED', 'PAID'] as const
  const activeJobs = allJobs.filter(job => !TERMINAL.includes(job.status as any))
  const assignedJobs = activeJobs.filter(job => !!assignmentByJobId[job.id])
  const unassignedJobs = activeJobs.filter(job => !assignmentByJobId[job.id])

  const smartAssign = useSmartAssign()
  const manualAssign = useManualAssign()
  const updateStatus = useUpdateAssignmentStatus()
  const updateJobStatus = useUpdateJobStatus()

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  const [showQuoteFromJob, setShowQuoteFromJob] = useState(false)
  const [showInvoiceFromJob, setShowInvoiceFromJob] = useState(false)
  const [financeContextJob, setFinanceContextJob] = useState<Job | null>(null)

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000) }

  const handleSmartAssign = (job: Job) => {
    setError(''); setNoTechsWarning(''); setSuggestions(null); setPendingJobId(job.id)
    const lat = job.serviceLatitude ? parseFloat(job.serviceLatitude) : 40.7128
    const lng = job.serviceLongitude ? parseFloat(job.serviceLongitude) : -74.006
    setPendingJobLat(lat); setPendingJobLng(lng)
    smartAssign.mutate({ jobId: job.id, jobLatitude: lat, jobLongitude: lng }, {
      onSuccess: (res) => {
        if (res.autoAssigned) {
          setSuggestions(null); setPendingJobId(null)
          updateJobStatus.mutate({ id: job.id, status: 'SCHEDULED', statusNote: 'Auto-assigned via smart dispatch' })
          showSuccess('Job auto-assigned to technician (score >= 90). Assignment created.')
          pendingJobsQuery.refetch()
        } else if (res.suggestions && res.suggestions.length > 0) {
          setSuggestions(res.suggestions)
        } else {
          setSuggestions(null); setPendingJobId(null)
          setNoTechsWarning('No technicians found nearby. Make sure technicians are registered with GPS coordinates and are within 50 km of the job location.')
        }
      },
      onError: (err: any) => {
        setError(err?.response?.data?.error ?? err?.response?.data?.message ?? 'Smart assign failed. Is the scheduling service running?')
        setPendingJobId(null)
      },
    })
  }

  const handlePickSuggestion = (techId: string) => {
    if (!pendingJobId) return
    setError('')
    const jobId = pendingJobId
    manualAssign.mutate({ jobId, technicianId: techId, jobLatitude: pendingJobLat, jobLongitude: pendingJobLng }, {
      onSuccess: () => {
        setSuggestions(null); setPendingJobId(null)
        updateJobStatus.mutate({ id: jobId, status: 'SCHEDULED', statusNote: 'Assigned via dispatcher suggestion pick' })
        showSuccess('Technician assigned successfully!')
        pendingJobsQuery.refetch()
      },
      onError: (err: any) => setError(techOnProjectMessage(err) ?? err?.response?.data?.error ?? 'Manual assign failed.'),
    })
  }

  const handleManualAssign = (jobId: string, techId: string) => {
    setError('')
    const job = allJobs.find(j => j.id === jobId) ?? pendingJobs.find(j => j.id === jobId)
    const lat = job?.serviceLatitude ? parseFloat(job.serviceLatitude) : 40.7128
    const lng = job?.serviceLongitude ? parseFloat(job.serviceLongitude) : -74.006
    manualAssign.mutate({ jobId, technicianId: techId, jobLatitude: lat, jobLongitude: lng }, {
      onSuccess: () => {
        updateJobStatus.mutate({ id: jobId, status: 'SCHEDULED', statusNote: 'Manually assigned via scheduling board' })
        showSuccess('Job manually assigned!')
        pendingJobsQuery.refetch(); allJobsQuery.refetch()
      },
      onError: (err: any) => setError(techOnProjectMessage(err) ?? err?.response?.data?.error ?? 'Assignment failed.'),
    })
  }

  const handleOpenJob = (job: Job, assignment?: typeof allAssignments[number]) => {
    setSelectedJob(job)
    setSelectedAssignment(assignment ?? null)
  }

  const ASSIGNMENT_TO_JOB_STATUS: Record<string, string> = { EN_ROUTE: 'EN_ROUTE', ON_SITE: 'ON_SITE', COMPLETED: 'COMPLETED' }

  const handleStatusTransition = (assignmentId: string, newStatus: string, jobId?: string) => {
    setError('')
    updateStatus.mutate({ id: assignmentId, status: newStatus }, {
      onSuccess: () => {
        const mappedJobStatus = ASSIGNMENT_TO_JOB_STATUS[newStatus]
        if (mappedJobStatus && jobId) updateJobStatus.mutate({ id: jobId, status: mappedJobStatus, statusNote: `Assignment status changed to ${newStatus}` })
      },
      onError: (err: any) => setError(err?.response?.data?.error ?? 'Status update failed.'),
    })
  }

  // ── Derived: active tab rows ──────────────────────────────────────────────
  const activeAssignmentsWithJob = useMemo(() => activeAssignments
    .map(a => ({ assignment: a, technician: techs.find(t => t.id === a.technicianId), job: allJobs.find(j => j.id === (a as any).jobId) }))
    .sort((a, b) => new Date((b.assignment as any).assignedAt ?? 0).getTime() - new Date((a.assignment as any).assignedAt ?? 0).getTime()),
    [activeAssignments, techs, allJobs])

  // ── Derived: completed tab rows ───────────────────────────────────────────
  const completedRows = useMemo(() => allJobs
    .filter(j => ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status))
    .map(job => ({ job, assignment: assignmentByJobId[job.id] })),
    [allJobs, assignmentByJobId])

  const scopeStats = scope === 'live'
    ? { jobs: allJobs.length, unassigned: pendingJobs.length, extra: activeAssignments.length, extraLabel: 'active', backlog: null as number | null }
    : { jobs: planStats.jobs, unassigned: planStats.unassigned, extra: planStats.opportunities, extraLabel: 'pull-forward', backlog: planStats.backlog }

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: -8 }}>

      {/* Sub-tabs — primary navigation for the page. Stats sit on the right,
          only meaningful (and only shown) for Board, which has a scope. */}
      <div className="page-tabs" style={{ marginBottom: 0, justifyContent: 'space-between', paddingRight: 16 }}>
        <div style={{ display: 'flex' }}>
          <button className={`tab-btn ${subTab === 'board' ? 'active' : ''}`} onClick={() => setSubTab('board')}><LayoutGrid size={14} /> Board</button>
          <button className={`tab-btn ${subTab === 'active' ? 'active' : ''}`} onClick={() => setSubTab('active')}><Activity size={14} /> Active <span className="tab-count">{activeAssignments.length}</span></button>
          <button className={`tab-btn ${subTab === 'completed' ? 'active' : ''}`} onClick={() => setSubTab('completed')}><CheckCircle2 size={14} /> Completed <span className="tab-count">{completedRows.length}</span></button>
          <button className={`tab-btn ${subTab === 'calendar' ? 'active' : ''}`} onClick={() => setSubTab('calendar')}><CalendarDays size={14} /> Calendar</button>
        </div>
        {subTab === 'board' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: 'var(--t2)', flexWrap: 'wrap' }}>
            <span><b style={{ color: 'var(--t1)' }}>{scopeStats.jobs}</b> jobs</span>
            <span><b style={{ color: 'var(--amber)' }}>{scopeStats.unassigned}</b> unassigned</span>
            <span><b style={{ color: 'var(--violet, #7C3AED)' }}>{scopeStats.extra}</b> {scopeStats.extraLabel}</span>
            {scopeStats.backlog != null && <span><b style={{ color: 'var(--t3)' }}>{scopeStats.backlog}</b> backlog</span>}
            {scope === 'plan' && (
              <button
                className="btn btn-sm"
                style={{ background: 'linear-gradient(90deg,#7C3AED,#4f46e5)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={planStats.unassigned === 0}
                onClick={() => setAutoScheduleRequestId(id => id + 1)}
              >
                <Sparkles size={13} /> Auto-schedule day
              </button>
            )}
          </div>
        )}
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontSize: 13 }}>
          <CheckCircle2 size={14} /> {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}
      {noTechsWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 10, color: '#d97706', fontSize: 13 }}>
          <AlertCircle size={14} /> {noTechsWarning}
          <button onClick={() => setNoTechsWarning('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#d97706', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {suggestions && pendingJobId && (
        <div style={{ border: '1px solid var(--blue-dim)', background: 'var(--blue-glow)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Top technician suggestions</span>
            <button onClick={() => { setSuggestions(null); setPendingJobId(null) }} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10 }}>
            {suggestions.map((s: ScoredTechnician, idx: number) => (
              <div key={s.technician.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>#{idx + 1} {s.technician.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.score >= 90 ? 'var(--green)' : s.score >= 70 ? 'var(--blue)' : 'var(--amber)' }}>{s.score.toFixed(0)}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{s.distanceKm.toFixed(1)} km · {s.activeJobs}/{s.technician.maxDailyJobs} jobs · {(s.technician.rating ?? 0).toFixed(1)}★</div>
                <button className="btn btn-primary btn-sm" onClick={() => handlePickSuggestion(s.technician.id)} disabled={manualAssign.isPending}>Assign this tech</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view content */}
      {subTab === 'board' && (scope === 'live' ? (
        <BoardLive
          pendingJobs={pendingJobs}
          assignedJobs={assignedJobs}
          unassignedJobs={unassignedJobs}
          techs={techs}
          loginMap={loginMap}
          assignmentByJobId={assignmentByJobId}
          onOpenJob={handleOpenJob}
          onSmartAssign={handleSmartAssign}
          onManualAssign={handleManualAssign}
          isAssigning={manualAssign.isPending || smartAssign.isPending}
          smartAssigningJobId={pendingJobId}
          smartSuggestions={suggestions ?? null}
          onSelectTech={setSelectedTech}
        />
      ) : (
        <BoardPlan date={planDate} onStatsChange={setPlanStats} autoScheduleRequestId={autoScheduleRequestId} />
      ))}

      {subTab === 'active' && (
        <ActiveControlTower
          isLoading={allAssignmentsQuery.isLoading}
          rows={activeAssignmentsWithJob}
          availableTechs={techs.filter(t => !activeAssignmentsWithJob.some(r => r.technician?.id === t.id))}
          onOpenAssignment={handleOpenJob}
          onAdvance={handleStatusTransition}
          isAdvancing={updateStatus.isPending}
        />
      )}

      {subTab === 'completed' && <CompletedLedger rows={completedRows} onOpen={handleOpenJob} />}

      {subTab === 'calendar' && (
        <DispatchCalendar
          jobs={allJobs}
          technicians={techs}
          assignmentByJobId={assignmentByJobId}
          onAssign={handleManualAssign}
          onSmartAssign={handleSmartAssign}
          onPickSuggestion={handlePickSuggestion}
          onDismissSuggestions={() => { setSuggestions(null); setPendingJobId(null) }}
          isAssigning={manualAssign.isPending}
          smartAssigningJobId={pendingJobId}
          smartSuggestions={suggestions ?? null}
          onOpenJob={handleOpenJob}
        />
      )}

      {/* Shared modals (unchanged from Dispatch) */}
      <AddTechnicianModal isOpen={showAddTech} onClose={() => setShowAddTech(false)} />
      <CreateJobModal isOpen={showCreateJob} onClose={() => setShowCreateJob(false)} />

      {selectedTech && (
        <TechnicianDetailPanel
          technician={selectedTech}
          assignments={allAssignments}
          jobs={allJobs}
          lastLoginAt={loginMap[selectedTech.userId]}
          onClose={() => setSelectedTech(null)}
        />
      )}

      {selectedJob && (
        <JobDetailPanel
          jobId={(selectedAssignment as any)?.jobId ?? selectedJob.id}
          assignment={selectedAssignment}
          technician={selectedAssignment ? techs.find(t => t.id === selectedAssignment.technicianId) : undefined}
          isOpen={!!selectedJob}
          onClose={() => { setSelectedJob(null); setSelectedAssignment(null) }}
          onCreateQuote={(j) => { setFinanceContextJob(j ?? selectedJob); setShowQuoteFromJob(true); setSelectedJob(null); setSelectedAssignment(null) }}
          onCreateInvoice={(j) => { setFinanceContextJob(j ?? selectedJob); setShowInvoiceFromJob(true); setSelectedJob(null); setSelectedAssignment(null) }}
        />
      )}

      <AddQuoteModal
        isOpen={showQuoteFromJob}
        onClose={() => { setShowQuoteFromJob(false); setFinanceContextJob(null) }}
        prefilledJob={financeContextJob}
        onBack={financeContextJob ? () => { setShowQuoteFromJob(false); setSelectedJob(financeContextJob as Job) } : undefined}
      />
      <AddInvoiceModal
        isOpen={showInvoiceFromJob}
        onClose={() => { setShowInvoiceFromJob(false); setFinanceContextJob(null) }}
        prefilledJob={financeContextJob}
        onBack={financeContextJob ? () => { setShowInvoiceFromJob(false); setSelectedJob(financeContextJob as Job) } : undefined}
      />
    </div>
  )
}
