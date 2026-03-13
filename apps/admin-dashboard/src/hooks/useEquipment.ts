/**
 * useEquipment.ts — Hooks for customer equipment CRUD
 * Routes → nginx /api/crm/customers/:id/equipment
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { EquipmentRecord } from '../types/api'

export function useCustomerEquipment(customerId: string | undefined) {
  return useQuery<EquipmentRecord[]>({
    queryKey: ['equipment', customerId],
    queryFn: async () => {
      const res = await api.get(`/crm/customers/${customerId}/equipment`)
      return res.data
    },
    enabled: !!customerId,
  })
}

export function useSaveCustomerEquipment() {
  return useMutation({
    mutationFn: async ({ customerId, equipment }: {
      customerId: string
      equipment: Array<{
        id?: string
        type?: string
        brand?: string
        model?: string
        serialNo?: string
        installDate?: string
        warrantyEnd?: string
        notes?: string
      }>
    }) => {
      const res = await api.put(`/crm/customers/${customerId}/equipment`, { equipment })
      return res.data
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
