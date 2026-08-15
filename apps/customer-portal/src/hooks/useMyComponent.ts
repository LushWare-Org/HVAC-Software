/**
 * useMyComponent.ts — components (any type) owned by the logged-in customer.
 * Routes → /api/crm/components/mine (JWT-scoped by customerId server-side).
 * Spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RescheduleStateValue } from '../types/api'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export interface MyComponent {
  id: string
  projectId: string
  projectName: string
  componentTypeKey: string
  label: string
  tags: string[]
}

export interface MyComponentEquipment {
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
  componentId: string
  equipmentId?: string | null
  errorCode?: string | null
  description?: string | null
  status: MyIssueStatus
  createdAt: string
}

export function useMyComponents() {
  const { isAuthenticated, user } = useAuth()
  return useQuery<MyComponent[]>({
    // Scoped by customerId — the persisted cache (localStorage) is keyed by
    // query key with no other session boundary, so an unscoped ['my-components']
    // key would serve a previous customer's (or a component-less customer's)
    // cached result to whoever logs in next on this browser.
    queryKey: ['my-components', user?.customerId],
    queryFn: async () => (await api.get('/crm/components/mine')).data ?? [],
    enabled: isAuthenticated && !!user?.customerId,
    // Shorter than the app default (60s) and refetches on focus, unlike most
    // portal queries — this one gates whether the "My Property" nav tab exists
    // at all, so a customer who was just assigned a component by an admin
    // while their tab was already open should see it appear the moment they
    // switch back, not up to a minute later or only after a manual reload.
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMyComponentEquipment(componentId: string | null) {
  return useQuery<MyComponentEquipment[]>({
    queryKey: ['my-components', componentId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/components/${componentId}/equipment`)).data ?? [],
    enabled: !!componentId,
    staleTime: 60 * 1000,
  })
}

export function useMyComponentServiceLog(componentId: string | null) {
  return useQuery({
    queryKey: ['my-components', componentId, 'service-log'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { componentId, limit: 100 } })
      return (res.data?.data ?? []) as Array<{
        id: string; title: string; status: string; scheduledStart?: string
        /** Open reschedule negotiation, if any — drives the RescheduleBadge. */
        rescheduleState?: RescheduleStateValue | null
      }>
    },
    enabled: !!componentId,
    // Shorter + refetch-on-focus, matching useMyComponents/useMyProjects — a job
    // a staff member just added for this component should show up when the
    // customer checks back, not after up to a minute's delay.
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMyIssueReports() {
  const { isAuthenticated, user } = useAuth()
  return useQuery<MyIssueReport[]>({
    queryKey: ['my-components', user?.customerId, 'issues'],
    queryFn: async () => (await api.get('/crm/components/mine/issues')).data ?? [],
    enabled: isAuthenticated && !!user?.customerId,
    staleTime: 30 * 1000,
  })
}

export function useReportIssue(componentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { equipmentId?: string; errorCode?: string; description?: string }) =>
      (await api.post(`/crm/components/${componentId}/issues`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-components', 'issues'] }),
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

export function useAddMyEquipment(componentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddMyEquipmentInput) =>
      (await api.post(`/crm/components/${componentId}/equipment`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-components', componentId, 'equipment'] }),
  })
}
