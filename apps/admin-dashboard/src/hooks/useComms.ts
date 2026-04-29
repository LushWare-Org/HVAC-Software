/**
 * useComms.ts — Hooks for the Communications page
 * Routes → nginx /api/comms/ → comms-service :3005
 *
 * The messaging API is THREAD-BASED:
 *   POST   /messaging/threads                 — create or retrieve a thread for a customer
 *   GET    /messaging/threads                 — list threads (paginated)
 *   GET    /messaging/threads/:id             — get thread + full message history
 *   PATCH  /messaging/threads/:id/status      — mark ACTIVE / RESOLVED / SPAM
 *   PATCH  /messaging/threads/:id/read        — mark all messages in thread as read
 *   POST   /messaging/threads/:id/messages    — send a message from staff to customer
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type {
  MessageThread,
  MessageThreadDetail,
  Notification,
  PaginatedResponse,
  ThreadStatus,
} from '../types/api'

// ─── Thread list ───────────────────────────────────────────────────────────────

interface ThreadFilters {
  page?: number
  limit?: number
  status?: ThreadStatus | 'all'
}

export function useThreads(filters: ThreadFilters = {}) {
  return useQuery<PaginatedResponse<MessageThread>>({
    queryKey: ['threads', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.status && filters.status !== 'all') params.status = filters.status
      const res = await api.get('/comms/messaging/threads', { params })
      return res.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000, // Poll for updates
  })
}

// ─── Unread thread count (for sidebar badge) ──────────────────────────────────

/**
 * Returns total unread message count across all threads.
 * Drives the red badge on the Communications sidebar item.
 * Re-uses the same `useThreads` cache so no extra network request is made.
 */
export function useUnreadThreadsCount(): number {
  const { data } = useThreads()
  return useMemo(
    () => (data?.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [data],
  )
}

// ─── Single thread with messages ──────────────────────────────────────────────

export function useThread(threadId: string | null) {
  return useQuery<MessageThreadDetail>({
    queryKey: ['threads', threadId],
    queryFn: async () => {
      const res = await api.get(`/comms/messaging/threads/${threadId}`)
      return res.data
    },
    enabled: !!threadId,
    staleTime: 0,
    refetchInterval: 5 * 1000, // Poll for new messages
  })
}

// ─── Create or retrieve a thread ──────────────────────────────────────────────

export function useCreateThread() {
  return useMutation({
    mutationFn: async (data: {
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      participantIds?: string[];
      participantNames?: string[];
      subject?: string;
    }) => {
      const res = await api.post('/comms/messaging/threads', data)
      return res.data as MessageThread
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

// ─── Send a message to a thread ───────────────────────────────────────────────

export function useSendThreadMessage() {
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const res = await api.post<MessageThreadDetail>(
        `/comms/messaging/threads/${threadId}/messages`,
        { body },
      )
      return res.data
    },
    onSuccess: (data, vars) => {
      // Set the thread data directly from the response for instant UI update
      queryClient.setQueryData(['threads', vars.threadId], data)
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

// ─── Mark thread as read ──────────────────────────────────────────────────────

export function useDeleteThread() {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await api.delete(`/comms/messaging/threads/${threadId}`)
      return res.data as { deleted: boolean; id: string }
    },
    onSuccess: (_data, threadId) => {
      // Remove from list cache immediately so the deleted thread disappears
      queryClient.setQueriesData<PaginatedResponse<MessageThread>>(
        { queryKey: ['threads'], exact: false },
        (old) =>
          old
            ? { ...old, data: old.data.filter((t) => t.id !== threadId), total: Math.max(0, old.total - 1) }
            : old,
      )
      queryClient.removeQueries({ queryKey: ['threads', threadId] })
    },
  })
}

export function useMarkThreadRead() {
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await api.patch(`/comms/messaging/threads/${threadId}/read`)
      return res.data
    },
    onSuccess: (_data, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['threads', threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

// ─── Update thread status ─────────────────────────────────────────────────────

export function useUpdateThreadStatus() {
  return useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: ThreadStatus }) => {
      const res = await api.patch(`/comms/messaging/threads/${threadId}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────

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
