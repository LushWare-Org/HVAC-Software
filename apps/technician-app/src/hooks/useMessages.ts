import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
 * Get message threads
 */
export function useThreads(filters: ThreadFilters = {}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.threads(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      params.set('page', String(filters.page ?? 1))
      params.set('limit', String(filters.limit ?? 50))
      const res = await api.get<PaginatedResponse<MessageThread>>(
        `/comms/messaging/threads?${params.toString()}`,
      )
      return res.data
    },
    enabled: isAuthenticated,
  })
}

/**
 * Get a single thread with messages
 */
export function useThreadDetail(threadId: string) {
  return useQuery({
    queryKey: queryKeys.threadDetail(threadId),
    queryFn: async () => {
      const res = await api.get<MessageThread>(`/comms/messaging/threads/${threadId}`)
      return res.data
    },
    enabled: !!threadId,
    refetchInterval: 5000, // Poll for new messages every 5s
    staleTime: 0, // Always refetch when invalidated
  })
}

/**
 * Send a message to a thread — optimistic update for instant UI
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
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.threadDetail(threadId) })

      const previous = qc.getQueryData<MessageThread>(queryKeys.threadDetail(threadId))

      // Optimistically add message
      if (previous) {
        const optimisticMsg: ThreadMessage = {
          id: `temp-${Date.now()}`,
          body,
          direction: 'OUTBOUND',
          senderName: user?.name ?? 'You',
          createdAt: new Date().toISOString(),
          status: 'SENT',
        }
        qc.setQueryData<MessageThread>(queryKeys.threadDetail(threadId), {
          ...previous,
          messages: [...(previous.messages ?? []), optimisticMsg],
          lastMessageBody: body.substring(0, 100),
          lastMessageAt: new Date().toISOString(),
        })
      }

      return { previous, threadId }
    },
    onSuccess: (data) => {
      // Replace cache with server response (has real message IDs)
      qc.setQueryData(queryKeys.threadDetail(data.id), data)
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previous) {
        qc.setQueryData(queryKeys.threadDetail(context.threadId), context.previous)
      }
    },
  })
}

/**
 * Mark thread as read
 */
export function useMarkThreadRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (threadId: string) => {
      const res = await api.patch(`/comms/messaging/threads/${threadId}/read`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

/**
 * Create or get thread for a customer or staff member
 */
export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      customerId?: string
      customerName?: string
      participantIds?: string[]
      participantNames?: string[]
      subject?: string
    }) => {
      const res = await api.post<MessageThread>('/comms/messaging/threads', params)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}
