/**
 * PlannerMap — Leaflet map for the Day Planner. Lazy-loaded to keep Leaflet
 * out of the main bundle.
 *
 * Pin legend:
 *   solid blue    = job assigned for the selected day
 *   hollow grey   = job on the selected day, not yet assigned
 *   solid green   = agreement job, assigned
 *   hollow green  = agreement job, not yet assigned
 *   amber ring    = opportunity — agreement visit due within 5 days that
 *                   could be pulled forward onto this day
 *   tech          = circular marker with initials
 */
import { useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Job, Technician } from '../../types/api'
import type { Agreement } from '../../hooks/useAgreements'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

// Styling for the always-on "Job details" floating bars (permanent tooltips).
// Injected once at module level — Leaflet renders tooltips outside the React tree.
;(() => {
  if (typeof document === 'undefined') return
  const id = 'planner-tip-styles'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `
    .planner-tip {
      background: white; border: 1px solid #e2e8f0; border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18); padding: 6px 9px;
      font: 500 11px/1.45 sans-serif; color: #334155;
      max-width: 220px; white-space: normal;
    }
    .planner-tip.leaflet-tooltip-top::before { border-top-color: white; }
    .planner-tip .pt-title { font-weight: 700; font-size: 11.5px; color: #0f172a; }
    .planner-tip .pt-sub { color: #64748b; }
  `
  document.head.appendChild(style)
})()

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

function dotIcon(color: string, ring = false) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4)${ring ? `,0 0 0 4px ${color}44` : ''};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// Hollow variant: white core with a thick colored border — reads as "needs
// action" next to the solid "handled" pins of the same hue.
function hollowIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:white;border:4px solid ${color};
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function pinIcon(kind: PlannerJobPin['kind']) {
  switch (kind) {
    case 'assigned':             return dotIcon('#3b82f6')
    case 'unassigned':           return hollowIcon('#9ca3af')
    case 'agreement-assigned':   return dotIcon('#10b981')
    case 'agreement-unassigned': return hollowIcon('#10b981')
  }
}

function techIcon(name: string) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:#1e293b;color:white;border:2px solid #3b82f6;
      display:flex;align-items:center;justify-content:center;
      font:700 10px sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.4);
    ">${initials}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

// Remember where the user left the map (pan/zoom) for the whole session, so
// navigating to another page and back doesn't reset their view.
let savedView: { center: [number, number]; zoom: number } | null = null

function ViewKeeper() {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter()
      savedView = { center: [c.lat, c.lng], zoom: map.getZoom() }
    },
  })
  return null
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useMemo(() => {
    // The user has a view they chose — restore it instead of auto-fitting.
    if (savedView) {
      map.setView(savedView.center, savedView.zoom, { animate: false })
      return
    }
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    map.fitBounds(L.latLngBounds(points.map(p => L.latLng(p[0], p[1]))), { padding: [40, 40] })
  }, [map, JSON.stringify(points)]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Two base layers the dispatcher can flip between: street tiles for context,
// satellite imagery for eyeballing roofs/yards before sending a tech.
const BASE_LAYERS = {
  street: {
    label: 'Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
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
  // "Job details" mode: every job/opportunity pin shows a permanent floating
  // detail bar (same info as the click popup) so the whole day is readable at a glance.
  const [showDetails, setShowDetails] = useState(false)
  const techPins = technicians.filter(t => t.currentLocation)
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
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1001, display: 'flex', gap: 8 }}>
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
      </div>

    <MapContainer
      center={[6.9271, 79.8612]}
      zoom={11}
      style={{ width: '100%', height: '100%', borderRadius: 'var(--r-md)' }}
    >
      {/* key forces a clean TileLayer remount when the base layer flips */}
      <TileLayer
        key={baseLayer}
        attribution={BASE_LAYERS[baseLayer].attribution}
        url={BASE_LAYERS[baseLayer].url}
      />
      <FitBounds points={allPoints} />
      <ViewKeeper />

      {jobPins.map(p => (
        // key includes showDetails: react-leaflet doesn't reliably unbind a permanent
        // Tooltip removed from a live Marker, so remount the Marker on toggle
        <Marker key={`${p.job.id}-${showDetails}`} position={[p.lat, p.lng]} icon={pinIcon(p.kind)}>
          {showDetails && (
            <Tooltip permanent direction="top" offset={[0, -12]} className="planner-tip" key={`tip-${p.job.id}`}>
              <div className="pt-title">{p.job.title}</div>
              {p.job.customerName && <div className="pt-sub">{p.job.customerName}</div>}
              <div style={{ color: p.job.assignedToName ? '#059669' : '#d97706', fontWeight: 600 }}>
                {p.job.assignedToName ? `✓ ${p.job.assignedToName}` : 'Unassigned'}
                {p.job.isAgreementJob ? ' · Agreement' : ''}
              </div>
            </Tooltip>
          )}
          <Popup>
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
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  View details
                </button>
                <button
                  onClick={() => onSelectJob(p.job)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1',
                    background: 'white', color: '#334155', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {p.job.assignedToName ? 'Reassign' : 'Assign'}
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {opportunityPins.map(p => (
        <Marker key={`${p.agreement.id}-${showDetails}`} position={[p.lat, p.lng]} icon={dotIcon('#f59e0b', true)}>
          {showDetails && (
            <Tooltip permanent direction="top" offset={[0, -12]} className="planner-tip" key={`tip-${p.agreement.id}`}>
              <div className="pt-title">
                {p.agreement.customer ? `${p.agreement.customer.firstName} ${p.agreement.customer.lastName}` : p.agreement.name}
              </div>
              <div className="pt-sub">{p.agreement.serviceType ?? p.agreement.name}</div>
              <div style={{ color: '#d97706', fontWeight: 600 }}>
                Opportunity · due in {p.dueInDays}d
              </div>
            </Tooltip>
          )}
          <Popup>
            <div style={{ fontSize: 13, minWidth: 190 }}>
              <strong>Nearby opportunity</strong>
              <div style={{ margin: '4px 0' }}>
                {p.agreement.customer?.firstName} {p.agreement.customer?.lastName} — {p.agreement.serviceType ?? p.agreement.name}
              </div>
              <div style={{ color: '#666' }}>Service due in {p.dueInDays} day{p.dueInDays === 1 ? '' : 's'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={() => onViewOpportunity(p.agreement)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  View details
                </button>
                <button
                  onClick={() => onSelectOpportunity(p.agreement)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: '#f59e0b', color: 'white', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Offer to pull forward
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {techPins.map(t => (
        <Marker
          key={t.id}
          position={[t.currentLocation!.lat, t.currentLocation!.lng]}
          icon={techIcon(t.name)}
        >
          <Popup>
            <div style={{ fontSize: 13 }}>
              <strong>{t.name}</strong>
              <div style={{ color: '#666' }}>Technician</div>
              <button
                onClick={() => onSelectTech(t)}
                style={{
                  marginTop: 6, padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer',
                }}
              >
                View day
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </div>
  )
}
