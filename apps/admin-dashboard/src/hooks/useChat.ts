/**
 * Chat for the dashboard (comms /chat). The office sees every customer and
 * technician conversation as one shared inbox, plus its own team chats.
 * Customer↔technician chats are private and never appear here.
 */
import { useEffect, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import { chatSocket, currentChatSocket } from '../lib/chatSocket'
import { useAuth } from '../contexts/AuthContext'
import type { ChatConversation, ChatDetail, ChatMessage, PaginatedResponse } from '../types/api'

export const chatKeys = {
  all: ['chat'] as const,
  list: (q: string, archived: boolean) => ['chat', 'list', q, archived] as const,
  detail: (id: string) => ['chat', 'detail', id] as const,
  older: (id: string) => ['chat', 'older', id] as const,
  unread: ['chat', 'unread'] as const,
  contacts: ['chat', 'contacts'] as const,
}

export function useConversations(q = '', archived = false) {
  return useQuery<PaginatedResponse<ChatConversation>>({
    queryKey: chatKeys.list(q, archived),
    queryFn: async () => (await api.get('/comms/chat/conversations', { params: { q: q || undefined, archived, limit: 100 } })).data,
    staleTime: 60_000,
  })
}

const fetchDetail = async (id: string): Promise<ChatDetail> => (await api.get(`/comms/chat/conversations/${id}`)).data

/** The list's copy of a conversation, so its header shows at once while the messages load. */
function fromList(id: string): ChatDetail | undefined {
  for (const [, page] of queryClient.getQueriesData<PaginatedResponse<ChatConversation>>({ queryKey: ['chat', 'list'] })) {
    const c = page?.data?.find((x) => x.id === id)
    if (c) return { ...c, members: [], messages: [], hasMore: false }
  }
  return undefined
}

export function useConversation(id: string | null) {
  return useQuery<ChatDetail>({
    queryKey: chatKeys.detail(id ?? ''),
    queryFn: () => fetchDetail(id!),
    enabled: !!id,
    staleTime: 60_000,
    placeholderData: () => (id ? fromList(id) : undefined),
  })
}

/** Start loading a conversation before it's clicked (on hover), so opening it is instant. */
export function prefetchConversation(id: string) {
  void queryClient.prefetchQuery({ queryKey: chatKeys.detail(id), queryFn: () => fetchDetail(id), staleTime: 60_000 })
}

/** A conversation already in my list with this person, if there is one. */
export function findConversation(target: { with: 'customer'; customerId: string } | { with: 'technician'; techUserId: string } | { with: 'colleague'; userId: string }): ChatConversation | undefined {
  for (const [, page] of queryClient.getQueriesData<PaginatedResponse<ChatConversation>>({ queryKey: ['chat', 'list'] })) {
    const hit = page?.data?.find((c) =>
      target.with === 'customer' ? c.kind === 'CUSTOMER_OFFICE' && c.customerId === target.customerId
      : target.with === 'technician' ? c.kind === 'TECH_OFFICE' && c.peerUserId === target.techUserId
      : c.kind === 'STAFF_DIRECT' && c.peerUserId === target.userId)
    if (hit) return hit
  }
  return undefined
}

/** Scrolling back: pages of older messages before the first one on screen. */
export function useOlderMessages(id: string | null, firstSeq: number | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.older(id ?? ''),
    queryFn: async ({ pageParam }) => (await api.get(`/comms/chat/conversations/${id}/messages`, { params: { before: pageParam, limit: 50 } })).data as { data: ChatMessage[]; hasMore: boolean },
    initialPageParam: firstSeq ?? 0,
    getNextPageParam: (last) => (last.hasMore && last.data.length ? last.data[0].seq : undefined),
    enabled: false,
  })
}

export function useChatUnread() {
  const { token } = useAuth()
  return useQuery<{ total: number; byConversation: Record<string, number> }>({
    queryKey: chatKeys.unread,
    queryFn: async () => (await api.get('/comms/chat/unread')).data,
    enabled: !!token,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // safety net only; the socket keeps it current
  })
}

export function useChatContacts() {
  return useQuery<{ colleagues: Array<{ userId: string; name: string; role: string; avatarUrl: string | null }> }>({
    queryKey: chatKeys.contacts,
    queryFn: async () => (await api.get('/comms/chat/contacts')).data,
    staleTime: 5 * 60_000,
  })
}

const newClientId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Sends with an optimistic bubble; a retry reuses the same client id, so it can't post twice. */
export function useSendChat() {
  return useMutation({
    mutationFn: async (v: { conversationId: string; body: string; clientId?: string; jobId?: string; alsoEmail?: boolean }) =>
      (await api.post(`/comms/chat/conversations/${v.conversationId}/messages`, { body: v.body, clientId: v.clientId, jobId: v.jobId, alsoEmail: v.alsoEmail })).data as ChatMessage,
    onMutate: (v) => {
      v.clientId ??= newClientId()
      const key = chatKeys.detail(v.conversationId)
      queryClient.setQueryData<ChatDetail>(key, (old) => old && ({
        ...old,
        messages: [...old.messages.filter((m) => m.clientId !== v.clientId), {
          id: `pending-${v.clientId}`, conversationId: v.conversationId, seq: (old.lastSeq ?? 0) + 0.5, senderKind: 'STAFF',
          senderMemberKey: old.myMemberKey, senderUserId: null, senderName: 'You', senderRole: null, body: v.body, attachments: null,
          jobId: v.jobId ?? null, jobNumber: null, clientId: v.clientId!, editedAt: null, deletedAt: null, createdAt: new Date().toISOString(), pending: true,
        }],
      }))
    },
    onSuccess: (message) => upsertMessage(message),
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
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: chatKeys.unread }) },
  })
}

