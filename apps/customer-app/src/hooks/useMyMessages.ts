import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/lib/api'
import type { Notification, PaginatedResponse } from '@/types/api'

/** Notifications. Chat lives in src/chat/useChat.ts. */

export function useMyNotifications(limit = 50) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', 'list', limit],
    queryFn: async () => {
      const { data } = await api.get('/comms/notifications', { params: { page: 1, limit } })
      return data
    },
    staleTime: 20 * 1000,
  })
}

export function useUnreadNotificationsCount(): number {
  const { data } = useMyNotifications()
  return useMemo(() => (data?.data ?? []).filter((n) => !n.isRead).length, [data])
}

export function useMarkMyNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/comms/notifications/${id}/read`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllMyNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/comms/notifications/read-all')
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
