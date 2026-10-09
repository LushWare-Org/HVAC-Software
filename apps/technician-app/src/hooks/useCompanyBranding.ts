import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export interface CompanyBranding {
  name: string
  logoUrl: string | null
  /** The company has Kelvin switched on. */
  kelvin: boolean
}

/** The technician's company name and logo, for the app header, and whether Kelvin is on. */
export function useCompanyBranding() {
  const { isAuthenticated, user } = useAuth()
  return useQuery({
    // Per company, so one company's name can never be shown for another's.
    queryKey: ['companyBranding', user?.companyId ?? null],
    queryFn: async () => {
      const res = await api.get<{ name: string; logoUrl?: string | null; features?: Record<string, unknown> }>('/crm/company/settings')
      return { name: res.data.name, logoUrl: res.data.logoUrl ?? null, kelvin: res.data.features?.kelvin === true }
    },
    enabled: isAuthenticated && !!user?.companyId,
    staleTime: 30 * 60_000,
  })
}
