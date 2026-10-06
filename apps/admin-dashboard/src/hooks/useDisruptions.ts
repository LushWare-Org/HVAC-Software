import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface DisruptionOption {
  kind: 'REASSIGN' | 'MOVE' | 'MESSAGE'
  label: string
  /** What to ask the assistant; it shows a confirmation card before anything changes. */
  request: string
  message?: string
}

export interface Disruption {
  kind: 'LATE_START' | 'LATE_ARRIVAL' | 'OVERRUN' | 'TECH_OFF'
  jobId: string
  jobNumber: string
  technicianName: string
  delayMins: number
  detail: string
  knockOn: Array<{ jobId: string; jobNumber: string; customer: string; delayMins: number }>
  options: DisruptionOption[]
}

/**
 * Today's late starts, late arrivals and overruns. Under the 'dashboard' key so
 * live job events (which invalidate it) refresh it; polled too, since lateness
 * grows with the clock even when nothing is clicked.
 */
export function useDisruptions(enabled = true) {
  return useQuery<{ timezone: string; generatedAt: string; disruptions: Disruption[] }>({
    queryKey: ['dashboard', 'disruptions'],
    queryFn: async () => (await api.get('/scheduling/dispatch/disruptions')).data,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
