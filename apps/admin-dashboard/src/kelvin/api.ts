import api from '../lib/api'
import type { KelvinFeed, KelvinMind, KelvinPrefs, LogEntry } from './types'

export const fetchFeed = async (): Promise<KelvinFeed> => (await api.get('/chat/kelvin/feed')).data
export const savePrefs = async (p: Partial<KelvinPrefs>): Promise<KelvinPrefs> => (await api.put('/chat/kelvin/prefs', p)).data
export const fetchMind = async (): Promise<KelvinMind> => (await api.get('/chat/kelvin/mind')).data
export const forgetNote = async (id: string) => (await api.delete(`/chat/kelvin/notes/${encodeURIComponent(id)}`)).data
export const removeRoutine = async (id: string) => (await api.delete(`/chat/kelvin/routines/${encodeURIComponent(id)}`)).data
export const fetchToday = async (since: string): Promise<LogEntry[]> => (await api.get('/chat/kelvin/today', { params: { since } })).data?.data ?? []

/** Fire and forget; Kelvin's memory never blocks the screen. */
export function postEvent(e: { type: 'SHOWN' | 'SPOKE' | 'DISMISSED' | 'FIX_USED'; itemId: string; summary?: string }) {
  api.post('/chat/kelvin/events', e).catch(() => {})
}
