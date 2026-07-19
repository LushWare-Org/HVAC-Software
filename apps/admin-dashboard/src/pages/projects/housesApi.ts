/**
 * Houses data layer — the "Housing Scheme" project template's sub-entity.
 * Spec: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md
 */
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'
import { invalidateProjectLinks } from './projectsApi'

export type HouseAccountStatus = 'NO_OWNER' | 'NO_ACCOUNT' | 'INVITED' | 'ACTIVE'

export const ACCOUNT_STATUS_META: Record<HouseAccountStatus, { label: string; color: string; dim: string }> = {
  NO_OWNER: { label: 'No owner', color: 'var(--t4)', dim: 'var(--surface-2)' },
  NO_ACCOUNT: { label: 'No account', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  INVITED: { label: 'Invited — pending login', color: 'var(--blue)', dim: 'var(--blue-dim)' },
  ACTIVE: { label: 'Active', color: 'var(--green)', dim: 'var(--green-dim)' },
}

export interface House {
  id: string
  companyId: string
  projectId: string
  label: string
  address?: string | null
  ownerCustomerId?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  accountStatus: HouseAccountStatus
  tags: string[]
  notes?: string | null
  createdAt: string
  equipmentCount?: number
  openIssueCount?: number
}

export interface HouseEquipment {
  id: string
  houseId: string
  customerId: string
  type: string
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  installDate?: string | null
  warrantyEnd?: string | null
  notes?: string | null
}

export type IssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
export const ISSUE_STATUS_META: Record<IssueStatus, { label: string; color: string; dim: string }> = {
  OPEN: { label: 'Open', color: 'var(--red)', dim: 'var(--red-dim)' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  RESOLVED: { label: 'Resolved', color: 'var(--green)', dim: 'var(--green-dim)' },
}

export interface HouseIssueReport {
  id: string
  houseId: string
  equipmentId?: string | null
  reportedByCustomerId: string
  errorCode?: string | null
  description?: string | null
  status: IssueStatus
  resolvedNote?: string | null
  createdAt: string
}

function mapHouse(raw: any): House {
  return {
    id: raw.id,
    companyId: raw.companyId,
    projectId: raw.projectId,
    label: raw.label,
    address: raw.address ?? null,
    ownerCustomerId: raw.ownerCustomerId ?? null,
    ownerName: raw.ownerName ?? null,
    ownerEmail: raw.ownerEmail ?? null,
    accountStatus: (raw.accountStatus as HouseAccountStatus) ?? 'NO_OWNER',
    tags: raw.tags ?? [],
    notes: raw.notes ?? null,
    createdAt: raw.createdAt,
    equipmentCount: raw.equipmentCount,
    openIssueCount: raw.openIssueCount,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────

export function useHouses(projectId: string | undefined) {
  return useQuery<House[]>({
    queryKey: ['houses', 'by-project', projectId],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/houses`)
      return ((res.data ?? []) as any[]).map(mapHouse)
    },
    enabled: !!projectId,
    staleTime: 15 * 1000,
  })
}

export function useHouse(id: string | undefined) {
  return useQuery<House>({
    queryKey: ['houses', id, 'detail'],
    queryFn: async () => mapHouse((await api.get(`/crm/houses/${id}`)).data),
    enabled: !!id,
    staleTime: 15 * 1000,
  })
}

export function useHouseEquipment(houseId: string | undefined) {
  return useQuery<HouseEquipment[]>({
    queryKey: ['houses', houseId, 'equipment'],
    queryFn: async () => (await api.get(`/crm/houses/${houseId}/equipment`)).data ?? [],
    enabled: !!houseId,
    staleTime: 15 * 1000,
  })
}

export function useHouseIssues(houseId: string | undefined) {
  return useQuery<HouseIssueReport[]>({
    queryKey: ['houses', houseId, 'issues'],
    queryFn: async () => (await api.get(`/crm/houses/${houseId}/issues`)).data ?? [],
    enabled: !!houseId,
    staleTime: 15 * 1000,
  })
}

export interface OpenHouseIssue {
  id: string
  houseId: string
  houseLabel: string
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
 * alert, the Project detail rollup, and the Houses tab banner. Polls periodically
 * so a new report from a customer surfaces without a manual refresh.
 */
export function useOpenHouseIssues() {
  return useQuery<OpenHouseIssue[]>({
    queryKey: ['houses', 'issues', 'open'],
    queryFn: async () => (await api.get('/crm/houses/issues/open')).data ?? [],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

const fetchServiceLogPage = async (params: Record<string, string>): Promise<any[]> => {
  const res = await api.get('/jobs/jobs', { params: { ...params, limit: 100 } })
  return res.data?.data ?? []
}

/**
 * A house's service log = jobs tied to the house directly (general visits) UNION
 * jobs tied to any of its equipment (per-unit service). No combined backend filter
 * exists yet — merged + deduped client-side, fine at Housing Scheme scale.
 */
export function useHouseServiceLog(houseId: string | undefined, equipmentIds: string[]) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['houses', houseId, 'service-log', 'house'],
        queryFn: () => fetchServiceLogPage({ houseId: houseId! }),
        enabled: !!houseId,
        staleTime: 30_000,
      },
      ...equipmentIds.map((eqId) => ({
        queryKey: ['houses', houseId, 'service-log', 'equipment', eqId],
        queryFn: () => fetchServiceLogPage({ equipmentId: eqId }),
        enabled: !!houseId,
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

const invalidateHouse = (houseId: string) => {
  queryClient.invalidateQueries({ queryKey: ['houses', houseId] })
}
const invalidateProjectHouses = (projectId: string | undefined) => {
  if (projectId) queryClient.invalidateQueries({ queryKey: ['houses', 'by-project', projectId] })
}

export interface UpsertHouseInput {
  label?: string
  address?: string
  tags?: string[]
  notes?: string
}

export function useCreateHouse(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (input: UpsertHouseInput) => {
      const res = await api.post(`/crm/projects/${projectId}/houses`, input)
      return mapHouse(res.data)
    },
    onSuccess: () => invalidateProjectHouses(projectId),
  })
}

export function useUpdateHouse(projectId: string | undefined) {
  return useMutation({
    mutationFn: async ({ id, ...input }: UpsertHouseInput & { id: string }) => {
      const res = await api.patch(`/crm/houses/${id}`, input)
      return mapHouse(res.data)
    },
    onSuccess: (_data, vars) => {
      invalidateHouse(vars.id)
      invalidateProjectHouses(projectId)
    },
  })
}

export function useDeleteHouse(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/houses/${id}`)).data,
    onSuccess: () => invalidateProjectHouses(projectId),
  })
}

export function useAssignOwner(projectId: string | undefined) {
  return useMutation({
    mutationFn: async ({ houseId, customerId }: { houseId: string; customerId: string | null }) => {
      const res = await api.patch(`/crm/houses/${houseId}/owner`, { customerId })
      return mapHouse(res.data)
    },
    onSuccess: (_data, vars) => {
      invalidateHouse(vars.houseId)
      invalidateProjectHouses(projectId)
    },
  })
}

export function useGenerateOwnerAccount(projectId: string | undefined) {
  return useMutation({
    mutationFn: async (houseId: string) => (await api.post(`/crm/houses/${houseId}/generate-account`)).data,
    onSuccess: (_data, houseId) => {
      invalidateHouse(houseId)
      invalidateProjectHouses(projectId)
    },
  })
}

export interface AddHouseEquipmentInput {
  type?: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

export function useAddHouseEquipment(houseId: string) {
  return useMutation({
    mutationFn: async (input: AddHouseEquipmentInput) =>
      (await api.post(`/crm/houses/${houseId}/equipment`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'equipment'] })
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'detail'] })
    },
  })
}

