/**
 * usePushNotifications — registers this device for push and reacts to pushes.
 *
 * On login:
 *   1. Ask notification permission (once).
 *   2. Get the Expo push token and register it with CRM
 *      (POST /crm/users/me/push-token) so backend orchestrators — e.g. the
 *      job-assigned notifier — can reach this device.
 *   3. Foreground pushes show a banner AND invalidate the matching queries so
 *      the UI updates underneath (a job-assigned push refreshes My Jobs).
 *   4. Tapping a push deep-links: job pushes open the job detail screen.
 *
 * On logout the token is cleared server-side (DELETE /crm/users/me/push-token)
 * so a signed-out device stops receiving work notifications.
 */
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

// Foreground presentation: show the banner, play sound, no badge mutation.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log('[Push] Simulator — skipping push registration')
    return null
  }
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Job alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const projectId =
    (Constants as any).easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    return token.data
  } catch (err) {
    if (__DEV__) console.warn('[Push] token fetch failed:', err)
    return null
  }
}

function invalidateForPush(data: Record<string, unknown> | undefined) {
  const type = data?.type
  if (type === 'job_assigned') {
    queryClient.invalidateQueries({ queryKey: ['jobs'] })
    queryClient.invalidateQueries({ queryKey: ['assignments'] })
  }
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth()
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false
      return
    }
    if (registeredRef.current) return
    registeredRef.current = true

    let cancelled = false
    ;(async () => {
      const token = await getExpoPushToken()
      if (!token || cancelled) return
      try {
        await api.post('/crm/users/me/push-token', { token, platform: Platform.OS })
        if (__DEV__) console.log('[Push] token registered')
      } catch (err) {
        if (__DEV__) console.warn('[Push] token registration failed:', err)
        registeredRef.current = false // retry on next auth change / app start
      }
    })()

    const received = Notifications.addNotificationReceivedListener((n) => {
      invalidateForPush(n.request.content.data as Record<string, unknown>)
    })
    const tapped = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as Record<string, unknown>
      invalidateForPush(data)
      const jobId = data?.jobId
      if (typeof jobId === 'string' && jobId) {
        router.push(`/job/${jobId}`)
      } else {
        router.push('/(tabs)/notifications')
      }
    })

    return () => {
      cancelled = true
      received.remove()
      tapped.remove()
    }
  }, [isAuthenticated])
}

/** Best-effort server-side token removal — call before clearing auth state. */
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/crm/users/me/push-token')
  } catch {
    // Signed-out cleanup is best-effort; the backend also drops invalid tokens.
  }
}
