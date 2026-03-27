import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { PaginatedResponse } from '@/types/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ItemCategory = 'PART' | 'MATERIAL' | 'TOOL' | 'CONSUMABLE'
export type LocationType = 'WAREHOUSE' | 'VAN'
export type MovementType = 'INTAKE' | 'TRANSFER' | 'CONSUME' | 'ADJUST' | 'RETURN'

export interface InventoryItem {
  id: string
  companyId: string
  sku: string
  name: string
  description?: string
  category: ItemCategory
  unit: string
  priceBookItemId?: string
  reorderPoint: number
  reorderQty: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StockLocation {
  id: string
  companyId: string
  type: LocationType
  name: string
  technicianId?: string
  createdAt: string
}

export interface StockLevel {
  id: string
  inventoryItemId: string
  locationId: string
  quantity: number | string
  reservedQty: number | string
  inventoryItem?: InventoryItem
  location?: StockLocation
}

export interface StockMovement {
  id: string
  companyId: string
  inventoryItemId: string
  fromLocationId?: string
  toLocationId?: string
  quantity: number | string
  movementType: MovementType
  referenceId?: string
  referenceType?: string
  notes?: string
  performedBy: string
  performedByName: string
  createdAt: string
  inventoryItem?: { name: string; sku: string }
  fromLocation?: { name: string; type: LocationType }
  toLocation?: { name: string; type: LocationType }
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const inventoryKeys = {
  locations: ['inventory', 'locations'] as const,
  vanStock: (locationId: string) => ['inventory', 'vanStock', locationId] as const,
  movements: (filters?: Record<string, unknown>) => ['inventory', 'movements', filters] as const,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function toNumber(v: string | number | undefined | null): number {
  if (v == null) return 0
  return typeof v === 'string' ? parseFloat(v) : v
}

// ─── Locations ──────────────────────────────────────────────────────────────

export function useLocations() {
  return useQuery({
    queryKey: inventoryKeys.locations,
    queryFn: async () => {
      const res = await api.get<StockLocation[]>('/inventory/locations')
      return res.data
    },
  })
}

// ─── My Van Stock ───────────────────────────────────────────────────────────

export function useMyVanLocation() {
  const { user } = useAuth()
  const { data: locations } = useLocations()
  return locations?.find((l) => l.type === 'VAN' && l.technicianId === user?.id) ?? null
}

export function useVanStock(locationId?: string) {
  return useQuery({
    queryKey: inventoryKeys.vanStock(locationId ?? ''),
    queryFn: async () => {
      const res = await api.get<{ data: StockLevel[]; count: number }>(
        `/inventory/locations/${locationId}/stock`,
        { params: { limit: 200 } },
      )
      return res.data
    },
    enabled: !!locationId,
  })
}

// ─── Stock Movements (for my van) ───────────────────────────────────────────

export function useMyMovements(locationId?: string, page = 1) {
  return useQuery({
    queryKey: inventoryKeys.movements({ locationId, page }),
    queryFn: async () => {
      const res = await api.get<{ data: StockMovement[]; count: number }>(
        '/inventory/movements',
        { params: { locationId, page, limit: 30 } },
      )
      return res.data
    },
    enabled: !!locationId,
  })
}

// ─── Confirm Transfer (accept stock into van) ──────────────────────────────

export function useConfirmTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string
      fromLocationId: string
      toLocationId: string
      quantity: number
      notes?: string
    }) => {
      const res = await api.post('/inventory/movements/transfer', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ─── Return excess stock from van back to warehouse ──────────────────────────

export function useReturnStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      inventoryItemId: string
      fromLocationId: string
      toLocationId: string
      quantity: number
      notes?: string
    }) => {
      const res = await api.post('/inventory/movements/return', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
