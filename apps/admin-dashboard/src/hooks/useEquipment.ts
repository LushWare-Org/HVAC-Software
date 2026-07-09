/**
 * useEquipment.ts — Hooks for customer equipment CRUD
 * Routes → nginx /api/crm/customers/:id/equipment/*
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

export function useAddEquipmentItem() {
  return useMutation({
    mutationFn: async ({
      customerId,
      item,
    }: {
      customerId: string
      item: {
        type: string
        brand?: string
        model?: string
        serialNo?: string
        installDate?: string
        warrantyEnd?: string
        notes?: string
      }
    }) => {
      const res = await api.post(`/crm/customers/${customerId}/equipment`, item)
      return res.data
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', customerId] })
    },
  })
}

export function useUpdateEquipmentItem() {
  return useMutation({
    mutationFn: async ({
      customerId,
      eqId,
      updates,
    }: {
      customerId: string
      eqId: string
      updates: {
        type?: string
        brand?: string
        model?: string
        serialNo?: string
        installDate?: string
        warrantyEnd?: string
        notes?: string
      }
    }) => {
      const res = await api.patch(`/crm/customers/${customerId}/equipment/${eqId}`, updates)
      return res.data
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', customerId] })
    },
  })
}

export function useDeleteEquipmentItem() {
  return useMutation({
    mutationFn: async ({ customerId, eqId }: { customerId: string; eqId: string }) => {
      await api.delete(`/crm/customers/${customerId}/equipment/${eqId}`)
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', customerId] })
    },
  })
}

// Kept for backwards compatibility — uses the new per-item endpoints under the hood
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

// ── Consumables (filters etc.) ────────────────────────────────────────────────

export interface ConsumableRecord {
  id: string
  kind: string
  partNumber?: string
  description?: string
  sizeSpec?: string
  rating?: string
  intervalDays: number
  lastReplacedAt?: string
  purchaseUrl?: string
  nextDueAt?: string
  dueInDays?: number | null
}

export interface ConsumableInput {
  kind?: string
  partNumber?: string
  description?: string
  sizeSpec?: string
  rating?: string
  intervalDays?: number
  lastReplacedAt?: string
  purchaseUrl?: string
}

export function useEquipmentConsumables(customerId: string | undefined, equipmentId: string | undefined) {
  return useQuery<ConsumableRecord[]>({
    queryKey: ['consumables', equipmentId],
    queryFn: async () => {
      const res = await api.get(`/crm/customers/${customerId}/equipment/${equipmentId}/consumables`)
      return res.data
    },
    enabled: !!customerId && !!equipmentId,
  })
}

export function useAddConsumable() {
  return useMutation({
    mutationFn: async ({ customerId, equipmentId, item }: { customerId: string; equipmentId: string; item: ConsumableInput }) => {
      const res = await api.post(`/crm/customers/${customerId}/equipment/${equipmentId}/consumables`, item)
      return res.data
    },
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['consumables', equipmentId] })
    },
  })
}

export function useUpdateConsumable() {
  return useMutation({
    mutationFn: async ({ customerId, equipmentId, id, item }: { customerId: string; equipmentId: string; id: string; item: ConsumableInput }) => {
      const res = await api.patch(`/crm/customers/${customerId}/equipment/${equipmentId}/consumables/${id}`, item)
      return res.data
    },
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['consumables', equipmentId] })
    },
  })
}

export function useDeleteConsumable() {
  return useMutation({
    mutationFn: async ({ customerId, equipmentId, id }: { customerId: string; equipmentId: string; id: string }) => {
      await api.delete(`/crm/customers/${customerId}/equipment/${equipmentId}/consumables/${id}`)
    },
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['consumables', equipmentId] })
    },
  })
}
