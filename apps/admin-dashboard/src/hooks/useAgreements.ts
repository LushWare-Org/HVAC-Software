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
  projectId?: string | null
  houseId?: string | null
  componentId?: string | null
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
  templateId?: string | null
  createdAt: string
  updatedAt: string
  amendments?: AgreementAmendment[]
}

export interface AgreementInput {
  customerId?: string
  projectId?: string
  houseId?: string
  componentId?: string
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
  templateId?: string
}

// Agreements render in three namespaces: the Agreements page
// ('service-agreements'), the customer sidebar's agreements tab
// ('agreements'), and the customer status-summary ('customers' prefix,
// which counts active agreements). Refresh all of them on any write.
const invalidate = () => {
  queryClient.invalidateQueries({ queryKey: ['service-agreements'] })
  queryClient.invalidateQueries({ queryKey: ['agreements'] })
  queryClient.invalidateQueries({ queryKey: ['customers'] })
}

type AgreementFilters = { status?: string; customerId?: string; projectId?: string; houseId?: string; componentId?: string; page?: number; limit?: number }

async function fetchAgreements(filters: AgreementFilters) {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  }
  if (filters.status && filters.status !== 'ALL') params.status = filters.status
  if (filters.customerId) params.customerId = filters.customerId
  if (filters.projectId) params.projectId = filters.projectId
  if (filters.houseId) params.houseId = filters.houseId
  if (filters.componentId) params.componentId = filters.componentId
  const res = await api.get('/crm/agreements', { params })
  const raw = res.data
  if (raw.meta) return { data: raw.data, ...raw.meta }
  return raw
}

export function useServiceAgreements(filters: AgreementFilters = {}) {
  return useQuery<{ data: Agreement[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['service-agreements', filters],
    queryFn: () => fetchAgreements(filters),
  })
}

/**
 * Warm both queries Agreements.tsx mounts with: the ALL-status list and the
 * unfiltered list (used for the stat strip). Same endpoint response, two keys.
 */
export function prefetchAgreementsPage(): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['service-agreements', { status: 'ALL', limit: 100 }], queryFn: () => fetchAgreements({ status: 'ALL', limit: 100 }) }),
    queryClient.prefetchQuery({ queryKey: ['service-agreements', { limit: 100 }], queryFn: () => fetchAgreements({ limit: 100 }) }),
  ])
}

export function useServiceAgreement(id?: string | null) {
  return useQuery<Agreement>({
    queryKey: ['service-agreements', 'detail', id],
    queryFn: async () => (await api.get(`/crm/agreements/${id}`)).data,
    enabled: !!id,
  })
}

/** Warm one agreement's detail — called on row hover so the drawer opens instantly. */
export function prefetchAgreementDetail(id: string): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['service-agreements', 'detail', id],
    queryFn: async () => (await api.get(`/crm/agreements/${id}`)).data,
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

export function useDownloadAgreementPdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/crm/agreements/${id}/pdf`, { responseType: 'blob' })
      return res.data as Blob
    },
  })
}
