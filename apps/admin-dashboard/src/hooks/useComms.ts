/**
 * useComms.ts — notifications (in-app inbox, broadcasts, SMS, email).
 * Routes → nginx /api/comms/ → comms-service :3005. Chat lives in useChat.ts.
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Notification, PaginatedResponse } from '../types/api'

export function useNotifications(limit = 20) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', limit],
    queryFn: async () => {
      const res = await api.get('/comms/notifications', { params: { page: 1, limit } })
      return res.data
    },
    staleTime: 30 * 1000,
  })
}

export function useSendInAppNotification() {
  return useMutation({
    mutationFn: async (data: {
      title: string
      body: string
      type?: string
      roles?: string[]
      recipients: Array<{
        recipientId: string
        recipientName?: string
        customerId?: string
        role?: string
      }>
    }) => {
      const res = await api.post('/comms/notifications/in-app', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/comms/notifications/${id}/read`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch('/comms/notifications/read-all')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ─── Send Notifications ───────────────────────────────────────────────────────

export function useSendSms() {
  return useMutation({
    mutationFn: async (data: {
      recipientId: string
      recipientName?: string
      recipientPhone: string
      body: string
      customerId?: string
    }) => {
      const res = await api.post('/comms/notifications/sms', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useSendEmail() {
  return useMutation({
    mutationFn: async (data: {
      recipientId: string
      recipientName?: string
      recipientEmail: string
      subject: string
      htmlBody: string
      customerId?: string
    }) => {
      const res = await api.post('/comms/notifications/email', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
