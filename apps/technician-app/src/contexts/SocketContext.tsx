/**
 * SocketContext — single Socket.IO connection for the entire app session.
 *
 * One connection is created when the user authenticates and torn down on logout.
 * All screens share the same socket via useSocketContext() instead of creating
 * individual connections (which caused duplicate events and wasted connections).
 *
 * The listener-forwarding pattern (msgListeners / typingListeners sets) means
 * callbacks registered via onNewMessage / onTyping survive socket reconnects
 * automatically — no need to re-register after a disconnect.
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
  useCallback,
} from 'react'
import { io, Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from './AuthContext'
import { queryClient } from '@/lib/queryClient'
import type { ThreadMessage } from '@/types/api'

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

function getWsBaseUrl(): string {
  // Explicit override wins
  const explicit =
    Constants.expoConfig?.extra?.wsBaseUrl ?? process.env.EXPO_PUBLIC_WS_BASE_URL
  if (explicit) return String(explicit).replace(/\/$/, '')

  // Derive from API base URL: strip /api suffix
  const apiBase =
    Constants.expoConfig?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:80/api'
  return String(apiBase).replace(/\/api\/?$/, '')
}

// ── Types ────────────────────────────────────────────────────────────────────

type NewMsgData = { threadId: string; message: ThreadMessage }
type TypingData = {
  threadId: string
  userId: string
  userName: string
  isTyping: boolean
}

interface SocketContextType {
  isConnected: boolean
  joinThread: (threadId: string) => void
  leaveThread: (threadId: string) => void
  sendTyping: (threadId: string, isTyping: boolean) => void
  onNewMessage: (cb: (data: NewMsgData) => void) => () => void
  onTyping: (cb: (data: TypingData) => void) => () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Stable callback sets — persist across socket reconnects
  const msgListeners = useRef(new Set<(data: NewMsgData) => void>())
  const typingListeners = useRef(new Set<(data: TypingData) => void>())

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
      auth: { token },
      query: {
        companyId: user?.companyId ?? '',
        userId:    user?.id        ?? '',
        userName:  user?.name      ?? '',
        userRole:  user?.role      ?? '',
      },
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

    // Forward events to all registered listeners.
    // This single socket.on() survives internal socket reconnects because
    // socket.io-client reuses the same Socket object across reconnects.
    socket.on('new_message', (data: NewMsgData) => {
      msgListeners.current.forEach((cb) => cb(data))
      // Invalidate ONLY the thread list (not individual thread details) so
      // the open chat screen isn't needlessly re-fetched — onNewMessage
      // already updates that cache in-place.
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] === 'threads' && q.queryKey[1] !== 'detail',
      })
    })
    socket.on('user_typing', (data: TypingData) => {
      typingListeners.current.forEach((cb) => cb(data))
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

  const joinThread = useCallback((threadId: string) => {
    socketRef.current?.emit('join_thread', { threadId })
  }, [])

  const leaveThread = useCallback((threadId: string) => {
    socketRef.current?.emit('leave_thread', { threadId })
  }, [])

  const sendTyping = useCallback((threadId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { threadId, isTyping })
  }, [])

  // Add / remove listeners from the stable set
  const onNewMessage = useCallback(
    (cb: (data: NewMsgData) => void) => {
      msgListeners.current.add(cb)
      return () => {
        msgListeners.current.delete(cb)
      }
    },
    [],
  )

  const onTyping = useCallback(
    (cb: (data: TypingData) => void) => {
      typingListeners.current.add(cb)
      return () => {
        typingListeners.current.delete(cb)
      }
    },
    [],
  )

  return (
    <SocketContext.Provider
      value={{ isConnected, joinThread, leaveThread, sendTyping, onNewMessage, onTyping }}
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
