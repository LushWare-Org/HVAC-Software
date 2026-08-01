/**
 * useMyAgreements.ts — Customer's own service agreements.
 * Routes → /api/crm/agreements/mine (JWT-scoped by customerId server-side)
 * Confirm-by-token endpoints are public (email link flow).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export interface MyAgreementAmendment {
  id: string
  changedFields: Record<string, { from: unknown; to: unknown }>
  customerConfirmedAt?: string | null
  createdAt: string
}

export interface MyAgreement {
  id: string
  name: string
  projectId?: string | null
  houseId?: string | null
  description?: string | null
  status: 'DRAFT' | 'SENT' | 'ACTIVE' | 'PENDING_RENEWAL' | 'RENEWED' | 'EXPIRED' | 'CANCELLED'
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
  customerConfirmedAt?: string | null
  signedByName?: string | null
  documentUrl?: string | null
  amendments?: MyAgreementAmendment[]
}

export function useMyAgreements() {
  const { user } = useAuth()
  return useQuery<{ data: MyAgreement[] }>({
    queryKey: ['my-agreements', user?.customerId],
    queryFn: async () => (await api.get('/crm/agreements/mine')).data,
    enabled: !!user?.customerId,
  })
}

/** Public: preview an agreement from an email confirm link (no login needed). */
export function useAgreementByToken(token?: string) {
  return useQuery({
    queryKey: ['agreement-confirm', token],
    queryFn: async () => (await api.get(`/crm/agreements/confirm/${token}`)).data,
    enabled: !!token,
    retry: false,
  })
}

export function useConfirmAgreement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, confirmedByName }: { token: string; confirmedByName?: string }) =>
      (await api.post(`/crm/agreements/confirm/${token}`, { confirmedByName })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-agreements'] }),
  })
}
