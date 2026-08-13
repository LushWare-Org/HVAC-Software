import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

// ── Types ────────────────────────────────────────────────────────────────────

export type StatsRange = '7d' | '30d' | '90d'

export interface MarketingKpis {
  sent: number
  delivered: number
  opened: number
  clicked: number
  reviewsSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
}

export interface CampaignStat {
  id: string
  name: string
  channel: 'EMAIL' | 'SMS'
  status: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  createdAt: string
}

export interface CampaignFunnel {
  sent: number
  delivered: number
  opened: number
  clicked: number
  failed: number
}

export interface Campaign {
  id: string
  companyId: string
  name: string
  channel: 'EMAIL' | 'SMS'
  status: string
  audienceId?: string
  templateId?: string
  scheduleAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  companyId: string
  channel: 'EMAIL' | 'SMS'
  name: string
  subject?: string
  htmlBody?: string
  smsBody?: string
  mergeTagsJson: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Audience {
  id: string
  companyId: string
  name: string
  type: 'STATIC' | 'DYNAMIC'
  filtersJson: string
  lastCount: number
  createdAt: string
  updatedAt: string
}

export interface MarketingSettings {
  id: string
  companyId: string
  globalEnabled: boolean
  reviewRequestsEnabled: boolean
  equipmentAutomationsEnabled: boolean
  winbackEnabled: boolean
  frequencyCapPerDay: number
  frequencyCapPerWeek: number
  defaultSenderName?: string
  createdAt: string
  updatedAt: string
}

export interface DeletionLogEntry {
  id: string
  companyId: string
  customerId: string
  deletedBy: string
  recordsDeleted: number
  deletedAt: string
}

export interface DeletionResult {
  sendJobsDeleted: number
  suppressionsDeleted: number
  reviewRequestsDeleted: number
  total: number
}

export interface AttributionStats {
  totalClicks: number
  reviewClicks: number
  reviewSends: number
  reviewClickRate: number
  winbackSends: number
  automationSends: number
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function useMarketingKpis(range: StatsRange = '30d') {
  return useQuery<MarketingKpis>({
    queryKey: ['marketing', 'kpis', range],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/kpis?range=${range}`)
      return res.data
    },
    staleTime: 2 * 60_000,
  })
}

export function useCampaignStats(range: StatsRange = '30d') {
  return useQuery<CampaignStat[]>({
    queryKey: ['marketing', 'campaign-stats', range],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/campaigns?range=${range}`)
      return res.data
    },
    staleTime: 2 * 60_000,
  })
}

export function useAttributionStats(range: StatsRange = '30d') {
  return useQuery<AttributionStats>({
    queryKey: ['marketing', 'attribution', range],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/attribution?range=${range}`)
      return res.data
    },
    staleTime: 2 * 60_000,
  })
}

export function useCampaignFunnel(id: string) {
  return useQuery<CampaignFunnel>({
    queryKey: ['marketing', 'funnel', id],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/campaigns/${id}/funnel`)
      return res.data
    },
    enabled: !!id,
    staleTime: 60_000,
  })
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ['marketing', 'campaigns'],
    queryFn: async () => {
      const res = await api.get('/comms/m/campaigns')
      return res.data
    },
    staleTime: 30_000,
  })
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (data: {
      name: string
      channel: 'EMAIL' | 'SMS'
      audienceId?: string
      templateId?: string
      scheduleAt?: string
    }) => {
      const res = await api.post('/comms/m/campaigns', data)
      return res.data as Campaign
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'campaigns'] })
      const prev = queryClient.getQueryData<Campaign[]>(['marketing', 'campaigns'])
      const optimistic: Campaign = {
        id: `_temp_${Date.now()}`,
        companyId: '',
        createdBy: '',
        status: data.scheduleAt ? 'SCHEDULED' : 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      }
      queryClient.setQueryData<Campaign[]>(['marketing', 'campaigns'], old => [optimistic, ...(old ?? [])])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'campaigns'], ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] })
    },
  })
}

