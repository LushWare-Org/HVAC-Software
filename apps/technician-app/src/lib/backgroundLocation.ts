/**
 * backgroundLocation.ts — OS-driven location tracking that survives a locked
 * screen.
 *
 * Why this exists
 * ---------------
 * The original tracker was a JS `setTimeout` loop inside a React hook. Both
 * iOS and Android suspend the JS timer queue once the app leaves the
 * foreground, so pings stopped the moment a technician pocketed their phone —
 * exactly the scenario live tracking exists for. `app.json` already declared
 * `UIBackgroundModes: ["location"]` and `ACCESS_BACKGROUND_LOCATION`, and
 * `expo-task-manager` was already a dependency; nothing used them.
 *
 * How it works
 * ------------
 * `Location.startLocationUpdatesAsync` hands the schedule to the OS, which
 * wakes a headless JS task on each fix even when the app is backgrounded or
 * the device is locked. The task runs OUTSIDE React, so it cannot read
 * AuthContext — it pulls the token from SecureStore on every batch instead.
 *
 * `defineTask` must run during module evaluation, before the OS can invoke the
 * task on a cold start, so this module is imported for its side effect from
 * `app/_layout.tsx`. Don't make that import lazy.
 *
 * Platform notes
 * --------------
 *  - `timeInterval` is Android-only. iOS drives updates off `distanceInterval`
 *    plus `activityType`, so both are set.
 *  - Android needs a `foregroundService` config or the OS kills the task
 *    within minutes. That is what surfaces the persistent notification.
 *  - Background location is unavailable in Expo Go. Every entry point here
 *    fails soft so the caller can fall back to foreground polling.
 */

import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import gpsClient, { setGpsAuthHeader } from './gpsClient'
import { getToken } from './storage'

export const BACKGROUND_LOCATION_TASK = 'tscrm-background-location'

export type GpsAccuracy = 'high' | 'balanced'

/** Metres of movement before the OS reports a new fix. */
const DISTANCE_INTERVAL_M: Record<GpsAccuracy, number> = { high: 25, balanced: 60 }

/** Android-only floor between fixes. Matches the old foreground cadence. */
const TIME_INTERVAL_MS: Record<GpsAccuracy, number> = { high: 30_000, balanced: 60_000 }

/**
 * POST one fix to scheduling-service.
 *
 * Shared by the background task and the foreground fallback so both paths
 * produce byte-identical payloads — the server cannot tell them apart, which
 * is what makes the fallback a genuine substitute rather than a second
 * behaviour to test.
 */
export async function sendGpsPoint(coords: Location.LocationObjectCoords): Promise<void> {
  await gpsClient.post('/scheduling/gps', {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracyM: coords.accuracy ?? undefined,
    // expo reports m/s; the API takes km/h. Negative means "unknown" on iOS.
    speedKmh: coords.speed != null && coords.speed >= 0 ? coords.speed * 3.6 : undefined,
    headingDeg: coords.heading != null && coords.heading >= 0 ? coords.heading : undefined,
  })
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    if (__DEV__) console.warn('[GPS bg] task error:', error.message)
    return
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations
  if (!locations?.length) return

  // A cold start wakes this task with a fresh JS context, so the axios auth
  // header set at login is gone. Re-read it from SecureStore. No token means
  // the technician signed out — drop the fix rather than posting anonymously.
  const token = await getToken()
  if (!token) {
    await stopBackgroundLocation()
    return
  }
  setGpsAuthHeader(token)

  // The OS may batch several fixes from one wake-up. Only the newest one is
  // the technician's position; the rest are already history and the server
  // overwrites current_location with whatever arrives last anyway.
  const latest = locations[locations.length - 1]
  try {
    await sendGpsPoint(latest.coords)
  } catch {
    // Best-effort. The next fix retries; there is no value in queueing stale
    // positions for a live map.
  }
})

/** True when the OS is currently driving the background task. */
export async function isBackgroundLocationRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
  } catch {
    return false
  }
}

/**
 * Ask for background ("Always") location permission.
 *
 * Both platforms require foreground to be granted first, and Android 11+
 * refuses to show the Always prompt in the same session as the foreground
 * one — the technician has to pick it from Settings. Returns false rather
 * than throwing so the caller can fall back.
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync()
    if (fg.status !== 'granted') return false
    const bg = await Location.requestBackgroundPermissionsAsync()
    return bg.status === 'granted'
  } catch {
    return false
  }
}

/**
 * Start OS-driven tracking. Returns false when background tracking is not
 * available (permission denied, Expo Go, unsupported device) so the caller
 * can fall back to foreground polling.
 */
export async function startBackgroundLocation(accuracy: GpsAccuracy = 'high'): Promise<boolean> {
  try {
    const granted = await requestBackgroundPermission()
    if (!granted) return false

    // Restarting with different options is how cadence changes take effect;
    // startLocationUpdatesAsync on an already-running task is a no-op.
    if (await isBackgroundLocationRunning()) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy:
        accuracy === 'high' ? Location.Accuracy.High : Location.Accuracy.Balanced,
      timeInterval: TIME_INTERVAL_MS[accuracy],
      distanceInterval: DISTANCE_INTERVAL_M[accuracy],
      // The OS otherwise pauses updates when it decides the user has stopped
      // moving, which reads as a dead technician on the dispatch map.
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Sharing your location',
        notificationBody: 'Your dispatcher can see your position while you are on duty.',
        notificationColor: '#2563EB',
      },
    })
    return true
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[GPS bg] could not start:', (err as Error)?.message ?? err)
    }
    return false
  }
}

/** Stop OS-driven tracking. Safe to call when it was never started. */
export async function stopBackgroundLocation(): Promise<void> {
  try {
    if (await isBackgroundLocationRunning()) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    }
  } catch {
    // Nothing to stop, or the task was never registered on this platform.
  }
}
