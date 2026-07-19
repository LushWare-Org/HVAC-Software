/**
 * Projects data layer — real TanStack Query hooks against crm/job/finance
 * services (replaces projectsMock.ts; same shapes the pages were built on).
 *
 * Financial roll-ups are computed client-side from `?projectId=`-filtered
 * finance queries per the spec; money arrives as Decimal strings → Number().
 */
import { useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'

// ── Types (shapes the pages were built on) ────────────────────────────────────

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'
export const WEEKDAYS: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// Project templates — extensible registry, mirrors crm-service's project-templates.ts.
// Immutable after creation.
export type ProjectTemplateType = 'STANDARD' | 'HOUSING_SCHEME'
export const PROJECT_TEMPLATE_META: Record<ProjectTemplateType, { label: string; description: string }> = {
  STANDARD: { label: 'Standard', description: 'A single client with jobs, agreements, and finances.' },
  HOUSING_SCHEME: {
    label: 'Housing Scheme',
    description: 'A development with many houses, each with its own owner, equipment, and portal access.',
  },
}

export interface ProjectJob {
  id: string
  title: string
  status: string
  scheduledStart?: string
  assignedToName?: string
  // Carried through so JobDetailModal's first render (before its own useJob
  // refetch resolves) has what it reads directly off the passed-in job.
  customerId?: string
  description?: string
}

export interface ProjectAgreement {
  id: string
  name: string
  serviceType: string
  interval: string
  nextVisit?: string
  status: string
}

export interface FinanceDoc {
  id: string
  number: string
  title: string
  total: number // dollars
  status: string
  date: string
}

export interface RosterDay {
  date: string // YYYY-MM-DD
  techUserIds: string[]
  isOverride: boolean
  isOff: boolean
}

export interface Project {
  id: string
  companyId: string
  customerId: string
  customerName: string
  name: string
  description?: string
  category?: string
  status: ProjectStatus
  templateType: ProjectTemplateType
  startDate?: string
  targetEndDate?: string
  budget?: number // dollars
  requiredHeadcount?: number
  siteAddress?: string
  latitude?: number
  longitude?: number
  workingDays: Weekday[]
  baseTeamUserIds: string[]
  notes?: string
  createdAt: string
  // Linked entities (fetched by projectId from job/finance services)
  jobs: ProjectJob[]
  agreements: ProjectAgreement[]
  quotes: FinanceDoc[]
  invoices: FinanceDoc[]
  /** Effective roster for today (list page / cards). */
  rosterToday: { techUserIds: string[]; isOverride: boolean; isOff: boolean }
  /** Housing Scheme only: rolled-up open issue-report count across all houses. */
  openIssueCount?: number
}

export interface ProjectRosterBandRow {
  projectId: string
  name: string
  customerId: string
  siteAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  requiredHeadcount?: number | null
  techUserIds: string[]
  isOverride: boolean
  isOff: boolean
}

export const STATUS_META: Record<ProjectStatus, { label: string; color: string; dim: string }> = {
  PLANNING: { label: 'Planning', color: 'var(--violet)', dim: 'var(--violet-dim)' },
  ACTIVE: { label: 'Active', color: 'var(--green)', dim: 'var(--green-dim)' },
  ON_HOLD: { label: 'On Hold', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  COMPLETED: { label: 'Completed', color: 'var(--blue)', dim: 'var(--blue-dim)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--red)', dim: 'var(--red-dim)' },
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

// ── Technician directory (real team, mock-free avatars) ──────────────────────

export interface TechInfo {
  userId: string
  name: string
  skills: string[]
  color: string
}

const AVATAR_PALETTE = ['#0891B2', '#7C3AED', '#DB2777', '#D97706', '#059669', '#2563EB', '#DC2626', '#475569']

function colorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

// Module-level directory primed by useTechDirectory — lets TechAvatar stay a
// plain synchronous component (same pattern as lib/format.ts tenant state).
let TECH_DIR = new Map<string, TechInfo>()
export const techById = (id: string) => TECH_DIR.get(id)

export function useTechDirectory() {
  return useQuery<TechInfo[]>({
    queryKey: ['projects', 'tech-directory'],
    queryFn: async () => {
      const res = await api.get('/crm/users', { params: { limit: 200 } })
      const rows: any[] = res.data?.data ?? res.data ?? []
      const techs = rows
        .filter(u => u.role === 'technician' && u.isActive !== false)
        .map(u => ({
          userId: u.id as string,
          name: (u.name as string) ?? '—',
          skills: (u.skills as string[]) ?? [],
          color: colorFor(u.id),
        }))
      TECH_DIR = new Map(techs.map(t => [t.userId, t]))
      return techs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Raw fetch helpers ─────────────────────────────────────────────────────────

export type ProjectBase = Omit<Project, 'jobs' | 'agreements' | 'quotes' | 'invoices' | 'rosterToday'>

function mapApiProject(raw: any): ProjectBase {
  return {
    id: raw.id,
    companyId: raw.companyId,
    customerId: raw.customerId,
    customerName: raw.customerName ?? '—',
    name: raw.name,
    description: raw.description ?? undefined,
    category: raw.category ?? undefined,
    status: raw.status as ProjectStatus,
    templateType: (raw.templateType as ProjectTemplateType) ?? 'STANDARD',
    startDate: raw.startDate ? String(raw.startDate).slice(0, 10) : undefined,
    targetEndDate: raw.targetEndDate ? String(raw.targetEndDate).slice(0, 10) : undefined,
    budget: raw.budget != null ? Number(raw.budget) : undefined,
    requiredHeadcount: raw.requiredHeadcount ?? undefined,
    siteAddress: raw.siteAddress ?? undefined,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    workingDays: (raw.workingDays ?? []) as Weekday[],
    baseTeamUserIds: raw.baseTeamUserIds ?? [],
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt,
    openIssueCount: raw.openIssueCount ?? undefined,
  }
}

function mapJob(j: any): ProjectJob {
  return {
    id: j.id,
    title: j.title,
    status: j.status,
    scheduledStart: j.scheduledStart ?? undefined,
    assignedToName: j.assignedToName ?? undefined,
    customerId: j.customerId ?? undefined,
    description: j.description ?? undefined,
  }
}

function mapQuote(q: any): FinanceDoc {
  return {
    id: q.id,
    number: q.quoteNumber ?? q.number ?? '—',
    title: q.title ?? '—',
    total: Number(q.total ?? 0),
    status: q.status,
    date: String(q.createdAt ?? q.date ?? '').slice(0, 10),
  }
}

function mapInvoice(i: any): FinanceDoc {
  return {
    id: i.id,
    number: i.invoiceNumber ?? i.number ?? '—',
    title: i.title ?? i.description ?? '—',
    total: Number(i.total ?? 0),
    status: i.status,
    date: String(i.issuedAt ?? i.createdAt ?? '').slice(0, 10),
  }
}

function mapAgreement(a: any): ProjectAgreement {
  return {
    id: a.id,
    name: a.name,
    serviceType: a.serviceType ?? 'Service',
    interval: a.serviceInterval ?? '—',
    nextVisit: a.nextServiceDate ? String(a.nextServiceDate).slice(0, 10) : undefined,
    status: a.status,
  }
}

const fetchProjectJobs = async (projectId: string): Promise<ProjectJob[]> => {
  const res = await api.get('/jobs/jobs', { params: { projectId, limit: 100 } })
  const rows: any[] = res.data?.data ?? []
  return rows.map(mapJob)
}
const fetchProjectQuotes = async (projectId: string): Promise<FinanceDoc[]> => {
  const res = await api.get('/finance/quotes', { params: { projectId, limit: 100 } })
  const rows: any[] = res.data?.data ?? res.data?.items ?? []
  return rows.map(mapQuote)
}
const fetchProjectInvoices = async (projectId: string): Promise<FinanceDoc[]> => {
  const res = await api.get('/finance/invoices', { params: { projectId, limit: 100 } })
  const rows: any[] = res.data?.data ?? res.data?.items ?? []
  return rows.map(mapInvoice)
}

const EMPTY_ROSTER = { techUserIds: [] as string[], isOverride: false, isOff: false }

// ── Queries ───────────────────────────────────────────────────────────────────

type ProjectLinksBatch = {
  jobs: Record<string, ProjectJob[]>
  quotes: Record<string, FinanceDoc[]>
  invoices: Record<string, FinanceDoc[]>
}

/**
 * One request per service for ALL projects' links (`?projectIds=a,b,c`)
 * instead of 3 requests per project — 3 round-trips total regardless of
 * project count. Also seeds the per-project query keys so ProjectDetail
 * renders instantly from cache after visiting the list.
 */
async function fetchProjectLinksBatch(projectIds: string[]): Promise<ProjectLinksBatch> {
  const empty = (): Record<string, any[]> => Object.fromEntries(projectIds.map(id => [id, []]))
  if (projectIds.length === 0) return { jobs: {}, quotes: {}, invoices: {} }
  const idsCsv = projectIds.join(',')
  const [jobsRes, quotesRes, invoicesRes] = await Promise.all([
    api.get('/jobs/jobs', { params: { projectIds: idsCsv, limit: 500 } }),
    api.get('/finance/quotes', { params: { projectIds: idsCsv, limit: 500 } }),
    api.get('/finance/invoices', { params: { projectIds: idsCsv, limit: 500 } }),
  ])
  const group = <T,>(rows: any[], map: (r: any) => T): Record<string, T[]> => {
    const by = empty() as Record<string, T[]>
    for (const r of rows) {
      const pid = r?.projectId
      if (pid && by[pid]) by[pid].push(map(r))
    }
    return by
  }
  const batch: ProjectLinksBatch = {
    jobs: group(jobsRes.data?.data ?? [], mapJob),
    quotes: group(quotesRes.data?.data ?? quotesRes.data?.items ?? [], mapQuote),
    invoices: group(invoicesRes.data?.data ?? invoicesRes.data?.items ?? [], mapInvoice),
  }
  // Seed per-project caches (same keys useProjectFull reads) so opening any
  // project's detail after the list needs zero link fetches.
  for (const id of projectIds) {
    queryClient.setQueryData(['projects', id, 'jobs'], batch.jobs[id] ?? [])
    queryClient.setQueryData(['projects', id, 'quotes'], batch.quotes[id] ?? [])
    queryClient.setQueryData(['projects', id, 'invoices'], batch.invoices[id] ?? [])
  }
  return batch
}

/** All projects with roster-today + per-project jobs/quotes/invoices attached. */
export function useProjectsFull() {
  const listQ = useQuery<ProjectBase[]>({
    queryKey: ['projects', 'list'],
    queryFn: async () => {
      const res = await api.get('/crm/projects', { params: { limit: 100 } })
      return ((res.data?.data ?? []) as any[]).map(mapApiProject)
    },
    staleTime: 30 * 1000,
  })

  const todayKey = toDateKey(new Date())
  const rostersQ = useRostersByDate(todayKey)

  const bases = listQ.data ?? []
  const projectIds = bases.map(p => p.id)
  const linksQ = useQuery<ProjectLinksBatch>({
    queryKey: ['projects', 'links-batch', projectIds.join(',')],
    queryFn: () => fetchProjectLinksBatch(projectIds),
    enabled: projectIds.length > 0,
    staleTime: 30_000,
  })

  const projects: Project[] = useMemo(() => {
    const rosterByProject = new Map((rostersQ.data ?? []).map(r => [r.projectId, r]))
    const links = linksQ.data
    return bases.map(p => {
      const roster = rosterByProject.get(p.id)
      return {
        ...p,
        jobs: links?.jobs[p.id] ?? [],
        quotes: links?.quotes[p.id] ?? [],
        invoices: links?.invoices[p.id] ?? [],
        agreements: [],
        rosterToday: roster
          ? { techUserIds: roster.techUserIds, isOverride: roster.isOverride, isOff: roster.isOff }
          : EMPTY_ROSTER,
      }
    })
  }, [bases, rostersQ.data, linksQ.data])

  return { projects, isLoading: listQ.isLoading, isError: listQ.isError, refetch: listQ.refetch }
}

/** One project with agreements (from crm detail) + jobs/quotes/invoices. */
export function useProjectFull(id: string | undefined) {
  const detailQ = useQuery({
    queryKey: ['projects', id, 'detail'],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${id}`)
      return res.data
    },
    enabled: !!id,
    staleTime: 15 * 1000,
  })

  const jobsQ = useQuery({
    queryKey: ['projects', id, 'jobs'],
    queryFn: () => fetchProjectJobs(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
  const quotesQ = useQuery({
    queryKey: ['projects', id, 'quotes'],
    queryFn: () => fetchProjectQuotes(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
  const invoicesQ = useQuery({
    queryKey: ['projects', id, 'invoices'],
    queryFn: () => fetchProjectInvoices(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const project: Project | undefined = useMemo(() => {
    if (!detailQ.data) return undefined
    return {
      ...mapApiProject(detailQ.data),
      jobs: jobsQ.data ?? [],
      quotes: quotesQ.data ?? [],
      invoices: invoicesQ.data ?? [],
      agreements: (detailQ.data.agreements ?? []).map(mapAgreement),
      rosterToday: EMPTY_ROSTER,
    }
  }, [detailQ.data, jobsQ.data, quotesQ.data, invoicesQ.data])

  return { project, isLoading: detailQ.isLoading, isError: detailQ.isError, notFound: detailQ.isError }
}

/** Effective roster per date for a range (roster tab week strip). */
export function useProjectRoster(id: string | undefined, from: string, to: string) {
  return useQuery<RosterDay[]>({
    queryKey: ['projects', id, 'roster', from, to],
    queryFn: async () => {
      const res = await api.get(`/crm/projects/${id}/roster`, { params: { from, to } })
      return res.data
    },
    enabled: !!id,
    staleTime: 15 * 1000,
  })
}

/** Day Planner band — all projects with a crew on the date. */
export function useRostersByDate(date: string) {
  return useQuery<ProjectRosterBandRow[]>({
    queryKey: ['projects', 'rosters', date],
    queryFn: async () => {
      const res = await api.get('/crm/projects/rosters', { params: { date } })
      return res.data
    },
    staleTime: 15 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

const invalidateProjects = () => queryClient.invalidateQueries({ queryKey: ['projects'] })

export interface UpsertProjectInput {
  customerId?: string
  name?: string
  description?: string
  category?: string
  /** Only meaningful on create — immutable server-side afterward. */
  templateType?: ProjectTemplateType
  status?: ProjectStatus
  startDate?: string
  targetEndDate?: string
  budget?: number
  requiredHeadcount?: number
  siteAddress?: string
  latitude?: number
  longitude?: number
  workingDays?: Weekday[]
  baseTeamUserIds?: string[]
  notes?: string
}

export function useCreateProject() {
  return useMutation({
    mutationFn: async (input: UpsertProjectInput) => {
      const res = await api.post('/crm/projects', input)
      return res.data
    },
    onSuccess: invalidateProjects,
  })
}

export function useUpdateProject() {
  return useMutation({
    mutationFn: async ({ id, ...input }: UpsertProjectInput & { id: string }) => {
      const res = await api.patch(`/crm/projects/${id}`, input)
      return res.data
    },
    onSuccess: invalidateProjects,
  })
}

/** Set override / mark off / reset for one date. */
export function useSetRosterDay() {
  return useMutation({
    mutationFn: async ({ projectId, date, ...body }: {
      projectId: string
      date: string
      techUserIds?: string[]
      isOff?: boolean
      reset?: boolean
    }) => {
      const res = await api.put(`/crm/projects/${projectId}/roster/${date}`, body)
      return res.data
    },
    onSuccess: invalidateProjects,
  })
}

export function useLinkJobToProject() {
  return useMutation({
    mutationFn: async ({ jobId, projectId }: { jobId: string; projectId: string | null }) => {
      const res = await api.patch(`/jobs/jobs/${jobId}`, { projectId })
      return res.data
    },
    onSuccess: () => {
      invalidateProjects()
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useLinkAgreement() {
  return useMutation({
    mutationFn: async ({ projectId, agreementId, link }: { projectId: string; agreementId: string; link: boolean }) => {
      const res = link
        ? await api.post(`/crm/projects/${projectId}/agreements/${agreementId}`)
        : await api.delete(`/crm/projects/${projectId}/agreements/${agreementId}`)
      return res.data
    },
    onSuccess: invalidateProjects,
  })
}

// ── Derived helpers (unchanged from the mock's contract) ─────────────────────

export function projectProgress(p: Project): { done: number; total: number; pct: number } {
  const total = p.jobs.length
  const done = p.jobs.filter(j => ['COMPLETED', 'INVOICED', 'PAID'].includes(j.status)).length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

export function projectFinances(p: Project) {
  const quoted = p.quotes.filter(q => !['REJECTED', 'DECLINED', 'EXPIRED'].includes(q.status)).reduce((s, q) => s + q.total, 0)
  const invoiced = p.invoices.filter(i => i.status !== 'VOID').reduce((s, i) => s + i.total, 0)
  const paid = p.invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  return { quoted, invoiced, paid, outstanding: invoiced - paid }
}

/**
 * Guided message for the scheduling service's TECH_ON_PROJECT 409 —
 * returns null when the error is something else.
 */
export function techOnProjectMessage(err: any, techName = 'This technician'): string | null {
  const d = err?.response?.data
  if (err?.response?.status !== 409 || d?.code !== 'TECH_ON_PROJECT') return null
  const day = d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'that day'
  return `${techName} is on "${d.projectName}" on ${day} — remove them from that day's roster in the project to assign them.`
}

/** Lightweight project name lookup (shares cache with useProjectFull's detail query). */
export function useProjectName(id: string | undefined | null) {
  return useQuery<string>({
    queryKey: ['projects', id, 'detail'],
    queryFn: async () => (await api.get(`/crm/projects/${id}`)).data,
    enabled: !!id,
    staleTime: 60 * 1000,
    select: (data: any) => data?.name ?? 'Project',
  })
}

/** Customer's projects (details sidebar section — renders only when ≥1). */
export function useCustomerProjects(customerId: string | undefined) {
  return useQuery<ProjectBase[]>({
    queryKey: ['projects', 'by-customer', customerId],
    queryFn: async () => {
      const res = await api.get('/crm/projects', { params: { customerId, limit: 50 } })
      return ((res.data?.data ?? []) as any[]).map(p => ({ ...p })) as ProjectBase[]
    },
    enabled: !!customerId,
    staleTime: 60 * 1000,
  })
}

/** Refresh a project's linked jobs/quotes/invoices/detail after creating or linking one from the project page. */
export function invalidateProjectLinks(projectId: string) {
  queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'jobs'] })
  queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'quotes'] })
  queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'invoices'] })
  queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'detail'] })
  queryClient.invalidateQueries({ queryKey: ['projects', 'links-batch'] })
  queryClient.invalidateQueries({ queryKey: ['projects', 'tech-directory'] })
  queryClient.invalidateQueries({ queryKey: ['projects', 'rosters'] })
}

