import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapMember, MapClash } from './CrewMap'

/**
 * Pin colours carry the whole legend, so they are the only decoration here.
 * Hardcoded rather than themed because they sit on map tiles, which do not
 * change with the app theme — a token that flips to a light shade on dark would
 * disappear against the same tiles.
 */
const SITE = '#DC2626'
const IN_CREW = '#2563EB'
const CANDIDATE = '#D97706'
const CLASH = '#DC2626'

function pin(color: string, label: string, opts?: { small?: boolean }): L.DivIcon {
  const size = opts?.small ? 18 : 24
  return L.divIcon({
    className: '',
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 6)],
    html: `<div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 6px;transform:rotate(-45deg);
        background:${color};border:2px solid #fff;
        box-shadow:0 2px 5px rgba(15,23,42,.35);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-size:${opts?.small ? 7 : 8}px;font-weight:700;">${label}</span>
      </div>`,
  })
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Fits every pin on first render so the panel opens showing all of them. */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useMemo(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
  }, [map, points])
  return null
}

export default function CrewMapInner({
  site,
  members,
  clashes,
  onSelectJob,
}: {
  site: { lat: number; lng: number }
  members: MapMember[]
  clashes: MapClash[]
  onSelectJob?: (jobId: string) => void
}) {
  const points = useMemo<[number, number][]>(
    () => [
      [site.lat, site.lng],
      ...members.map((m) => [m.lat, m.lng] as [number, number]),
      ...clashes.map((c) => [c.lat, c.lng] as [number, number]),
    ],
    [site, members, clashes],
  )

  return (
    <MapContainer
      center={[site.lat, site.lng]}
      zoom={13}
      style={{ height: 186, width: '100%', borderRadius: 8 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />

      <Marker position={[site.lat, site.lng]} icon={pin(SITE, '★')}>
        <Popup>
          <strong>Job site</strong>
        </Popup>
      </Marker>

      {members.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={pin(m.inCrew ? IN_CREW : CANDIDATE, initials(m.name))}
        >
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>{m.name}</strong>
              <div style={{ color: '#6b7280' }}>
                {m.inCrew ? 'On this crew' : 'Available to add'}
              </div>
              <div style={{ color: '#6b7280' }}>
                {m.fromBase ? 'Base location' : 'Last known position'}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* The clashing job's pin is the point of this map: seeing that a
          candidate's 09:00 job is 1.4 km away is what lets a dispatcher
          overrule the warning sensibly. */}
      {clashes.map((c) => (
        <Marker key={c.jobId} position={[c.lat, c.lng]} icon={pin(CLASH, '!', { small: true })}>
          <Popup>
            <div style={{ fontSize: 12, minWidth: 170 }}>
              <strong>{c.technicianName} is booked</strong>
              <div style={{ marginTop: 3 }}>
                {c.jobNumber} ·{' '}
                {new Date(c.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' to '}
                {new Date(c.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {c.distanceFromSiteKm != null && (
                <div style={{ color: '#6b7280' }}>
                  {c.distanceFromSiteKm.toFixed(1)} km from this job
                </div>
              )}
              {onSelectJob && (
                <button
                  type="button"
                  onClick={() => onSelectJob(c.jobId)}
                  style={{
                    marginTop: 5,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#2563eb',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Open this job
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
