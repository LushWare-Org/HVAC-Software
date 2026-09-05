import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type {
  AddMyEquipmentInput, MyComponent, MyComponentEquipment,
  MyComponentServiceEntry, MyIssueReport,
} from '@/types/api'

export function useMyComponents() {
  const { isAuthenticated, user } = useAuth()
  return useQuery<MyComponent[]>({
    queryKey: ['components', 'list', user?.customerId],
    queryFn: async () => (await api.get('/crm/components/mine')).data ?? [],
    enabled: isAuthenticated && Boolean(user?.customerId),
    staleTime: 15 * 1000,
  })
}

export function useMyComponentEquipment(componentId: string | null) {
  return useQuery<MyComponentEquipment[]>({
    queryKey: ['components', componentId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/components/${componentId}/equipment`)).data ?? [],
    enabled: Boolean(componentId),
    staleTime: 60 * 1000,
  })
}

export function useMyComponentServiceLog(componentId: string | null) {
  return useQuery<MyComponentServiceEntry[]>({
    queryKey: ['components', componentId, 'service-log'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { componentId, limit: 100 } })
      return (res.data?.data ?? []) as MyComponentServiceEntry[]
    },
    enabled: Boolean(componentId),
    staleTime: 15 * 1000,
  })
}

export function useMyIssueReports() {
  const { isAuthenticated, user } = useAuth()
  return useQuery<MyIssueReport[]>({
    queryKey: ['components', 'issues', user?.customerId],
    queryFn: async () => (await api.get('/crm/components/mine/issues')).data ?? [],
    enabled: isAuthenticated && Boolean(user?.customerId),
    staleTime: 30 * 1000,
  })
}

export function useReportIssue(componentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { equipmentId?: string; errorCode?: string; description?: string }) =>
      (await api.post(`/crm/components/${componentId}/issues`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['components', 'issues'] }),
  })
}

export function useAddMyEquipment(componentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddMyEquipmentInput) =>
      (await api.post(`/crm/components/${componentId}/equipment`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['components', componentId, 'equipment'] }),
  })
}
