import React, { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider, useSocketContext } from '@/contexts/SocketContext'
import { queryClient } from '@/lib/queryClient'
import { setupQueryPersistence } from '@/lib/queryPersistence'
import { Colors } from '@/constants/theme'

/**
 * AppState foreground-refetch — when the user backgrounds and re-opens the
 * app, stale job/assignment/message data is invalidated immediately so the
 * first thing they see is fresh data (not yesterday's schedule).
 */
function ForegroundRefresher() {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (__DEV__) console.log('[AppState] Foreground — refetching critical queries')
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        queryClient.invalidateQueries({ queryKey: ['threads'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [])

  return null
}

/**
 * Persist the React Query cache to MMKV so the next cold start shows data
 * instantly instead of a loading spinner.
 */
function QueryCachePersister() {
  useEffect(() => {
    const unsubscribe = setupQueryPersistence(queryClient)
    return unsubscribe
  }, [])
  return null
}

/**
 * On every successful socket (re)connect, invalidate the real-time queries —
 * this catches events that were pushed while the socket was briefly down, and
 * immediately pulls fresh data when the tech comes back online.
 *
 * Also forwards ad-hoc server events (job_assigned, inventory_changed) to
 * targeted invalidations so new assignments / stock transfers show up
 * within a few hundred ms rather than waiting for the polling interval.
 */
function RealtimeSync() {
  const { isConnected } = useSocketContext()
  const wasConnected = useRef(false)

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      if (__DEV__) console.log('[WS] (Re)connected — pulling fresh data')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
    wasConnected.current = isConnected
  }, [isConnected])

  return null
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <QueryCachePersister />
          <AuthProvider>
            {/* Single socket connection for the entire auth session */}
            <SocketProvider>
              <ForegroundRefresher />
              <RealtimeSync />
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="login"           options={{ animation: 'fade' }} />
                <Stack.Screen name="signup"          options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="pending-approval" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="job/[id]"
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="message/[id]"
                  options={{ headerShown: false, animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="expense/create"
                  options={{ headerShown: false, presentation: 'modal' }}
                />
              </Stack>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
