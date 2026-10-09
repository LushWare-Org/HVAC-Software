/**
 * useAnnouncements.ts: customer-portal announcements (admin CRUD)
 * Routes → nginx /api/crm/announcements/*
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export interface Announcement {
  id: string
  title: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor: string
  icon: AnnouncementIcon
  ctaAction: AnnouncementAction
  style: AnnouncementStyle
  dismissible: boolean
  pinned: boolean
  isActive: boolean
  activeFrom?: string
  activeTo?: string
  createdAt: string
}

export type AnnouncementIcon = 'megaphone' | 'telegram' | 'sparkles' | 'gift' | 'wrench' | 'calendar' | 'alert' | 'leaf'
export type AnnouncementAction = 'link' | 'telegram' | 'none'
export type AnnouncementStyle = 'card' | 'spotlight'

export interface AnnouncementInput {
  title?: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor?: string
  icon?: AnnouncementIcon
  ctaAction?: AnnouncementAction
  style?: AnnouncementStyle
  dismissible?: boolean
  pinned?: boolean
  isActive?: boolean
  activeFrom?: string
  activeTo?: string
}

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => (await api.get('/crm/announcements')).data,
  })
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: async (item: AnnouncementInput & { title: string }) =>
      (await api.post('/crm/announcements', item)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useUpdateAnnouncement() {
  return useMutation({
    mutationFn: async ({ id, item }: { id: string; item: AnnouncementInput }) =>
      (await api.patch(`/crm/announcements/${id}`, item)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useDeleteAnnouncement() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/announcements/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
