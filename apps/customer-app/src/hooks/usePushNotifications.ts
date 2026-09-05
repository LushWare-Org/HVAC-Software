/**
 * Registers this device for push and reacts to incoming notifications.
 *
 * The token is an Expo push token; comms-service's PushService routes
 * ExponentPushToken[...] through Expo's push API (and native tokens through
 * FCM), so no Firebase config is needed on the app side.
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Service updates',
      importance: Notifications.AndroidImportance.HIGH,
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
  } catch {
    return null
  }
}

/** Push `data.type` → which cached queries are now stale. */
function invalidateForPush(data: Record<string, unknown> | undefined): void {
  switch (data?.type) {
    case 'job_status':
    case 'job_reminder':
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      break
    case 'quote':
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      break
    case 'invoice':
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      break
    default:
      break
  }
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

/** Deep-links a tapped push to the screen it is about. */
function routeForPush(data: Record<string, unknown> | undefined): void {
  const jobId = data?.jobId
  if (typeof jobId === 'string' && jobId) {
    router.push(`/job/${jobId}` as never)
    return
  }
  const quoteId = data?.quoteId
  if (typeof quoteId === 'string' && quoteId) {
    router.push(`/quote/${quoteId}` as never)
    return
  }
  const invoiceId = data?.invoiceId
  if (typeof invoiceId === 'string' && invoiceId) {
    router.push(`/invoice/${invoiceId}` as never)
    return
  }
  router.push('/(tabs)' as never)
}

export function usePushNotifications(): void {
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
      } catch {
        registeredRef.current = false // retry on next auth change / app start
      }
    })()

    const received = Notifications.addNotificationReceivedListener((n) =>
      invalidateForPush(n.request.content.data as Record<string, unknown>),
    )
    const tapped = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as Record<string, unknown>
      invalidateForPush(data)
      routeForPush(data)
    })

    return () => {
      cancelled = true
      received.remove()
      tapped.remove()
    }
  }, [isAuthenticated])
}

/** Best-effort server-side token removal — called by logout. */
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/crm/users/me/push-token')
  } catch {
    // Best-effort only.
  }
}
