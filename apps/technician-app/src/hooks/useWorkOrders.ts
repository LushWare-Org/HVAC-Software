import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import type { WorkOrder, LineItem, LineItemCategory, PriceBookItem, PaginatedResponse } from '@/types/api'

/**
 * Get work orders for a job
 */
export function useWorkOrdersByJob(jobId: string) {
  return useQuery({
    queryKey: queryKeys.workOrders(jobId),
    queryFn: async () => {
      const res = await api.get<WorkOrder[]>(`/jobs/work-orders/by-job/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
  })
}

/**
 * Get single work order detail
 */
export function useWorkOrderDetail(workOrderId: string) {
  return useQuery({
    queryKey: queryKeys.workOrderDetail(workOrderId),
    queryFn: async () => {
      const res = await api.get<WorkOrder>(`/jobs/work-orders/${workOrderId}`)
      return res.data
    },
    enabled: !!workOrderId,
  })
}

/**
 * Check in to a work order (technician arrives on site)
 */
export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (workOrderId: string) => {
      const res = await api.patch(`/jobs/work-orders/${workOrderId}/check-in`)
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.workOrderDetail(data.id) })
      qc.invalidateQueries({ queryKey: queryKeys.workOrders(data.jobId) })
      qc.invalidateQueries({ queryKey: queryKeys.jobDetail(data.jobId) })
    },
  })
}

/**
 * Check out of a work order (job complete)
 */
export function useCheckOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workOrderId, notes }: { workOrderId: string; notes?: string }) => {
      const res = await api.patch(`/jobs/work-orders/${workOrderId}/check-out`, { notes })
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.workOrderDetail(data.id) })
      qc.invalidateQueries({ queryKey: queryKeys.workOrders(data.jobId) })
      qc.invalidateQueries({ queryKey: queryKeys.jobDetail(data.jobId) })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Complete/uncomplete a checklist task
 */
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      workOrderId,
      taskCompletionId,
      isCompleted,
      notes,
      photoUrl,
    }: {
      workOrderId: string
      taskCompletionId: string
      isCompleted: boolean
      notes?: string
      photoUrl?: string
    }) => {
      const res = await api.patch(
        `/jobs/work-orders/${workOrderId}/tasks/${taskCompletionId}`,
        { isCompleted, notes, photoUrl },
      )
      return { ...res.data, workOrderId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.workOrderDetail(data.workOrderId) })
      qc.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })
}

/**
 * Add a line item (part/labour) to a work order
 */
export function useAddLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      workOrderId,
      item,
    }: {
      workOrderId: string
      item: {
        priceBookItemId?: string
        description: string
        category: LineItemCategory
        quantity: number
        unitPrice: number
        taxable?: boolean
      }
    }) => {
      const res = await api.post(`/jobs/work-orders/${workOrderId}/line-items`, item)
      return { ...res.data, workOrderId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.workOrderDetail(data.workOrderId) })
      qc.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })
}

/**
 * Remove a line item from a work order
 */
export function useRemoveLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workOrderId, lineItemId }: { workOrderId: string; lineItemId: string }) => {
      await api.delete(`/jobs/work-orders/${workOrderId}/line-items/${lineItemId}`)
      return { workOrderId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.workOrderDetail(data.workOrderId) })
      qc.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })
}

/**
 * Search price book items
 */
export function usePriceBook(search?: string, category?: string) {
  return useQuery({
    queryKey: queryKeys.priceBook({ search, category }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      params.set('limit', '50')
      const res = await api.get<PaginatedResponse<PriceBookItem>>(`/jobs/price-book?${params.toString()}`)
      return res.data
    },
    enabled: true,
  })
}
