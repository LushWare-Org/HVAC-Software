/**
 * useSocket — Socket.IO hook for real-time chat in the admin dashboard.
 *
 * Connects to comms-service WebSocket gateway on mount.
 * Uses JWT token from AuthContext; falls back to dev-bypass query params.
 * Provides join/leave thread, send message, and typing indicator helpers.
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import type { ThreadMessage } from '../types/api'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3005'

export function useSocket() {
  const { token, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    const socket = io(`${WS_URL}/chat`, {
      transports: ['websocket', 'polling'],
      // Use JWT if available, otherwise dev-bypass query params
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
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('connect_error', (err) => {
      console.warn('[useSocket] connect error:', err.message)
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [token, user?.id])

  const joinThread = useCallback((threadId: string) => {
    socketRef.current?.emit('join_thread', { threadId })
  }, [])

  const leaveThread = useCallback((threadId: string) => {
    socketRef.current?.emit('leave_thread', { threadId })
  }, [])

  /** Send via WebSocket (with callback ack). Returns the saved message or null. */
  const sendMessage = useCallback((threadId: string, body: string): Promise<ThreadMessage | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null)
        return
      }
      socketRef.current.emit('send_message', { threadId, body }, (response: any) => {
        resolve(response?.success ? response.message : null)
      })
    })
  }, [])

  const sendTyping = useCallback((threadId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { threadId, isTyping })
  }, [])

  /**
   * Register a listener for new_message events.
   * Returns a cleanup function — call it in useEffect's return.
   */
  const onNewMessage = useCallback(
    (cb: (data: { threadId: string; message: ThreadMessage }) => void) => {
      const sock = socketRef.current
      if (!sock) return () => {}
      sock.on('new_message', cb)
      return () => { sock.off('new_message', cb) }
    },
    [],
  )

  const onTyping = useCallback(
    (cb: (data: { threadId: string; userId: string; userName: string; isTyping: boolean }) => void) => {
      const sock = socketRef.current
      if (!sock) return () => {}
      sock.on('user_typing', cb)
      return () => { sock.off('user_typing', cb) }
    },
    [],
  )

  return {
    isConnected,
    socket: socketRef,
    joinThread,
    leaveThread,
    sendMessage,
    sendTyping,
    onNewMessage,
    onTyping,
  }
}
