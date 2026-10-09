/**
 * Telegram for the signed-in customer (comms /telegram/me): is it on offer,
 * are they linked, and a fresh one-tap link to connect.
 */
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export interface MyTelegram {
  available: boolean
  bot?: { username: string; name: string; link: string }
  linked?: boolean
  telegramName?: string | null
  linkedAt?: string | null
  alsoPush?: boolean
}

export const telegramKey = ['telegram', 'me'] as const

/** Pass a poll interval while a connect window is open, so it notices the moment they press Start. */
export function useMyTelegram(pollMs: number | false = false) {
  return useQuery<MyTelegram>({
    queryKey: telegramKey,
    queryFn: async () => (await api.get('/comms/telegram/me')).data,
    staleTime: 5 * 60_000,
    retry: false,
    refetchInterval: pollMs,
  })
}

/**
 * A fresh one-time link for this connect window. A query (one per window), not a
 * mutation: React's development double-mount can drop a mutation's answer and leave
 * the window waiting forever; a query keeps its result and is fetched once.
 */
export function useTelegramLink() {
  const [windowId] = useState(() => Math.random().toString(36).slice(2))
  return useQuery({
    queryKey: ['telegram', 'link', windowId],
    queryFn: async () => (await api.post('/comms/telegram/me/link')).data as { url: string; botUsername: string; expiresAt: string },
    staleTime: Infinity, gcTime: 30 * 60_000, retry: 1, refetchOnWindowFocus: false,
  })
}

export function useTelegramUnlink() {
  return useMutation({
    mutationFn: async () => (await api.delete('/comms/telegram/me/link')).data,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: telegramKey }) },
  })
}

export function useTelegramAlsoPush() {
  return useMutation({
    mutationFn: async (alsoPush: boolean) => (await api.patch('/comms/telegram/me', { alsoPush })).data as MyTelegram,
    onSuccess: (d) => queryClient.setQueryData(telegramKey, d),
  })
}
