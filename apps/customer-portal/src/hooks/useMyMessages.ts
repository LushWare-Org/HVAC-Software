/**
 * useMyMessages — notification hooks for the customer portal (chat lives in useChat.ts).
 *
 * Split out of the original 811-line `useCustomerPortal.ts`. The unread-count
 * helper drives the red dot on the sidebar Messages item.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { keys } from './keys'
import type { Notification, PaginatedResponse } from '../types/api'

export function useMyNotifications(limit = 30) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: [...keys.notifications(), limit],
    queryFn: async () => {
      const { data } = await api.get('/comms/notifications', { params: { page: 1, limit } })
      return {
        data: data?.data ?? [],
        meta: {
          total: data?.total ?? 0,
          page: data?.page ?? 1,
          limit: data?.limit ?? limit,
          totalPages: Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? limit))),
        },
      }
    },
    staleTime: 20 * 1000,
  })
}

export function useMarkMyNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/comms/notifications/${id}/read`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications() })
    },
  })
}

export function useMarkAllMyNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/comms/notifications/read-all')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications() })
    },
  })
}

