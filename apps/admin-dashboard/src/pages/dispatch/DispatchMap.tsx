/**
 * DispatchMap — operational map for technicians and jobs.
 * Lazy-loaded from DispatchBoard to avoid loading Leaflet on initial page load.
 *
 * Features:
 *  1. Auto-fit bounds on load
 *  2. Technician pins color-coded by availability tier (ONLINE/AVAILABLE/AWAY/OFFLINE)
 *  3. Quick-assign from unassigned job popups
 *  4. Missing-coordinates warning badge
 *  5. Workload badge on technician markers
 *  6. Job priority coloring
 *  7. Today / Week / All scope toggle
 *  8. Routing lines (EN_ROUTE = dashed, ON_SITE = solid)
 *  Plus: toggleable map layers (live techs, stale techs, assigned jobs, unassigned jobs, routes)
 */

import { useState, useMemo, useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, Polyline, useMap } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DispatchAssignment, Job, ScoredTechnician, Technician } from '../../types/api'
import { useLocations, useLocationStock, decimalToNumber } from '../../hooks/useInventory'

// Fix default marker icon (Leaflet + bundler issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// ─── CSS animations (module-level — must run outside React tree for Leaflet) ─────
;(() => {
  if (typeof document === 'undefined') return
  const id = 'dmap-animations'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    @keyframes dmap-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
      50%      { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
    }
    .dmap-online-ring { animation: dmap-pulse 1.8s ease-in-out infinite; }
    @keyframes dmap-pop { from { transform: scale(0.6) translateY(4px); opacity:0; } to { transform: scale(1) translateY(0); opacity:1; } }
    .dmap-marker { animation: dmap-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
    .dmap-tip {
      background: white; border: 1px solid #e2e8f0; border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18); padding: 6px 9px;
      font: 500 11px/1.45 sans-serif; color: #334155;
      max-width: 220px; white-space: normal;
    }
    .dmap-tip.leaflet-tooltip-top::before { border-top-color: white; }
    .dmap-tip .dt-title { font-weight: 700; font-size: 11.5px; color: #0f172a; }
    .dmap-tip .dt-sub { color: #64748b; }
  `
  document.head.appendChild(style)
})()

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
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)
  return d >= now || d.toDateString() === now.toDateString()
}

// ─── Coordinate helpers ──────────────────────────────────────────────────────────
function parseCoords(job: Job): { lat: number; lng: number } | null {
  if (!job.serviceLatitude || !job.serviceLongitude) return null
  const lat = Number.parseFloat(job.serviceLatitude)
  const lng = Number.parseFloat(job.serviceLongitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

// ─── Custom marker factories ─────────────────────────────────────────────────────

function techIcon(tier: AvailTier, workload: number, maxJobs: number): L.DivIcon {
  const c = AVAIL[tier].color
  const isOnline = tier === 'ONLINE'
  const pct = maxJobs > 0 ? Math.round((workload / maxJobs) * 100) : 0
  const wColor = pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
  return L.divIcon({
    className: '',
    iconSize: [40, 46],
    iconAnchor: [20, 46],
    popupAnchor: [0, -46],
    html: `<div class="dmap-marker" style="position:relative;width:40px;height:46px;">
      <div class="${isOnline ? 'dmap-online-ring' : ''}" style="
        width:36px;height:36px;border-radius:50%;
        background:${c};border:2.5px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.22);
        display:flex;align-items:center;justify-content:center;
        position:absolute;top:0;left:2px;
      ">
        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white' stroke='white' stroke-width='1'>
          <circle cx='12' cy='8' r='4'/><path d='M20 21a8 8 0 0 0-16 0'/>
        </svg>
      </div>
      <!-- tail -->
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:10px solid ${c};"></div>
      <!-- workload badge -->
      <div style="
        position:absolute;top:-4px;right:-2px;
        background:${wColor};color:white;
        font-size:9px;font-weight:700;
        width:16px;height:16px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);
      ">${workload}</div>
    </div>`,
  })
}

function jobIcon(priority: string, assigned: boolean, status?: string): L.DivIcon {
  const pc = PRIORITY_COLOR[priority] ?? '#f59e0b'
  const fill = assigned ? pc : 'white'
  const stroke = pc
  const isEnRoute = status === 'EN_ROUTE'
  const isOnSite  = status === 'ON_SITE'
  const badge = isEnRoute ? '🚗' : isOnSite ? '🔧' : assigned ? '✓' : '!'
  const ringColor = isOnSite ? '#7c3aed' : isEnRoute ? '#d97706' : assigned ? pc : '#e5e7eb'

  return L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
    html: `<div class="dmap-marker" style="position:relative;width:34px;height:42px;">
      <div style="
        width:30px;height:30px;border-radius:50%;
        background:${fill};border:2.5px solid ${stroke};
        box-shadow:0 2px 8px rgba(0,0,0,0.2),0 0 0 3px ${ringColor}33;
        display:flex;align-items:center;justify-content:center;
        position:absolute;top:0;left:2px;
        font-size:12px;line-height:1;
      ">${badge}</div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:12px solid ${stroke};"></div>
    </div>`,
  })
}

// ─── Road routing via OSRM public API ────────────────────────────────────────────
// OSRM returns GeoJSON [lng, lat] pairs; Leaflet needs [lat, lng].
function useRoadRoute(from: [number, number] | null, to: [number, number] | null) {
  return useQuery<[number, number][] | null>({
    queryKey: ['osrm-route', from, to],
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
function RoutePolyline({
  techPos, jobPos, status,
}: {
  techPos: [number, number]
  jobPos: [number, number]
  status: string
}) {
  const { data: roadCoords, isLoading } = useRoadRoute(techPos, jobPos)
  const isOnSite = status === 'ON_SITE'
  const color = isOnSite ? '#7c3aed' : '#d97706'

  if (isLoading || !roadCoords) {
    // Fallback: straight line while loading or if OSRM unreachable
    return (
      <Polyline
        positions={[techPos, jobPos]}
        pathOptions={{ color, weight: 2, opacity: 0.4, dashArray: '4 6' }}
      />
    )
  }

  return (
    <>
      {/* Subtle halo for contrast against map tiles */}
      <Polyline
        positions={roadCoords}
        pathOptions={{ color: '#fff', weight: 6, opacity: 0.5 }}
      />
      <Polyline
        positions={roadCoords}
        pathOptions={{
          color,
          weight: 3,
          opacity: 0.85,
          dashArray: isOnSite ? undefined : '10 6',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  )
}

// ─── FitBoundsOnLoad — must be rendered inside MapContainer ──────────────────────
function FitBoundsOnLoad({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

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

const LAYERS: { key: LayerKey; label: string; color: string }[] = [
  { key: 'liveTechs',     label: 'Live Techs',      color: '#10b981' },
  { key: 'staleTechs',    label: 'Stale Techs',     color: '#f59e0b' },
  { key: 'assignedJobs',  label: 'Assigned Jobs',   color: '#6366f1' },
  { key: 'unassignedJobs',label: 'Unassigned Jobs', color: '#ef4444' },
  { key: 'routes',        label: 'Routes',          color: '#8b5cf6' },
]

// ─── Main component ──────────────────────────────────────────────────────────────
export default function DispatchMap({
  technicians,
  assignedJobs,
  unassignedJobs,
  assignmentByJobId,
  loginMap = {},
  onOpenJob,
  onSmartAssign,
  onAssign,
  isAssigning,
  smartAssigningJobId,
}: Props) {
  const [scope, setScope] = useState<ScopeFilter>('all')
  // "Job details" mode: every plotted job shows a permanent floating detail bar
  // (same info as its click popup) so the whole board is readable at a glance.
  const [showDetails, setShowDetails] = useState(false)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    liveTechs: true, staleTechs: true,
    assignedJobs: true, unassignedJobs: true,
    routes: true,
  })

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
  const activeJobCountByTech = useMemo(() => {
    const m: Record<string, number> = {}
    Object.values(assignmentByJobId).forEach(a => {
      if (a && ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)) {
        m[a.technicianId] = (m[a.technicianId] ?? 0) + 1
      }
    })
    return m
  }, [assignmentByJobId])

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

  // ── Routing lines: techs with EN_ROUTE / ON_SITE assignments ─────────────────
  const routeLines = useMemo(() => {
    const lines: { techPos: [number, number]; jobPos: [number, number]; status: string }[] = []
    Object.values(assignmentByJobId).forEach(a => {
      if (!a || !['EN_ROUTE', 'ON_SITE'].includes(a.status)) return
      const tech = technicians.find(t => t.id === a.technicianId)
      const job  = [...assignedJobs, ...unassignedJobs].find(j => j.id === a.jobId)
      if (!tech?.currentLocation || !job) return
      const coords = parseCoords(job)
      if (!coords) return
      lines.push({
        techPos: [tech.currentLocation.lat, tech.currentLocation.lng],
        jobPos:  [coords.lat, coords.lng],
        status:  a.status,
      })
    })
    return lines
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Stats row ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Live Techs',      value: onlineCount,                      sub: 'on map · < 8h',   color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Stale Techs',     value: staleCount,                       sub: 'on map · ≥ 8h',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Assigned Jobs',   value: assignedJobs.length,              sub: `${assignedWithCoords.length} plotted`,   color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
          { label: 'Unassigned Jobs', value: unassignedJobs.length,            sub: `${unassignedWithCoords.length} plotted`, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 10, border: `1px solid ${s.border}`, background: s.bg, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Controls row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Scope toggle */}
        <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: 'white' }}>
          {(['today', 'week', 'all'] as ScopeFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 0,
                background: scope === s ? '#2563eb' : 'white',
                color: scope === s ? 'white' : '#6b7280',
                borderRight: s !== 'all' ? '1px solid #e5e7eb' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {s === 'today' ? 'Today' : s === 'week' ? 'This Week' : 'All Jobs'}
            </button>
          ))}
        </div>

        {/* Layer toggles */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LAYERS.map(({ key, label, color }) => {
            const on = layers[key]
            return (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', fontSize: 10, fontWeight: 600,
                  borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${on ? color : '#d1d5db'}`,
                  background: on ? color + '15' : 'white',
                  color: on ? color : '#9ca3af',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? color : '#d1d5db', transition: 'background 0.15s' }} />
                {label}
              </button>
            )
          })}
        </div>

        {/* "Job details" toggle — permanent info bars on every plotted job */}
        <button
          onClick={() => setShowDetails(v => !v)}
          title={showDetails ? 'Hide job detail bars' : 'Show every job\'s details on the map'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', fontSize: 10, fontWeight: 700,
            borderRadius: 20, cursor: 'pointer',
            border: `1.5px solid ${showDetails ? '#2563eb' : '#d1d5db'}`,
            background: showDetails ? '#2563eb' : 'white',
            color: showDetails ? 'white' : '#6b7280',
            transition: 'all 0.15s',
          }}
        >
          Job details {showDetails ? 'ON' : 'OFF'}
        </button>

        {/* Missing coords warning */}
        {missingCoords > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 9px', fontWeight: 600 }}>
            ⚠ {missingCoords} job{missingCoords !== 1 ? 's' : ''} hidden — no coordinates
          </div>
        )}
        {noGPSTechs > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#9ca3af', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 9px', fontWeight: 500 }}>
            {noGPSTechs} tech{noGPSTechs !== 1 ? 's' : ''} without GPS
          </div>
        )}
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────────────── */}
      {/* zIndex: 0 traps the Leaflet panes/controls in their own stacking context
          so page modals (z-index 1000 at the root) always paint above the map */}
      <div style={{ position: 'relative', zIndex: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', height: 560, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          {/* CartoDB Positron — clean, professional, low visual noise */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBoundsOnLoad points={allPoints} />

          {/* ── Routing lines (road-following via OSRM) ────────────────────── */}
          {layers.routes && routeLines.map(({ techPos, jobPos, status }, i) => (
            <RoutePolyline
              key={`route-${i}`}
              techPos={techPos}
              jobPos={jobPos}
              status={status}
            />
          ))}

          {/* ── Live technician markers ───────────────────────────────────────── */}
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
              <Marker
                key={`tech-live-${t.id}`}
                position={[loc.lat, loc.lng]}
                icon={techIcon(tier, workload, t.maxDailyJobs)}
              >
                <Popup maxWidth={240}>
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
                </Popup>
              </Marker>
            )
          })}

          {/* ── Stale technician markers ──────────────────────────────────────── */}
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
              <Marker
                key={`tech-stale-${t.id}`}
                position={[loc.lat, loc.lng]}
                icon={techIcon(tier, workload, t.maxDailyJobs)}
                opacity={0.55}
              >
                <Popup maxWidth={220}>
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
                </Popup>
              </Marker>
            )
          })}

          {/* ── Assigned job markers ──────────────────────────────────────────── */}
          {layers.assignedJobs && assignedWithCoords.map(({ j: job, c }) => {
            const assignment = assignmentByJobId[job.id]
            const tech = technicians.find(t => t.id === assignment?.technicianId)
            const techName = tech?.name ?? assignment?.technicianName ?? job.assignedToName ?? '—'

            return (
              <Marker
                key={`assigned-${job.id}-${showDetails}`}
                position={[c.lat, c.lng]}
                icon={jobIcon(job.priority, true, assignment?.status)}
              >
                {showDetails && (
                  <Tooltip permanent direction="top" offset={[0, -42]} className="dmap-tip">
                    <div className="dt-title">{job.title}</div>
                    {job.customerName && <div className="dt-sub">{job.customerName}</div>}
                    <div style={{ color: '#059669', fontWeight: 600 }}>
                      {assignment?.status === 'EN_ROUTE' ? '🚗 En route' : assignment?.status === 'ON_SITE' ? '🔧 On site' : '✓ Assigned'} · {techName}
                    </div>
                  </Tooltip>
                )}
                <Popup maxWidth={240}>
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
                </Popup>
              </Marker>
            )
          })}

          {/* ── Unassigned job markers ────────────────────────────────────────── */}
          {layers.unassignedJobs && unassignedWithCoords.map(({ j: job, c }) => {
            const isAssigningThis = smartAssigningJobId === job.id
            return (
              <Marker
                key={`unassigned-${job.id}-${showDetails}`}
                position={[c.lat, c.lng]}
                icon={jobIcon(job.priority, false)}
              >
                {showDetails && (
                  <Tooltip permanent direction="top" offset={[0, -42]} className="dmap-tip">
                    <div className="dt-title">{job.title}</div>
                    {job.customerName && <div className="dt-sub">{job.customerName}</div>}
                    <div style={{ color: '#d97706', fontWeight: 600 }}>
                      ! Unassigned · {job.priority}
                    </div>
                  </Tooltip>
                )}
                <Popup maxWidth={250}>
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
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#374151' }}>Technicians:</div>
        {(['ONLINE','AVAILABLE','AWAY','OFFLINE'] as AvailTier[]).map(tier => (
          <span key={tier} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: AVAIL[tier].color, display: 'inline-block' }} />
            {AVAIL[tier].label}
          </span>
        ))}
        <span style={{ width: 1, background: '#e5e7eb', height: 14, alignSelf: 'center' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#374151' }}>Routes:</div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, borderTop: '2px dashed #d97706', display: 'inline-block' }} /> En Route
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, borderTop: '2.5px solid #7c3aed', display: 'inline-block' }} /> On Site
        </span>
        <span style={{ width: 1, background: '#e5e7eb', height: 14, alignSelf: 'center' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#374151' }}>Priority:</div>
        {Object.entries(PRIORITY_COLOR).map(([p, c]) => (
          <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}
