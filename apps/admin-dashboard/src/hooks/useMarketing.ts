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
  })
}

export function useCampaignStats(range: StatsRange = '30d') {
  return useQuery<CampaignStat[]>({
    queryKey: ['marketing', 'campaign-stats', range],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/campaigns?range=${range}`)
      return res.data
    },
  })
}

export function useAttributionStats(range: StatsRange = '30d') {
  return useQuery<AttributionStats>({
    queryKey: ['marketing', 'attribution', range],
    queryFn: async () => {
      const res = await api.get(`/comms/m/stats/attribution?range=${range}`)
      return res.data
    },
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
    onSuccess: () => {
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
    onSuccess: () => {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

export function useUpdateTemplate() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Template> }) => {
      const res = await api.patch(`/comms/m/templates/${id}`, data)
      return res.data as Template
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comms/m/templates/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'templates'] }),
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
  })
}

export function useCreateAudience() {
  return useMutation({
    mutationFn: async (data: { name: string; type?: 'STATIC' | 'DYNAMIC'; filtersJson?: string }) => {
      const res = await api.post('/comms/m/audiences', data)
      return res.data as Audience
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'audiences'] }),
  })
}

export function useDeleteAudience() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comms/m/audiences/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'audiences'] }),
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
  })
}

export function useUpdateMarketingSettings() {
  return useMutation({
    mutationFn: async (data: Partial<MarketingSettings>) => {
      const res = await api.patch('/comms/m/settings', data)
      return res.data as MarketingSettings
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing', 'settings'] }),
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
