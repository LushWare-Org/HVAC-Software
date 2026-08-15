/**
 * Project Components data layer — the generic replacement for housesApi.ts.
 * Spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 */
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'
import { invalidateProjectLinks } from './projectsApi'

export type ComponentAccountStatus = 'NO_OWNER' | 'NO_ACCOUNT' | 'INVITED' | 'ACTIVE'

export const ACCOUNT_STATUS_META: Record<ComponentAccountStatus, { label: string; color: string; dim: string }> = {
  NO_OWNER: { label: 'No owner', color: 'var(--t4)', dim: 'var(--surface-2)' },
  NO_ACCOUNT: { label: 'No account', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  INVITED: { label: 'Invited — pending login', color: 'var(--blue)', dim: 'var(--blue-dim)' },
  ACTIVE: { label: 'Active', color: 'var(--green)', dim: 'var(--green-dim)' },
}

export interface ProjectComponent {
  id: string
  companyId: string
  projectId: string
  componentTypeKey: string
  label: string
  ownerCustomerId?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  accountStatus: ComponentAccountStatus
  tags: string[]
  notes?: string | null
  createdAt: string
  equipmentCount?: number
  openIssueCount?: number
}

export type ImageScanStatus = 'NONE' | 'SCANNING' | 'DONE' | 'FAILED'

export interface EquipmentScanResult {
  brand: string | null
  model: string | null
  serialNo: string | null
  errorCodes: { code: string; meaning: string }[]
}

export interface EquipmentErrorCode {
  id: string
  code: string
  meaning?: string | null
  source: 'AI_SCAN' | 'MANUAL'
  createdAt: string
}

export interface ComponentEquipment {
  id: string
  componentId: string
  customerId: string
  type: string
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  installDate?: string | null
  warrantyEnd?: string | null
  notes?: string | null
  imageUrl?: string | null
  imageScanStatus: ImageScanStatus
  imageScanResult?: EquipmentScanResult | null
  imageScanError?: string | null
  errorCodes: EquipmentErrorCode[]
}

export type IssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
export const ISSUE_STATUS_META: Record<IssueStatus, { label: string; color: string; dim: string }> = {
  OPEN: { label: 'Open', color: 'var(--red)', dim: 'var(--red-dim)' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  RESOLVED: { label: 'Resolved', color: 'var(--green)', dim: 'var(--green-dim)' },
}

export interface ComponentIssueReport {
  id: string
  componentId: string
  equipmentId?: string | null
  reportedByCustomerId: string
  errorCode?: string | null
  description?: string | null
  status: IssueStatus
  resolvedNote?: string | null
  createdAt: string
}

function mapComponent(raw: any): ProjectComponent {
  return {
    id: raw.id,
    companyId: raw.companyId,
    projectId: raw.projectId,
    componentTypeKey: raw.componentTypeKey,
    label: raw.label,
    ownerCustomerId: raw.ownerCustomerId ?? null,
    ownerName: raw.ownerName ?? null,
    ownerEmail: raw.ownerEmail ?? null,
    accountStatus: (raw.accountStatus as ComponentAccountStatus) ?? 'NO_OWNER',
    tags: raw.tags ?? [],
    notes: raw.notes ?? null,
    createdAt: raw.createdAt,
    equipmentCount: raw.equipmentCount,
    openIssueCount: raw.openIssueCount,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────

export function useComponents(projectId: string | undefined, type?: string) {
  return useQuery<ProjectComponent[]>({
    queryKey: ['components', 'by-project', projectId, type ?? 'all'],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/components`, { params: type ? { type } : undefined })
      return ((res.data ?? []) as any[]).map(mapComponent)
    },
    enabled: !!projectId,
    staleTime: 15 * 1000,
  })
}

export function useComponent(id: string | undefined) {
  return useQuery<ProjectComponent>({
    queryKey: ['components', id, 'detail'],
    queryFn: async () => mapComponent((await api.get(`/crm/components/${id}`)).data),
    enabled: !!id,
    staleTime: 15 * 1000,
  })
}

export function useComponentEquipment(componentId: string | undefined) {
  return useQuery<ComponentEquipment[]>({
    queryKey: ['components', componentId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/components/${componentId}/equipment`)).data ?? [],
    enabled: !!componentId,
    staleTime: 15 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as ComponentEquipment[] | undefined
      return data?.some(e => e.imageScanStatus === 'SCANNING') ? 3000 : false
    },
  })
}

export function useComponentIssues(componentId: string | undefined) {
  return useQuery<ComponentIssueReport[]>({
    queryKey: ['components', componentId, 'issues'],
    queryFn: async () => (await api.get(`/crm/components/${componentId}/issues`)).data ?? [],
    enabled: !!componentId,
    staleTime: 15 * 1000,
  })
}

export interface OpenComponentIssue {
  id: string
  componentId: string
  componentLabel: string
  projectId: string
  projectName: string
  equipmentId?: string | null
  errorCode?: string | null
  description?: string | null
  status: IssueStatus
  reportedByName: string
  createdAt: string
}

/**
 * Every open/acknowledged issue across the whole company — powers the Dashboard
 * alert, the Project detail rollup, and the Components tab banner. Polls
 * periodically so a new report from a customer surfaces without a manual refresh.
 */
export function useOpenComponentIssues() {
  return useQuery<OpenComponentIssue[]>({
    queryKey: ['components', 'issues', 'open'],
    queryFn: async () => (await api.get('/crm/components/issues/open')).data ?? [],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

const fetchServiceLogPage = async (params: Record<string, string>): Promise<any[]> => {
  const res = await api.get('/jobs/jobs', { params: { ...params, limit: 100 } })
  return res.data?.data ?? []
}

/**
 * A component's service log = jobs tied to the component directly (general
 * visits) UNION jobs tied to any of its equipment (per-unit service). No
 * combined backend filter exists yet — merged + deduped client-side.
 */
export function useComponentServiceLog(componentId: string | undefined, equipmentIds: string[]) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['components', componentId, 'service-log', 'component'],
        queryFn: () => fetchServiceLogPage({ componentId: componentId! }),
        enabled: !!componentId,
        staleTime: 30_000,
      },
      ...equipmentIds.map((eqId) => ({
        queryKey: ['components', componentId, 'service-log', 'equipment', eqId],
        queryFn: () => fetchServiceLogPage({ equipmentId: eqId }),
        enabled: !!componentId,
        staleTime: 30_000,
      })),
    ],
  })

  const isLoading = queries.some((q) => q.isLoading)
  const jobs = useMemo(() => {
    const byId = new Map<string, any>()
    for (const q of queries) {
      for (const job of (q.data as any[]) ?? []) byId.set(job.id, job)
    }
    return [...byId.values()].sort((a, b) =>
      String(b.scheduledStart ?? b.createdAt ?? '').localeCompare(String(a.scheduledStart ?? a.createdAt ?? '')),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map((q) => q.dataUpdatedAt).join(',')])

  return { jobs, isLoading }
}

