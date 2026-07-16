/**
 * useMyHouse.ts — Housing Scheme template: houses owned by the logged-in customer.
 * Routes → /api/crm/houses/mine (JWT-scoped by customerId server-side).
 * Spec: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export interface MyHouse {
  id: string
  projectId: string
  projectName: string
  label: string
  address?: string | null
  tags: string[]
}

export interface MyHouseEquipment {
  id: string
  type: string
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  installDate?: string | null
  warrantyEnd?: string | null
}

export type MyIssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface MyIssueReport {
  id: string
  houseId: string
  equipmentId?: string | null
  errorCode?: string | null
  description?: string | null
  status: MyIssueStatus
  createdAt: string
}

export function useMyHouses() {
  const { isAuthenticated } = useAuth()
  return useQuery<MyHouse[]>({
    queryKey: ['my-houses'],
    queryFn: async () => (await api.get('/crm/houses/mine')).data ?? [],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })
}

export function useMyHouseEquipment(houseId: string | null) {
  return useQuery<MyHouseEquipment[]>({
    queryKey: ['my-houses', houseId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/houses/${houseId}/equipment`)).data ?? [],
    enabled: !!houseId,
    staleTime: 60 * 1000,
  })
}

export function useMyHouseServiceLog(houseId: string | null) {
  return useQuery({
    queryKey: ['my-houses', houseId, 'service-log'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { houseId, limit: 100 } })
      return (res.data?.data ?? []) as Array<{ id: string; title: string; status: string; scheduledStart?: string }>
    },
    enabled: !!houseId,
    staleTime: 60 * 1000,
  })
}

export function useMyIssueReports() {
  const { isAuthenticated } = useAuth()
  return useQuery<MyIssueReport[]>({
    queryKey: ['my-houses', 'issues'],
    queryFn: async () => (await api.get('/crm/houses/mine/issues')).data ?? [],
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  })
}

export function useReportIssue(houseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { equipmentId?: string; errorCode?: string; description?: string }) =>
      (await api.post(`/crm/houses/${houseId}/issues`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-houses', 'issues'] }),
  })
}

export interface AddMyEquipmentInput {
  type?: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

export function useAddMyEquipment(houseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddMyEquipmentInput) =>
      (await api.post(`/crm/houses/${houseId}/equipment`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-houses', houseId, 'equipment'] }),
  })
}
