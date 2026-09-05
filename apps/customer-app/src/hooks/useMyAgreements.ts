import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { MyAgreement } from '@/types/api'

export function useMyAgreements() {
  const { user } = useAuth()
  const customerId = user?.customerId

  return useQuery<{ data: MyAgreement[] }>({
    queryKey: ['agreements', 'list', customerId],
    queryFn: async () => (await api.get('/crm/agreements/mine')).data,
    enabled: Boolean(customerId),
  })
}

/**
 * Confirms in place using the token already embedded on the customer's own
 * agreement record — the same public `/agreements/confirm/:token` endpoint
 * the emailed link uses, just reached without leaving the app.
 */
export function useConfirmAgreement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ token, confirmedByName }: { token: string; confirmedByName?: string }) =>
      (await api.post(`/crm/agreements/confirm/${token}`, { confirmedByName })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agreements'] }),
  })
}
