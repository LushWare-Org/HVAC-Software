/**
 * PlannerMap — the Day Planner's map. Lazy-loaded so the map engine stays out of the main bundle.
 * Draws on Leaflet, or Google Maps for companies that have it switched on (see components/map/kit).
 *
 * Pins (lib/maps/pins): teardrop colour = trade, corner badge = stage, dashed = not yet assigned,
 * teal loop = agreement visit, orange ring on a dashed pin = a visit due soon that could be pulled forward.
 * Technicians are round photos with a ring of job slots for the day.
 */
import { useMemo, useState } from 'react'
import { createMapViewStore } from '../../lib/mapView'
import type { Job, Technician } from '../../types/api'
import type { Agreement } from '../../hooks/useAgreements'
import { BaseMap, Pin, TechPin } from '../../components/map/kit'
import { useMapEngine } from '../../components/map/kit/provider'
import { JOB_PIN, jobPinHtml, stageOf, tradeOf, urgencyOf } from '../../lib/maps/pins'

export interface PlannerJobPin {
  job: Job
  lat: number
  lng: number
  kind: 'assigned' | 'unassigned' | 'agreement-assigned' | 'agreement-unassigned'
}

export interface OpportunityPin {
  agreement: Agreement
  lat: number
  lng: number
  dueInDays: number
}

// Remember where the user left the map (pan/zoom), so navigating to another
// page and back doesn't reset their view. Shared with DispatchMap via
// lib/mapView, which also makes the view survive a reload — this was a
// module-level variable that a refresh silently discarded.
const plannerMapView = createMapViewStore('planner')

// Two base layers the dispatcher can flip between: street map for context,
// satellite for eyeballing roofs and yards before sending a tech.
const BASE_LAYERS = {
  street: { label: 'Map' },
  satellite: { label: 'Satellite' },
} as const

type BaseLayerKey = keyof typeof BASE_LAYERS

