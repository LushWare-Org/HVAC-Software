/**
 * useMyEquipment.ts — Customer's own equipment + consumables (filters etc.)
 * Routes → /api/crm/customers/:customerId/equipment[...]
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { CustomerEquipment, EquipmentConsumable } from '../types/api'

export function useMyEquipment() {
  const { user } = useAuth()
  const customerId = user?.customerId
  return useQuery<CustomerEquipment[]>({
    queryKey: ['my-equipment', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/customers/${customerId}/equipment`)
      return data
    },
    enabled: !!customerId,
  })
}

export function useEquipmentConsumables(equipmentId: string | undefined) {
  const { user } = useAuth()
  const customerId = user?.customerId
  return useQuery<EquipmentConsumable[]>({
    queryKey: ['my-consumables', equipmentId],
    queryFn: async () => {
      const { data } = await api.get(
        `/crm/customers/${customerId}/equipment/${equipmentId}/consumables`,
      )
      return data
    },
    enabled: !!customerId && !!equipmentId,
  })
}

export function useAddEquipment() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      type?: string; brand?: string; model?: string;
      serialNo?: string; installDate?: string; warrantyEnd?: string; notes?: string;
    }) => {
      const { data } = await api.post(`/crm/customers/${user?.customerId}/equipment`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-equipment', user?.customerId] })
    },
  })
}

export function useMarkConsumableReplaced(equipmentId: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (consumableId: string) => {
      const { data } = await api.post(
        `/crm/customers/${user?.customerId}/equipment/${equipmentId}/consumables/${consumableId}/replaced`,
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-consumables', equipmentId] })
    },
  })
}
