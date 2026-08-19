import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from '@/contexts/AuthContext'
import { queryClient } from '@/lib/queryClient'
import { CUSTOMER_EVENTS, invalidateForEvent } from '@/lib/realtimeEvents'
import { devWsBaseUrl } from '@/lib/devHost'
import { expoHostUri } from '@/lib/api'

const DEFAULT_WS_BASE_URL = 'https://nginx-gateway-536584181394.us-central1.run.app'

function getWsBaseUrl(): string {
  const explicit =
    Constants.expoConfig?.extra?.wsBaseUrl ?? process.env.EXPO_PUBLIC_WS_BASE_URL
  if (explicit) return String(explicit).replace(/\/$/, '')

  const apiBase =
    Constants.expoConfig?.extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL
  // Derive from the API base by stripping the /api suffix.
  if (apiBase) return String(apiBase).replace(/\/api\/?$/, '')

  // In dev, follow the same host the API uses. Without this the socket would
  // reach for the production gateway while REST hit the local one — updates
  // would appear to work while pointing at entirely different data.
  return typeof __DEV__ !== 'undefined' && __DEV__
    ? devWsBaseUrl(expoHostUri())
    : DEFAULT_WS_BASE_URL
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

    const url = `${getWsBaseUrl()}/chat`
    if (__DEV__) console.log(`[socket] connecting → ${url}`)

    const socket = io(url, {
      // Allow polling as a fallback: a websocket upgrade can be blocked by a
      // proxy or flaky network, and websocket-only turns that into "no realtime
      // at all" rather than a slower-but-working connection.
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      if (__DEV__) console.log('[socket] connected')
      setIsConnected(true)
    })
    socket.on('disconnect', (reason) => {
      if (__DEV__) console.log(`[socket] disconnected: ${reason}`)
      setIsConnected(false)
    })
    socket.on('connect_error', (err) => {
      // Silent failure here is what makes "realtime doesn't work" impossible to
      // diagnose from the device — always surface it in dev.
      if (__DEV__) console.warn(`[socket] connect_error: ${err.message}`)
      setIsConnected(false)
    })

    for (const eventName of CUSTOMER_EVENTS) {
      socket.on(eventName, (payload) => {
        if (__DEV__) console.log(`[socket] ${eventName}`, JSON.stringify(payload))
        invalidateForEvent(queryClient, eventName)
      })
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
