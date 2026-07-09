import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import { setActiveCompanyFormat } from '../lib/format'
import { useAuth } from './AuthContext'

export interface CompanySettingsView {
  name: string
  logoUrl: string | null
  currency: string
  timezone: string
  features: Record<string, unknown>
}

const CompanyContext = createContext<{ settings: CompanySettingsView | null }>({ settings: null })

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<CompanySettingsView | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setSettings(null)
      return
    }
    let cancelled = false
    api
      .get('/crm/company/settings')
      .then((res) => {
        if (cancelled) return
        const s = res.data as CompanySettingsView
        setSettings(s)
        setActiveCompanyFormat({ currency: s.currency, timezone: s.timezone })
      })
      .catch(() => {
        /* keep USD defaults; the page still works */
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  return <CompanyContext.Provider value={{ settings }}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  return useContext(CompanyContext)
}
