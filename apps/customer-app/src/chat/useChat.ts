/**
 * Customer chat (comms /chat): the customer's conversation with the office and
 * private chats with technicians who have visited them. The server only ever
 * returns conversations about this customer.
 */
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import { getWsBaseUrl } from '@/contexts/SocketContext'
import type { ChatConversation, ChatDetail, ChatMessage } from '@/types/api'

export const chatKeys = {
  all: ['chat'] as const,
  list: ['chat', 'list'] as const,
  detail: (id: string) => ['chat', 'detail', id] as const,
  unread: ['chat', 'unread'] as const,
  contacts: ['chat', 'contacts'] as const,
}

export function useConversations() {
  const { isAuthenticated } = useAuth()
  return useQuery<{ data: ChatConversation[]; total: number }>({
    queryKey: chatKeys.list,
    queryFn: async () => (await api.get('/comms/chat/conversations', { params: { limit: 100 } })).data,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useConversation(id: string | null) {
  return useQuery<ChatDetail>({
    queryKey: chatKeys.detail(id ?? ''),
    queryFn: async () => (await api.get(`/comms/chat/conversations/${id}`)).data,
    enabled: !!id,
    staleTime: 60_000,
    // The list's copy shows the header at once while the messages load.
    placeholderData: () => {
      const c = queryClient.getQueryData<{ data: ChatConversation[] }>(chatKeys.list)?.data.find((x) => x.id === id)
      return c ? { ...c, members: [], messages: [], hasMore: false } : undefined
    },
  })
}

export async function fetchOlder(id: string, beforeSeq: number): Promise<{ data: ChatMessage[]; hasMore: boolean }> {
  return (await api.get(`/comms/chat/conversations/${id}/messages`, { params: { before: beforeSeq, limit: 50 } })).data
}

/** Unread across all my conversations: the Messages tab badge. */
export function useChatUnreadTotal(): number {
  const { isAuthenticated } = useAuth()
  const q = useQuery<{ total: number; byConversation: Record<string, number> }>({
    queryKey: chatKeys.unread,
    queryFn: async () => (await api.get('/comms/chat/unread')).data,
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
  return q.data?.total ?? 0
}

export function useChatContacts() {
  return useQuery<{
    office: { name: string }
    technicians: Array<{ userId: string; name: string; avatarUrl: string | null }>
  }>({
    queryKey: chatKeys.contacts,
    queryFn: async () => (await api.get('/comms/chat/contacts')).data,
    staleTime: 5 * 60_000,
  })
}

export function useOpenConversation() {
  return useMutation({
    mutationFn: async (v: { with: 'office' } | { with: 'technician'; techUserId: string }) =>
      (v.with === 'office' ? await api.post('/comms/chat/conversations/office', {})
        : await api.post('/comms/chat/conversations/customer-tech', { techUserId: v.techUserId })).data as ChatDetail,
    onSuccess: (detail) => {
      queryClient.setQueryData(chatKeys.detail(detail.id), detail)
      void queryClient.invalidateQueries({ queryKey: chatKeys.list })
    },
  })
}

const newClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function useSendChat() {
  return useMutation({
    mutationFn: async (v: { conversationId: string; body: string; clientId?: string; jobId?: string }) =>
      (await api.post(`/comms/chat/conversations/${v.conversationId}/messages`, { body: v.body, clientId: v.clientId, jobId: v.jobId })).data as ChatMessage,
    onMutate: (v) => {
      v.clientId ??= newClientId()
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(v.conversationId), (old) => old && ({
        ...old,
        messages: [...old.messages.filter((m) => m.clientId !== v.clientId), {
          id: `pending-${v.clientId}`, conversationId: v.conversationId, seq: (old.lastSeq ?? 0) + 0.5, senderKind: 'CUSTOMER',
          senderMemberKey: old.myMemberKey, senderUserId: null, senderName: 'You', senderRole: 'customer', body: v.body, attachments: null,
          jobId: v.jobId ?? null, jobNumber: null, clientId: v.clientId!, editedAt: null, deletedAt: null, createdAt: new Date().toISOString(), pending: true,
        }],
      }))
    },
    onSuccess: (m) => upsertMessage(m),
    onError: (_e, v) => {
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(v.conversationId), (old) => old && ({
        ...old, messages: old.messages.map((m) => (m.clientId === v.clientId ? { ...m, pending: false, failed: true } : m)),
      }))
    },
  })
}

export function useMarkChatRead() {
  return useMutation({
    mutationFn: async (v: { conversationId: string; seq?: number }) => (await api.patch(`/comms/chat/conversations/${v.conversationId}/read`, { seq: v.seq })).data,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: chatKeys.unread }); void queryClient.invalidateQueries({ queryKey: chatKeys.list }) },
  })
}

