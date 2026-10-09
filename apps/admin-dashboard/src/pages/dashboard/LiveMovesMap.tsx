/**
 * Small live map for the dashboard: technicians driving to or working at a job,
 * their job pins, and the road driven so far. Drawn with the shared map kit, so it
 * is the company's own map (Google when switched on, Leaflet otherwise) and the pins
 * look exactly like the scheduling board's. Loaded lazily to keep it out of the
 * dashboard's main chunk.
 */
import { Fragment, useMemo } from 'react'
import TripTrail from '../../components/map/TripTrail'
import { BaseMap, Pin, TechPin, type LatLng } from '../../components/map/kit'
import { JOB_PIN, jobPinHtml } from '../../lib/maps/pins'
import type { LiveMove } from './opsData'

// Same colours as the Live now list, so a row and its pin read as one thing.
const EN_ROUTE = '#0891B2'
const ON_SITE = '#D97706'

export default function LiveMovesMap({ moves }: { moves: LiveMove[] }) {
  const points = useMemo(() => moves.flatMap(m => [m.techPos, m.jobPos].filter(Boolean) as LatLng[]), [moves])
  // Re-frames only when someone starts or stops moving, never on each GPS fix.
  const refitKey = moves.map(m => m.techId).sort().join(',')
  const center: LatLng = points[0] ?? [6.9271, 79.8612]
  return (
    <div className="ops-live-map">
      <BaseMap center={center} zoom={13} fit={points} refitKey={refitKey} style={{ height: '100%', width: '100%' }}>
        {moves.map(m => {
          const color = m.state === 'EN_ROUTE' ? EN_ROUTE : ON_SITE
          return (
            <Fragment key={m.techId}>
              {m.state === 'EN_ROUTE' && m.techPos && m.enRouteAt && (
                <TripTrail technicianId={m.techId} enRouteAt={m.enRouteAt} techPos={m.techPos} weight={3.5} />
              )}
              {m.jobPos && (
                <Pin
                  position={m.jobPos}
                  html={jobPinHtml(m.trade, m.state === 'EN_ROUTE' ? 'enroute' : 'onsite')}
                  width={JOB_PIN.width} height={JOB_PIN.height} anchor={[JOB_PIN.anchorX, JOB_PIN.anchorY]}
                  zIndex={300}
                  popup={<div style={{ fontSize: 12, lineHeight: 1.45 }}><b>{m.job.jobNumber}</b>{m.job.customer ? <><br />{m.job.customer}</> : null}{m.job.address ? <><br /><span style={{ color: '#64748B' }}>{m.job.address}</span></> : null}</div>}
                />
              )}
              {m.techPos && (
                <TechPin
                  position={m.techPos} name={m.name} avatarUrl={m.avatarUrl} color={color}
                  workload={m.workload} maxJobs={m.maxJobs} speedKmh={m.state === 'EN_ROUTE' ? 20 : 0}
                  popup={<div style={{ fontSize: 12, lineHeight: 1.45 }}><b>{m.name}</b><br />{m.state === 'EN_ROUTE' ? 'On the way to' : 'Working on'} {m.job.jobNumber}</div>}
                />
              )}
            </Fragment>
          )
        })}
      </BaseMap>
    </div>
  )
}
