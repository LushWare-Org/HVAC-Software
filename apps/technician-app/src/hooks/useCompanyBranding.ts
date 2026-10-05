import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export interface CompanyBranding {
  name: string
  logoUrl: string | null
}

/** The technician's company name and logo, for the app header. */
export function useCompanyBranding() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ['companyBranding'],
    queryFn: async () => {
      const res = await api.get<CompanyBranding>('/crm/company/settings')
      return { name: res.data.name, logoUrl: res.data.logoUrl ?? null }
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60_000,
  })
}
