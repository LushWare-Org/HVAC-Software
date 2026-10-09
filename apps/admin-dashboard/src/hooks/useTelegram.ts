/**
 * The Telegram add-on (comms /telegram): the company bot, who is linked, and invitations.
 */
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export interface TelegramStatus {
  available: boolean
  connected: boolean
  bot?: { username: string; name: string; link: string }
  enabled?: boolean
  mode?: 'webhook' | 'polling'
  lastError?: string | null
  lastErrorAt?: string | null
  linked?: { customers: number; staff: number; office?: number }
  officeAlerts?: boolean
  connectedAt?: string
}

export interface TelegramLinkRow {
  id: string
  memberKind: 'CUSTOMER' | 'STAFF'
  memberKey: string
  customerId: string | null
  userId: string | null
  name: string
  role?: string | null
  telegramName: string | null
  linkedAt: string
}

export interface OfficePrefs { alertScope: 'all' | 'mine'; quietFrom: string | null; quietTo: string | null }
export interface MyTelegram {
  available: boolean
  officeAlertsOff?: boolean
  bot?: { username: string; name: string; link: string }
  linked?: boolean
  telegramName?: string | null
  linkedAt?: string | null
  prefs?: OfficePrefs
}

export interface InviteResult { sent: number; alreadyLinked: number; noEmail: number; failed: number; total: number }

const keys = {
  me: ['telegram', 'me'] as const,
  status: ['telegram', 'status'] as const,
  links: (customerId?: string) => ['telegram', 'links', customerId ?? 'all'] as const,
}
const refresh = () => queryClient.invalidateQueries({ queryKey: ['telegram'] })

export function useTelegramStatus(enabled = true) {
  return useQuery<TelegramStatus>({
    queryKey: keys.status,
    queryFn: async () => (await api.get('/comms/telegram/settings')).data,
    staleTime: 5 * 60_000,
    retry: false,
    enabled,
  })
}

export function useTelegramLinks(customerId?: string, enabled = true) {
  return useQuery<TelegramLinkRow[]>({
    queryKey: keys.links(customerId),
    queryFn: async () => (await api.get('/comms/telegram/links', { params: { customerId } })).data,
    staleTime: 60_000,
    retry: false,
    enabled,
  })
}

export function useConnectTelegram() {
  return useMutation({
    mutationFn: async (token: string) => (await api.put('/comms/telegram/settings', { token })).data as TelegramStatus,
    onSuccess: (s) => { queryClient.setQueryData(keys.status, s); void refresh() },
  })
}

export function useTelegramEnabled() {
  return useMutation({
    mutationFn: async (change: { enabled?: boolean; officeAlerts?: boolean }) => (await api.patch('/comms/telegram/settings', change)).data as TelegramStatus,
    onSuccess: (s) => { queryClient.setQueryData(keys.status, s); void queryClient.invalidateQueries({ queryKey: keys.me }) },
  })
}

// ── My own Telegram (office alerts) ─────────────────────────────────────

/** Pass a poll interval while the connect window is open, so it notices the moment they press Start. */
export function useMyTelegram(pollMs: number | false = false) {
  return useQuery<MyTelegram>({
    queryKey: keys.me,
    queryFn: async () => (await api.get('/comms/telegram/me')).data,
    staleTime: 60_000,
    retry: false,
    refetchInterval: pollMs,
  })
}

/**
 * A fresh one-time link for this connect window. A query (one per window), not a
 * mutation: React's development double-mount can drop a mutation's answer and leave
 * the window waiting forever; a query keeps its result and is fetched once.
 */
export function useMyTelegramLink() {
  const [windowId] = useState(() => Math.random().toString(36).slice(2))
  return useQuery({
    queryKey: ['telegram', 'link', windowId],
    queryFn: async () => (await api.post('/comms/telegram/me/link')).data as { url: string; botUsername: string; expiresAt: string },
    staleTime: Infinity, gcTime: 30 * 60_000, retry: 1, refetchOnWindowFocus: false,
  })
}

export function useUpdateMyTelegram() {
  return useMutation({
    mutationFn: async (change: Partial<OfficePrefs>) => (await api.patch('/comms/telegram/me', change)).data as MyTelegram,
    onSuccess: (d) => queryClient.setQueryData(keys.me, d),
  })
}

export function useTestMyTelegram() {
  return useMutation({ mutationFn: async () => (await api.post('/comms/telegram/me/test')).data })
}

export function useUnlinkMyTelegram() {
  return useMutation({
    mutationFn: async () => (await api.delete('/comms/telegram/me/link')).data,
    onSuccess: () => { void refresh() },
  })
}

export function useDisconnectTelegram() {
  return useMutation({
    mutationFn: async () => (await api.delete('/comms/telegram/settings')).data,
    onSuccess: () => { void refresh() },
  })
}

export function useUnlinkTelegram() {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/comms/telegram/links/${id}`)).data,
    onSuccess: () => { void refresh() },
  })
}

export function useInviteToTelegram() {
  return useMutation({
    mutationFn: async (body: { customerIds?: string[]; userIds?: string[]; allCustomers?: boolean; note?: string }) =>
      (await api.post('/comms/telegram/invites', body)).data as InviteResult,
  })
}

/** "3 invites emailed, 2 already on Telegram, 1 without an email". */
export function inviteSummary(r: InviteResult): string {
  const parts = [`${r.sent} invite${r.sent === 1 ? '' : 's'} emailed`]
  if (r.alreadyLinked) parts.push(`${r.alreadyLinked} already on Telegram`)
  if (r.noEmail) parts.push(`${r.noEmail} without an email`)
  if (r.failed) parts.push(`${r.failed} failed`)
  return parts.join(', ')
}

/** The error message the server gave, or a fallback. */
export const apiError = (e: unknown, fallback: string) =>
  ((e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() || fallback)