export function useUpdateIssueStatus(houseId: string) {
  return useMutation({
    mutationFn: async ({ issueId, status, resolvedNote }: { issueId: string; status: IssueStatus; resolvedNote?: string }) =>
      (await api.patch(`/crm/houses/${houseId}/issues/${issueId}`, { status, resolvedNote })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'issues'] })
      queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'detail'] })
    },
  })
}

/** After creating a job from a house's Equipment/Service Log tab. */
export function invalidateHouseServiceLog(houseId: string, projectId?: string) {
  queryClient.invalidateQueries({ queryKey: ['houses', houseId, 'service-log'] })
  if (projectId) invalidateProjectLinks(projectId)
}

// ── Prefetch ──────────────────────────────────────────────────────────────

/** Warm a project's house list so the Houses tab renders instantly. */
export function prefetchHousesForProject(projectId: string): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['houses', 'by-project', projectId],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${projectId}/houses`)
      return ((res.data ?? []) as any[]).map(mapHouse)
    },
    staleTime: 15 * 1000,
  })
}

/** Warm one house's detail + equipment + issues — called on card hover so the modal opens instantly. */
export function prefetchHouseDetail(houseId: string): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['houses', houseId, 'detail'],
      queryFn: async () => mapHouse((await api.get(`/crm/houses/${houseId}`)).data),
      staleTime: 15 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['houses', houseId, 'equipment'],
      queryFn: async () => (await api.get(`/crm/houses/${houseId}/equipment`)).data ?? [],
      staleTime: 15 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['houses', houseId, 'issues'],
      queryFn: async () => (await api.get(`/crm/houses/${houseId}/issues`)).data ?? [],
      staleTime: 15 * 1000,
    }),
  ])
}

/** Warm the company-wide open-issues rollup (Dashboard alert + Projects banner). */
export function prefetchOpenHouseIssues(): Promise<unknown> {
  return queryClient.prefetchQuery({
    queryKey: ['houses', 'issues', 'open'],
    queryFn: async () => (await api.get('/crm/houses/issues/open')).data ?? [],
    staleTime: 30 * 1000,
  })
}
