import { useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'
import {
  startBackgroundLocation,
  stopBackgroundLocation,
  sendGpsPoint,
  type GpsAccuracy,
} from '@/lib/backgroundLocation'

/**
 * GPS tracking hook
 *
 * Two tiers, in preference order:
 *
 *  1. Background (preferred) — hands the schedule to the OS via
 *     expo-location + expo-task-manager, so fixes keep arriving when the app
 *     is backgrounded or the screen is locked. See lib/backgroundLocation.ts.
 *
 *  2. Foreground polling (fallback) — the original setTimeout loop, used only
 *     when background tracking is unavailable: "Always" permission denied,
 *     Expo Go, or an unsupported device. It stops when the app leaves the
 *     foreground, which is precisely the limitation tier 1 exists to remove.
 *
 * Only one tier runs at a time, so the server never receives duplicate fixes
 * for the same moment.
 *
 * Fallback reliability design (unchanged from the original):
 *  - Dedicated axios client with a 5s timeout (see gpsClient.ts) so a slow
 *    /scheduling/gps endpoint can't stall the main API queue.
 *  - Circuit breaker: after 3 consecutive timeouts back off by 2x each
 *    failure up to 5 min.
 *  - Auto-resumes at normal cadence on the first successful ping.
 *  - Warnings gated by __DEV__ so prod builds stay quiet.
 *
 * @param isActive - track when true (tech is on duty)
 * @param accuracy - 'high' while driving, 'balanced' otherwise
 */
export function useGPSTracking(isActive: boolean, accuracy: GpsAccuracy = 'high') {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const consecutiveFailuresRef = useRef(0)
  const canceledRef = useRef(false)

  const baseIntervalMs = accuracy === 'high' ? 30_000 : 60_000
  const MAX_BACKOFF_MS = 5 * 60_000 // 5 min cap

  const sendLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: accuracy === 'high'
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      })

      await sendGpsPoint(location.coords)

      // Success — reset failure count
      consecutiveFailuresRef.current = 0
      return true
    } catch {
      consecutiveFailuresRef.current += 1
      // Only warn once every 3 failures in dev; never in prod
      if (__DEV__ && consecutiveFailuresRef.current % 3 === 1) {
        console.warn(
          `[GPS] ${consecutiveFailuresRef.current} consecutive failure(s) — backing off`,
        )
      }
      return false
    }
  }, [accuracy])

  const scheduleNext = useCallback(() => {
    if (canceledRef.current) return
    const failures = consecutiveFailuresRef.current
    // Exponential backoff once we hit 3 failures; uncapped otherwise
    const delay =
      failures < 3
        ? baseIntervalMs
        : Math.min(baseIntervalMs * Math.pow(2, failures - 2), MAX_BACKOFF_MS)
    timeoutRef.current = setTimeout(async () => {
      await sendLocation()
      scheduleNext()
    }, delay)
  }, [baseIntervalMs, sendLocation])

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    canceledRef.current = false

    if (!isActive) {
      clearTimer()
      consecutiveFailuresRef.current = 0
      void stopBackgroundLocation()
      return
    }

    ;(async () => {
      // Tier 1: let the OS drive it, so a locked screen keeps reporting.
      const backgroundStarted = await startBackgroundLocation(accuracy)
      if (canceledRef.current) {
        // isActive flipped off (or we unmounted) while permission prompts were
        // up — don't leave an orphaned OS task running.
        if (backgroundStarted) void stopBackgroundLocation()
        return
      }
      if (backgroundStarted) {
        // Send one fix immediately so the dispatcher sees the technician
        // without waiting for the first OS-scheduled update.
        void sendLocation()
        return
      }

      // Tier 2: foreground-only polling.
      if (__DEV__) {
        console.warn('[GPS] Background tracking unavailable — foreground polling only')
      }
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (__DEV__) console.warn('[GPS] Foreground permission denied')
        return
      }
      if (canceledRef.current) return
      await sendLocation()
      scheduleNext()
    })()

    return () => {
      canceledRef.current = true
      clearTimer()
    }
  }, [isActive, accuracy]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Request all location permissions (foreground + background)
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync()
  if (fgStatus !== 'granted') return false

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync()
  return bgStatus === 'granted'
}

/**
 * Get current location once (for check-in verification, etc.)
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    }
  } catch {
    return null
  }
}
