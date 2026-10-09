import { useMemo } from 'react'
import { Line } from './kit'
import { useTripTrail } from '../../hooks/useScheduling'

export const ROUTE_DRIVEN = '#1D4ED8'

/**
 * The road a technician has driven on the current trip, ending at their marker.
 * Starts at enRouteAt, so earlier trips never appear. Must render inside a
 * BaseMap.
 */
export default function TripTrail({ technicianId, enRouteAt, techPos, weight = 4.5 }: {
  technicianId: string
  enRouteAt: string | null
  techPos: [number, number]
  weight?: number
}) {
  const { data: trail } = useTripTrail(technicianId, enRouteAt)
  const positions = useMemo(() => {
    const pts = (trail ?? []).map(p => [p.lat, p.lng] as [number, number])
    // End on the marker even if the latest fix is not in the trail yet.
    const last = pts[pts.length - 1]
    if (!last || last[0] !== techPos[0] || last[1] !== techPos[1]) pts.push(techPos)
    return pts
  }, [trail, techPos])

  if (positions.length < 2) return null
  return (
    <>
      <Line positions={positions} color="#fff" weight={weight + 3.5} opacity={0.7} />
      <Line positions={positions} color={ROUTE_DRIVEN} weight={weight} opacity={0.95} />
    </>
  )
}
