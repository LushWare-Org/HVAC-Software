import React, { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
// useFonts comes from expo-font (a real declared dependency), not the
// re-exported shim in @expo-google-fonts/poppins — that shim calls its own
// React hooks from inside a package with no declared react dependency, which
// pnpm's isolated node_modules can resolve to a second React copy and throw
// "Invalid hook call". @expo-google-fonts/poppins is used here only for its
// font asset constants (plain `require(...).ttf`, no hooks involved).
import { useFonts } from 'expo-font'
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins'
import * as SplashScreen from 'expo-splash-screen'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Held open until Poppins is loaded — an unstyled flash before the brand font
// swaps in reads as broken, not "fast".
SplashScreen.preventAutoHideAsync()

/**
 * React Query's focus tracking is a browser concept. On native we drive it from
 * AppState so returning to the foreground refetches stale data.
 */
function useAppStateRefetch() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active')
    })
    return () => sub.remove()
  }, [])
}

function AppShell() {
  useAppStateRefetch()
  usePushNotifications()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job/[id]" />
      <Stack.Screen name="quote/[id]" />
      <Stack.Screen name="invoice/[id]" />
      <Stack.Screen name="thread/[id]" />
      <Stack.Screen name="agreements" />
      <Stack.Screen name="projects/index" />
      <Stack.Screen name="projects/[id]" />
      <Stack.Screen name="property" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="tips" />
      <Stack.Screen name="book" />
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  // A font load failure (rare, but possible offline on first install before
  // the font is cached) falls back to the system font rather than blocking
  // the app forever on a blank splash screen.
  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <StatusBar style="dark" />
              <AppShell />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
