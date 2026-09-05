import { useMutation, useQuery } from '@tanstack/react-query'
import { Navigation2, Square } from 'lucide-react'
import api from '../lib/api'

type Phase = 'WAITING_FOR_EN_ROUTE' | 'DRIVING' | 'ARRIVED'

interface SimRun {
  jobId: string
  technicianName: string
  phase: Phase
  fixesSent: number
  fixesTotal: number
  routeKm: number
  message: string
}

/**
 * Trial tool: drives the assigned technician along a real road route so live
 * tracking can be shown without putting someone in a car.
 *
 * Renders NOTHING unless the server reports simulation enabled
 * (ENABLE_GPS_SIMULATION=true), so on a normal deployment this control does not
 * exist rather than existing and failing. The server is the authority; the UI
 * only mirrors it.
 *
 * Arming does not move anything or change the job. It watches, and movement
 * begins when someone marks the job En Route, so the person playing the
 * technician still triggers it exactly as they would on a real call.
 */
export default function GpsSimulationControl({ jobId }: { jobId: string }) {
  const status = useQuery({
    queryKey: ['gps-sim', jobId],
    queryFn: async () => {
      const res = await api.get<{ enabled: boolean; run: SimRun | null }>(
        '/scheduling/dispatch/simulate/status', { params: { jobId } },
      )
      return res.data
    },
    // Fast enough that the phase change feels immediate when En Route is tapped.
    refetchInterval: 3000,
  })

  const arm = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/scheduling/dispatch/jobs/${jobId}/simulate`, { speed: 10 })
      return res.data
    },
    onSuccess: () => status.refetch(),
  })

  const stop = useMutation({
    mutationFn: async () => api.delete(`/scheduling/dispatch/jobs/${jobId}/simulate`),
    onSuccess: () => status.refetch(),
  })

  // Not enabled on this server: behave as though the feature does not exist.
  if (!status.data?.enabled) return null

  const run = status.data.run
  const busy = arm.isPending || stop.isPending
  const armError = (arm.error as any)?.response?.data?.error as string | undefined

  const tone =
    run?.phase === 'DRIVING' ? 'var(--green)'
    : run?.phase === 'ARRIVED' ? 'var(--blue)'
    : 'var(--amber)'

  return (
    <div
      style={{
        border: `1px solid ${run ? `color-mix(in srgb, ${tone} 45%, transparent)` : 'var(--bd)'}`,
        background: run ? `color-mix(in srgb, ${tone} 8%, transparent)` : 'var(--bg-card)',
        borderRadius: 9,
        padding: '9px 11px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: 'var(--t3)',
          }}
        >
          Demo mode
        </div>
        <div style={{ fontSize: 11.5, color: run ? tone : 'var(--t2)', marginTop: 2, lineHeight: 1.45 }}>
          {armError
            ? armError
            : run
              ? run.message +
                (run.phase === 'DRIVING' && run.fixesTotal
                  ? ` (${Math.round((run.fixesSent / run.fixesTotal) * 100)}% of the way)`
                  : '')
              : 'Simulate the technician driving to this job. Nothing moves until the job is marked En Route.'}
        </div>
      </div>

      {run ? (
        <button
          type="button"
          onClick={() => stop.mutate()}
          disabled={busy}
          className="btn btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Square size={12} /> Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={() => arm.mutate()}
          disabled={busy}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Navigation2 size={12} /> {busy ? 'Starting…' : 'Simulate arrival'}
        </button>
      )}
    </div>
  )
}
