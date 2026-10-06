import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface GapFill {
  kind: 'ASSIGN' | 'PULL_FORWARD'
  jobId: string
  jobNumber: string
  title: string
  customer: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
  start: string
  end: string
  travelKm: number | null
  currentStart?: string
  /** What to ask the assistant; it shows a confirmation card before anything changes. */
  request: string
}

export interface Gap {
  cancelledJobId: string
  cancelledJobNumber: string
  customer: string
  reason: string
  cancelledAt: string
  technicianId: string
  technicianName: string
  date: string
  from: string
  to: string
  fills: GapFill[]
}

/** Time freed by cancellations over the next few days, with work that fits it. */
export function useGaps(enabled = true) {
  return useQuery<{ timezone: string; generatedAt: string; gaps: Gap[] }>({
    queryKey: ['dashboard', 'gaps'],
    queryFn: async () => (await api.get('/scheduling/dispatch/gaps')).data,
    enabled,
    refetchInterval: 120_000,
    staleTime: 60_000,
  })
}
