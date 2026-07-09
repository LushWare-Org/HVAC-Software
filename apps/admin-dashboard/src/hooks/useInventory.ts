/**
 * useInventory.ts — Hooks for the Inventory Management page
 *
 * Routes → nginx /api/inventory/ → inventory-service (NestJS) :3007
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type {
  InventoryItem, StockLocation, StockLevel, StockMovement,
  PurchaseOrder, LowStockAlert, ItemCategory, PurchaseOrderStatus,
} from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Paginated<T> { data: T[]; count: number; page: number; limit: number }

export function decimalToNumber(v: string | number | undefined | null): number {
  if (v == null) return 0
  return typeof v === 'string' ? parseFloat(v) : v
}

// ─── Inventory Items ──────────────────────────────────────────────────────────

export function useInventoryItems(filters: {
  page?: number; limit?: number; search?: string; category?: string;
} = {}) {
  const { page = 1, limit = 50, search, category } = filters
  return useQuery<Paginated<InventoryItem>>({
    queryKey: ['inventory', 'items', { page, limit, search, category }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (search) params.search = search
      if (category) params.category = category
      const res = await api.get('/inventory/items', { params })
      return res.data
    },
  })
}

export function useInventoryItem(id?: string) {
  return useQuery<InventoryItem>({
    queryKey: ['inventory', 'items', id],
    queryFn: async () => (await api.get(`/inventory/items/${id}`)).data,
    enabled: !!id,
  })
}

export function useItemStockLevels(itemId?: string) {
  return useQuery<StockLevel[]>({
    queryKey: ['inventory', 'items', itemId, 'stock'],
    queryFn: async () => (await api.get(`/inventory/items/${itemId}/stock`)).data,
    enabled: !!itemId,
  })
}

export function useCreateInventoryItem() {
  return useMutation({
    mutationFn: async (data: {
      sku: string; name: string; description?: string; category: ItemCategory;
      unit?: string; priceBookItemId?: string; reorderPoint?: number; reorderQty?: number; unitCost?: number;
    }) => (await api.post('/inventory/items', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] }) },
  })
}

export function useUpdateInventoryItem() {
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string; name?: string; description?: string; unit?: string;
      reorderPoint?: number; reorderQty?: number; priceBookItemId?: string; unitCost?: number; isActive?: boolean;
    }) => (await api.patch(`/inventory/items/${id}`, data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] }) },
  })
}

// ─── Locations ────────────────────────────────────────────────────────────────

export function useLocations() {
  return useQuery<StockLocation[]>({
    queryKey: ['inventory', 'locations'],
    queryFn: async () => (await api.get('/inventory/locations')).data,
  })
}

export function useLocationStock(locationId?: string, filters: {
  page?: number; limit?: number; search?: string;
} = {}) {
  const { page = 1, limit = 50, search } = filters
  return useQuery<Paginated<StockLevel>>({
    queryKey: ['inventory', 'locations', locationId, 'stock', { page, limit, search }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (search) params.search = search
      return (await api.get(`/inventory/locations/${locationId}/stock`, { params })).data
    },
    enabled: !!locationId,
  })
}

// ─── Stock Operations ─────────────────────────────────────────────────────────

export function useIntake() {
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string; toLocationId: string; quantity: number;
      referenceId?: string; notes?: string;
    }) => (await api.post('/inventory/movements/intake', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}

export function useTransfer() {
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string; fromLocationId: string; toLocationId: string;
      quantity: number; notes?: string;
    }) => (await api.post('/inventory/movements/transfer', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}

export function useConsume() {
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string; locationId: string; quantity: number;
      referenceId?: string; referenceType?: string;
    }) => (await api.post('/inventory/movements/consume', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}

export function useAdjust() {
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string; locationId: string; newQuantity: number; reason?: string;
    }) => (await api.post('/inventory/movements/adjust', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}

export function useStockMovements(filters: {
  page?: number; limit?: number; inventoryItemId?: string; locationId?: string;
  movementType?: string; dateFrom?: string; dateTo?: string;
} = {}) {
  const { page = 1, limit = 50, ...rest } = filters
  return useQuery<Paginated<StockMovement>>({
    queryKey: ['inventory', 'movements', { page, limit, ...rest }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (rest.inventoryItemId) params.inventoryItemId = rest.inventoryItemId
      if (rest.locationId) params.locationId = rest.locationId
      if (rest.movementType) params.movementType = rest.movementType
      if (rest.dateFrom) params.dateFrom = rest.dateFrom
      if (rest.dateTo) params.dateTo = rest.dateTo
      return (await api.get('/inventory/movements', { params })).data
    },
  })
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export function usePurchaseOrders(filters: {
  page?: number; limit?: number; status?: string;
} = {}) {
  const { page = 1, limit = 20, status } = filters
  return useQuery<Paginated<PurchaseOrder>>({
    queryKey: ['inventory', 'purchase-orders', { page, limit, status }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (status) params.status = status
      return (await api.get('/inventory/purchase-orders', { params })).data
    },
  })
}

export function useCreatePurchaseOrder() {
  return useMutation({
    mutationFn: async (data: {
      supplierName: string;
      items: { inventoryItemId: string; qty: number; unitCost: number }[];
      notes?: string;
    }) => (await api.post('/inventory/purchase-orders', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] }) },
  })
}

export function useUpdatePOStatus() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      (await api.patch(`/inventory/purchase-orders/${id}/status`, { status })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders'] }) },
  })
}

export function useReceivePO() {
  return useMutation({
    mutationFn: async ({ id, receivedItems }: {
      id: string; receivedItems?: { inventoryItemId: string; qty: number }[];
    }) => (await api.post(`/inventory/purchase-orders/${id}/receive`, { receivedItems })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function useLowStockAlerts() {
  return useQuery<LowStockAlert[]>({
    queryKey: ['inventory', 'alerts', 'low-stock'],
    queryFn: async () => (await api.get('/inventory/alerts/low-stock')).data,
    staleTime: 60_000,
  })
}

// ─── Van Management ──────────────────────────────────────────────────────────

export function useEnsureVan() {
  return useMutation({
    mutationFn: async (data: { technicianId: string; technicianName: string }) =>
      (await api.post('/inventory/locations/ensure-van', data)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory', 'locations'] }) },
  })
}

// ─── Availability Check ──────────────────────────────────────────────────────

export interface AvailabilityResult {
  score: number
  details: { inventoryItemId: string; itemName: string; required: number; inVan: number; inWarehouse: number; sufficient: boolean }[]
}

export function useCheckAvailability(
  items: { inventoryItemId: string; qty: number }[],
  technicianId?: string,
) {
  return useQuery<AvailabilityResult>({
    queryKey: ['inventory', 'availability', items, technicianId],
    queryFn: async () => {
      const params: any = { items: JSON.stringify(items) }
      if (technicianId) params.technicianId = technicianId
      return (await api.get('/inventory/check-availability', { params })).data
    },
    enabled: items.length > 0,
    staleTime: 30_000,
  })
}

// ─── Return Stock ────────────────────────────────────────────────────────────

export function useReturnStock() {
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string; fromLocationId: string; toLocationId: string;
      quantity: number; notes?: string;
    }) => (await api.post('/inventory/movements/return', { ...data, notes: data.notes ?? 'Excess stock returned from van' })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }) },
  })
}