export function useLaunchCampaign() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/comms/m/campaigns/${id}/launch`)
      return res.data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'campaigns'] })
      const prev = queryClient.getQueryData<Campaign[]>(['marketing', 'campaigns'])
      queryClient.setQueryData<Campaign[]>(['marketing', 'campaigns'], old =>
        (old ?? []).map(c => c.id === id ? { ...c, status: 'SENT' } : c)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'campaigns'], ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaign-stats'] })
    },
  })
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function useMarketingTemplates() {
  return useQuery<Template[]>({
    queryKey: ['marketing', 'templates'],
    queryFn: async () => {
      const res = await api.get('/comms/m/templates')
      return res.data
    },
    staleTime: 5 * 60_000,
  })
}

export function useCreateTemplate() {
  return useMutation({
    mutationFn: async (data: {
      name: string
      channel: 'EMAIL' | 'SMS'
      subject?: string
      htmlBody?: string
      smsBody?: string
    }) => {
      const res = await api.post('/comms/m/templates', data)
      return res.data as Template
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'templates'] })
      const prev = queryClient.getQueryData<Template[]>(['marketing', 'templates'])
      const optimistic: Template = {
        id: `_temp_${Date.now()}`,
        companyId: '',
        mergeTagsJson: '[]',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      }
      queryClient.setQueryData<Template[]>(['marketing', 'templates'], old => [optimistic, ...(old ?? [])])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'templates'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

export function useUpdateTemplate() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Template> }) => {
      const res = await api.patch(`/comms/m/templates/${id}`, data)
      return res.data as Template
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'templates'] })
      const prev = queryClient.getQueryData<Template[]>(['marketing', 'templates'])
      queryClient.setQueryData<Template[]>(['marketing', 'templates'], old =>
        (old ?? []).map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'templates'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comms/m/templates/${id}`)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'templates'] })
      const prev = queryClient.getQueryData<Template[]>(['marketing', 'templates'])
      queryClient.setQueryData<Template[]>(['marketing', 'templates'], old =>
        (old ?? []).filter(t => t.id !== id)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'templates'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

export function useSeedDefaultTemplates() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/comms/m/templates/seed-defaults')
      return res.data as { seeded: number }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

// ── Audiences ─────────────────────────────────────────────────────────────────

export function useAudiences() {
  return useQuery<Audience[]>({
    queryKey: ['marketing', 'audiences'],
    queryFn: async () => {
      const res = await api.get('/comms/m/audiences')
      return res.data
    },
    staleTime: 2 * 60_000,
  })
}

export function useCreateAudience() {
  return useMutation({
    mutationFn: async (data: { name: string; type?: 'STATIC' | 'DYNAMIC'; filtersJson?: string }) => {
      const res = await api.post('/comms/m/audiences', data)
      return res.data as Audience
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'audiences'] })
      const prev = queryClient.getQueryData<Audience[]>(['marketing', 'audiences'])
      const optimistic: Audience = {
        id: `_temp_${Date.now()}`,
        companyId: '',
        name: data.name,
        type: data.type ?? 'DYNAMIC',
        filtersJson: data.filtersJson ?? '[]',
        lastCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      queryClient.setQueryData<Audience[]>(['marketing', 'audiences'], old => [optimistic, ...(old ?? [])])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'audiences'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'audiences'] }),
  })
}

export function useDeleteAudience() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comms/m/audiences/${id}`)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'audiences'] })
      const prev = queryClient.getQueryData<Audience[]>(['marketing', 'audiences'])
      queryClient.setQueryData<Audience[]>(['marketing', 'audiences'], old =>
        (old ?? []).filter(a => a.id !== id)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'audiences'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'audiences'] }),
  })
}

export function useAudiencePreviewCount(filtersJson: string) {
  return useQuery<{ count: number }>({
    queryKey: ['marketing', 'audience-preview', filtersJson],
    queryFn: async () => {
      const res = await api.get(`/comms/m/audiences/preview-count?filters=${encodeURIComponent(filtersJson)}`)
      return res.data
    },
    enabled: filtersJson !== '[]',
    staleTime: 10_000,
  })
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useMarketingSettings() {
  return useQuery<MarketingSettings>({
    queryKey: ['marketing', 'settings'],
    queryFn: async () => {
      const res = await api.get('/comms/m/settings')
      return res.data
    },
    staleTime: 10 * 60_000,
  })
}

export function useUpdateMarketingSettings() {
  return useMutation({
    mutationFn: async (data: Partial<MarketingSettings>) => {
      const res = await api.patch('/comms/m/settings', data)
      return res.data as MarketingSettings
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['marketing', 'settings'] })
      const prev = queryClient.getQueryData<MarketingSettings>(['marketing', 'settings'])
      queryClient.setQueryData<MarketingSettings>(['marketing', 'settings'], old =>
        old ? { ...old, ...data } : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['marketing', 'settings'], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'settings'] }),
  })
}

// ── Compliance (CCPA) ─────────────────────────────────────────────────────────

export function useDeletionLog() {
  return useQuery<DeletionLogEntry[]>({
    queryKey: ['marketing', 'deletion-log'],
    queryFn: async () => {
      const res = await api.get('/comms/m/compliance/deletion-log')
      return res.data
    },
    staleTime: 2 * 60_000,
  })
}

export function useDeleteCustomerMarketingData() {
  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await api.delete(`/comms/m/compliance/customers/${customerId}`)
      return res.data as DeletionResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'deletion-log'] })
      queryClient.invalidateQueries({ queryKey: ['marketing', 'kpis'] })
    },
  })
}

// ── Prefetch ──────────────────────────────────────────────────────────────────

/**
 * Warm everything the Marketing page's Overview and Campaigns tabs mount
 * with (kpis / campaign-stats / attribution at the default 30d range, plus
 * campaigns, templates, and audiences), so tab switches render instantly.
 */
export function prefetchMarketingPage(): Promise<unknown> {
  const get = (url: string) => async () => (await api.get(url)).data
  return Promise.allSettled([
    queryClient.prefetchQuery({ queryKey: ['marketing', 'kpis', '30d'], queryFn: get('/comms/m/stats/kpis?range=30d'), staleTime: 2 * 60_000 }),
    queryClient.prefetchQuery({ queryKey: ['marketing', 'campaign-stats', '30d'], queryFn: get('/comms/m/stats/campaigns?range=30d'), staleTime: 2 * 60_000 }),
    queryClient.prefetchQuery({ queryKey: ['marketing', 'attribution', '30d'], queryFn: get('/comms/m/stats/attribution?range=30d'), staleTime: 2 * 60_000 }),
    queryClient.prefetchQuery({ queryKey: ['marketing', 'campaigns'], queryFn: get('/comms/m/campaigns'), staleTime: 30_000 }),
    queryClient.prefetchQuery({ queryKey: ['marketing', 'templates'], queryFn: get('/comms/m/templates'), staleTime: 5 * 60_000 }),
    queryClient.prefetchQuery({ queryKey: ['marketing', 'audiences'], queryFn: get('/comms/m/audiences'), staleTime: 2 * 60_000 }),
  ])
}