export function useChatAction() {
  return useMutation({
    mutationFn: async (v: { conversationId: string; action: 'hide' | 'mute' | 'unmute' }) => {
      const base = `/comms/chat/conversations/${v.conversationId}`
      if (v.action === 'hide') return (await api.patch(`${base}/hide`)).data
      return (await api.patch(`${base}/mute`, { until: v.action === 'mute' ? new Date(Date.now() + 365 * 86_400_000).toISOString() : null })).data
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: chatKeys.all }) },
  })
}

export function upsertMessage(m: ChatMessage) {
  queryClient.setQueryData<ChatDetail>(chatKeys.detail(m.conversationId), (old) => {
    if (!old) return old
    const rest = old.messages.filter((x) => x.id !== m.id && !(m.clientId && x.clientId === m.clientId))
    return { ...old, messages: [...rest, m].sort((a, b) => a.seq - b.seq), lastSeq: Math.max(old.lastSeq, m.seq) }
  })
}

// ── Live connection (one per signed-in session) ──────────────────────────────

let socket: Socket | null = null
const typingListeners = new Set<(e: { conversationId: string; memberKey: string; name: string; typing: boolean }) => void>()

/** Mounted once in the app root. */
export function useChatRealtime() {
  const { token, isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (!isAuthenticated || !token) return
    const s = io(`${getWsBaseUrl()}/messages`, {
      auth: { token }, transports: ['websocket', 'polling'],
      reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 2000, reconnectionDelayMax: 15000,
    })
    socket = s
    s.on('connect', () => { setConnected(true); void queryClient.invalidateQueries({ queryKey: chatKeys.all }) })
    s.on('disconnect', () => setConnected(false))
    s.on('chat:message', (e: { message: ChatMessage }) => {
      upsertMessage(e.message)
      void queryClient.invalidateQueries({ queryKey: chatKeys.list })
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    })
    s.on('chat:message_updated', (e: { message: ChatMessage }) => upsertMessage(e.message))
    s.on('chat:read', (e: { conversationId: string; memberKey: string; seq: number }) => {
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(e.conversationId), (old) => old && ({
        ...old, members: old.members.map((m) => (m.memberKey === e.memberKey ? { ...m, lastReadSeq: Math.max(m.lastReadSeq, e.seq) } : m)),
      }))
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    })
    s.on('chat:conversation', () => { void queryClient.invalidateQueries({ queryKey: chatKeys.all }) })
    s.on('chat:typing', (e) => typingListeners.forEach((cb) => cb(e)))
    return () => {
      s.removeAllListeners()
      s.disconnect()
      if (socket === s) socket = null
      setConnected(false)
    }
  }, [isAuthenticated, token])
  return connected
}

export const chatLive = {
  focus: (conversationId: string | null) => socket?.emit('chat:focus', { conversationId }),
  typing: (conversationId: string, typing: boolean) => socket?.emit('chat:typing', { conversationId, typing }),
  onTyping: (cb: (e: { conversationId: string; memberKey: string; name: string; typing: boolean }) => void) => {
    typingListeners.add(cb)
    return () => { typingListeners.delete(cb) }
  },
}
