import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { Notification, PaginatedResponse } from '@/types/api'

interface NotificationFilters {
  page?: number
  limit?: number
}

/**
 * Get notifications
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(filters.page ?? 1))
      params.set('limit', String(filters.limit ?? 50))
      const res = await api.get<PaginatedResponse<Notification>>(
        `/comms/notifications?${params.toString()}`,
      )
      return res.data
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s for new notifications
  })
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
  const { data } = useNotifications({ limit: 100 })
  if (!data?.data) return 0
  return data.data.filter((n) => !n.isRead).length
}

/**
 * Mark single notification as read
 */
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await api.patch(`/comms/notifications/${notificationId}/read`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.patch('/comms/notifications/read-all')
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
