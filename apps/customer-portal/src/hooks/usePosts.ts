import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { ContractorPost } from '../types/api'

export function usePosts(type?: 'TIP' | 'VIDEO' | 'OFFER') {
  return useQuery<ContractorPost[]>({
    queryKey: ['portal-posts', type ?? 'ALL'],
    queryFn: async () => {
      const params = type ? `?type=${type}` : ''
      return (await api.get(`/crm/posts${params}`)).data
    },
  })
}

export function useLatestTip() {
  return useQuery<ContractorPost | null>({
    queryKey: ['portal-latest-tip'],
    queryFn: async () => {
      try {
        return (await api.get('/crm/posts/latest-tip')).data
      } catch {
        return null
      }
    },
  })
}
