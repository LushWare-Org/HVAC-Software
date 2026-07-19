/**
 * BoardLive — "See all jobs" cockpit: unassigned queue + live map + live
 * technician rail, all visible at once. Composes existing Dispatch pieces
 * (DispatchMap, availability tiers) into the new persistent 3-column layout;
 * does not duplicate their internals.
 */
import { lazy, Suspense, useState } from 'react'
import { Loader2, Zap, Users, Phone, Maximize2, Minimize2 } from 'lucide-react'
import type { Job, Technician, ScoredTechnician } from '../../types/api'
import Avatar from '../../components/Avatar'
import { getTechAvailability, AVAIL_META, type AvailabilityTier } from './availability'

const DispatchMap = lazy(() => import('../dispatch/DispatchMap'))

export default function BoardLive({
  pendingJobs, assignedJobs, unassignedJobs, techs, loginMap, assignmentByJobId,
  onOpenJob, onSmartAssign, onManualAssign, isAssigning, smartAssigningJobId,
  smartSuggestions, onSelectTech,
}: {
  pendingJobs: Job[]
  assignedJobs: Job[]
  unassignedJobs: Job[]
  techs: Technician[]
  loginMap: Record<string, string>
  assignmentByJobId: Record<string, any>
  onOpenJob: (job: Job, assignment?: any) => void
  onSmartAssign: (job: Job) => void
  onManualAssign: (jobId: string, techId: string) => void
  isAssigning: boolean
  smartAssigningJobId: string | null
  smartSuggestions: ScoredTechnician[] | null
  onSelectTech: (tech: Technician) => void
}) {
  const withAvail = techs.map(t => ({ t, avail: getTechAvailability(t, loginMap[t.userId]) as AvailabilityTier }))
  const counts = {
    online: withAvail.filter(x => x.avail === 'ONLINE').length,
    available: withAvail.filter(x => x.avail === 'AVAILABLE').length,
    away: withAvail.filter(x => x.avail === 'AWAY').length,
    offline: withAvail.filter(x => x.avail === 'OFFLINE').length,
  }
  const [mapExpanded, setMapExpanded] = useState(false)

  // Leaflet only recalculates its tile layout on a real `window resize`
  // event (or an explicit invalidateSize() call it doesn't expose to us here
  // since DispatchMap is reused as-is). Toggling mapExpanded resizes the
  // map's container via CSS, which Leaflet has no way to notice on its own —
  // without this nudge, tiles outside the map's *original* size never load,
  // which is exactly the "some parts not visible" bug. Firing a synthetic
  // resize during and after the 0.2s CSS transition covers both the
  // mid-transition and final container size.
  const toggleMapExpanded = () => {
    setMapExpanded(e => !e)
    window.dispatchEvent(new Event('resize'))
    setTimeout(() => window.dispatchEvent(new Event('resize')), 220)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mapExpanded ? '1fr' : 'minmax(0,300px) 1fr minmax(0,340px)', gap: 14, height: mapExpanded ? '90vh' : 'max(620px, calc(100vh - 190px))', transition: 'height 0.2s ease' }}>
      {/* Unassigned queue */}
      {!mapExpanded && (
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Unassigned now</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)', padding: '2px 8px', borderRadius: 10 }}>
            {pendingJobs.length}
          </span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {pendingJobs.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', padding: '20px 0' }}>Nothing waiting for dispatch.</p>
          ) : pendingJobs.map(job => (
            <div key={job.id} onClick={() => onOpenJob(job, assignmentByJobId[job.id])} style={{ border: '1px solid var(--bd)', borderLeft: `3px solid ${job.serviceLatitude && job.serviceLongitude ? 'var(--t4)' : 'var(--amber)'}`, borderRadius: 11, padding: '10px 11px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: job.priority === 'EMERGENCY' || job.priority === 'HIGH' ? '#1D4ED8' : '#6B7280', background: job.priority === 'EMERGENCY' || job.priority === 'HIGH' ? '#DBEAFE' : '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>{job.priority}</span>
                {job.serviceLatitude && job.serviceLongitude && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '1px 5px', borderRadius: 3 }}>GPS</span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{job.title}</div>
              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3 }}>{job.customerName ?? '—'} · {job.serviceAddress ?? job.customerAddress ?? 'No address'}</div>
              <button
                onClick={e => { e.stopPropagation(); onSmartAssign(job) }}
                disabled={isAssigning && smartAssigningJobId === job.id}
                style={{ width: '100%', marginTop: 8, background: 'linear-gradient(90deg,#F59E0B,#F97316)', color: '#fff', border: 'none', borderRadius: 7, padding: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                {isAssigning && smartAssigningJobId === job.id ? <Loader2 size={11} className="spin" /> : <Zap size={11} />} Smart-assign
              </button>
              <select
                defaultValue=""
                onClick={e => e.stopPropagation()}
                onChange={e => { if (e.target.value) onManualAssign(job.id, e.target.value); e.target.value = '' }}
                style={{ width: '100%', marginTop: 5, fontSize: 10.5, border: '1px solid var(--bd)', borderRadius: 6, padding: '4px 6px', background: 'var(--bg-card)', color: 'var(--t2)' }}
              >
                <option value="" disabled>Assign manually…</option>
                {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Live map — the expand toggle gets its own header strip, never
          overlapping DispatchMap's own internal KPI/filter row */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} /></div>}>
          <DispatchMap
            technicians={techs}
            assignedJobs={assignedJobs}
            unassignedJobs={unassignedJobs}
            assignmentByJobId={assignmentByJobId}
            loginMap={loginMap}
            onOpenJob={onOpenJob}
            onSmartAssign={onSmartAssign}
            onAssign={onManualAssign}
            isAssigning={isAssigning}
            smartAssigningJobId={smartAssigningJobId}
            smartSuggestions={smartSuggestions}
          />
        </Suspense>
        </div>
      </div>

      {/* Live tech rail */}
      {!mapExpanded && (
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} /> Technicians · live
          </span>
        </div>
        <div style={{ padding: '9px 15px', display: 'flex', gap: 12, borderBottom: '1px solid var(--bd)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, color: 'var(--t3)' }}><b style={{ color: '#059669' }}>{counts.online}</b> online</span>
          <span style={{ fontSize: 10.5, color: 'var(--t3)' }}><b style={{ color: '#2563EB' }}>{counts.available}</b> avail</span>
          <span style={{ fontSize: 10.5, color: 'var(--t3)' }}><b style={{ color: '#D97706' }}>{counts.away}</b> away</span>
          <span style={{ fontSize: 10.5, color: 'var(--t3)' }}><b style={{ color: '#6B7280' }}>{counts.offline}</b> off</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {withAvail.map(({ t, avail }) => {
            const meta = AVAIL_META[avail]
            return (
              <div key={t.id} onClick={() => onSelectTech(t)} style={{ border: '1px solid var(--bd)', borderLeft: `3px solid ${meta.color}`, borderRadius: 11, padding: '10px 11px', cursor: 'pointer', opacity: meta.dim }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={t.name} avatarUrl={t.avatarUrl} size={30} radius={15} fontSize={11} />
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: meta.color, border: '2px solid var(--bg-card)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t1)' }}>{t.name}</div>
                    <div style={{ fontSize: 9.5, color: meta.color }}>{meta.label}{t.phone ? ` · ${t.phone}` : ''}</div>
                  </div>
                  {t.phone && <Phone size={11} style={{ color: 'var(--t4)', flexShrink: 0 }} />}
                </div>
              </div>
            )
          })}
          {withAvail.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Users size={24} style={{ opacity: 0.3 }} /> No technicians registered
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
