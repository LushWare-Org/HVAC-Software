import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from '@/contexts/AuthContext'
import { queryClient } from '@/lib/queryClient'
import { CUSTOMER_EVENTS, invalidateForEvent } from '@/lib/realtimeEvents'

const DEFAULT_WS_BASE_URL = 'https://nginx-gateway-536584181394.us-central1.run.app'

function getWsBaseUrl(): string {
  const explicit =
    Constants.expoConfig?.extra?.wsBaseUrl ?? process.env.EXPO_PUBLIC_WS_BASE_URL
  if (explicit) return String(explicit).replace(/\/$/, '')
  const apiBase =
    Constants.expoConfig?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    DEFAULT_WS_BASE_URL
  // Derive from the API base by stripping the /api suffix.
  return String(apiBase).replace(/\/api\/?$/, '')
}

interface SocketContextValue {
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({ isConnected: false })

/**
 * One Socket.IO connection per authenticated session.
 *
 * Handlers are attached to the socket instance itself, so socket.io-client's
 * own reconnect logic keeps them alive across drops — there is no
 * re-registration step after a reconnect.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setIsConnected(false)
      return
    }

    const socket = io(`${getWsBaseUrl()}/chat`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('connect_error', () => setIsConnected(false))

    for (const eventName of CUSTOMER_EVENTS) {
      socket.on(eventName, () => invalidateForEvent(queryClient, eventName))
    }

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isAuthenticated, token])

  return (
    <SocketContext.Provider value={{ isConnected }}>{children}</SocketContext.Provider>
  )
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext)
}
