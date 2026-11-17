/**
 * SocketContext — one Socket.IO connection (comms /chat) for job, stock and
 * notification alerts, for the whole session. Chat itself has its own
 * connection (comms /messages, see src/chat/useChat.ts).
 *
 * URL derivation: Socket.IO path is /socket.io/ (proxied by nginx → comms-service).
 * The WS base URL is derived from the API base URL by stripping /api, so a single
 * env var (EXPO_PUBLIC_API_BASE_URL) covers both REST and WebSocket.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { io, Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from './AuthContext'
import { queryClient } from '@/lib/queryClient'

// ── Real-time query invalidation map ─────────────────────────────────────────
// Server events → which React Query keys to invalidate. Any listed event the
// server emits on the /chat namespace will trigger an instant refetch, giving
// the user sub-second updates for assignments / stock / jobs without having
// to wait for the polling interval.
const EVENT_TO_QUERY_KEYS: Record<string, string[][]> = {
  job_assigned:        [['jobs'], ['assignments']],
  job_updated:         [['jobs']],
  job_unassigned:      [['jobs'], ['assignments']],
  assignment_updated:  [['assignments'], ['jobs']],
  assignment_created:  [['assignments'], ['jobs']],
  inventory_changed:   [['inventory']],
  inventory_transfer:  [['inventory']],
  inventory_return:    [['inventory']],
  stock_updated:       [['inventory']],
  notification_new:    [['notifications']],
}

// ── URL helpers ──────────────────────────────────────────────────────────────

const DEFAULT_API_BASE_URL = 'https://nginx-gateway-858799009248.asia-northeast3.run.app/api'

function getDefaultApiBaseUrl(): string {
  return __DEV__ ? 'http://localhost:80/api' : DEFAULT_API_BASE_URL
}

export function getWsBaseUrl(): string {
  // Explicit override wins
  const explicit =
    Constants.expoConfig?.extra?.wsBaseUrl ?? process.env.EXPO_PUBLIC_WS_BASE_URL
  if (explicit) return String(explicit).replace(/\/$/, '')

  // Derive from API base URL: strip /api suffix
  const apiBase =
    Constants.expoConfig?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    getDefaultApiBaseUrl()
  return String(apiBase).replace(/\/api\/?$/, '')
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SocketContextType {
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)


  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setIsConnected(false)
      return
    }

    const wsBase = getWsBaseUrl()

    // Connect to the /chat namespace.
    // Socket.IO handshake uses path /socket.io/ (nginx proxies this to comms-service).
    const socket = io(`${wsBase}/chat`, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      // Identity comes only from the login token.
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log(`[WS] Connected (${wsBase})`)
      setIsConnected(true)
    })
    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason)
      setIsConnected(false)
    })
    socket.on('connect_error', (err) => {
      // Warn silently — reconnect will retry
      console.warn('[WS] Connect error:', err.message)
    })

    // Real-time query invalidation — any event in EVENT_TO_QUERY_KEYS triggers
    // an instant refetch of the related queries. The backend can push these
    // from REST endpoints via MessagingGateway.broadcastToUser(userId, event).
    for (const [event, keys] of Object.entries(EVENT_TO_QUERY_KEYS)) {
      socket.on(event, () => {
        if (__DEV__) console.log(`[WS] ${event} → invalidating`, keys)
        keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }))
      })
    }

    socketRef.current = socket

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isAuthenticated, token, user?.id, user?.companyId])

  return (
    <SocketContext.Provider
      value={{ isConnected }}
    >
      {children}
    </SocketContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSocketContext(): SocketContextType {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocketContext must be used inside <SocketProvider>')
  return ctx
}
