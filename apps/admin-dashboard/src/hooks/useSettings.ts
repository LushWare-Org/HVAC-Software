/**
 * useSettings.ts — Hooks for Settings page (profile & company)
 * Profile via /crm/users/me, Company via /crm/company
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

/**
 * Local mirrors of `packages/types/src/finance-settings.ts` — the frontends
 * deliberately do not depend on `@tscrm/types` (see the `featureEnabled` mirror
 * in `lib/format.ts` / the reschedule vocabulary in `lib/reschedule.ts` for the
 * same pattern). Keep these three interfaces in sync with that file.
 */
export interface CurrencySettings {
  enabled: string[]
  default: string
}

export interface TaxRatePreset {
  id: string
  companyId: string
  name: string
  rate: number
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PaymentTermsPreset {
  id: string
  companyId: string
  name: string
  days: number
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  companyId: string
  auth0UserId?: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export function useMyProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/crm/users/me')
      return res.data
    },
  })
}

export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string }) => {
      const me = await api.get('/crm/users/me')
      const res = await api.patch(`/crm/users/${me.data.id}`, data)
      return res.data as UserProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export interface CompanyProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country: string
  website?: string
  logoUrl?: string
  automaticFollowupEnabled: boolean
  isActive: boolean
  trialEndsAt?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyInput {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  website?: string
  logoUrl?: string
  automaticFollowupEnabled?: boolean
}

export function useCompany() {
  return useQuery<CompanyProfile>({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await api.get('/crm/company')
      return res.data
    },
    enabled: !!localStorage.getItem('tscrm_token'),
    retry: 1,
  })
}

export function useUpdateCompany() {
  return useMutation({
    mutationFn: async (data: UpdateCompanyInput) => {
      const res = await api.patch('/crm/company', data)
      return res.data as CompanyProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}

// ── Currencies ───────────────────────────────────────────────────────────

export function useCurrencies() {
  return useQuery<CurrencySettings>({
    queryKey: ['company', 'currencies'],
    queryFn: async () => {
      const res = await api.get('/crm/company/currencies')
      return res.data
    },
  })
}

export function useUpdateCurrencies() {
  return useMutation({
    mutationFn: async (data: CurrencySettings) => {
      const res = await api.patch('/crm/company/currencies', data)
      return res.data as CurrencySettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'currencies'] })
    },
  })
}

// ── Tax rate presets ─────────────────────────────────────────────────────

export function useTaxRates() {
  return useQuery<TaxRatePreset[]>({
    queryKey: ['company', 'tax-rates'],
    queryFn: async () => {
      const res = await api.get('/crm/company/tax-rates')
      return res.data
    },
  })
}

export function useCreateTaxRate() {
  return useMutation({
    mutationFn: async (data: { name: string; rate: number; isDefault?: boolean }) => {
      const res = await api.post('/crm/company/tax-rates', data)
      return res.data as TaxRatePreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

export function useUpdateTaxRate() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; rate?: number; isActive?: boolean; isDefault?: boolean; sortOrder?: number }) => {
      const res = await api.patch(`/crm/company/tax-rates/${id}`, data)
      return res.data as TaxRatePreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

export function useDeleteTaxRate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/company/tax-rates/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'tax-rates'] }),
  })
}

// ── Payment terms presets ────────────────────────────────────────────────

export function usePaymentTerms() {
  return useQuery<PaymentTermsPreset[]>({
    queryKey: ['company', 'payment-terms'],
    queryFn: async () => {
      const res = await api.get('/crm/company/payment-terms')
      return res.data
    },
  })
}

export function useCreatePaymentTerms() {
  return useMutation({
    mutationFn: async (data: { name: string; days: number; isDefault?: boolean }) => {
      const res = await api.post('/crm/company/payment-terms', data)
      return res.data as PaymentTermsPreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}

export function useUpdatePaymentTerms() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; days?: number; isActive?: boolean; isDefault?: boolean; sortOrder?: number }) => {
      const res = await api.patch(`/crm/company/payment-terms/${id}`, data)
      return res.data as PaymentTermsPreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}

export function useDeletePaymentTerms() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/company/payment-terms/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'payment-terms'] }),
  })
}
