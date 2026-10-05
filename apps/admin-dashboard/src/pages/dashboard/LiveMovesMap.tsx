/**
 * Small live map for the dashboard: technicians driving to or working at a job,
 * their job pins, and the road driven so far. Loaded lazily so Leaflet stays out
 * of the dashboard's main chunk.
 */
import { Fragment, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TripTrail from '../../components/map/TripTrail'
import type { LiveMove } from './opsData'

// Leaflet writes colours as SVG attributes, where CSS variables do not resolve.
const EN_ROUTE = '#0891B2'
const ON_SITE = '#D97706'

/** Re-frames only when someone starts or stops moving, never on each GPS fix. */
function FitToMoves({ moves }: { moves: LiveMove[] }) {
  const map = useMap()
  const who = moves.map(m => m.techId).sort().join(',')
  useEffect(() => {
    const pts = moves.flatMap(m => [m.techPos, m.jobPos].filter(Boolean) as [number, number][])
    if (pts.length === 1) map.setView(pts[0], 14)
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, map])
  return null
}

/** Leaflet only measures its box once; redraw tiles when the panel resizes. */
function KeepSized() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

export default function LiveMovesMap({ moves }: { moves: LiveMove[] }) {
  const center = useMemo<[number, number]>(() => moves.find(m => m.techPos)?.techPos ?? moves.find(m => m.jobPos)?.jobPos ?? [6.9271, 79.8612], [moves])
  return (
    <MapContainer center={center} zoom={13} className="ops-live-map" scrollWheelZoom={false} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <KeepSized />
      <FitToMoves moves={moves} />
      {moves.map(m => {
        const color = m.state === 'EN_ROUTE' ? EN_ROUTE : ON_SITE
        return (
          <Fragment key={m.techId}>
            {m.state === 'EN_ROUTE' && m.techPos && m.enRouteAt && (
              <TripTrail technicianId={m.techId} enRouteAt={m.enRouteAt} techPos={m.techPos} weight={3.5} />
            )}
            {m.jobPos && (
              <CircleMarker center={m.jobPos} radius={6} pathOptions={{ color, weight: 3, fillColor: '#fff', fillOpacity: 1 }}>
                <Tooltip direction="top">{m.job.jobNumber}{m.job.customer ? `, ${m.job.customer}` : ''}</Tooltip>
              </CircleMarker>
            )}
            {m.techPos && (
              <CircleMarker center={m.techPos} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}>
                <Tooltip permanent direction="right" offset={[10, 0]} className="ops-live-label">{m.name.split(' ')[0]}</Tooltip>
              </CircleMarker>
            )}
          </Fragment>
        )
      })}
    </MapContainer>
  )
}
