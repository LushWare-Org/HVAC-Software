/**
 * DispatchMap — operational map for technicians and jobs.
 * Lazy-loaded from DispatchBoard to keep the map engine out of the first page load.
 * Draws on Leaflet, or Google Maps for companies that have it switched on (components/map/kit).
 *
 * Features:
 *  1. Auto-fit bounds on load, and the view is remembered
 *  2. Technician pins: round photo, ring of job slots, availability colour; they glide between GPS fixes
 *  3. Quick-assign from unassigned job popups
 *  4. Missing-coordinates warning badge
 *  5. Job pins: colour = trade, corner badge = stage, dashed = unassigned, ring = priority (lib/maps/pins)
 *  6. Today / Week / All scope toggle
 *  7. Routing lines while EN_ROUTE only; cleared once the job is ON_SITE
 *  Plus: toggleable map layers (live techs, stale techs, assigned jobs, unassigned jobs, routes)
 */

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Info, Layers } from 'lucide-react'
import { usePersistentState } from '../../lib/usePersistentState'
import './dispatchMap.css'
import { useQuery } from '@tanstack/react-query'
import { createMapViewStore } from '../../lib/mapView'
import type { DispatchAssignment, Job, ScoredTechnician, Technician } from '../../types/api'
import { useLocations, useLocationStock, decimalToNumber } from '../../hooks/useInventory'
import TripTrail, { ROUTE_DRIVEN } from '../../components/map/TripTrail'
import { BaseMap, Line, Pin, TechPin } from '../../components/map/kit'
import { JOB_PIN, STAGE_COLOR, STAGE_LABEL, TRADE_COLOR, TRADE_LABEL, jobPinHtml, stageOf, tradeOf, urgencyOf, type Trade } from '../../lib/maps/pins'

// ─── Availability tier (duplicated from DispatchBoard — no circular dep allowed) ─
type AvailTier = 'ONLINE' | 'AVAILABLE' | 'AWAY' | 'OFFLINE'

function getTechAvailability(tech: { lastSeenAt?: string; locationUpdatedAt?: string }, lastLoginAt?: string): AvailTier {
  const signals = [tech.lastSeenAt, tech.locationUpdatedAt, lastLoginAt]
    .filter(Boolean).map(d => new Date(d!).getTime())
  if (!signals.length) return 'OFFLINE'
  const newest = Math.max(...signals)
  const mins = (Date.now() - newest) / 60000
  if (mins < 15)       return 'ONLINE'
  if (mins < 8 * 60)   return 'AVAILABLE'
  if (mins < 24 * 60)  return 'AWAY'
  return 'OFFLINE'
}

const AVAIL: Record<AvailTier, { color: string; label: string; isLive: boolean }> = {
  ONLINE:    { color: '#10b981', label: 'Online',    isLive: true  },
  AVAILABLE: { color: '#2563eb', label: 'Available', isLive: true  },
  AWAY:      { color: '#f59e0b', label: 'Away',      isLive: false },
  OFFLINE:   { color: '#9ca3af', label: 'Offline',   isLive: false },
}

// ─── Priority colors ─────────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  EMERGENCY: '#dc2626',
  URGENT:    '#ef4444',
  HIGH:      '#f97316',
  NORMAL:    '#f59e0b',
  LOW:       '#94a3b8',
}

// ─── Scope filter ────────────────────────────────────────────────────────────────
type ScopeFilter = 'today' | 'week' | 'all'

function jobInScope(job: Job, scope: ScopeFilter): boolean {
  if (scope === 'all') return true
  const ref = job.scheduledStart ?? job.createdAt
  if (!ref) return false
  const d = new Date(ref)
  const now = new Date()
  if (scope === 'today') {
    return d.toDateString() === now.toDateString()
  }
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const weekEnd = new Date(start); weekEnd.setDate(start.getDate() + 7)
  return d >= start && d < weekEnd
}

