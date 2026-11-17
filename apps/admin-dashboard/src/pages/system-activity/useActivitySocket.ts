/**
 * useActivitySocket — connects to comms-service's /activity Socket.IO
 * namespace and streams activity:new events live. Mirrors useSocket.ts's
 * /chat connection pattern (JWT when present, dev-bypass query params
 * otherwise). The namespace itself rejects any non-super_admin connection
 * (see ActivityGateway.handleConnection in comms-service), so this hook is
 * safe to mount only from the super_admin-gated SystemActivity page.
 */
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../../contexts/AuthContext'
import type { ActivityLogEntry } from './activityLogApi'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3005'

export function useActivitySocket(onEvent: (entry: ActivityLogEntry) => void, companyId?: string) {
  const { token, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    const socket = io(`${WS_URL}/activity`, {
      transports: ['websocket', 'polling'],
      ...(token
        ? { auth: { token } }
        : {
            query: {
              companyId: user.companyId,
              userId: user.id,
              userName: user.name,
              userRole: user.role,
            },
          }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))
    socket.on('activity:new', (entry: ActivityLogEntry) => onEventRef.current(entry))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [token, user?.id])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !companyId) return
    socket.emit('watch_company', { companyId })
    return () => {
      socket.emit('unwatch_company', { companyId })
    }
  }, [companyId])

  return { connected }
}
