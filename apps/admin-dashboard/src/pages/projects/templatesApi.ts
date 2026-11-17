/**
 * Project Templates data layer — reusable, admin-authored "recipes" for a
 * project's component structure. Spec:
 * docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'
import type { ComponentTypeMeta } from './projectsApi'

export interface ProjectTemplate {
  id: string
  companyId: string
  name: string
  description?: string | null
  componentTypes: ComponentTypeMeta[]
  isBuiltIn: boolean
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
}

function mapTemplate(raw: any): ProjectTemplate {
  return {
    id: raw.id,
    companyId: raw.companyId,
    name: raw.name,
    description: raw.description ?? null,
    componentTypes: raw.componentTypes ?? [],
    isBuiltIn: !!raw.isBuiltIn,
    status: (raw.status as 'DRAFT' | 'PUBLISHED') ?? 'DRAFT',
    createdAt: raw.createdAt,
  }
}

export function useProjectTemplates() {
  return useQuery<ProjectTemplate[]>({
    queryKey: ['project-templates'],
    queryFn: async () => ((await api.get('/crm/project-templates')).data ?? []).map(mapTemplate),
    staleTime: 30 * 1000,
  })
}

export function useProjectTemplate(id: string | undefined) {
  return useQuery<ProjectTemplate>({
    queryKey: ['project-templates', id],
    queryFn: async () => mapTemplate((await api.get(`/crm/project-templates/${id}`)).data),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export interface UpsertTemplateInput {
  name: string
  description?: string
  componentTypes: ComponentTypeMeta[]
}

const invalidateTemplates = () => queryClient.invalidateQueries({ queryKey: ['project-templates'] })

export function useCreateTemplate() {
  return useMutation({
    mutationFn: async (input: UpsertTemplateInput) => mapTemplate((await api.post('/crm/project-templates', input)).data),
    onSuccess: invalidateTemplates,
  })
}

export function useUpdateTemplate() {
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<UpsertTemplateInput> & { id: string }) =>
      mapTemplate((await api.patch(`/crm/project-templates/${id}`, input)).data),
    onSuccess: invalidateTemplates,
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/project-templates/${id}`)).data,
    onSuccess: invalidateTemplates,
  })
}

export function useSetTemplateStatus() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' }) =>
      mapTemplate((await api.patch(`/crm/project-templates/${id}`, { status })).data),
    onSuccess: invalidateTemplates,
  })
}