export function useOpenConversation() {
  return useMutation({
    mutationFn: async (v: { with: 'customer'; customerId: string } | { with: 'technician'; techUserId: string } | { with: 'colleague'; userId: string } | { with: 'group'; userIds: string[]; title: string }) => {
      const res =
        v.with === 'customer' ? await api.post('/comms/chat/conversations/office', { customerId: v.customerId })
        : v.with === 'technician' ? await api.post('/comms/chat/conversations/tech-office', { techUserId: v.techUserId })
        : v.with === 'colleague' ? await api.post('/comms/chat/conversations/direct', { userId: v.userId })
        : await api.post('/comms/chat/conversations/group', { userIds: v.userIds, title: v.title })
      return res.data as ChatDetail
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(chatKeys.detail(detail.id), detail)
      void queryClient.invalidateQueries({ queryKey: ['chat', 'list'] })
    },
  })
}

export function useChatAction() {
  return useMutation({
    mutationFn: async (v: { conversationId: string; action: 'archive' | 'unarchive' | 'mute' | 'unmute' | 'hide' }) => {
      const base = `/comms/chat/conversations/${v.conversationId}`
      if (v.action === 'archive' || v.action === 'unarchive') return (await api.patch(`${base}/archive`, { archived: v.action === 'archive' })).data
      if (v.action === 'hide') return (await api.patch(`${base}/hide`)).data
      const until = v.action === 'mute' ? new Date(Date.now() + 365 * 86_400_000).toISOString() : null
      return (await api.patch(`${base}/mute`, { until })).data
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: chatKeys.all }) },
  })
}

export function useEditChatMessage() {
  return useMutation({
    mutationFn: async (v: { id: string; body?: string; remove?: boolean }) =>
      (v.remove ? await api.delete(`/comms/chat/messages/${v.id}`) : await api.patch(`/comms/chat/messages/${v.id}`, { body: v.body })).data as ChatMessage,
    onSuccess: (m) => upsertMessage(m),
  })
}

/** Put a message into its open conversation (replacing the optimistic copy or an older version). */
function upsertMessage(m: ChatMessage) {
  queryClient.setQueryData<ChatDetail>(chatKeys.detail(m.conversationId), (old) => {
    if (!old) return old
    const prev = old.messages.find((x) => x.id === m.id)
    const rest = old.messages.filter((x) => x.id !== m.id && !(m.clientId && x.clientId === m.clientId))
    const messages = [...rest, { ...m, telegram: m.telegram ?? prev?.telegram ?? null }].sort((a, b) => a.seq - b.seq)
    return { ...old, messages, lastSeq: Math.max(old.lastSeq, m.seq) }
  })
}

/**
 * Mounted once in the app shell: keeps the live connection open and folds its
 * events into the caches, so badges and open conversations stay current on every page.
 */
export function useChatRealtime() {
  const { token } = useAuth()
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    const s = chatSocket(token)
    if (!s) return
    const onConnect = () => {
      setConnected(true)
      // Anything missed while offline: refetch what's on screen.
      void queryClient.invalidateQueries({ queryKey: chatKeys.all })
    }
    const onDisconnect = () => setConnected(false)
    const onMessage = (e: { conversationId: string; message: ChatMessage }) => {
      upsertMessage(e.message)
      void queryClient.invalidateQueries({ queryKey: ['chat', 'list'] })
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
    }
    const onUpdated = (e: { message: ChatMessage }) => upsertMessage(e.message)
    const onRead = (e: { conversationId: string; memberKey: string; seq: number }) => {
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(e.conversationId), (old) => old && ({
        ...old, members: old.members.map((m) => (m.memberKey === e.memberKey ? { ...m, lastReadSeq: Math.max(m.lastReadSeq, e.seq) } : m)),
      }))
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread })
      void queryClient.invalidateQueries({ queryKey: ['chat', 'list'] })
    }
    const onConversation = () => { void queryClient.invalidateQueries({ queryKey: chatKeys.all }) }
    // A message also reached (or failed to reach) someone's Telegram.
    const onDelivery = (e: { conversationId: string; messageId: string; status: 'sent' | 'failed' }) => {
      queryClient.setQueryData<ChatDetail>(chatKeys.detail(e.conversationId), (old) => old && ({
        ...old, messages: old.messages.map((m) => (m.id === e.messageId ? { ...m, telegram: m.telegram === 'sent' ? 'sent' : e.status } : m)),
      }))
    }
    s.on('chat:delivery', onDelivery)
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('chat:message', onMessage)
    s.on('chat:message_updated', onUpdated)
    s.on('chat:read', onRead)
    s.on('chat:conversation', onConversation)
    if (s.connected) setConnected(true)
    return () => {
      s.off('connect', onConnect); s.off('disconnect', onDisconnect); s.off('chat:message', onMessage)
      s.off('chat:message_updated', onUpdated); s.off('chat:read', onRead); s.off('chat:conversation', onConversation)
      s.off('chat:delivery', onDelivery)
    }
  }, [token])
  return connected
}

/** Tell the server which conversation is open (no push for what you're reading), and send typing. */
export const chatLive = {
  focus: (conversationId: string | null) => currentChatSocket()?.emit('chat:focus', { conversationId }),
  typing: (conversationId: string, typing: boolean) => currentChatSocket()?.emit('chat:typing', { conversationId, typing }),
  onMessage: (cb: (e: { conversationId: string; message: ChatMessage }) => void) => {
    const s = currentChatSocket()
    s?.on('chat:message', cb)
    return () => { s?.off('chat:message', cb) }
  },
  onTyping: (cb: (e: { conversationId: string; memberKey: string; name: string; typing: boolean }) => void) => {
    const s = currentChatSocket()
    s?.on('chat:typing', cb)
    return () => { s?.off('chat:typing', cb) }
  },
}
