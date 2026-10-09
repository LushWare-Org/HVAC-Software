/**
 * BoardLive — "See all jobs": the live map filling the board, a small
 * technicians control on it, and the jobs waiting for a technician docked
 * underneath as decision cards (the best technician for each, one click to give
 * it to them). Composes DispatchMap; does not duplicate its internals.
 *
 * Everything the dispatcher sets up here (dock open, full view, and the map's
 * own filters and position inside DispatchMap) is remembered across pages,
 * tabs and windows.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Maximize2, Minimize2, Search, Users, Zap } from 'lucide-react'
import type { Job, Technician, ScoredTechnician, DispatchAssignment } from '../../types/api'
import Avatar from '../../components/Avatar'
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import { getTechAvailability, AVAIL_META, type AvailabilityTier } from './availability'
import { usePersistentState } from '../../lib/usePersistentState'
import { bestFits, jobUrgency, sortByUrgency, whenNeeded, type Fit } from './boardFit'
import './boardLive.css'

const DispatchMap = lazy(() => import('../dispatch/DispatchMap'))
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'

export default function BoardLive({
  pendingJobs, assignedJobs, unassignedJobs, techs, loginMap, assignmentByJobId, allAssignments,
  onOpenJob, onSmartAssign, onManualAssign, isAssigning, smartAssigningJobId,
  smartSuggestions, onSelectTech,
}: {
  pendingJobs: Job[]
  assignedJobs: Job[]
  unassignedJobs: Job[]
  techs: Technician[]
  loginMap: Record<string, string>
  assignmentByJobId: Record<string, any>
  /** Every assignment, not just the lead's. Needed for per-technician workload,
   *  which undercounts badly if it only sees one assignment per job. */
  allAssignments: DispatchAssignment[]
  onOpenJob: (job: Job, assignment?: any) => void
  onSmartAssign: (job: Job) => void
  onManualAssign: (jobId: string, techId: string) => void
  isAssigning: boolean
  smartAssigningJobId: string | null
  smartSuggestions: ScoredTechnician[] | null
  onSelectTech: (tech: Technician) => void
}) {
  const [mapExpanded, setMapExpanded] = usePersistentState<boolean>('board.fullView', false, isBool)
  const [dockOpen, setDockOpen] = usePersistentState<boolean>('board.dockOpen', true, isBool)

  // Leaflet only re-measures on a window resize, so nudge it when the map's box changes.
  const nudgeMap = () => {
    window.dispatchEvent(new Event('resize'))
    setTimeout(() => window.dispatchEvent(new Event('resize')), 220)
  }
  useEffect(nudgeMap, [mapExpanded, dockOpen])

  const queue = useMemo(() => sortByUrgency(pendingJobs), [pendingJobs])
  const fits = useMemo(() => bestFits(queue, techs, loginMap, allAssignments), [queue, techs, loginMap, allAssignments])

  return (
    <div className="bl" style={{ height: mapExpanded ? '90vh' : 'max(640px, calc(100vh - 190px))' }}>
      <section className="bl-map card" aria-label="Live map">
        <Suspense fallback={<div className="bl-loading"><Loader2 size={24} className="spin" /></div>}>
          <DispatchMap
            technicians={techs}
            assignedJobs={assignedJobs}
            unassignedJobs={unassignedJobs}
            assignmentByJobId={assignmentByJobId}
            allAssignments={allAssignments}
            loginMap={loginMap}
            onOpenJob={onOpenJob}
            onSmartAssign={onSmartAssign}
            onAssign={onManualAssign}
            isAssigning={isAssigning}
            smartAssigningJobId={smartAssigningJobId}
            smartSuggestions={smartSuggestions}
          />
        </Suspense>
        {/* Top right, clear of the map's own full-screen button. */}
        <div className="bl-top">
          <TechniciansControl techs={techs} loginMap={loginMap} allAssignments={allAssignments} onSelectTech={onSelectTech} />
          <button type="button" className="dm-pill" onClick={() => setMapExpanded(e => !e)} aria-pressed={mapExpanded}>
            {mapExpanded ? <><Minimize2 size={13} /> Exit full view</> : <><Maximize2 size={13} /> Full view</>}
          </button>
        </div>
      </section>

      {!mapExpanded && (
        <section className={`bl-dock card${dockOpen ? '' : ' is-closed'}`} aria-label="Jobs waiting for a technician">
          <header className="bl-dock-head">
            <h2>Unassigned</h2>
            <span className="bl-count">{queue.length}</span>
            {queue.length > 0 && <span className="bl-sub">Most urgent first. Each card shows the best technician for it.</span>}
            <span style={{ flex: 1 }} />
            <button type="button" className="dm-icon-btn bl-toggle" onClick={() => setDockOpen(o => !o)} aria-expanded={dockOpen}>
              {dockOpen ? <><ChevronDown size={15} /> Hide</> : <><ChevronUp size={15} /> Show</>}
            </button>
          </header>
          {dockOpen && (
            queue.length === 0 ? (
              <p className="bl-empty">Nothing is waiting for a technician.</p>
            ) : (
              <div className="bl-cards" role="list">
                {queue.map(job => (
                  <DecisionCard
                    key={job.id} job={job} fit={fits[job.id]}
                    busy={isAssigning && smartAssigningJobId === job.id}
                    onOpen={() => onOpenJob(job, assignmentByJobId[job.id])}
                    onGive={(techId) => onManualAssign(job.id, techId)}
                    onSmart={() => onSmartAssign(job)}
                  />
                ))}
              </div>
            )
          )}
        </section>
      )}
    </div>
  )
}