// ── Prefetch ──────────────────────────────────────────────────────────────────

/**
 * Warm the Projects page: the project list + today's rosters first, then the
 * batched links query (one request per service for every project's
 * jobs/quotes/invoices) so the cards show their finances instantly.
 */
export async function prefetchProjectsPage(): Promise<void> {
  const todayKey = toDateKey(new Date())
  const listPromise = queryClient.prefetchQuery({
    queryKey: ['projects', 'list'],
    queryFn: async () => {
      const res = await api.get('/crm/projects', { params: { limit: 100 } })
      return ((res.data?.data ?? []) as any[]).map(mapApiProject)
    },
    staleTime: 30 * 1000,
  })
  await Promise.allSettled([
    listPromise,
    queryClient.prefetchQuery({
      queryKey: ['projects', 'rosters', todayKey],
      queryFn: async () => (await api.get('/crm/projects/rosters', { params: { date: todayKey } })).data,
      staleTime: 15 * 1000,
    }),
  ])
  const bases = queryClient.getQueryData<ProjectBase[]>(['projects', 'list']) ?? []
  const projectIds = bases.map(p => p.id)
  if (projectIds.length) {
    await queryClient.prefetchQuery({
      queryKey: ['projects', 'links-batch', projectIds.join(',')],
      queryFn: () => fetchProjectLinksBatch(projectIds),
      staleTime: 30_000,
    })
  }
}

/**
 * Warm one project's detail + houses — called on card hover/press so the
 * detail page opens with everything already in cache (jobs/quotes/invoices
 * are usually warm already from the list page's queries).
 */
export function prefetchProjectDetail(id: string): Promise<unknown> {
  return Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['projects', id, 'detail'],
      queryFn: async () => (await api.get(`/crm/projects/${id}`)).data,
      staleTime: 15 * 1000,
    }),
    queryClient.prefetchQuery({ queryKey: ['projects', id, 'jobs'], queryFn: () => fetchProjectJobs(id), staleTime: 30_000 }),
    queryClient.prefetchQuery({ queryKey: ['projects', id, 'quotes'], queryFn: () => fetchProjectQuotes(id), staleTime: 30_000 }),
    queryClient.prefetchQuery({ queryKey: ['projects', id, 'invoices'], queryFn: () => fetchProjectInvoices(id), staleTime: 30_000 }),
    import('./housesApi').then(m => m.prefetchHousesForProject(id)),
  ])
}
