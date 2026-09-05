import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ContractorPost, PostType } from '@/types/api'

export function usePosts(type?: PostType) {
  return useQuery<ContractorPost[]>({
    queryKey: ['posts', type ?? 'ALL'],
    queryFn: async () => (await api.get('/crm/posts', { params: type ? { type } : {} })).data,
  })
}