// ─── One waiting job: who should take it, and one click to give it to them ───

function DecisionCard({ job, fit, busy, onOpen, onGive, onSmart }: {
  job: Job; fit?: Fit; busy: boolean; onOpen: () => void; onGive: (techId: string) => void; onSmart: () => void
}) {
  const urgency = jobUrgency(job)
  const when = whenNeeded(job)
  const area = (job.serviceAddress ?? job.customerAddress ?? '').split(',').map(x => x.trim()).filter(Boolean).pop()
  const best = fit?.ranked[0]
  return (
    <article className={`bl-card is-${urgency}`} role="listitem">
      <button type="button" className="bl-card-open" onClick={onOpen} aria-label={`Open ${job.title}`}>
        <span className={`bl-tag is-${when.tone}`}>{when.label}</span>
        <span className="bl-title">{job.title}</span>
        <span className="bl-meta">{[job.customerName, area].filter(Boolean).join(' · ') || 'No address yet'}</span>
      </button>
      <RescheduleBadge state={job.rescheduleState} size="sm" />
      {best ? (
        <div className="bl-best">
          <Avatar name={best.tech.name} avatarUrl={best.tech.avatarUrl} size={26} radius={13} fontSize={10} />
          <span><b>{best.tech.name}</b> is the best fit<span className="bl-why">{best.why}</span></span>
        </div>
      ) : (
        <div className="bl-best is-none">No technician is free right now.</div>
      )}
      <div className="bl-actions">
        {best && (
          <button type="button" className="btn btn-primary btn-sm bl-give" onClick={() => onGive(best.tech.id)}>
            Give to {best.tech.name.split(' ')[0]}
          </button>
        )}
        <select
          aria-label={`Give ${job.title} to someone else`}
          defaultValue=""
          onChange={e => { if (e.target.value) onGive(e.target.value); e.target.value = '' }}
          className="bl-other"
        >
          <option value="" disabled>{best ? 'Someone else' : 'Choose a technician'}</option>
          {(fit?.ranked ?? []).slice(best ? 1 : 0).map(r => <option key={r.tech.id} value={r.tech.id}>{r.tech.name}{r.km != null ? ` · ${r.km < 1 ? '<1' : Math.round(r.km)} km` : ''}</option>)}
          {(fit?.unavailable ?? []).map(t => <option key={t.id} value={t.id}>{t.name} · offline</option>)}
        </select>
        <button type="button" className="bl-smart" onClick={onSmart} disabled={busy} title="Let HVACtor score every technician for this job">
          {busy ? <Loader2 size={12} className="spin" /> : <Zap size={12} />} Smart
        </button>
      </div>
    </article>
  )
}

