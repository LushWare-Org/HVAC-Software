import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export interface CompanySettings {
  id: string
  name: string
  features?: Record<string, unknown>
}

/** The company's own settings: its name and which features it has switched on. */
export function useCompanySettings() {
  const { user } = useAuth()
  return useQuery<CompanySettings>({
    queryKey: ['company', 'settings', user?.id],
    queryFn: async () => (await api.get('/crm/company/settings')).data,
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
    retry: false,
  })
}
