/**
 * useMyMessages — In-app messaging + notification hooks for the customer portal.
 *
 * Split out of the original 811-line `useCustomerPortal.ts`. The unread-count
 * helper drives the red dot on the sidebar Messages item.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '../lib/api'
import { keys } from './keys'
import type { MessageThread, Notification, PaginatedResponse } from '../types/api'

export function useMyThreads() {
  return useQuery<PaginatedResponse<MessageThread>>({
    queryKey: keys.threads(),
    queryFn: async () => {
      const { data } = await api.get('/comms/messaging/threads', { params: { page: 1, limit: 100 } })
      return {
        data: data?.data ?? [],
        meta: {
          total: data?.total ?? 0,
          page: data?.page ?? 1,
          limit: data?.limit ?? 100,
          totalPages: Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 100))),
        },
      }
    },
    staleTime: 15 * 1000,
  })
}

/** Total unread count across all threads — drives the red dot on the sidebar Messages item. */
export function useUnreadMyThreadsCount(): number {
  const { data } = useMyThreads()
  return useMemo(
    () => (data?.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [data],
  )
}

export function useMyThread(threadId: string | null) {
  return useQuery<MessageThread>({
    queryKey: keys.thread(threadId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/comms/messaging/threads/${threadId}`)
      return data
    },
    enabled: !!threadId,
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
      qc.invalidateQueries({ queryKey: keys.thread(vars.threadId) })
      qc.invalidateQueries({ queryKey: keys.threads() })
      qc.invalidateQueries({ queryKey: keys.notifications() })
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
      qc.invalidateQueries({ queryKey: keys.thread(threadId) })
      qc.invalidateQueries({ queryKey: keys.threads() })
    },
  })
}

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

export function useCreateMyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      customerId?: string
      customerName?: string
      subject?: string
      jobId?: string
    }) => {
      const { data: res } = await api.post('/comms/messaging/threads', data)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.threads() })
    },
  })
}

export function useDeleteMyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const { data } = await api.delete(`/comms/messaging/threads/${threadId}`)
      return data as { deleted: boolean; id: string }
    },
    onSuccess: (_data, threadId) => {
      // Optimistically remove from thread list
      qc.setQueriesData<PaginatedResponse<MessageThread>>(
        { queryKey: keys.threads(), exact: false },
        (old) =>
          old
            ? { ...old, data: old.data.filter((t) => t.id !== threadId) }
            : old,
      )
      qc.removeQueries({ queryKey: keys.thread(threadId) })
    },
  })
}