// ─── Technicians: a small button on the map, and a list that scales to any team size ───

type TechFilter = 'all' | 'free' | 'busy' | 'off'

function TechniciansControl({ techs, loginMap, allAssignments, onSelectTech }: {
  techs: Technician[]; loginMap: Record<string, string>; allAssignments: DispatchAssignment[]; onSelectTech: (t: Technician) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<TechFilter>('all')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const rows = useMemo(() => techs.map(t => {
    const avail = getTechAvailability(t, loginMap[t.userId]) as AvailabilityTier
    const mine = allAssignments.filter(a => a.technicianId === t.id)
    const driving = mine.find(a => a.status === 'EN_ROUTE')
    const onSite = mine.find(a => a.status === 'ON_SITE')
    const queued = mine.filter(a => a.status === 'ASSIGNED').length
    const state: Exclude<TechFilter, 'all'> = avail === 'OFFLINE' ? 'off' : driving || onSite ? 'busy' : 'free'
    const line = driving ? 'On the way to a job' : onSite ? 'On site' : avail === 'OFFLINE' ? 'Offline' : queued ? `Free · ${queued} job${queued === 1 ? '' : 's'} later` : 'Free'
    return { t, avail, state, line }
  }), [techs, loginMap, allAssignments])

  const counts = { free: rows.filter(r => r.state === 'free').length, busy: rows.filter(r => r.state === 'busy').length, off: rows.filter(r => r.state === 'off').length }
  const shown = rows.filter(r => (filter === 'all' || r.state === filter) && (!q.trim() || r.t.name.toLowerCase().includes(q.trim().toLowerCase())))
  const faces = [...rows].sort((a, b) => (a.state === 'off' ? 1 : 0) - (b.state === 'off' ? 1 : 0)).slice(0, 3)

  return (
    <div className="bl-techs" ref={box}>
      <button type="button" className="dm-pill bl-techs-btn" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(o => !o)}>
        <span className="bl-faces" aria-hidden="true">
          {faces.map(({ t, avail }) => (
            <span key={t.id} className="bl-face" style={{ boxShadow: `0 0 0 2px ${AVAIL_META[avail].color}` }}>
              <Avatar name={t.name} avatarUrl={t.avatarUrl} size={22} radius={11} fontSize={9} />
            </span>
          ))}
          {rows.length > 3 && <span className="bl-more">+{rows.length - 3}</span>}
        </span>
        {rows.length ? <span><b>{counts.free}</b> free · <b>{counts.busy}</b> on a job</span> : <span>No technicians</span>}
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="bl-techs-panel" role="dialog" aria-label="Technicians">
          <label className="bl-search"><Search size={13} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Find a technician" aria-label="Find a technician" /></label>
          <div className="bl-filters" role="radiogroup" aria-label="Show">
            {([['all', `All ${rows.length}`], ['free', `Free ${counts.free}`], ['busy', `On a job ${counts.busy}`], ['off', `Offline ${counts.off}`]] as Array<[TechFilter, string]>).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{label}</button>
            ))}
          </div>
          <div className="bl-tech-list">
            {shown.map(({ t, avail, line }) => (
              <button key={t.id} type="button" className="bl-tech" onClick={() => { setOpen(false); onSelectTech(t) }} style={{ opacity: AVAIL_META[avail].dim }}>
                <span style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={t.name} avatarUrl={t.avatarUrl} size={30} radius={15} fontSize={11} />
                  <span className="bl-tech-dot" style={{ background: AVAIL_META[avail].color }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="bl-tech-name">{t.name}</span>
                  <span className="bl-tech-line" style={{ color: AVAIL_META[avail].color }}>{line}</span>
                </span>
              </button>
            ))}
            {!shown.length && (
              <p className="bl-empty" style={{ padding: '18px 8px' }}>
                {rows.length ? 'Nobody matches.' : <><Users size={20} style={{ opacity: .4, display: 'block', margin: '0 auto 6px' }} />No technicians yet. Add them in Team.</>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
