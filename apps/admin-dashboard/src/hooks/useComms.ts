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
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type {
  MessageThread,
  MessageThreadDetail,
  Notification,
  PaginatedResponse,
  ThreadStatus,
  MessageChannel,
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
    staleTime: 15 * 1000, // conversations refresh frequently
  })
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
    staleTime: 10 * 1000,
  })
}

// ─── Create or retrieve a thread ──────────────────────────────────────────────
// POST /messaging/threads — returns an existing thread for the customer/channel combo
// or creates a new one.

export function useCreateThread() {
  return useMutation({
    mutationFn: async (data: { customerId?: string; customerName?: string; channel: MessageChannel; customerPhone?: string; customerEmail?: string }) => {
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
    mutationFn: async ({ threadId, body, subject }: { threadId: string; body: string; subject?: string }) => {
      const res = await api.post(`/comms/messaging/threads/${threadId}/messages`, { body, subject })
      return res.data
    },
    onSuccess: (_data, vars) => {
      // Refresh this thread's messages + thread list
      queryClient.invalidateQueries({ queryKey: ['threads', vars.threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

// ─── Mark thread as read ──────────────────────────────────────────────────────

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
