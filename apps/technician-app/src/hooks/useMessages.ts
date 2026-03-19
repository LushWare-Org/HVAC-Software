import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { MessageThread, PaginatedResponse } from '@/types/api'

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
    refetchInterval: 10000, // Poll for new messages every 10s
  })
}

/**
 * Send a message to a thread
 */
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const res = await api.post(`/comms/messaging/threads/${threadId}/messages`, { body })
      return { ...res.data, threadId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.threadDetail(data.threadId) })
      qc.invalidateQueries({ queryKey: ['threads'] })
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
 * Create or get thread for a customer
 */
export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ customerId, customerName }: { customerId: string; customerName: string }) => {
      const res = await api.post<MessageThread>('/comms/messaging/threads', {
        customerId,
        customerName,
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}
