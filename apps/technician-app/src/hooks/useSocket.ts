/**
 * useSocket — Socket.IO hook for real-time chat in the technician app.
 *
 * Connects to the comms-service WebSocket gateway on mount.
 * Provides join/leave thread, send message, and typing indicator functions.
 * Automatically reconnects on disconnect.
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from '@/contexts/AuthContext'
import type { ThreadMessage } from '@/types/api'

const WS_URL =
  Constants.expoConfig?.extra?.wsBaseUrl ??
  process.env.EXPO_PUBLIC_WS_BASE_URL ??
  'http://localhost:3005'

export function useSocket() {
  const { token, user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token && !user) return

    const socket = io(`${WS_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      query: token ? undefined : {
        companyId: user?.companyId,
        userId: user?.id,
        userName: user?.name,
        userRole: user?.role,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

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

  const sendMessage = useCallback((threadId: string, body: string) => {
    return new Promise<ThreadMessage | null>((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null)
        return
      }
      socketRef.current.emit('send_message', { threadId, body }, (response: any) => {
        if (response?.success) {
          resolve(response.message)
        } else {
          resolve(null)
        }
      })
    })
  }, [])

  const sendTyping = useCallback((threadId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { threadId, isTyping })
  }, [])

  const onNewMessage = useCallback(
    (callback: (data: { threadId: string; message: ThreadMessage }) => void) => {
      socketRef.current?.on('new_message', callback)
      return () => {
        socketRef.current?.off('new_message', callback)
      }
    },
    [],
  )

  const onTyping = useCallback(
    (callback: (data: { threadId: string; userId: string; userName: string; isTyping: boolean }) => void) => {
      socketRef.current?.on('user_typing', callback)
      return () => {
        socketRef.current?.off('user_typing', callback)
      }
    },
    [],
  )

  return {
    isConnected,
    joinThread,
    leaveThread,
    sendMessage,
    sendTyping,
    onNewMessage,
    onTyping,
    socket: socketRef,
  }
}
