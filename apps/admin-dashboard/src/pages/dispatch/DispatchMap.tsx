/**
 * DispatchMap — operational map for technicians and jobs.
 * Lazy-loaded from DispatchBoard to avoid loading Leaflet on initial page load.
 */

import { useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DispatchAssignment, Job, Technician, StockLevel } from '../../types/api'
import { useLocations, useLocationStock, decimalToNumber } from '../../hooks/useInventory'

// Fix default marker icon (Leaflet + bundler issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const techIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%237c3aed" stroke="white" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
})

const assignedJobIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%2310b981" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><path d="m9 10 2 2 4-4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

const unassignedJobIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%23f59e0b" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

interface Props {
  technicians: Technician[]
  assignedJobs: Job[]
  unassignedJobs: Job[]
  assignmentByJobId: Record<string, DispatchAssignment>
}

function parseJobCoordinates(job: Job) {
  if (!job.serviceLatitude || !job.serviceLongitude) return null

  const lat = Number.parseFloat(job.serviceLatitude)
  const lng = Number.parseFloat(job.serviceLongitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return { lat, lng }
}

/** Inline van inventory summary shown inside technician popup */
function VanInventorySummary({ technicianId }: { technicianId: string }) {
  const { data: locations } = useLocations()
  const vanLocation = locations?.find((l) => l.type === 'VAN' && l.technicianId === technicianId)
  const { data: stockData } = useLocationStock(vanLocation?.id, { limit: 100 })
  const [expanded, setExpanded] = useState(false)

  if (!vanLocation || !stockData) return null

  const items = stockData.data ?? []
  const totalItems = items.length
  const lowStock = items.filter(
    (sl) => sl.inventoryItem && decimalToNumber(sl.quantity) <= (sl.inventoryItem.reorderPoint ?? 0),
  ).length

  return (
    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 6, marginTop: 4 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontWeight: 600, color: '#374151', fontSize: 11 }}>
          📦 Van Stock: {totalItems} items
          {lowStock > 0 && (
            <span style={{ color: '#dc2626', marginLeft: 4 }}>· {lowStock} low</span>
          )}
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && items.length > 0 && (
        <div style={{ marginTop: 4, maxHeight: 120, overflowY: 'auto' }}>
          {items.slice(0, 15).map((sl) => {
            const qty = decimalToNumber(sl.quantity)
            const isLow = sl.inventoryItem && qty <= (sl.inventoryItem.reorderPoint ?? 0)
            return (
              <div
                key={sl.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: 10, color: isLow ? '#dc2626' : '#374151' }}
              >
                <span>{sl.inventoryItem?.name ?? 'Unknown'}</span>
                <span style={{ fontWeight: 600 }}>{qty}</span>
              </div>
            )
          })}
          {items.length > 15 && (
            <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>
              +{items.length - 15} more items
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DispatchMap({ technicians, assignedJobs, unassignedJobs, assignmentByJobId }: Props) {
  const techsWithGPS = technicians.filter((technician) => technician.currentLocation)
  const technicianNameById = technicians.reduce<Record<string, string>>((acc, tech) => {
    acc[tech.id] = tech.name
    return acc
  }, {})
  const assignedWithGPS = assignedJobs
    .map((job) => ({ job, coords: parseJobCoordinates(job) }))
    .filter((item): item is { job: Job; coords: { lat: number; lng: number } } => !!item.coords)
  const unassignedWithGPS = unassignedJobs
    .map((job) => ({ job, coords: parseJobCoordinates(job) }))
    .filter((item): item is { job: Job; coords: { lat: number; lng: number } } => !!item.coords)

  let centerLat = 6.9271
  let centerLng = 79.8612
  if (techsWithGPS.length > 0) {
    centerLat = techsWithGPS[0].currentLocation!.lat
    centerLng = techsWithGPS[0].currentLocation!.lng
  } else if (assignedWithGPS.length > 0) {
    centerLat = assignedWithGPS[0].coords.lat
    centerLng = assignedWithGPS[0].coords.lng
  } else if (unassignedWithGPS.length > 0) {
    centerLat = unassignedWithGPS[0].coords.lat
    centerLng = unassignedWithGPS[0].coords.lng
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-700">
          <div className="font-semibold">Technicians</div>
          <div className="mt-1 text-xl font-bold">{techsWithGPS.length}</div>
          <div className="mt-1 text-[11px]">Live field positions</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <div className="font-semibold">Assigned Jobs</div>
          <div className="mt-1 text-xl font-bold">{assignedWithGPS.length}</div>
          <div className="mt-1 text-[11px]">Scheduled work with technician ownership</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <div className="font-semibold">Unassigned Jobs</div>
          <div className="mt-1 text-xl font-bold">{unassignedWithGPS.length}</div>
          <div className="mt-1 text-[11px]">Jobs still waiting for dispatch</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Technicians ({techsWithGPS.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Assigned Jobs ({assignedWithGPS.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Unassigned Jobs ({unassignedWithGPS.length})
        </span>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '540px' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {techsWithGPS.map((t) => {
            const secondsAgo = t.locationUpdatedAt
              ? Math.round((Date.now() - new Date(t.locationUpdatedAt).getTime()) / 1000)
              : null
            const isLive = secondsAgo !== null && secondsAgo < 120
            const ageLabel = secondsAgo === null ? null
              : secondsAgo < 60 ? `${secondsAgo}s ago`
              : secondsAgo < 3600 ? `${Math.floor(secondsAgo / 60)}m ago`
              : `${Math.floor(secondsAgo / 3600)}h ago`

            return (
              <Marker
                key={`tech-${t.id}`}
                position={[t.currentLocation!.lat, t.currentLocation!.lng]}
                icon={techIcon}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[170px]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{t.name}</p>
                      {isLive && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#dcfce7', color: '#16a34a', borderRadius: 9999, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                          LIVE
                        </span>
                      )}
                    </div>
                    {t.phone && <p style={{ color: '#6b7280' }}>{t.phone}</p>}
                    <p style={{ color: '#7c3aed', fontWeight: 500 }}>
                      {t.isActive ? 'Active' : 'Inactive'} · ⭐ {t.rating.toFixed(1)}
                    </p>
                    {t.skills?.length > 0 && (
                      <p style={{ color: '#6b7280' }}>{t.skills.join(', ')}</p>
                    )}
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {t.speedKmh !== undefined && (
                        <span style={{ color: '#374151' }}>🚗 {t.speedKmh.toFixed(0)} km/h</span>
                      )}
                      {t.headingDeg !== undefined && (
                        <span style={{ color: '#374151' }}>🧭 {t.headingDeg.toFixed(0)}°</span>
                      )}
                      {t.batteryPct !== undefined && (
                        <span style={{ color: t.batteryPct < 20 ? '#dc2626' : '#374151' }}>
                          🔋 {t.batteryPct}%
                        </span>
                      )}
                    </div>
                    {ageLabel && (
                      <p style={{ color: '#9ca3af', fontSize: 10 }}>Updated {ageLabel}</p>
                    )}
                    <VanInventorySummary technicianId={t.id} />
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {assignedWithGPS.map(({ job, coords }) => {
            const assignment = assignmentByJobId[job.id]
            const assignedTechnicianName = assignment
              ? (technicianNameById[assignment.technicianId] ?? assignment.technicianName ?? job.assignedToName ?? 'Technician pending sync')
              : (job.assignedToName ?? 'Technician pending sync')

            return (
              <Marker
                key={`assigned-${job.id}`}
                position={[coords.lat, coords.lng]}
                icon={assignedJobIcon}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[150px]">
                    <p className="font-bold text-sm">{job.title}</p>
                    <p className="text-gray-500">{job.customerName ?? '—'}</p>
                    <p className="text-gray-500">{job.serviceAddress ?? '—'}</p>
                    <p className="text-emerald-600 font-medium">Assigned · {assignedTechnicianName}</p>
                    <p className="text-gray-500">{job.priority} · {job.status}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {unassignedWithGPS.map(({ job, coords }) => (
            <Marker
              key={`unassigned-${job.id}`}
              position={[coords.lat, coords.lng]}
              icon={unassignedJobIcon}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <p className="font-bold text-sm">{job.title}</p>
                  <p className="text-gray-500">{job.customerName ?? '—'}</p>
                  <p className="text-gray-500">{job.serviceAddress ?? '—'}</p>
                  <p className="text-amber-600 font-medium">Awaiting assignment</p>
                  <p className="text-gray-500">{job.priority} · {job.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
