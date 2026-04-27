import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { MessageThread, ThreadMessage, PaginatedResponse } from '@/types/api'

interface ThreadFilters {
  status?: string
  page?: number
  limit?: number
}

/**
 * Get message threads.
 * Polls every 15 seconds so new incoming messages surface without manual refresh.
 */
export function useThreads(filters: ThreadFilters = {}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.threads(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      params.set('page',  String(filters.page  ?? 1))
      params.set('limit', String(filters.limit ?? 50))
      const res = await api.get<PaginatedResponse<MessageThread>>(
        `/comms/messaging/threads?${params.toString()}`,
      )
      return res.data
    },
    enabled: isAuthenticated,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}

/**
 * Total unread message count across all threads (for the tab badge).
 */
export function useUnreadThreadsCount(): number {
  const { data } = useThreads()
  return useMemo(
    () => (data?.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [data],
  )
}

/**
 * Get a single thread with messages.
 * Polls every 8 seconds as a WebSocket fallback when the socket disconnects.
 */
export function useThreadDetail(threadId: string) {
  return useQuery({
    queryKey: queryKeys.threadDetail(threadId),
    queryFn: async () => {
      const res = await api.get<MessageThread>(`/comms/messaging/threads/${threadId}`)
      return res.data
    },
    enabled: !!threadId,
    refetchInterval: 8_000,
    staleTime: 0, // always show latest messages
  })
}

/**
 * Send a message — optimistic update so the bubble appears instantly.
 */
export function useSendMessage() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const res = await api.post<MessageThread>(
        `/comms/messaging/threads/${threadId}/messages`,
        { body },
      )
      return res.data
    },
    onMutate: async ({ threadId, body }) => {
      await qc.cancelQueries({ queryKey: queryKeys.threadDetail(threadId) })
      const previous = qc.getQueryData<MessageThread>(queryKeys.threadDetail(threadId))

      if (previous) {
        const optimisticMsg: ThreadMessage = {
          id:         `temp-${Date.now()}`,
          body,
          direction:  'OUTBOUND',
          senderName: user?.name ?? 'You',
          senderId:   user?.id,
          createdAt:  new Date().toISOString(),
          status:     'SENT',
        }
        qc.setQueryData<MessageThread>(queryKeys.threadDetail(threadId), {
          ...previous,
          messages:        [...(previous.messages ?? []), optimisticMsg],
          lastMessageBody: body.substring(0, 100),
          lastMessageAt:   new Date().toISOString(),
        })
      }
      return { previous, threadId }
    },
    onSuccess: (data) => {
      // Replace cache with authoritative server response
      qc.setQueryData(queryKeys.threadDetail(data.id), data)
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.threadDetail(ctx.threadId), ctx.previous)
      }
    },
  })
}

/**
 * Mark all messages in a thread as read
 */
export function useMarkThreadRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await api.patch(`/comms/messaging/threads/${threadId}/read`)
      return res.data
    },
    onSuccess: (_data, threadId) => {
      // Zero out unread count in thread list cache
      qc.setQueryData<PaginatedResponse<MessageThread>>(
        queryKeys.threads({}),
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === threadId ? { ...t, unreadCount: 0 } : t,
            ),
          }
        },
      )
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

/**
 * Permanently delete a thread (hard-delete with cascade on messages).
 */
export function useDeleteThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await api.delete(`/comms/messaging/threads/${threadId}`)
      return res.data as { deleted: boolean; id: string }
    },
    onSuccess: (_data, threadId) => {
      // Remove optimistically from thread list
      qc.setQueryData<PaginatedResponse<MessageThread>>(
        queryKeys.threads({}),
        (old) => {
          if (!old) return old
          return { ...old, data: old.data.filter((t) => t.id !== threadId) }
        },
      )
      qc.removeQueries({ queryKey: queryKeys.threadDetail(threadId) })
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

/**
 * Create or retrieve a thread.
 *
 * Privacy design for the technician app:
 *  - When the technician opens a chat with a customer, the thread is scoped
 *    to *this technician* by injecting `participantIds: [user.id]` and a
 *    tech-specific subject (`Tech: {name}`). That way it does NOT collide
 *    with the admin↔customer support thread (which has no subject). The
 *    backend thread-reuse key is (customerId, subject) so each tech gets
 *    their own private line to the customer.
 *  - When `customerId` is omitted, we're creating a staff chat — we still
 *    inject the current user into participantIds so they're a member.
 *
 * Passing `customerId` → tech↔customer thread.
 * Passing `participantIds` without customerId → staff↔staff thread.
 * Pass `subject` to override the default (e.g. on a job-specific chat).
 */
export function useCreateThread() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      customerId?:       string
      customerName?:     string
      participantIds?:   string[]
      participantNames?: string[]
      subject?:          string
      jobId?:            string
    }) => {
      // Always ensure the tech is in participantIds so client-side filtering
      // and backend participant match both see them.
      const selfId   = user?.id
      const selfName = user?.name

      const participantIds = Array.from(
        new Set([...(params.participantIds ?? []), ...(selfId ? [selfId] : [])]),
      )
      const participantNames = Array.from(
        new Set([...(params.participantNames ?? []), ...(selfName ? [selfName] : [])]),
      )

      // For customer threads, scope by tech so we don't merge with admin's
      // support thread. Caller-supplied subject wins (e.g. job-specific).
      const subject = params.customerId
        ? params.subject ?? (selfName ? `Tech: ${selfName}` : `Tech: ${selfId ?? ''}`)
        : params.subject

      const body = { ...params, participantIds, participantNames, subject }

      const res = await api.post<MessageThread>('/comms/messaging/threads', body)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}
