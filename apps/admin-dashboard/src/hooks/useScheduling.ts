/**
 * useScheduling.ts — Hooks for the Scheduling page
 *
 * Routes → nginx /api/scheduling/ → scheduling-service (Go/Gin) :3003
 * WebSocket → nginx /ws → scheduling-service /ws
 *
 * The scheduling service is Go-based and provides:
 *   GET    /technicians                                — list all technicians
 *   POST   /technicians                               — create technician
 *   GET    /technicians/:id                           — get technician
 *   PATCH  /technicians/:id                           — update technician
 *   POST   /dispatch/assign                           — smart auto-assign job
 *   POST   /dispatch/assign/manual                    — manual dispatcher override
 *   GET    /dispatch/assignments/:id                  — single assignment
 *   GET    /dispatch/assignments/job/:jobId            — assignments for a job
 *   GET    /dispatch/assignments/technician/:techId   — assignments for a technician
 *   PATCH  /dispatch/assignments/:id/status           — update assignment status
 *   POST   /gps                                       — GPS location update
 *   GET    /ws                                        — WebSocket endpoint
 *
 * NOTE: There is no /appointments endpoint. Scheduling is done via dispatch assignments.
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { useAuth } from '../contexts/AuthContext'
import type {
  Technician,
  DispatchAssignment,
  AssignResponse,
  ManualAssignRequest,
  AssignJobRequest,
} from '../types/api'

const DEFAULT_DISPATCH_WS_BASE = 'wss://nginx-gateway-536584181394.us-central1.run.app'

// ─── Technicians ───────────────────────────────────────────────────────────────

async function fetchTechnicians(): Promise<Technician[]> {
  const res = await api.get('/scheduling/technicians')
  // Go handler returns { data: [...], count: N }
  // When the slice is empty Go marshals null, so guard with Array.isArray
  const arr = res.data?.data
  return Array.isArray(arr) ? arr : []
}

export function useTechnicians() {
  return useQuery<Technician[]>({
    queryKey: ['scheduling', 'technicians'],
    queryFn: fetchTechnicians,
    staleTime: 30 * 1000,
  })
}

/**
 * Warm the Scheduling cockpit's mount queries: technicians + the two job
 * lists it renders from. The assignments query keys off the fetched tech
 * ids, so it fires naturally once the page mounts with warm techs.
 */
export function prefetchSchedulingPage(): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['scheduling', 'technicians'], queryFn: fetchTechnicians, staleTime: 30 * 1000 }),
    import('./useJobs').then(m => Promise.allSettled([
      m.prefetchJobs({ status: 'PENDING', limit: 50 }),
      m.prefetchJobs({ limit: 200 }),
    ])),
  ])
}

