import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/lib/api'
import type { MessageThread, Notification, PaginatedResponse } from '@/types/api'

/**
 * Keys sit under ['threads'] / ['notifications'] so the message_new socket
 * event (see realtimeEvents) refreshes them with no extra wiring.
 */

export function useMyThreads() {
  return useQuery<PaginatedResponse<MessageThread>>({
    queryKey: ['threads', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/comms/messaging/threads', { params: { page: 1, limit: 100 } })
      return data
    },
    staleTime: 15 * 1000,
  })
}

/** Total unread count across all threads — drives the tab bar badge. */
export function useUnreadThreadsCount(): number {
  const { data } = useMyThreads()
  return useMemo(
    () => (data?.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [data],
  )
}

export function useMyThread(threadId: string | undefined) {
  return useQuery<MessageThread>({
    queryKey: ['threads', 'detail', threadId],
    queryFn: async () => {
      const { data } = await api.get(`/comms/messaging/threads/${threadId}`)
      return data
    },
    enabled: Boolean(threadId),
  })
}

export function useSendMyThreadMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { data } = await api.post(`/comms/messaging/threads/${threadId}/messages`, { body })
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['threads', 'detail', vars.threadId] })
      qc.invalidateQueries({ queryKey: ['threads', 'list'] })
    },
  })
}

export function useMarkMyThreadRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data } = await api.patch(`/comms/messaging/threads/${threadId}/read`)
      return data
    },
    onSuccess: (_data, threadId) => {
      qc.invalidateQueries({ queryKey: ['threads', 'detail', threadId] })
      qc.invalidateQueries({ queryKey: ['threads', 'list'] })
    },
  })
}

/**
 * Admin thread: no subject, empty participantIds → all admins can see and
 * respond. A technician thread carries the tech's name in the subject —
 * see threadActions.getThreadTitle for how that's parsed back out.
 */
export function useCreateMyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { customerId?: string; customerName?: string; subject?: string }) => {
      const { data } = await api.post('/comms/messaging/threads', input)
      return data as MessageThread
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads', 'list'] })
    },
  })
}

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
