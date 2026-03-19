import { useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { useSendGps } from './useSchedule'

const GPS_TASK_NAME = 'TECH_GPS_TRACKING'

/**
 * Background GPS tracking hook
 *
 * Starts background location tracking when `isActive` is true.
 * Sends GPS updates to the scheduling service.
 *
 * @param isActive - Whether to track (true when tech has EN_ROUTE or ON_SITE jobs)
 * @param accuracy - Location accuracy mode: 'high' for driving, 'balanced' for on-site
 */
export function useGPSTracking(isActive: boolean, accuracy: 'high' | 'balanced' = 'high') {
  const sendGps = useSendGps()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        accuracyM: location.coords.accuracy ?? undefined,
        speedKmh: location.coords.speed
          ? location.coords.speed * 3.6  // m/s → km/h
          : undefined,
        headingDeg: location.coords.heading ?? undefined,
      })
    } catch (err) {
      console.warn('[GPS] Failed to send location:', err)
    }
  }, [accuracy, sendGps])

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Request permissions
    ;(async () => {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync()
      if (fgStatus !== 'granted') {
        console.warn('[GPS] Foreground permission denied')
        return
      }

      // Send immediately on start
      await sendLocation()

      // Interval: 30s for high accuracy (driving), 60s for balanced (on-site)
      const intervalMs = accuracy === 'high' ? 30000 : 60000
      intervalRef.current = setInterval(sendLocation, intervalMs)
    })()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, accuracy, sendLocation])
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