export function useCreateTechnician() {
  return useMutation({
    mutationFn: async (data: {
      userId: string
      name: string
      phone?: string
      skills?: string[]
      maxDailyJobs?: number
      latitude?: number
      longitude?: number
    }) => {
      const res = await api.post('/scheduling/technicians', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling', 'technicians'] })
    },
  })
}

// ─── Single technician ─────────────────────────────────────────────────────────

export function useTechnician(id: string) {
  return useQuery<Technician>({
    queryKey: ['scheduling', 'technicians', id],
    queryFn: async () => {
      const res = await api.get(`/scheduling/technicians/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

// ─── Technician login map (CRM lastLoginAt cross-referenced by userId) ────────
// Gives availability signals beyond GPS pings — reflects actual app logins.

export function useTechnicianLoginMap(): Record<string, string> {
  const query = useQuery<Record<string, string>>({
    queryKey: ['crm', 'tech-login-map'],
    queryFn: async () => {
      const res = await api.get('/crm/users', { params: { role: 'technician', limit: 100, slim: true } })
      const users: Array<{ id: string; lastLoginAt?: string }> = res.data?.data ?? []
      const map: Record<string, string> = {}
      for (const u of users) {
        if (u.lastLoginAt) map[u.id] = u.lastLoginAt
      }
      return map
    },
    staleTime: 2 * 60 * 1000,
  })
  return query.data ?? {}
}

// ─── Assignments for a specific technician ────────────────────────────────────
// Used to build per-technician dispatch grid rows.

export function useTechAssignments(techId: string | null, statusFilter?: string) {
  return useQuery<{ data: DispatchAssignment[] }>({
    queryKey: ['scheduling', 'assignments', 'technician', techId, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get(`/scheduling/dispatch/assignments/technician/${techId}`, { params })
      // Go handler returns { data: [...] }
      return res.data
    },
    enabled: !!techId,
    staleTime: 30 * 1000,
  })
}

// ─── Assignments for a specific job ──────────────────────────────────────────

export function useJobAssignments(jobId: string | null) {
  return useQuery<{ data: DispatchAssignment[] }>({
    queryKey: ['scheduling', 'assignments', 'job', jobId],
    queryFn: async () => {
      const res = await api.get(`/scheduling/dispatch/assignments/job/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
  })
}

// ─── All assignments for a list of technicians ──────────────────────────────

export type FlatAssignment = DispatchAssignment

export function useAllTechAssignments(techIds: string[]) {
  return useQuery<FlatAssignment[]>({
    queryKey: ['scheduling', 'assignments', 'all-techs', techIds],
    queryFn: async () => {
      // One bulk call for the whole company (GET /dispatch/assignments)
      // instead of one request per technician.
      try {
        const res = await api.get('/scheduling/dispatch/assignments')
        const arr = res.data?.data
        if (Array.isArray(arr)) {
          const wanted = new Set(techIds)
          return arr.filter((a: any) => wanted.has(a.technicianId))
        }
      } catch {
        // Fall through to the legacy per-technician fan-out below — keeps the
        // page working against a scheduling-service that predates the bulk
        // endpoint (e.g. prod before the next deploy).
      }
      const results = await Promise.all(
        techIds.map(async (tid) => {
          try {
            const res = await api.get(`/scheduling/dispatch/assignments/technician/${tid}`)
            const arr = res.data?.data
            return Array.isArray(arr) ? arr.map((a: any) => ({ ...a, technicianId: a.technicianId ?? tid })) : []
          } catch {
            return []
          }
        }),
      )
      return results.flat()
    },
    enabled: techIds.length > 0,
    staleTime: 30 * 1000,
  })
}

// ─── Smart auto-assign a job ──────────────────────────────────────────────────
// Phase 1 smart assignment: scores all nearby technicians. If score ≥ 90,
// auto-assigns. Otherwise returns top-3 suggestions for dispatcher to choose.

export function useSmartAssign() {
  return useMutation({
    mutationFn: async (req: AssignJobRequest) => {
      const res = await api.post('/scheduling/dispatch/assign', req)
      return res.data as AssignResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ─── Manual dispatch assign ───────────────────────────────────────────────────
// Dispatcher explicitly picks a technician (overrides scoring or picks a suggestion).

export function useManualAssign() {
  return useMutation({
    mutationFn: async (req: ManualAssignRequest) => {
      const res = await api.post('/scheduling/dispatch/assign/manual', req)
      return res.data as DispatchAssignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ─── Update assignment status ─────────────────────────────────────────────────

export function useUpdateAssignmentStatus() {
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await api.patch(`/scheduling/dispatch/assignments/${id}/status`, {
        status: status.toUpperCase(),
        notes,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ─── WebSocket hook for live dispatch board ────────────────────────────────────
//
// Connects to ws://localhost/ws (Vite dev proxy → nginx → scheduling-service).
// Returns the last parsed message + connection status.
// Handles Go WebSocket event types:
//   GPS_UPDATE, ASSIGNMENT_CREATED, ASSIGNMENT_STATUS_CHANGED, TECHNICIAN_ONLINE

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface DispatchEvent {
  type:
    | 'GPS_UPDATE'
    | 'ASSIGNMENT_CREATED'
    | 'ASSIGNMENT_STATUS_CHANGED'
    | 'TECHNICIAN_ONLINE'
    // Published by job-service: status changes, new jobs, schedule moves and
    // reschedule-badge changes. The board's data is mostly jobs, so without
    // these it could only ever reflect assignment and GPS activity.
    | 'JOB_CHANGED'
    | 'PING'
  companyId?: string
  payload: Record<string, unknown>
  timestamp?: string
}

/**
 * How often to refetch the board while the socket is NOT connected.
 *
 * A fallback, not the primary path: without it a Redis outage or a dropped
 * socket leaves the page silently frozen, which is what trained people to hit
 * refresh. Only runs while a component using this hook is mounted, so it costs
 * nothing on other pages.
 */
const FALLBACK_POLL_MS = 8_000

/** Reconnect backoff — quick first retry, then easing off to avoid hammering. */
const RECONNECT_STEPS_MS = [1_000, 2_000, 5_000, 10_000, 20_000]

function resolveDispatchWsBase(): string {
  // Allow explicit override for non-standard local setups.
  const explicit = import.meta.env.VITE_DISPATCH_WS_BASE as string | undefined
  if (explicit && explicit.trim().length > 0) return explicit.trim().replace(/\/$/, '')

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const hostname = window.location.hostname

  // In Vite dev, bypass Vite's ws proxy and hit Nginx directly to avoid EPIPE noise.
  if (import.meta.env.DEV && window.location.port === '5173') {
    return `${protocol}//${hostname}`
  }

  // In production, always connect to the gateway instead of the Firebase host.
  if (import.meta.env.PROD) {
    return DEFAULT_DISPATCH_WS_BASE
  }

  return `${protocol}//${window.location.host}`
}

export function useDispatchWebSocket() {
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const [lastEvent, setLastEvent] = useState<DispatchEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const { token, user } = useAuth()

  // Auth contract for the Go scheduling /ws endpoint:
  //   1. If we have a JWT (HS256 in dev, RS256 in prod) → send `?access_token=…`.
  //      The Go middleware peeks the alg header and validates against either
  //      the local JWT_SECRET or the Auth0 JWKS.
  //   2. Else (no token) and DEV build → send the dev test-bypass query params
  //      pulled from AuthContext (or demo defaults). The middleware honors
  //      these only when BYPASS_AUTH=true and GIN_MODE != "release".
  // Native browser WebSocket can't send custom headers, so query params are
  // the only viable transport for both branches.

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const params = new URLSearchParams()
    if (token) {
      params.set('access_token', token)
    } else if (import.meta.env.DEV) {
      params.set('x-test-company-id', user?.companyId ?? 'co-demo-001')
      params.set('x-test-user-id', user?.id ?? 'user-admin-001')
      params.set('x-test-user-role', (user?.role ?? 'company_admin').toLowerCase())
      if (user?.email) params.set('x-test-user-email', user.email)
      if (user?.name) params.set('x-test-user-name', user.name)
    }
    const wsBase = resolveDispatchWsBase()
    const qs = params.toString()
    const wsUrl = qs ? `${wsBase}/ws?${qs}` : `${wsBase}/ws`

    setStatus('connecting')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      attemptRef.current = 0
      // The socket was down for some interval — whatever changed in the gap was
      // never delivered, so resync once on reconnect rather than waiting for the
      // next event to arrive.
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      console.info('[WS] Dispatch board connected')
    }

    ws.onmessage = (e) => {
      try {
        const event: DispatchEvent = JSON.parse(e.data)
        setLastEvent(event)

        if (event.type === 'ASSIGNMENT_CREATED' || event.type === 'ASSIGNMENT_STATUS_CHANGED') {
          queryClient.invalidateQueries({ queryKey: ['scheduling'] })
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }

        if (event.type === 'GPS_UPDATE') {
          // Directly patch the technician in the query cache — no HTTP round-trip needed.
          // The WS payload already contains the fresh position.
          const p = event.payload as {
            technicianId: string
            lat: number
            lng: number
            speedKmh?: number
            headingDeg?: number
            batteryPct?: number
            capturedAt?: string
          }
          queryClient.setQueryData<Technician[]>(['scheduling', 'technicians'], (prev) => {
            if (!prev) return prev
            return prev.map((t) =>
              t.id === p.technicianId
                ? {
                    ...t,
                    currentLocation: { lat: p.lat, lng: p.lng },
                    speedKmh: p.speedKmh,
                    headingDeg: p.headingDeg,
                    batteryPct: p.batteryPct,
                    locationUpdatedAt: p.capturedAt ?? new Date().toISOString(),
                  }
                : t,
            )
          })
        }

        if (event.type === 'TECHNICIAN_ONLINE') {
          queryClient.invalidateQueries({ queryKey: ['scheduling', 'technicians'] })
        }

        // A job changed in job-service — status, schedule, assignment or
        // reschedule state. Every board surface reads from ['jobs'], so one
        // invalidation refreshes the queue, the map, the planner and the
        // calendar together.
        if (event.type === 'JOB_CHANGED') {
          queryClient.invalidateQueries({ queryKey: ['jobs'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          const change = (event.payload as { change?: string } | undefined)?.change
          // A reschedule also moves the inbox count and the badge.
          if (change === 'RESCHEDULE') {
            queryClient.invalidateQueries({ queryKey: ['reschedule'] })
          }
          // An assignment change alters the dispatch board's assignment map.
          if (change === 'RESCHEDULE' || change === 'ASSIGNMENT') {
            queryClient.invalidateQueries({ queryKey: ['scheduling'] })
          }
        }
      } catch {
        // Ignore non-JSON messages (ping/pong frames)
      }
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('disconnected')
      // Exponential-ish backoff: a transient blip recovers in a second, while a
      // service that is genuinely down is not hammered every 5s by every open
      // dispatcher tab.
      const delay = RECONNECT_STEPS_MS[Math.min(attemptRef.current, RECONNECT_STEPS_MS.length - 1)]
      attemptRef.current += 1
      console.info(`[WS] Dispatch board disconnected — reconnecting in ${delay / 1000}s`)
      reconnectTimer.current = setTimeout(connect, delay)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
    // Reconnect when the auth identity changes (login / logout / token refresh)
    // so the new credentials are used on the WS handshake.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id])

  // ── Fallback: poll while the socket is down ──────────────────────────────
  //
  // Realtime should never be all-or-nothing. Redis being unreachable, a proxy
  // dropping the upgrade, or a laptop waking from sleep all leave the socket
  // shut — and previously that meant the board froze with no indication. This
  // keeps it current at a slower cadence until the socket returns, then stops.
  useEffect(() => {
    if (status === 'connected') return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return  // don't poll hidden tabs
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
    }, FALLBACK_POLL_MS)
    return () => clearInterval(id)
  }, [status])

  // ── Resync when the operator comes back to the tab ───────────────────────
  //
  // Cheap and high-value: a dispatcher switching back after ten minutes wants
  // to trust what they see immediately, not after the next event happens to
  // fire. Also covers the case where the socket died silently while hidden.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['reschedule'] })
      // If the socket dropped while we were away, reconnect now rather than
      // waiting out the remaining backoff.
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
        attemptRef.current = 0
        connect()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, lastEvent }
}

// ─── Admin: provision technician account ──────────────────────────────────────

/**
 * Admin provisions a technician CRM account (sets mustResetPassword=true,
 * sends welcome email), then creates the scheduling-service record so the
 * technician shows up on the dispatch board immediately.
 *
 * Flow:
 *  1. POST /crm/auth/provision-technician  → { userId4Scheduling, ... }
 *  2. POST /scheduling/technicians          → scheduling profile
 */
export function useProvisionTechnicianAccount() {
  return useMutation({
    mutationFn: async (data: {
      name: string
      email: string
      phone?: string
      skills?: string[]
      maxDailyJobs?: number
      latitude?: number
      longitude?: number
    }) => {
      // Step 1 — create CRM account + send welcome email
      const crmRes = await api.post<{ userId4Scheduling: string; success: boolean; message: string }>(
        '/crm/auth/provision-technician',
        data,
      )
      const { userId4Scheduling } = crmRes.data

      // Step 2 — create scheduling profile so tech appears on dispatch board
      const schedRes = await api.post('/scheduling/technicians', {
        userId:      userId4Scheduling,
        name:        data.name,
        phone:       data.phone,
        skills:      data.skills,
        maxDailyJobs: data.maxDailyJobs ?? 5,
        latitude:    data.latitude,
        longitude:   data.longitude,
      })

      return { crm: crmRes.data, scheduling: schedRes.data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling', 'technicians'] })
    },
  })
}