// ─── Coordinate helpers ──────────────────────────────────────────────────────────
function parseCoords(job: Job): { lat: number; lng: number } | null {
  if (!job.serviceLatitude || !job.serviceLongitude) return null
  const lat = Number.parseFloat(job.serviceLatitude)
  const lng = Number.parseFloat(job.serviceLongitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

// ─── Road routing via OSRM public API ────────────────────────────────────────────
// OSRM returns GeoJSON [lng, lat] pairs; Leaflet needs [lat, lng].
/**
 * Snaps a position to a ~150 m grid.
 *
 * The route is recalculated from the technician's CURRENT position, which is
 * what makes the blue line shrink as they drive and re-route if they take a
 * different road. But a GPS fix lands every 30 s, and asking OSRM for a new
 * route on every one would hammer a public demo server for a line that has
 * barely changed. Rounding the origin means a recalculation only happens once
 * they have actually moved.
 */
function routeGrid(p: [number, number] | null): string {
  if (!p) return 'none'
  return `${p[0].toFixed(3)},${p[1].toFixed(3)}`
}

function useRoadRoute(from: [number, number] | null, to: [number, number] | null) {
  return useQuery<[number, number][] | null>({
    queryKey: ['osrm-route', routeGrid(from), routeGrid(to)],
    queryFn: async () => {
      if (!from || !to) return null
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from[1]},${from[0]};${to[1]},${to[0]}` +
        `?overview=full&geometries=geojson`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      const coords = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
      if (!coords?.length) return null
      return coords.map(([lng, lat]) => [lat, lng] as [number, number])
    },
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000, // cache 5 min — road geometry doesn't change
    retry: 1,
    gcTime: 10 * 60 * 1000,
  })
}

// Renders one route line: road-following when the OSRM fetch succeeds,
// straight dashed line (clearly marked) while loading / on error.
/**
 * Two lines per trip: the road still to drive (dashed, from where the
 * technician is now to the job) and the road already driven (solid).
 *
 * The driven line starts at the trip's en-route time and nothing earlier. An
 * older version drew a rolling window of GPS history, which put a finished
 * journey on the map next to the live one; scoping it to one trip keeps the
 * path without that confusion. Both lines disappear once the job is ON_SITE.
 */
const ROUTE_AHEAD = '#2563EB'
// Only ever rendered for EN_ROUTE jobs: routeLines drops everything else, so
// there is no arrived/on-site variant to handle here.
function RoutePolyline({ techPos, jobPos }: {
  techPos: [number, number]
  jobPos: [number, number]
}) {
  // Routed from the technician's CURRENT position, so the blue line shortens as
  // they drive and re-routes on its own if they take a different road. No
  // deviation detection needed: the origin moving IS the deviation.
  const { data: roadCoords, isLoading } = useRoadRoute(techPos, jobPos)
  const color = ROUTE_AHEAD

  if (isLoading || !roadCoords) {
    // Straight line while OSRM is loading or unreachable. Dashed and faint so it
    // never passes for a real road route.
    return <Line positions={[techPos, jobPos]} color={color} weight={2} opacity={0.4} dash="4 6" />
  }

  return (
    <>
      {/* Subtle halo for contrast against map tiles */}
      <Line positions={roadCoords} color="#fff" weight={7} opacity={0.6} />
      {/* Still to drive */}
      <Line positions={roadCoords} color={color} weight={3.5} opacity={0.9} dash="10 6" />
    </>
  )
}

const dispatchMapView = createMapViewStore('dispatch')

// ─── Van inventory summary (inside technician popup) ─────────────────────────────
function VanInventorySummary({ technicianId }: { technicianId: string }) {
  const { data: locations } = useLocations()
  const vanLocation = locations?.find(l => l.type === 'VAN' && l.technicianId === technicianId)
  const { data: stockData } = useLocationStock(vanLocation?.id, { limit: 100 })
  const [expanded, setExpanded] = useState(false)

  if (!vanLocation || !stockData) return null
  const items = stockData.data ?? []
  const lowStock = items.filter(sl => sl.inventoryItem && decimalToNumber(sl.quantity) <= (sl.inventoryItem.reorderPoint ?? 0)).length

  return (
    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 6, marginTop: 6 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontWeight: 600, color: '#374151', fontSize: 11 }}>
          📦 Van Stock: {items.length} items
          {lowStock > 0 && <span style={{ color: '#dc2626', marginLeft: 4 }}>· {lowStock} low</span>}
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && items.length > 0 && (
        <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto' }}>
          {items.slice(0, 15).map(sl => {
            const qty = decimalToNumber(sl.quantity)
            const isLow = sl.inventoryItem && qty <= (sl.inventoryItem.reorderPoint ?? 0)
            return (
              <div key={sl.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: 10, color: isLow ? '#dc2626' : '#374151' }}>
                <span>{sl.inventoryItem?.name ?? 'Unknown'}</span>
                <span style={{ fontWeight: 600 }}>{qty}</span>
              </div>
            )
          })}
          {items.length > 15 && <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>+{items.length - 15} more</div>}
        </div>
      )}
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────────
interface Props {
  technicians: Technician[]
  assignedJobs: Job[]
  unassignedJobs: Job[]
  assignmentByJobId: Record<string, DispatchAssignment | undefined>
  /** Every assignment across the board, not one per job. Workload must count
   *  each crew member; the lead-only map would undercount a helper to zero. */
  allAssignments: DispatchAssignment[]
  loginMap?: Record<string, string>
  onOpenJob?: (job: Job, assignment?: DispatchAssignment) => void
  onSmartAssign?: (job: Job) => void
  onAssign?: (jobId: string, techId: string) => void
  isAssigning?: boolean
  smartAssigningJobId?: string | null
  smartSuggestions?: ScoredTechnician[] | null
}

// ─── Layer toggle keys ────────────────────────────────────────────────────────────
type LayerKey = 'liveTechs' | 'staleTechs' | 'assignedJobs' | 'unassignedJobs' | 'routes'

const LAYERS: { key: LayerKey; label: string; color: string; group: 'Technicians' | 'Jobs' | 'Extras' }[] = [
  { key: 'liveTechs',      label: 'Live',              color: '#10b981', group: 'Technicians' },
  { key: 'staleTechs',     label: 'Not seen for 8 h+', color: '#f59e0b', group: 'Technicians' },
  { key: 'assignedJobs',   label: 'Booked',            color: '#6366f1', group: 'Jobs' },
  { key: 'unassignedJobs', label: 'Need a technician', color: '#ef4444', group: 'Jobs' },
  { key: 'routes',         label: 'Routes',            color: '#8b5cf6', group: 'Extras' },
]
const DEFAULT_LAYERS: Record<LayerKey, boolean> = { liveTechs: true, staleTechs: true, assignedJobs: true, unassignedJobs: true, routes: true }
const isScope = (v: unknown): v is ScopeFilter => v === 'today' || v === 'week' || v === 'all'
const isLayers = (v: unknown): v is Record<LayerKey, boolean> =>
  !!v && typeof v === 'object' && LAYERS.every(l => typeof (v as Record<string, unknown>)[l.key] === 'boolean')
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'

// ─── Main component ──────────────────────────────────────────────────────────────
export default function DispatchMap({
  technicians,
  assignedJobs,
  unassignedJobs,
  assignmentByJobId,
  allAssignments,
  loginMap = {},
  onOpenJob,
  onSmartAssign,
  onAssign,
  isAssigning,
  smartAssigningJobId,
}: Props) {
  // Remembered across pages, tabs and windows: what the dispatcher set up stays set up.
  const [scope, setScope] = usePersistentState<ScopeFilter>('dispatch.scope', 'all', isScope)
  // "Job details" mode: every plotted job shows a permanent floating detail bar
  // (same info as its click popup) so the whole board is readable at a glance.
  const [showDetails, setShowDetails] = usePersistentState<boolean>('dispatch.labels', false, isBool)
  const [layers, setLayers] = usePersistentState<Record<LayerKey, boolean>>('dispatch.layers', DEFAULT_LAYERS, isLayers)
  const [panelOpen, setPanelOpen] = usePersistentState<boolean>('dispatch.panelOpen', true, isBool)
  const [keyOpen, setKeyOpen] = useState(false)

  const toggleLayer = (key: LayerKey) => setLayers(l => ({ ...l, [key]: !l[key] }))

  // ── Compute availability per tech ──────────────────────────────────────────────
  const techsWithAvail = useMemo(() =>
    technicians.map(t => ({
      t,
      tier: getTechAvailability(t, loginMap[t.userId]) as AvailTier,
    })), [technicians, loginMap])

  // ── Classify techs by live vs stale ───────────────────────────────────────────
  const liveTechs  = useMemo(() => techsWithAvail.filter(x => AVAIL[x.tier].isLive  && x.t.currentLocation), [techsWithAvail])
  const staleTechs = useMemo(() => techsWithAvail.filter(x => !AVAIL[x.tier].isLive && x.t.currentLocation), [techsWithAvail])

  // ── Workload per tech ──────────────────────────────────────────────────────────
  // Counts EVERY crew member's assignment, not one per job. Using
  // assignmentByJobId here would see only the lead, so a helper working three
  // jobs would show a workload of zero and be ranked as completely free.
  const activeJobCountByTech = useMemo(() => {
    const m: Record<string, number> = {}
    allAssignments.forEach(a => {
      if (a && ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)) {
        m[a.technicianId] = (m[a.technicianId] ?? 0) + 1
      }
    })
    return m
  }, [allAssignments])

  // ── Scope-filtered jobs ────────────────────────────────────────────────────────
  const scopedAssigned   = useMemo(() => assignedJobs.filter(j => jobInScope(j, scope)), [assignedJobs, scope])
  const scopedUnassigned = useMemo(() => unassignedJobs.filter(j => jobInScope(j, scope)), [unassignedJobs, scope])

  // ── Jobs with coords ───────────────────────────────────────────────────────────
  const assignedWithCoords   = useMemo(() => scopedAssigned.flatMap(j => { const c = parseCoords(j); return c ? [{ j, c }] : [] }), [scopedAssigned])
  const unassignedWithCoords = useMemo(() => scopedUnassigned.flatMap(j => { const c = parseCoords(j); return c ? [{ j, c }] : [] }), [scopedUnassigned])

  // ── Jobs without coords (warning) ─────────────────────────────────────────────
  const missingCoords = useMemo(() =>
    [...scopedAssigned, ...scopedUnassigned].filter(j => !parseCoords(j)).length
  , [scopedAssigned, scopedUnassigned])

  // ── Routing lines: one per JOB, drawn from the lead ─────────────────────────
  // Deliberately iterates the lead-only map. Using allAssignments would draw one
  // line per crew member, stacking three identical lines to the same pin.
  const routeLines = useMemo(() => {
    const lines: {
      techPos: [number, number]; jobPos: [number, number]
      technicianId: string; enRouteAt: string | null
    }[] = []
    Object.values(assignmentByJobId).forEach(a => {
      if (!a) return
      const job = [...assignedJobs, ...unassignedJobs].find(j => j.id === a.jobId)
      if (!job) return

      // Gate on the JOB's status, falling back to the assignment's.
      //
      // These two drift: marking a job EN_ROUTE through job-service does not
      // touch scheduling's assignment row, so keying only on the assignment
      // meant a job the whole rest of the app showed as EN_ROUTE had no route
      // line at all. The job status is what the lead controls and what the
      // customer is told, so it wins.
      const effective = ['EN_ROUTE', 'ON_SITE'].includes(job.status) ? job.status : a.status

      // Only while they are still driving. Once the job is ON_SITE (the status
      // behind the technician app's "Arrived" button) the route has served its
      // purpose, and leaving it up clutters the map with lines to jobs nobody
      // is travelling to any more. The technician marker still shows them at
      // the job, so nothing is lost by dropping the line.
      if (effective !== 'EN_ROUTE') return

      const tech = technicians.find(t => t.id === a.technicianId)
      if (!tech?.currentLocation) return
      const coords = parseCoords(job)
      if (!coords) return

      lines.push({
        techPos: [tech.currentLocation.lat, tech.currentLocation.lng],
        jobPos:  [coords.lat, coords.lng],
        technicianId: a.technicianId,
        enRouteAt: a.enRouteAt ?? null,
      })
    })

    // One line per technician: nobody drives to two places at once. A job left
    // in EN_ROUTE because it was never marked arrived would otherwise keep its
    // route on the map forever, alongside the real one. Most recent trip wins;
    // an assignment with no enRouteAt loses to one that has it.
    const latestByTech = new Map<string, typeof lines[number]>()
    for (const line of lines) {
      const held = latestByTech.get(line.technicianId)
      if (!held) { latestByTech.set(line.technicianId, line); continue }
      const t = line.enRouteAt ? new Date(line.enRouteAt).getTime() : -Infinity
      const h = held.enRouteAt ? new Date(held.enRouteAt).getTime() : -Infinity
      if (t > h) latestByTech.set(line.technicianId, line)
    }
    return [...latestByTech.values()]
  }, [assignmentByJobId, technicians, assignedJobs, unassignedJobs])

  // ── All map points for auto-fit ────────────────────────────────────────────────
  const allPoints = useMemo((): [number, number][] => {
    const pts: [number, number][] = []
    techsWithAvail.forEach(({ t }) => { if (t.currentLocation) pts.push([t.currentLocation.lat, t.currentLocation.lng]) })
    assignedWithCoords.forEach(({ c }) => pts.push([c.lat, c.lng]))
    unassignedWithCoords.forEach(({ c }) => pts.push([c.lat, c.lng]))
    return pts
  }, [techsWithAvail, assignedWithCoords, unassignedWithCoords])

  // ── Default center ─────────────────────────────────────────────────────────────
  const defaultCenter: [number, number] = allPoints.length > 0 ? allPoints[0] : [6.9271, 79.8612]

  // ── Summary stats ──────────────────────────────────────────────────────────────

  const onlineCount   = liveTechs.length
  const staleCount    = staleTechs.length
  const noGPSTechs    = technicians.filter(t => !t.currentLocation).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Map ─────────────────────────────────────────────────────────────────── */}
      {/* zIndex: 0 traps the Leaflet panes/controls in their own stacking context
          so page modals (z-index 1000 at the root) always paint above the map */}
      {/* flex:1 rather than a fixed height. At 560px the stats row, the two
          control rows and the map together overflowed this card, which sets
          overflow:hidden — and because Leaflet's container is focusable,
          clicking the map scrolled it into view, pushing the stat cards out of
          sight with no scrollbar to bring them back. Filling the space leaves
          nothing to scroll. minHeight keeps it usable on short windows. */}
      <div style={{ position: 'relative', zIndex: 0, overflow: 'hidden', flex: 1, minHeight: 280 }}>
        {/* What's on the map: a small panel floating on it, below the map's own top-left
            control (Google's Map/Satellite, Leaflet's zoom). Folds into a pill. */}
        <div className="dm-panel" style={{ position: 'absolute', left: 10, top: 84, zIndex: 1000 }}>
          {panelOpen ? (
            <div style={{ width: 196, background: 'var(--bg-card)', color: 'var(--t1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 8, boxShadow: '0 8px 24px rgba(15,23,42,.18)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 6px' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>On the map</span>
                <button type="button" onClick={() => setPanelOpen(false)} aria-label="Fold the map panel" className="dm-icon-btn"><ChevronUp size={14} /></button>
              </div>
              <div role="radiogroup" aria-label="Which dates" style={{ display: 'flex', background: 'var(--bg-card-2)', borderRadius: 8, padding: 2, marginBottom: 4 }}>
                {(['today', 'week', 'all'] as ScopeFilter[]).map(sc => (
                  <button key={sc} type="button" role="radio" aria-checked={scope === sc} onClick={() => setScope(sc)}
                    style={{ flex: 1, border: 0, borderRadius: 6, padding: '5px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: scope === sc ? 'var(--bg-card)' : 'transparent', color: scope === sc ? 'var(--t1)' : 'var(--t3)',
                      boxShadow: scope === sc ? '0 1px 2px rgba(0,0,0,.12)' : 'none' }}>
                    {sc === 'today' ? 'Today' : sc === 'week' ? 'Week' : 'All'}
                  </button>
                ))}
              </div>
              {(['Technicians', 'Jobs', 'Extras'] as const).map(group => (
                <div key={group}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', padding: '5px 6px 1px' }}>{group}</div>
                  {LAYERS.filter(l => l.group === group).map(({ key, label, color }) => {
                    const count = key === 'liveTechs' ? onlineCount : key === 'staleTechs' ? staleCount : key === 'assignedJobs' ? scopedAssigned.length : key === 'unassignedJobs' ? scopedUnassigned.length : null
                    return (
                      <label key={key} className="dm-layer" style={{ opacity: layers[key] ? 1 : 0.55 }}>
                        <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} />
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{label}</span>
                        {count !== null && <b style={{ fontSize: 12 }}>{count}</b>}
                      </label>
                    )
                  })}
                  {group === 'Extras' && (
                    <label className="dm-layer" style={{ opacity: showDetails ? 1 : 0.55 }}>
                      <input type="checkbox" checked={showDetails} onChange={() => setShowDetails(v => !v)} />
                      <span style={{ flex: 1 }}>Labels on every job</span>
                    </label>
                  )}
                </div>
              ))}
              {(missingCoords > 0 || noGPSTechs > 0) && (
                <div style={{ fontSize: 10.5, color: 'var(--amber)', padding: '6px 6px 2px', lineHeight: 1.4 }}>
                  {missingCoords > 0 && <div>{missingCoords} job{missingCoords !== 1 ? 's' : ''} not shown (no location)</div>}
                  {noGPSTechs > 0 && <div style={{ color: 'var(--t3)' }}>{noGPSTechs} technician{noGPSTechs !== 1 ? 's' : ''} without GPS</div>}
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setPanelOpen(true)} className="dm-pill" aria-label="Show the map panel">
              <Layers size={13} /> {scope === 'today' ? 'Today' : scope === 'week' ? 'This week' : 'All'} · {LAYERS.filter(l => layers[l.key]).length} on <ChevronDown size={13} />
            </button>
          )}
        </div>

        {/* Map key, on demand instead of a legend row that got cut off */}
        <div style={{ position: 'absolute', left: 10, bottom: 28, zIndex: 1000 }}>
          {keyOpen && (
            <div style={{ marginBottom: 6, width: 250, background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)', borderRadius: 12, padding: '10px 12px', boxShadow: '0 8px 24px rgba(15,23,42,.18)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b style={{ fontSize: 12, color: 'var(--t1)' }}>Map key</b>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                {(['ONLINE','AVAILABLE','AWAY','OFFLINE'] as AvailTier[]).map(tier => (
                  <span key={tier} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: AVAIL[tier].color }} />{AVAIL[tier].label}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, borderTop: `3.5px solid ${ROUTE_DRIVEN}` }} /> Driven so far</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, borderTop: `2.5px dashed ${ROUTE_AHEAD}` }} /> Still to drive</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                {(['hvac', 'plumbing', 'electrical', 'agreement'] as Trade[]).map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: TRADE_COLOR[t] }} />{TRADE_LABEL[t]}</span>
                ))}
              </div>
              <span style={{ color: 'var(--t3)', lineHeight: 1.45 }}>The badge shows the stage ({Object.values(STAGE_LABEL).join(', ')}). A dashed pin has nobody yet; a red pulse is an emergency.</span>
            </div>
          )}
          <button type="button" className="dm-pill" aria-expanded={keyOpen} onClick={() => setKeyOpen(v => !v)}><Info size={13} /> Map key</button>
        </div>

        <BaseMap center={defaultCenter} zoom={12} fit={allPoints} viewStore={dispatchMapView}>
          {/* ── Routing lines (road-following via OSRM) ────────────────────── */}
          {layers.routes && routeLines.map(({ techPos, jobPos, technicianId }) => (
            <RoutePolyline key={`route-${technicianId}`} techPos={techPos} jobPos={jobPos} />
          ))}
          {/* Drawn after the route ahead so the driven path sits on top. */}
          {layers.routes && routeLines.map(({ techPos, technicianId, enRouteAt }) => (
            <TripTrail key={`trip-${technicianId}-${enRouteAt ?? 'none'}`} technicianId={technicianId} enRouteAt={enRouteAt} techPos={techPos} />
          ))}

          {/* ── Live technicians: round photo, ring of job slots, glide while driving ── */}
          {layers.liveTechs && liveTechs.map(({ t, tier }) => {
            const loc = t.currentLocation!
            const workload = activeJobCountByTech[t.id] ?? 0
            const secondsAgo = t.locationUpdatedAt
              ? Math.round((Date.now() - new Date(t.locationUpdatedAt).getTime()) / 1000) : null
            const ageLabel = !secondsAgo ? null
              : secondsAgo < 60 ? `${secondsAgo}s ago`
              : secondsAgo < 3600 ? `${Math.floor(secondsAgo / 60)}m ago`
              : `${Math.floor(secondsAgo / 3600)}h ago`

            return (
              <TechPin
                key={`tech-live-${t.id}`}
                position={[loc.lat, loc.lng]}
                name={t.name} avatarUrl={t.avatarUrl} color={AVAIL[tier].color}
                workload={workload} maxJobs={t.maxDailyJobs}
                speedKmh={t.speedKmh} headingDeg={t.headingDeg}
                popupWidth={240}
                popup={
    <div style={{ fontSize: 12, minWidth: 190 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>{t.name}</strong>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: AVAIL[tier].color + '20', color: AVAIL[tier].color, borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: AVAIL[tier].color }} />
          {AVAIL[tier].label.toUpperCase()}
        </span>
      </div>
      {t.phone && <div style={{ color: '#6b7280', marginBottom: 3 }}>{t.phone}</div>}
      {t.speedKmh !== undefined && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4, background: t.speedKmh > 3 ? '#DBEAFE' : '#F3F4F6', color: t.speedKmh > 3 ? '#1D4ED8' : '#6B7280', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
          {t.speedKmh > 3 ? `● MOVING · ${t.speedKmh.toFixed(0)} km/h` : '○ STATIONARY'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: '#374151' }}>⭐ {t.rating.toFixed(1)}</span>
        <span style={{ color: workload >= t.maxDailyJobs ? '#ef4444' : '#374151' }}>
          📋 {workload}/{t.maxDailyJobs} jobs
        </span>
        {t.batteryPct !== undefined && (
          <span style={{ color: t.batteryPct < 20 ? '#ef4444' : '#374151' }}>🔋 {t.batteryPct}%</span>
        )}
      </div>
      {t.skills?.length > 0 && (
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{t.skills.join(', ')}</div>
      )}
      {ageLabel && <div style={{ color: '#9ca3af', fontSize: 10 }}>GPS updated {ageLabel}</div>}
      <VanInventorySummary technicianId={t.id} />
    </div>
                }
              />
            )
          })}

          {/* ── Stale technicians (no recent GPS) ───────────────────────────────── */}
          {layers.staleTechs && staleTechs.map(({ t, tier }) => {
            const loc = t.currentLocation!
            const workload = activeJobCountByTech[t.id] ?? 0
            const signals = [t.lastSeenAt, t.locationUpdatedAt].filter(Boolean).map(d => new Date(d!).getTime())
            const staleAgo = signals.length
              ? (() => {
                  const mins = (Date.now() - Math.max(...signals)) / 60000
                  return mins < 60 ? `${Math.round(mins)}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : 'Over a day ago'
                })()
              : 'Unknown'

            return (
              <TechPin
                key={`tech-stale-${t.id}`}
                position={[loc.lat, loc.lng]}
                name={t.name} avatarUrl={t.avatarUrl} color={AVAIL[tier].color}
                workload={workload} maxJobs={t.maxDailyJobs} stale
                popupWidth={220}
                popup={
    <div style={{ fontSize: 12, minWidth: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>{t.name}</strong>
        <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
          {AVAIL[tier].label.toUpperCase()}
        </span>
      </div>
      {t.phone && <div style={{ color: '#6b7280', marginBottom: 4 }}>{t.phone}</div>}
      <div style={{ color: '#9ca3af', fontSize: 10, fontStyle: 'italic' }}>Last seen: {staleAgo}</div>
      <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>⚠ Stale location — may have moved</div>
    </div>
                }
              />
            )
          })}

          {/* ── Assigned job markers ──────────────────────────────────────────── */}
          {layers.assignedJobs && assignedWithCoords.map(({ j: job, c }) => {
            const assignment = assignmentByJobId[job.id]
            const tech = technicians.find(t => t.id === assignment?.technicianId)
            const techName = tech?.name ?? assignment?.technicianName ?? job.assignedToName ?? '—'
            const stage = stageOf(job, true, assignment?.status)

            return (
              <Pin
                key={`assigned-${job.id}`}
                position={[c.lat, c.lng]}
                html={jobPinHtml(tradeOf(job), stage, urgencyOf(job.priority))}
                width={JOB_PIN.width} height={JOB_PIN.height} anchor={[JOB_PIN.anchorX, JOB_PIN.anchorY]}
                popupWidth={240}
                label={showDetails ? (
                  <>
                    <div className="t">{job.title}</div>
                    {job.customerName && <div className="s">{job.customerName}</div>}
                    <div style={{ color: STAGE_COLOR[stage], fontWeight: 600 }}>
                      {STAGE_LABEL[stage]} · {techName}
                    </div>
                  </>
                ) : undefined}
                popup={
    <div style={{ fontSize: 12, minWidth: 190 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{job.title}</div>
      <div style={{ color: '#6b7280', marginBottom: 2 }}>{job.customerName ?? '—'}</div>
      <div style={{ color: '#6b7280', marginBottom: 6, fontSize: 11 }}>{job.serviceAddress ?? '—'}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ background: (PRIORITY_COLOR[job.priority] ?? '#f59e0b') + '20', color: PRIORITY_COLOR[job.priority] ?? '#f59e0b', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          {job.priority}
        </span>
        {assignment && (
          <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
            {assignment.status === 'EN_ROUTE' ? '🚗 En Route' : assignment.status === 'ON_SITE' ? '🔧 On Site' : '✓ Assigned'}
          </span>
        )}
      </div>
      <div style={{ color: '#10b981', fontWeight: 600, fontSize: 11, marginBottom: 8 }}>Technician: {techName}</div>
      {onOpenJob && (
        <button
          onClick={() => onOpenJob(job, assignment)}
          style={{ width: '100%', padding: '6px 0', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          View Job Details →
        </button>
      )}
    </div>
                }
              />
            )
          })}

          {/* ── Unassigned job markers ────────────────────────────────────────── */}
          {layers.unassignedJobs && unassignedWithCoords.map(({ j: job, c }) => {
            const isAssigningThis = smartAssigningJobId === job.id
            return (
              <Pin
                key={`unassigned-${job.id}`}
                position={[c.lat, c.lng]}
                html={jobPinHtml(tradeOf(job), 'unassigned', urgencyOf(job.priority))}
                width={JOB_PIN.width} height={JOB_PIN.height} anchor={[JOB_PIN.anchorX, JOB_PIN.anchorY]}
                popupWidth={250}
                label={showDetails ? (
                  <>
                    <div className="t">{job.title}</div>
                    {job.customerName && <div className="s">{job.customerName}</div>}
                    <div style={{ color: STAGE_COLOR.unassigned, fontWeight: 600 }}>
                      ! Unassigned · {job.priority}
                    </div>
                  </>
                ) : undefined}
                popup={
    <div style={{ fontSize: 12, minWidth: 200 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{job.title}</div>
      <div style={{ color: '#6b7280', marginBottom: 2 }}>{job.customerName ?? '—'}</div>
      <div style={{ color: '#6b7280', marginBottom: 6, fontSize: 11 }}>{job.serviceAddress ?? '—'}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <span style={{ background: (PRIORITY_COLOR[job.priority] ?? '#f59e0b') + '20', color: PRIORITY_COLOR[job.priority] ?? '#f59e0b', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
          {job.priority}
        </span>
        <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>
          Awaiting assignment
        </span>
      </div>

      {/* Quick manual assign */}
      {onAssign && technicians.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Manual Assign:</div>
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { onAssign(job.id, e.target.value); e.target.value = '' } }}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 11, cursor: 'pointer', background: 'white' }}
          >
            <option value="" disabled>Select technician…</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({activeJobCountByTech[t.id] ?? 0}/{t.maxDailyJobs})</option>
            ))}
          </select>
        </div>
      )}

      {/* Smart assign button */}
      <div style={{ display: 'flex', gap: 6 }}>
        {onSmartAssign && (
          <button
            onClick={() => onSmartAssign(job)}
            disabled={isAssigning || isAssigningThis}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: 0, cursor: 'pointer',
              background: isAssigningThis ? '#fde68a' : 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: 'white', fontSize: 11, fontWeight: 700,
            }}
          >
            {isAssigningThis ? '⏳ Assigning…' : '⚡ Smart Assign'}
          </button>
        )}
        {onOpenJob && (
          <button
            onClick={() => onOpenJob(job)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Details
          </button>
        )}
      </div>
    </div>
                }
              />
            )
          })}
        </BaseMap>
      </div>

    </div>
  )
}