// ── Mutations ─────────────────────────────────────────────────────────────

const invalidateComponent = (componentId: string) => {
  queryClient.invalidateQueries({ queryKey: ['components', componentId] })
}
const invalidateProjectComponents = (projectId: string | undefined) => {
  if (projectId) queryClient.invalidateQueries({ queryKey: ['components', 'by-project', projectId] })
}

export interface UpsertComponentInput {
  typeLabel?: string
  typeAssignable?: boolean
  label?: string
  tags?: string[]
  notes?: string
  ownerCustomerId?: string
}

export function useCreateComponent(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (input: UpsertComponentInput & { typeLabel: string; label: string }) => {
      const res = await api.post(`/crm/projects/${projectId}/components`, input)
      return mapComponent(res.data)
    },
    onSuccess: () => invalidateProjectComponents(projectId),
  })
}

export function useUpdateComponent(projectId: string | undefined) {
  return useMutation({
    mutationFn: async ({ id, ...input }: UpsertComponentInput & { id: string }) => {
      const res = await api.patch(`/crm/components/${id}`, input)
      return mapComponent(res.data)
    },
    onSuccess: (_data, vars) => {
      invalidateComponent(vars.id)
      invalidateProjectComponents(projectId)
    },
  })
}

export function useDeleteComponent(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/components/${id}`)).data,
    onSuccess: () => invalidateProjectComponents(projectId),
  })
}

export function useAssignOwner(projectId: string | undefined) {
  return useMutation({
    mutationFn: async ({ componentId, customerId }: { componentId: string; customerId: string | null }) => {
      const res = await api.patch(`/crm/components/${componentId}/owner`, { customerId })
      return mapComponent(res.data)
    },
    onSuccess: (_data, vars) => {
      invalidateComponent(vars.componentId)
      invalidateProjectComponents(projectId)
    },
  })
}

export function useGenerateOwnerAccount(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (componentId: string) => (await api.post(`/crm/components/${componentId}/generate-account`)).data,
    onSuccess: (_data, componentId) => {
      invalidateComponent(componentId)
      invalidateProjectComponents(projectId)
    },
  })
}

export interface AddComponentEquipmentInput {
  type?: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

export function useAddComponentEquipment(componentId: string) {
  return useMutation({
    mutationFn: async (input: AddComponentEquipmentInput) =>
      (await api.post(`/crm/components/${componentId}/equipment`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components', componentId, 'equipment'] })
      queryClient.invalidateQueries({ queryKey: ['components', componentId, 'detail'] })
    },
  })
}

export function useUploadEquipmentImage(componentId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, file }: { equipmentId: string; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/crm/equipment/${equipmentId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as ComponentEquipment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components', componentId, 'equipment'] })
    },
  })
}

/**
 * Patches one equipment item in the cached ['components', componentId, 'equipment']
 * list in place. Used instead of invalidateQueries by every mutation below — a
 * full invalidate+refetch per error code is what made "Add all" across several
 * codes feel slow. Writing the known result straight into the cache is instant
 * and still correct, since the server response is the full source of truth.
 */
function patchEquipmentInCache(componentId: string, equipmentId: string, patch: (eq: ComponentEquipment) => ComponentEquipment) {
  queryClient.setQueryData<ComponentEquipment[]>(['components', componentId, 'equipment'], (old) =>
    old?.map((eq) => (eq.id === equipmentId ? patch(eq) : eq)),
  )
}

export function useAddErrorCode(componentId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, code, meaning, source }: { equipmentId: string; code: string; meaning?: string; source?: 'AI_SCAN' | 'MANUAL' }) =>
      (await api.post(`/crm/equipment/${equipmentId}/error-codes`, { code, meaning, source })).data as EquipmentErrorCode,
    onSuccess: (created, vars) => {
      patchEquipmentInCache(componentId, vars.equipmentId, (eq) => ({ ...eq, errorCodes: [...eq.errorCodes, created] }))
    },
  })
}

export function useDeleteErrorCode(componentId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, codeId }: { equipmentId: string; codeId: string }) =>
      (await api.delete(`/crm/equipment/${equipmentId}/error-codes/${codeId}`)).data,
    onSuccess: (_data, vars) => {
      patchEquipmentInCache(componentId, vars.equipmentId, (eq) => ({
        ...eq, errorCodes: eq.errorCodes.filter((c) => c.id !== vars.codeId),
      }))
    },
  })
}

export function useUpdateComponentEquipment(componentId: string) {
  return useMutation({
    mutationFn: async ({ equipmentId, ...patch }: { equipmentId: string; brand?: string; model?: string; serialNo?: string }) =>
      (await api.patch(`/crm/components/${componentId}/equipment/${equipmentId}`, patch)).data as ComponentEquipment,
    onSuccess: (updated, vars) => {
      patchEquipmentInCache(componentId, vars.equipmentId, () => updated)
    },
  })
}

export function useUpdateIssueStatus(componentId: string) {
  return useMutation({
    mutationFn: async ({ issueId, status, resolvedNote }: { issueId: string; status: IssueStatus; resolvedNote?: string }) =>
      (await api.patch(`/crm/components/${componentId}/issues/${issueId}`, { status, resolvedNote })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components', componentId, 'issues'] })
      queryClient.invalidateQueries({ queryKey: ['components', componentId, 'detail'] })
    },
  })
}

/** After creating a job from a component's Equipment/Service Log tab. */
export function invalidateComponentServiceLog(componentId: string, projectId?: string) {
  queryClient.invalidateQueries({ queryKey: ['components', componentId, 'service-log'] })
  if (projectId) invalidateProjectLinks(projectId)
}

// ── Prefetch ──────────────────────────────────────────────────────────────

/** Warm a project's component list so the Components tab renders instantly. */
export function prefetchComponentsForProject(projectId: string): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['components', 'by-project', projectId, 'all'],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/components`)
      return ((res.data ?? []) as any[]).map(mapComponent)
    },
    staleTime: 15 * 1000,
  })
}

/** Warm one component's detail + equipment + issues — called on card hover so the modal opens instantly. */
export function prefetchComponentDetail(componentId: string): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['components', componentId, 'detail'],
      queryFn: async () => mapComponent((await api.get(`/crm/components/${componentId}`)).data),
      staleTime: 15 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['components', componentId, 'equipment'],
      queryFn: async () => (await api.get(`/crm/components/${componentId}/equipment`)).data ?? [],
      staleTime: 15 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['components', componentId, 'issues'],
      queryFn: async () => (await api.get(`/crm/components/${componentId}/issues`)).data ?? [],
      staleTime: 15 * 1000,
    }),
  ])
}

/** Warm the company-wide open-issues rollup (Dashboard alert + Projects banner). */
export function prefetchOpenComponentIssues(): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['components', 'issues', 'open'],
    queryFn: async () => (await api.get('/crm/components/issues/open')).data ?? [],
    staleTime: 30 * 1000,
  })
}
