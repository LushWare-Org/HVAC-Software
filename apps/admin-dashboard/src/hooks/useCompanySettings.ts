import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { setActiveCompanyFormat } from '../lib/format'

export interface CompanySettingsView {
  id: string
  name: string
  logoUrl: string | null
  currency: string
  timezone: string
  features: Record<string, unknown>
}

/**
 * Loads per-tenant settings once per session and primes the module-level
 * currency/timezone used by formatMoney/formatDateTz. Call it once in the
 * authed shell; pages just use the format helpers.
 */
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await api.get('/crm/company/settings')
      const s = res.data as CompanySettingsView
      setActiveCompanyFormat({ currency: s.currency, timezone: s.timezone })
      return s
    },
    staleTime: 5 * 60 * 1000,
  })
}
