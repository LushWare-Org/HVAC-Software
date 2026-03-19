import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import type { Customer } from '@/types/api'

/**
 * Get customer detail by ID (for job context — contact info, address, equipment)
 */
export function useCustomerDetail(customerId?: string) {
  return useQuery({
    queryKey: queryKeys.customer(customerId ?? ''),
    queryFn: async () => {
      const res = await api.get<Customer>(`/crm/customers/${customerId}`)
      return res.data
    },
    enabled: !!customerId,
  })
}
