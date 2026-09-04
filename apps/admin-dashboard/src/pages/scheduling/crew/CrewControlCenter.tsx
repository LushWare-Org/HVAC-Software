import { useEffect, useMemo, useState } from 'react'
import { X, Crown, UserMinus } from 'lucide-react'
import type { Job, CrewCandidate, CrewMember, Technician } from '../../../types/api'
import { useCrew, useCrewCandidates, useSetCrew } from '../../../hooks/useCrew'
import { useUpdateJobFields } from '../../../hooks/useJobs'
import { DEFAULT_DURATION_MIN } from '../../../lib/dayPlan'
import TechAvatar from '../../../components/TechAvatar'
import CrewTimeline, { type TimelineRow, type TimelineBlock } from './CrewTimeline'
import CrewMap, { type MapMember, type MapClash } from './CrewMap'
import CandidateList from './CandidateList'

/** A crew member being edited, before anything is written. */
interface DraftMember {
  technician: Technician
  isLead: boolean
  /** Carried from the candidate list so the timeline can draw their clashes. */
  conflicts: NonNullable<CrewCandidate['conflicts']>
  baseDistanceKm?: number | null
  fromBase?: boolean
}

function hhmm(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function jobWindow(job: Job): { start: Date; end: Date } {
  const start = job.scheduledStart ? new Date(job.scheduledStart) : new Date()
  const end = job.scheduledEnd
    ? new Date(job.scheduledEnd)
    : new Date(start.getTime() + (job.estimatedDurationMins ?? DEFAULT_DURATION_MIN) * 60_000)
  return { start, end }
}

/**
 * CrewControlCenter — build, edit and confirm the crew for one job.
 *
 * Everything a dispatcher needs to decide is on screen at once: who is on the
 * crew, each member's whole day against a shared axis, where everyone starts
 * from, and what any of them would clash with.
 *
 * The crew is held as a local draft and only written on confirm, so someone can
 * try three combinations without three round trips, and closing the panel
 * abandons the experiment rather than half-applying it.
 */
export default function CrewControlCenter({
  job,
  open,
  onClose,
  onOpenJob,
  onSaved,
}: {
  job: Job | null
  open: boolean
  onClose: () => void
  onOpenJob?: (jobId: string) => void
  /** Fires after a successful save so a caller showing a summary of this crew
   *  (the plan table) can update without refetching. */
  onSaved?: (jobId: string, technicianIds: string[], leadTechnicianId: string) => void
}) {
  const jobId = open && job ? job.id : undefined
  const { start, end } = useMemo(() => (job ? jobWindow(job) : { start: new Date(), end: new Date() }), [job])

  const crewQuery = useCrew(jobId)
  const candidatesQuery = useCrewCandidates(jobId, start.toISOString(), end.toISOString(), 12)
  const setCrew = useSetCrew()
  const updateJob = useUpdateJobFields()

  const [draft, setDraft] = useState<DraftMember[]>([])
  const [target, setTarget] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Seed the draft from the saved crew whenever the job changes or the panel
  // reopens. Keyed on job id so switching jobs never shows the previous crew.
  useEffect(() => {
    if (!open || !job) return
    setError(null)
    setTarget(job.requiredTechCount ?? null)
    setDraft(
      (crewQuery.data ?? []).map((m: CrewMember) => ({
        technician: m.technician,
        isLead: !!m.assignment.isLead,
        conflicts: [],
        baseDistanceKm: m.assignment.baseDistanceKm,
        fromBase: true,
      })),
    )
  }, [open, job?.id, crewQuery.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Every hook must run on every render, so this sits above the early return.
  // Putting it after meant the hook count changed when the panel opened, which
  // React reports as "Rendered more hooks than during the previous render".
  const site = useMemo(() => {
    const lat = job?.serviceLatitude != null ? Number(job.serviceLatitude) : NaN
    const lng = job?.serviceLongitude != null ? Number(job.serviceLongitude) : NaN
    // 0,0 is the Gulf of Guinea, not a real service address.
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null
    return { lat, lng }
  }, [job?.serviceLatitude, job?.serviceLongitude])

  if (!open || !job) return null

  const candidates = candidatesQuery.data ?? []
  const draftIds = draft.map((d) => d.technician.id)
  const lead = draft.find((d) => d.isLead) ?? draft[0]

  const addMember = (c: CrewCandidate) => {
    setError(null)
    setDraft((prev) => {
      if (prev.some((p) => p.technician.id === c.technician.id)) return prev
      const next: DraftMember = {
        technician: c.technician,
        // First person added becomes lead by default. The algorithm scores
        // distance, workload and rating and knows nothing about seniority, so
        // it proposes rather than decides — the crown is one click away.
        isLead: prev.length === 0,
        conflicts: c.conflicts ?? [],
        baseDistanceKm: c.baseDistanceKm,
        fromBase: c.distanceFromBase,
      }
      return [...prev, next]
    })
  }

  const removeMember = (techId: string) => {
    setError(null)
    setDraft((prev) => {
      const next = prev.filter((p) => p.technician.id !== techId)
      // Removing the lead must never leave a headless crew: promote whoever is
      // first rather than blocking the removal.
      if (next.length > 0 && !next.some((n) => n.isLead)) next[0] = { ...next[0], isLead: true }
      return next
    })
  }

  const makeLead = (techId: string) => {
    setError(null)
    setDraft((prev) => prev.map((p) => ({ ...p, isLead: p.technician.id === techId })))
  }

  const confirm = async () => {
    if (!lead && draft.length > 0) {
      setError('Choose which technician is leading.')
      return
    }
    try {
      await setCrew.mutateAsync({
        jobId: job.id,
        technicianIds: draftIds,
        leadTechnicianId: lead?.technician.id ?? '',
      })
      // Persist the target too, or the "n of m" counter resets every time the
      // panel closes and the number the dispatcher chose is silently lost.
      if (target !== (job.requiredTechCount ?? null)) {
        await updateJob.mutateAsync({ id: job.id, requiredTechCount: target ?? null })
      }
      onSaved?.(job.id, draftIds, lead?.technician.id ?? '')
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Could not save the crew. Try again.')
    }
  }

  // ── Derived views ─────────────────────────────────────────────────────────
  const timelineRows: TimelineRow[] = draft.map((d) => {
    const blocks: TimelineBlock[] = [
      { start, end, kind: 'this', label: `${hhmm(start)}–${hhmm(end)}` },
      ...d.conflicts.map((c) => ({
        start: new Date(c.start),
        end: new Date(c.end),
        kind: 'clash' as const,
        label: c.jobNumber,
        jobId: c.jobId,
      })),
    ]
    return { id: d.technician.id, name: d.technician.name, blocks }
  })

  // Crew members first, then anyone suggested but not yet added, so the map
  // shows both who is going and who else is nearby.
  const mapMembers: MapMember[] = []
  for (const d of draft) {
    const p = d.technician.baseLocation
    if (p) mapMembers.push({ id: d.technician.id, name: d.technician.name, lat: p.lat, lng: p.lng, inCrew: true, fromBase: d.fromBase ?? true })
  }
  for (const c of candidates) {
    if (draftIds.includes(c.technician.id)) continue
    const p = c.technician.baseLocation
    if (p) mapMembers.push({ id: c.technician.id, name: c.technician.name, lat: p.lat, lng: p.lng, inCrew: false, fromBase: c.distanceFromBase })
  }

  const mapClashes: MapClash[] = []
  for (const d of draft) {
    for (const c of d.conflicts) {
      if (c.lat != null && c.lng != null) {
        mapClashes.push({
          jobId: c.jobId,
          jobNumber: c.jobNumber,
          lat: c.lat,
          lng: c.lng,
          technicianName: d.technician.name,
          start: c.start,
          end: c.end,
          distanceFromSiteKm: c.distanceFromSiteKm,
        })
      }
    }
  }

  const clashingCount = draft.filter((d) => d.conflicts.length > 0).length
  const short = target != null && draft.length < target

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bd)',
          borderRadius: 12,
          width: 'min(1000px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700 }}>
              {job.jobNumber ?? 'Job'}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--t1)', margin: '2px 0 3px' }}>
              {job.title ?? 'Untitled job'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t2)' }}>
              {job.customerName ?? 'No customer'}
              {job.serviceAddress ? ` · ${job.serviceAddress}` : ''}
              {` · ${start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}, ${hhmm(start)}–${hhmm(end)}`}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700, marginBottom: 4 }}>
              Technicians needed
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 6, overflow: 'hidden' }}>
              <button type="button" onClick={() => setTarget((t) => Math.max(1, (t ?? (draft.length || 1)) - 1))}
                style={{ padding: '4px 9px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', fontWeight: 700 }}>−</button>
              <span style={{ padding: '4px 9px', minWidth: 30, textAlign: 'center', fontWeight: 700, color: 'var(--t1)', borderLeft: '1px solid var(--bd)', borderRight: '1px solid var(--bd)' }}>
                {target ?? '—'}
              </span>
              <button type="button" onClick={() => setTarget((t) => (t ?? draft.length) + 1)}
                style={{ padding: '4px 9px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', fontWeight: 700 }}>+</button>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', alignSelf: 'flex-start' }}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', minHeight: 0, flex: 1, overflow: 'hidden' }}>
          {/* Left: crew + timeline */}
          <div style={{ flex: 1.45, borderRight: '1px solid var(--bd)', padding: '11px 13px', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700, marginBottom: 7 }}>
              Crew{target != null ? ` · ${draft.length} of ${target}` : ` · ${draft.length}`}
            </div>

            {draft.length === 0 ? (
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 10px' }}>
                Nobody is assigned yet. Pick a technician from the list to start the crew.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                {draft.map((d) => (
                  <div key={d.technician.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      border: `1px solid ${d.conflicts.length ? 'color-mix(in srgb, var(--amber) 45%, transparent)' : 'var(--bd)'}`,
                      borderRadius: 7,
                      background: d.conflicts.length ? 'color-mix(in srgb, var(--amber) 6%, var(--bg-card))' : 'var(--bg-card)',
                    }}>
                    <TechAvatar id={d.technician.id} name={d.technician.name} avatarUrl={d.technician.avatarUrl} size={24} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--t1)' }}>{d.technician.name}</span>
                      <span style={{ display: 'block', fontSize: 9.5, color: 'var(--t3)' }}>
                        {(d.technician.skills ?? []).join(', ') || 'No skills listed'}
                        {d.baseDistanceKm != null ? ` · ${d.baseDistanceKm.toFixed(1)} km away` : ''}
                      </span>
                    </span>

                    {d.isLead ? (
                      <span style={{ fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'color-mix(in srgb, var(--blue) 18%, transparent)', color: 'var(--blue)' }}>
                        LEAD
                      </span>
                    ) : (
                      <button type="button" onClick={() => makeLead(d.technician.id)} title="Make lead"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', display: 'flex' }}>
                        <Crown size={13} />
                      </button>
                    )}

                    <button type="button" onClick={() => removeMember(d.technician.id)} title={`Remove ${d.technician.name}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)', display: 'flex' }}>
                      <UserMinus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {draft.length > 0 && (
              <CrewTimeline day={start} windowStart={start} windowEnd={end} rows={timelineRows}
                onBlockClick={(b) => b.jobId && onOpenJob?.(b.jobId)} />
            )}

            <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700, margin: '14px 0 7px' }}>
              Available to add
            </div>
            <CandidateList
              candidates={candidates}
              onAdd={addMember}
              loading={candidatesQuery.isLoading}
              error={candidatesQuery.isError}
              excludeIds={draftIds}
            />
          </div>

          {/* Right: map */}
          <div style={{ flex: 1, padding: '11px 13px', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 700, marginBottom: 7 }}>
              Where the crew starts
            </div>
            <CrewMap site={site} members={mapMembers} clashes={mapClashes} onSelectJob={onOpenJob} />

            {mapClashes.length > 0 && (
              <div style={{ marginTop: 11, border: '1px solid color-mix(in srgb, var(--amber) 45%, transparent)', background: 'color-mix(in srgb, var(--amber) 8%, transparent)', borderRadius: 7, padding: '8px 9px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--amber)', marginBottom: 3 }}>
                  {mapClashes.length === 1 ? 'One clash on this crew' : `${mapClashes.length} clashes on this crew`}
                </div>
                {mapClashes.map((c) => (
                  <div key={c.jobId} style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.5 }}>
                    {c.technicianName} has {c.jobNumber} at {hhmm(new Date(c.start))}
                    {c.distanceFromSiteKm != null ? `, ${c.distanceFromSiteKm.toFixed(1)} km from here` : ''}.
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--bd)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 10.5, color: error ? 'var(--red)' : 'var(--t2)' }}>
            {error
              ? error
              : draft.length === 0
                ? 'Confirming with nobody assigned will leave this job unassigned.'
                : `${lead?.technician.name ?? 'Nobody'} leads.` +
                  (short ? ` ${target! - draft.length} more to reach ${target}.` : '') +
                  (clashingCount > 0 ? ` ${clashingCount} member${clashingCount === 1 ? '' : 's'} already booked.` : '')}
          </span>
          <button type="button" onClick={onClose} className="btn btn-sm">Cancel</button>
          <button type="button" onClick={confirm} disabled={setCrew.isPending} className="btn btn-primary btn-sm">
            {setCrew.isPending
              ? 'Saving…'
              : draft.length === 0
                ? 'Leave unassigned'
                : `Confirm crew of ${draft.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}
