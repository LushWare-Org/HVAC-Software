/**
 * Customer chat (comms /chat): the customer's conversation with the office and
 * private conversations with technicians who have worked for them. The server
 * only ever returns conversations about this customer.
 */
import { useEffect, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { chatSocket, currentChatSocket } from '../lib/chatSocket'
import { useAuth } from '../contexts/AuthContext'
import type { ChatConversation, ChatDetail, ChatMessage } from '../types/api'

export const chatKeys = {
  all: ['chat'] as const,
  list: ['chat', 'list'] as const,
  detail: (id: string) => ['chat', 'detail', id] as const,
  older: (id: string) => ['chat', 'older', id] as const,
  unread: ['chat', 'unread'] as const,
  contacts: ['chat', 'contacts'] as const,
}

export function useConversations() {
  const { token } = useAuth()
  return useQuery<{ data: ChatConversation[]; total: number }>({
    queryKey: chatKeys.list,
    queryFn: async () => (await api.get('/comms/chat/conversations', { params: { limit: 100 } })).data,
    enabled: !!token,
    staleTime: 60_000,
  })
}

const fetchDetail = async (id: string): Promise<ChatDetail> => (await api.get(`/comms/chat/conversations/${id}`)).data

export function useConversation(id: string | null) {
  return useQuery<ChatDetail>({
    queryKey: chatKeys.detail(id ?? ''),
    queryFn: () => fetchDetail(id!),
    enabled: !!id,
    staleTime: 60_000,
    // The list's copy shows the header at once while the messages load.
    placeholderData: () => {
      const c = queryClient.getQueryData<{ data: ChatConversation[] }>(chatKeys.list)?.data.find((x) => x.id === id)
      return c ? { ...c, members: [], messages: [], hasMore: false } : undefined
    },
  })
}

export function prefetchConversation(id: string) {
  void queryClient.prefetchQuery({ queryKey: chatKeys.detail(id), queryFn: () => fetchDetail(id), staleTime: 60_000 })
}

/** My existing conversation with the office or this technician, if any: opens with no round trip. */
export function findConversation(target: { with: 'office' } | { with: 'technician'; techUserId: string }): ChatConversation | undefined {
  return queryClient.getQueryData<{ data: ChatConversation[] }>(chatKeys.list)?.data.find((c) =>
    target.with === 'office' ? c.kind === 'CUSTOMER_OFFICE' : c.kind === 'CUSTOMER_TECH' && c.peerUserId === target.techUserId)
}

export function useOlderMessages(id: string | null, firstSeq: number | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.older(id ?? ''),
    queryFn: async ({ pageParam }) => (await api.get(`/comms/chat/conversations/${id}/messages`, { params: { before: pageParam, limit: 50 } })).data as { data: ChatMessage[]; hasMore: boolean },
    initialPageParam: firstSeq ?? 0,
    getNextPageParam: (last) => (last.hasMore && last.data.length ? last.data[0].seq : undefined),
    enabled: false,
  })
}

/** Total unread: the red dot on Messages. */
export function useChatUnread() {
  const { token } = useAuth()
  return useQuery<{ total: number; byConversation: Record<string, number> }>({
    queryKey: chatKeys.unread,
    queryFn: async () => (await api.get('/comms/chat/unread')).data,
    enabled: !!token,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

export function useChatContacts() {
  return useQuery<{ office: { name: string }; technicians: Array<{ userId: string; name: string; avatarUrl: string | null }> }>({
    queryKey: chatKeys.contacts,
    queryFn: async () => (await api.get('/comms/chat/contacts')).data,
    staleTime: 5 * 60_000,
  })
}

export function useOpenConversation() {
  return useMutation({
    mutationFn: async (v: { with: 'office' } | { with: 'technician'; techUserId: string }) =>
      (v.with === 'office'
        ? await api.post('/comms/chat/conversations/office', {})
        : await api.post('/comms/chat/conversations/customer-tech', { techUserId: v.techUserId })).data as ChatDetail,
    onSuccess: (detail) => {
      queryClient.setQueryData(chatKeys.detail(detail.id), detail)
      void queryClient.invalidateQueries({ queryKey: chatKeys.list })
    },
  })
}

const newClientId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

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

/** Hide from my list (the other side keeps it), or mute notifications. */
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

function upsertMessage(m: ChatMessage) {
  queryClient.setQueryData<ChatDetail>(chatKeys.detail(m.conversationId), (old) => {
    if (!old) return old
    const rest = old.messages.filter((x) => x.id !== m.id && !(m.clientId && x.clientId === m.clientId))
    return { ...old, messages: [...rest, m].sort((a, b) => a.seq - b.seq), lastSeq: Math.max(old.lastSeq, m.seq) }
  })
}

/** Mounted once in the portal shell: live messages, read receipts and badges on every page. */
export function useChatRealtime() {
  const { token } = useAuth()
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    const s = chatSocket(token)
    if (!s) return
    const onConnect = () => { setConnected(true); void queryClient.invalidateQueries({ queryKey: chatKeys.all }) }
    const onDisconnect = () => setConnected(false)
    const onMessage = (e: { message: ChatMessage }) => {
      upsertMessage(e.message)
      void queryClient.invalidateQueries({ queryKey: chatKeys.list })
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    }
    const onUpdated = (e: { message: ChatMessage }) => upsertMessage(e.message)
    const onRead = (e: { conversationId: string; memberKey: string; seq: number }) => {
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(e.conversationId), (old) => old && ({
        ...old, members: old.members.map((m) => (m.memberKey === e.memberKey ? { ...m, lastReadSeq: Math.max(m.lastReadSeq, e.seq) } : m)),
      }))
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    }
    const onConversation = () => { void queryClient.invalidateQueries({ queryKey: chatKeys.all }) }
    s.on('connect', onConnect); s.on('disconnect', onDisconnect)
    s.on('chat:message', onMessage); s.on('chat:message_updated', onUpdated); s.on('chat:read', onRead); s.on('chat:conversation', onConversation)
    if (s.connected) setConnected(true)
    return () => {
      s.off('connect', onConnect); s.off('disconnect', onDisconnect)
      s.off('chat:message', onMessage); s.off('chat:message_updated', onUpdated); s.off('chat:read', onRead); s.off('chat:conversation', onConversation)
    }
  }, [token])
  return connected
}

export const chatLive = {
  focus: (conversationId: string | null) => currentChatSocket()?.emit('chat:focus', { conversationId }),
  typing: (conversationId: string, typing: boolean) => currentChatSocket()?.emit('chat:typing', { conversationId, typing }),
  onTyping: (cb: (e: { conversationId: string; memberKey: string; name: string; typing: boolean }) => void) => {
    const s = currentChatSocket()
    s?.on('chat:typing', cb)
    return () => { s?.off('chat:typing', cb) }
  },
}
