import { useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'
import { useSendGps } from './useSchedule'

/**
 * Background GPS tracking hook
 *
 * Starts foreground GPS while `isActive` is true (tech is EN_ROUTE / ON_SITE).
 *
 * Reliability design:
 *  - Uses a dedicated axios client with a 5s timeout (see gpsClient.ts) so a
 *    slow /scheduling/gps endpoint can't stall the main API queue.
 *  - Circuit breaker: after 3 consecutive timeouts we back off by 2× each
 *    failure up to 5 min — no more log spam, no more futile attempts when
 *    the backend is unreachable.
 *  - Auto-resumes at normal cadence on the first successful ping.
 *  - All warnings are gated by __DEV__ so prod builds stay quiet.
 *
 * @param isActive - track when true (tech has an EN_ROUTE or ON_SITE job)
 * @param accuracy - 'high' while driving, 'balanced' on-site
 */
export function useGPSTracking(isActive: boolean, accuracy: 'high' | 'balanced' = 'high') {
  const sendGps = useSendGps()
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

      await sendGps.mutateAsync({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracyM:  location.coords.accuracy ?? undefined,
        speedKmh:   location.coords.speed ? location.coords.speed * 3.6 : undefined,
        headingDeg: location.coords.heading ?? undefined,
      })

      // Success — reset failure count
      consecutiveFailuresRef.current = 0
      return true
    } catch (err: any) {
      consecutiveFailuresRef.current += 1
      // Only warn once every 3 failures in dev; never in prod
      if (__DEV__ && consecutiveFailuresRef.current % 3 === 1) {
        console.warn(
          `[GPS] ${consecutiveFailuresRef.current} consecutive failure(s) — backing off`,
        )
      }
      return false
    }
  }, [accuracy, sendGps])

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

  useEffect(() => {
    canceledRef.current = false

    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      consecutiveFailuresRef.current = 0
      return
    }

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (__DEV__) console.warn('[GPS] Foreground permission denied')
        return
      }
      // Fire immediately, then schedule the next tick
      await sendLocation()
      scheduleNext()
    })()

    return () => {
      canceledRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
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
