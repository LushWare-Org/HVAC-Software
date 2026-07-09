/**
 * useAgreements.ts — Hooks for service agreements
 * Routes → nginx /api/crm/agreements → crm-service :3001
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export type AgreementStatus =
  | 'DRAFT' | 'SENT' | 'ACTIVE' | 'PENDING_RENEWAL' | 'RENEWED' | 'EXPIRED' | 'CANCELLED'

export interface AgreementAmendment {
  id: string
  agreementId: string
  changedFields: Record<string, { from: unknown; to: unknown }>
  changedBy: string
  changedByName?: string | null
  customerNotifiedAt?: string | null
  customerConfirmedAt?: string | null
  createdAt: string
}

export interface Agreement {
  id: string
  companyId: string
  customerId: string
  customer?: {
    id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null
    address?: string | null; city?: string | null
  }
  name: string
  description?: string | null
  status: AgreementStatus
  startDate: string
  endDate?: string | null
  value?: string | number | null
  billingCycle?: string | null
  billingAmount?: string | number | null
  nextBillingDate?: string | null
  serviceType?: string | null
  serviceInterval?: string | null
  serviceIntervalDays?: number | null
  visitsIncluded?: number | null
  visitsUsed: number
  lastServiceDate?: string | null
  nextServiceDate?: string | null
  autoCreateJobs: boolean
  leadDays: number
  autoRenew: boolean
  customerConfirmedAt?: string | null
  signedAt?: string | null
  signedByName?: string | null
  renewedFromId?: string | null
  createdAt: string
  updatedAt: string
  amendments?: AgreementAmendment[]
}

export interface AgreementInput {
  customerId?: string
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  value?: number
  billingCycle?: string
  billingAmount?: number
  nextBillingDate?: string
  serviceType?: string
  serviceInterval?: string
  serviceIntervalDays?: number
  visitsIncluded?: number
  nextServiceDate?: string
  autoCreateJobs?: boolean
  leadDays?: number
  autoRenew?: boolean
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: ['service-agreements'] })

export function useServiceAgreements(filters: { status?: string; customerId?: string; page?: number; limit?: number } = {}) {
  return useQuery<{ data: Agreement[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['service-agreements', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.status && filters.status !== 'ALL') params.status = filters.status
      if (filters.customerId) params.customerId = filters.customerId
      const res = await api.get('/crm/agreements', { params })
      const raw = res.data
      if (raw.meta) return { data: raw.data, ...raw.meta }
      return raw
    },
  })
}

export function useServiceAgreement(id?: string | null) {
  return useQuery<Agreement>({
    queryKey: ['service-agreements', 'detail', id],
    queryFn: async () => (await api.get(`/crm/agreements/${id}`)).data,
    enabled: !!id,
  })
}

export function useCreateAgreement() {
  return useMutation({
    mutationFn: async (data: AgreementInput) => (await api.post('/crm/agreements', data)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateAgreement() {
  return useMutation({
    mutationFn: async ({ id, ...data }: AgreementInput & { id: string }) =>
      (await api.patch(`/crm/agreements/${id}`, data)).data,
    onSuccess: invalidate,
  })
}

export function useSendAgreement() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/crm/agreements/${id}/send`)).data,
    onSuccess: invalidate,
  })
}

export function useRenewAgreement() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/crm/agreements/${id}/renew`)).data,
    onSuccess: invalidate,
  })
}

export function useCancelAgreement() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/crm/agreements/${id}/cancel`)).data,
    onSuccess: invalidate,
  })
}