export default function PlannerMap({
  jobPins, opportunityPins, technicians, onSelectJob, onViewJob, onSelectOpportunity, onViewOpportunity, onSelectTech,
}: {
  jobPins: PlannerJobPin[]
  opportunityPins: OpportunityPin[]
  technicians: Technician[]
  onSelectJob: (job: Job) => void
  onViewJob: (job: Job) => void
  onSelectOpportunity: (a: Agreement) => void
  onViewOpportunity: (a: Agreement) => void
  onSelectTech: (t: Technician) => void
}) {
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>('street')
  // Google Maps shows its own Map/Satellite and full-screen controls; ours are for the standard map only.
  const isLeaflet = useMapEngine() === 'leaflet'
  // "Job details" mode: every job/opportunity pin shows a permanent floating
  // detail bar (same info as the click popup) so the whole day is readable at a glance.
  const [showDetails, setShowDetails] = useState(false)
  const techPins = technicians.filter(t => t.currentLocation)
  // Jobs each technician has on the selected day, for the ring around their photo.
  const jobsByTech = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of jobPins) if (p.job.assignedToId) m.set(p.job.assignedToId, (m.get(p.job.assignedToId) ?? 0) + 1)
    return m
  }, [jobPins])
  const allPoints: Array<[number, number]> = [
    ...jobPins.map(p => [p.lat, p.lng] as [number, number]),
    ...opportunityPins.map(p => [p.lat, p.lng] as [number, number]),
    ...techPins.map(t => [t.currentLocation!.lat, t.currentLocation!.lng] as [number, number]),
  ]

  return (
    /* zIndex: 0 creates a stacking context that traps every Leaflet pane and the
       map controls below, so page modals (z-index 1000 at the root) always paint
       on top of the map — without it the Map/Satellite toggle bled over modals. */
    <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 0 }}>
      {/* Map controls — sit above the Leaflet panes (zoom control is z-index 1000) */}
      {/* On Google, sit left of its full-screen button (top right). */}
      <div style={{ position: 'absolute', top: 10, right: isLeaflet ? 10 : 60, zIndex: 1001, display: 'flex', gap: 8 }}>
        {/* "Job details" toggle: shows a permanent info bar on every job pin */}
        <button
          onClick={() => setShowDetails(v => !v)}
          title={showDetails ? 'Hide job detail bars' : 'Show every job\'s details on the map'}
          style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)',
            boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
            background: showDetails ? '#2563eb' : 'white',
            color: showDetails ? 'white' : '#334155',
          }}
        >
          Job details {showDetails ? 'ON' : 'OFF'}
        </button>
        {/* Base-layer toggle */}
        {isLeaflet && (
          <div style={{
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.2)', boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
          }}>
            {(Object.keys(BASE_LAYERS) as BaseLayerKey[]).map(key => (
              <button
                key={key}
                onClick={() => setBaseLayer(key)}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: baseLayer === key ? '#2563eb' : 'white',
                  color: baseLayer === key ? 'white' : '#334155',
                }}
              >
                {BASE_LAYERS[key].label}
              </button>
            ))}
          </div>
        )}
      </div>

    <BaseMap
      center={[6.9271, 79.8612]}
      zoom={11}
      fit={allPoints}
      viewStore={plannerMapView}
      baseLayer={baseLayer}
      style={{ borderRadius: 'var(--r-md)' }}
    >
      {jobPins.map(p => {
        const agreement = p.kind.startsWith('agreement')
        const assigned = p.kind.endsWith('-assigned') || p.kind === 'assigned'
        const trade = agreement ? 'agreement' : tradeOf(p.job)
        const stage = stageOf(p.job, assigned)
        return (
          <Pin
            key={p.job.id}
            position={[p.lat, p.lng]}
            html={jobPinHtml(trade, stage, urgencyOf(p.job.priority))}
            width={JOB_PIN.width} height={JOB_PIN.height} anchor={[JOB_PIN.anchorX, JOB_PIN.anchorY]}
            label={showDetails ? (
              <>
                <div className="t">{p.job.title}</div>
                {p.job.customerName && <div className="s">{p.job.customerName}</div>}
                <div style={{ color: p.job.assignedToName ? '#059669' : '#d97706', fontWeight: 600 }}>
                  {p.job.assignedToName ? `✓ ${p.job.assignedToName}` : 'Unassigned'}
                  {p.job.isAgreementJob ? ' · Agreement' : ''}
                </div>
              </>
            ) : undefined}
            popup={
              <div style={{ fontSize: 13, minWidth: 180 }}>
                <strong>{p.job.title}</strong>
                <div style={{ color: '#666', margin: '4px 0' }}>{p.job.customerName}</div>
                <div style={{ color: '#666' }}>{p.job.serviceAddress}</div>
                <div style={{ margin: '4px 0' }}>
                  {p.job.assignedToName ? `Assigned: ${p.job.assignedToName}` : 'Unassigned'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    onClick={() => onViewJob(p.job)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer' }}
                  >
                    View details
                  </button>
                  <button
                    onClick={() => onSelectJob(p.job)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontSize: 12, cursor: 'pointer' }}
                  >
                    {p.job.assignedToName ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </div>
            }
          />
        )
      })}

      {opportunityPins.map(p => (
        // A dashed agreement pin with an orange ring: a visit due soon that could be pulled onto this day.
        <Pin
          key={p.agreement.id}
          position={[p.lat, p.lng]}
          html={jobPinHtml('agreement', 'unassigned', 'high')}
          width={JOB_PIN.width} height={JOB_PIN.height} anchor={[JOB_PIN.anchorX, JOB_PIN.anchorY]}
          label={showDetails ? (
            <>
              <div className="t">
                {p.agreement.customer ? `${p.agreement.customer.firstName} ${p.agreement.customer.lastName}` : p.agreement.name}
              </div>
              <div className="s">{p.agreement.serviceType ?? p.agreement.name}</div>
              <div style={{ color: '#d97706', fontWeight: 600 }}>Opportunity · due in {p.dueInDays}d</div>
            </>
          ) : undefined}
          popup={
            <div style={{ fontSize: 13, minWidth: 190 }}>
              <strong>Nearby opportunity</strong>
              <div style={{ margin: '4px 0' }}>
                {p.agreement.customer?.firstName} {p.agreement.customer?.lastName} — {p.agreement.serviceType ?? p.agreement.name}
              </div>
              <div style={{ color: '#666' }}>Service due in {p.dueInDays} day{p.dueInDays === 1 ? '' : 's'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={() => onViewOpportunity(p.agreement)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer' }}
                >
                  View details
                </button>
                <button
                  onClick={() => onSelectOpportunity(p.agreement)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#f59e0b', color: 'white', fontSize: 12, cursor: 'pointer' }}
                >
                  Offer to pull forward
                </button>
              </div>
            </div>
          }
        />
      ))}

      {techPins.map(t => (
        <TechPin
          key={t.id}
          position={[t.currentLocation!.lat, t.currentLocation!.lng]}
          name={t.name}
          avatarUrl={t.avatarUrl}
          color="#2563EB"
          workload={jobsByTech.get(t.userId) ?? 0}
          maxJobs={t.maxDailyJobs}
          speedKmh={t.speedKmh}
          headingDeg={t.headingDeg}
          popup={
            <div style={{ fontSize: 13 }}>
              <strong>{t.name}</strong>
              <div style={{ color: '#666' }}>Technician · {jobsByTech.get(t.userId) ?? 0} job{(jobsByTech.get(t.userId) ?? 0) === 1 ? '' : 's'} this day</div>
              <button
                onClick={() => onSelectTech(t)}
                style={{ marginTop: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer' }}
              >
                View day
              </button>
            </div>
          }
        />
      ))}
    </BaseMap>
    </div>
  )
}
