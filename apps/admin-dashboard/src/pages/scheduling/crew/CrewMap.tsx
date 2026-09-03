import { lazy, Suspense } from 'react'

const CrewMapInner = lazy(() => import('./CrewMapInner'))

export interface MapMember {
  id: string
  name: string
  lat: number
  lng: number
  inCrew: boolean
  /** false when the position is their last known GPS rather than their base. */
  fromBase: boolean
}

export interface MapClash {
  jobId: string
  jobNumber: string
  lat: number
  lng: number
  technicianName: string
  start: string
  end: string
  distanceFromSiteKm?: number | null
}

/**
 * Base locations, the job site, and the sites of any clashing jobs.
 *
 * Leaflet is loaded lazily, matching MapPickerLazy: it is ~150 KB gzipped and
 * the Scheduling page should not pay for it until a crew panel actually opens.
 *
 * Shows base locations rather than live positions on purpose. When scheduling a
 * job for next Tuesday, where a van happens to be parked right now predicts
 * nothing; where the technician starts their day does.
 */
export default function CrewMap({
  site,
  members,
  clashes,
  onSelectJob,
}: {
  site: { lat: number; lng: number } | null
  members: MapMember[]
  clashes: MapClash[]
  onSelectJob?: (jobId: string) => void
}) {
  if (!site) {
    // A job with no pin is common enough that this must explain itself rather
    // than render an empty grey box that looks broken.
    return (
      <div
        style={{
          border: '1px dashed var(--bd)',
          borderRadius: 8,
          padding: '18px 14px',
          fontSize: 11.5,
          lineHeight: 1.5,
          color: 'var(--t3)',
          textAlign: 'center',
        }}
      >
        This job has no map pin, so travel distances cannot be shown.
        <br />
        Set a location on the job to see where the crew would be coming from.
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            height: 186,
            borderRadius: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--bd)',
          }}
        />
      }
    >
      <CrewMapInner site={site} members={members} clashes={clashes} onSelectJob={onSelectJob} />
    </Suspense>
  )
}
