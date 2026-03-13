/**
 * useAddresses.ts — Hooks for customer/lead address CRUD
 * Routes → nginx /api/crm/customers/:id/addresses & /api/crm/leads/:id/addresses
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { Address } from '../types/api'

export function useCustomerAddresses(customerId: string | undefined) {
  return useQuery<Address[]>({
    queryKey: ['addresses', 'customer', customerId],
    queryFn: async () => {
      const res = await api.get(`/crm/customers/${customerId}/addresses`)
      return res.data
    },
    enabled: !!customerId,
  })
}

export function useLeadAddresses(leadId: string | undefined) {
  return useQuery<Address[]>({
    queryKey: ['addresses', 'lead', leadId],
    queryFn: async () => {
      const res = await api.get(`/crm/leads/${leadId}/addresses`)
      return res.data
    },
    enabled: !!leadId,
  })
}

export function useSaveCustomerAddresses() {
  return useMutation({
    mutationFn: async ({ customerId, addresses }: {
      customerId: string
      addresses: Array<{
        id?: string
        type?: string
        line1: string
        line2?: string
        city?: string
        state?: string
        postcode?: string
        isPrimary?: boolean
      }>
    }) => {
      const res = await api.put(`/crm/customers/${customerId}/addresses`, { addresses })
      return res.data
    },
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useSaveLeadAddresses() {
  return useMutation({
    mutationFn: async ({ leadId, addresses }: {
      leadId: string
      addresses: Array<{
        id?: string
        type?: string
        line1: string
        line2?: string
        city?: string
        state?: string
        postcode?: string
        isPrimary?: boolean
      }>
    }) => {
      const res = await api.put(`/crm/leads/${leadId}/addresses`, { addresses })
      return res.data
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'lead', leadId] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
