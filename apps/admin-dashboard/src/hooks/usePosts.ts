import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export interface Post {
  id: string
  type: 'TIP' | 'VIDEO' | 'OFFER'
  title: string
  body?: string
  videoUrl?: string
  heroImageUrl?: string
  isPinned: boolean
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PostInput {
  type?: 'TIP' | 'VIDEO' | 'OFFER'
  title?: string
  body?: string
  videoUrl?: string
  heroImageUrl?: string
  isPinned?: boolean
  isPublished?: boolean
}

const KEY = ['admin-posts']

export function useAdminPosts() {
  return useQuery<Post[]>({
    queryKey: KEY,
    queryFn: async () => (await api.get('/crm/posts/admin')).data,
  })
}

export function useCreatePost() {
  return useMutation({
    mutationFn: async (item: PostInput & { title: string }) =>
      (await api.post('/crm/posts', item)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdatePost() {
  return useMutation({
    mutationFn: async ({ id, item }: { id: string; item: PostInput }) =>
      (await api.patch(`/crm/posts/${id}`, item)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeletePost() {
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/crm/posts/${id}`) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
