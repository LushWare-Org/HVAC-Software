import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

/** A technician's own entry for one date. Dates without one are standard 8 to 5 days. */
export interface ShiftEntry {
  technicianId: string
  technicianName: string
  date: string // YYYY-MM-DD
  available: boolean
  start: string // HH:MM
  end: string
  note?: string
}

export function useAvailability(from: string, to: string) {
  return useQuery<ShiftEntry[]>({
    queryKey: ['scheduling', 'availability', from, to],
    queryFn: async () => (await api.get('/scheduling/dispatch/availability', { params: { from, to } })).data?.data ?? [],
    staleTime: 30_000,
  })
}

export type DayChange =
  | { technicianId: string; date: string; kind: 'off'; note?: string }
  | { technicianId: string; date: string; kind: 'hours'; start: string; end: string; note?: string }
  | { technicianId: string; date: string; kind: 'standard' }

/** Saves one day. Slots, running-behind and gaps all read these, so they refresh too. */
export function useSetDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c: DayChange) => {
      const path = `/scheduling/dispatch/availability/${c.technicianId}/${c.date}`
      if (c.kind === 'standard') return api.delete(path)
      return api.put(path, c.kind === 'off'
        ? { available: false, note: c.note || undefined }
        : { available: true, start: c.start, end: c.end, note: c.note || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduling', 'availability'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
