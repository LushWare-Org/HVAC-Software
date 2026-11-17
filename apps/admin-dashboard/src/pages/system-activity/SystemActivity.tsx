/**
 * System Activity — the super-admin-only, real-time, cross-tenant monitoring
 * feed. Every real action across every backend service, tagged with who did
 * what, to which tenant, and whether it succeeded — the trial-monitoring
 * surface that finally gives the super_admin role a purpose.
 *
 * Layout: a narrow, sticky filter rail (never the full page width — this is
 * a live timeline, not a data table) beside a chronological feed where each
 * row already carries its own result, so nothing needs a click to reveal
 * what actually happened.
 *
 * Spec: docs/superpowers/specs/2026-08-15-super-admin-activity-monitoring-design.md
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Pause, Play, Radio, Search, AlertTriangle, CheckCircle2, Building2,
  ArrowDownToLine, X, SlidersHorizontal, Users, Wrench, CalendarClock, DollarSign,
  MessageSquare, BarChart3, Package, Brain,
} from 'lucide-react'
import {
  useActivityLog, useActivityCompanies, ALL_SERVICES, SERVICE_LABELS,
  type ActivityLogEntry, type ActivityLogFilters,
} from './activityLogApi'
import { useActivitySocket } from './useActivitySocket'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const secs = Math.round(diffMs / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function roleLabel(role: string | null): string {
  if (!role) return 'System'
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Stable color per tenant so the same company always reads the same badge tone across the feed. */
const TENANT_TONES = ['blue', 'violet', 'cyan', 'amber', 'green'] as const
function tenantTone(companyId: string | null): (typeof TENANT_TONES)[number] {
  if (!companyId) return 'blue'
  let hash = 0
  for (let i = 0; i < companyId.length; i++) hash = (hash * 31 + companyId.charCodeAt(i)) >>> 0
  return TENANT_TONES[hash % TENANT_TONES.length]
}

/** One icon + one accent color per service — the rail dot and the filter chips share this so a service reads the same way everywhere on the page. */
const SERVICE_META: Record<string, { icon: any; color: string }> = {
  crm: { icon: Users, color: 'var(--blue)' },
  jobs: { icon: Wrench, color: 'var(--amber)' },
  scheduling: { icon: CalendarClock, color: 'var(--violet)' },
  finance: { icon: DollarSign, color: 'var(--green)' },
  comms: { icon: MessageSquare, color: 'var(--cyan)' },
  analytics: { icon: BarChart3, color: 'var(--violet)' },
  inventory: { icon: Package, color: 'var(--amber)' },
  churn: { icon: Brain, color: 'var(--red)' },
}
function serviceMeta(service: string) {
  return SERVICE_META[service] ?? { icon: Activity, color: 'var(--t4)' }
}

// ─── Small presentational pieces ───────────────────────────────────────────

function LiveIndicator({ connected, live, onToggle }: { connected: boolean; live: boolean; onToggle: () => void }) {
  const label = !connected ? 'Reconnecting…' : live ? 'Live' : 'Paused'
  const dotColor = !connected ? 'var(--amber)' : live ? 'var(--green)' : 'var(--t4)'
  return (
    <button
      type="button"
      onClick={onToggle}
      className="btn btn-secondary btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative' }}
      title={live ? 'Pause the live feed (history stays browsable)' : 'Resume streaming new events'}
    >
      <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-flex' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, display: 'block' }} />
        {connected && live && (
          <span className="anim-ping-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor }} />
        )}
      </span>
      {label}
      {live ? <Pause size={12} /> : <Play size={12} />}
    </button>
  )
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color: tone }} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{value}</p>
    </div>
  )
}

// ─── Filter rail — compact, sticky, never full-width ───────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 7px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function ChipButton({ active, tone, onClick, children }: {
  active: boolean; tone?: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
        padding: '6px 9px', borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: active ? 600 : 500,
        border: '1px solid ' + (active ? (tone ?? 'var(--blue)') : 'transparent'),
        background: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--t1)' : 'var(--t3)',
        cursor: 'pointer', transition: 'background var(--dur-fast), border-color var(--dur-fast)',
      }}
    >
      {children}
    </button>
  )
}

function FilterRail({ filters, setFilters, companies, search, setSearch, onClear, hasActiveFilters }: {
  filters: ActivityLogFilters
  setFilters: (updater: (f: ActivityLogFilters) => ActivityLogFilters) => void
  companies: { companyId: string; companyName: string }[]
  search: string
  setSearch: (v: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}) {
  return (
    <div className="card" style={{ width: 216, flexShrink: 0, padding: '14px 14px 16px', position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>
          <SlidersHorizontal size={13} /> Filters
        </span>
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      <FilterSection label="Search">
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 25, width: '100%', fontSize: 12.5, height: 30 }}
            placeholder="Description, actor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FilterSection>

      <FilterSection label="Tenant">
        <select
          className="select"
          style={{ width: '100%', fontSize: 12.5 }}
          value={filters.companyId ?? 'all'}
          onChange={(e) => setFilters((f) => ({ ...f, companyId: e.target.value, page: 1 }))}
        >
          <option value="all">All tenants</option>
          {companies.map((c) => (
            <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
          ))}
        </select>
      </FilterSection>

      <FilterSection label="Service">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ChipButton active={!filters.service} onClick={() => setFilters((f) => ({ ...f, service: undefined, page: 1 }))}>
            All services
          </ChipButton>
          {ALL_SERVICES.map((s) => {
            const meta = serviceMeta(s)
            const Icon = meta.icon
            return (
              <ChipButton
                key={s}
                active={filters.service === s}
                tone={meta.color}
                onClick={() => setFilters((f) => ({ ...f, service: f.service === s ? undefined : s, page: 1 }))}
              >
                <Icon size={12} style={{ color: meta.color, flexShrink: 0 }} />
                {SERVICE_LABELS[s]}
              </ChipButton>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection label="Result">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ChipButton active={!filters.status} onClick={() => setFilters((f) => ({ ...f, status: undefined, page: 1 }))}>
            All results
          </ChipButton>
          <ChipButton
            active={filters.status === 'SUCCESS'}
            tone="var(--green)"
            onClick={() => setFilters((f) => ({ ...f, status: f.status === 'SUCCESS' ? undefined : 'SUCCESS', page: 1 }))}
          >
            <CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> Succeeded
          </ChipButton>
          <ChipButton
            active={filters.status === 'FAILURE'}
            tone="var(--red)"
            onClick={() => setFilters((f) => ({ ...f, status: f.status === 'FAILURE' ? undefined : 'FAILURE', page: 1 }))}
          >
            <AlertTriangle size={12} style={{ color: 'var(--red)' }} /> Failed
          </ChipButton>
        </div>
      </FilterSection>
    </div>
  )
}

// ─── Feed — a chronological timeline, not a click-to-reveal table ─────────

function TimelineRow({ entry, isNew, isLast }: { entry: ActivityLogEntry; isNew: boolean; isLast: boolean }) {
  const isFailure = entry.status === 'FAILURE'
  const meta = serviceMeta(entry.service)
  const Icon = meta.icon
  return (
    <div className={isNew ? 'anim-fade-up' : undefined} style={{ display: 'flex', gap: 12, padding: '13px 18px' }}>
      {/* Rail: service-colored dot + connecting line down to the next event */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg-card-2)', border: `1.5px solid ${meta.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={11} style={{ color: meta.color }} />
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, marginTop: 4, background: 'var(--bd)' }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--t3)', marginBottom: 4 }}>
          <span className={`badge badge-${tenantTone(entry.companyId)}`} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.companyName}>
            <Building2 size={10} /> {entry.companyName}
          </span>
          <span>{entry.actorName ?? 'System'} · {roleLabel(entry.actorRole)}</span>
          <span style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span title={new Date(entry.createdAt).toLocaleString()}>{clockTime(entry.createdAt)}</span>
            <span style={{ color: 'var(--t4)' }}>· {timeAgo(entry.createdAt)}</span>
          </span>
        </div>

        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)', lineHeight: 1.45, margin: 0 }}>
          {entry.description}
        </p>

        <div style={{ marginTop: 6 }}>
          {isFailure ? (
            <span className="badge badge-red" style={{ fontWeight: 600 }}>
              <AlertTriangle size={10} />
              Failed{entry.errorMessage ? ` — ${entry.errorMessage}` : ''}
            </span>
          ) : (
            <span className="badge badge-green" style={{ fontWeight: 600 }}>
              <CheckCircle2 size={10} /> Succeeded
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SystemActivity() {
  const [filters, setFilters] = useState<ActivityLogFilters>({ companyId: 'all', page: 1, limit: 50 })
  const [search, setSearch] = useState('')
  const [live, setLive] = useState(true)
  const [liveEntries, setLiveEntries] = useState<ActivityLogEntry[]>([])
  const seenIds = useRef(new Set<string>())

  const companiesQ = useActivityCompanies()
  const historyQ = useActivityLog(filters)

  const { connected } = useActivitySocket(
    (entry) => {
      if (!live) return
      if (seenIds.current.has(entry.id)) return
      seenIds.current.add(entry.id)
      setLiveEntries((prev) => [entry, ...prev].slice(0, 300))
    },
    filters.companyId !== 'all' ? filters.companyId : undefined,
  )

  // Reset the live buffer whenever a filter that changes the underlying
  // dataset changes, so the feed never shows entries from a tenant/service
  // the admin just filtered away.
  useEffect(() => {
    setLiveEntries([])
    seenIds.current.clear()
  }, [filters.companyId, filters.service, filters.status])

  const rows = useMemo(() => {
    const historical = historyQ.data?.items ?? []
    const seen = new Set(liveEntries.map((e) => e.id))
    const merged = [...liveEntries, ...historical.filter((e) => !seen.has(e.id))]
    if (!search.trim()) return merged
    const q = search.trim().toLowerCase()
    return merged.filter((e) =>
      e.description.toLowerCase().includes(q) ||
      e.companyName.toLowerCase().includes(q) ||
      (e.actorName ?? '').toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q),
    )
  }, [liveEntries, historyQ.data, search])

  const kpis = useMemo(() => {
    const total = (historyQ.data?.total ?? 0) + liveEntries.length
    const failuresLastHour = [...liveEntries, ...(historyQ.data?.items ?? [])].filter((e) => {
      if (e.status !== 'FAILURE') return false
      return Date.now() - new Date(e.createdAt).getTime() < 60 * 60 * 1000
    }).length
    const tenants = new Set((historyQ.data?.items ?? []).map((e) => e.companyId).filter(Boolean)).size
    const loaded = [...liveEntries, ...(historyQ.data?.items ?? [])]
    const successRate = loaded.length
      ? Math.round((loaded.filter((e) => e.status === 'SUCCESS').length / loaded.length) * 100)
      : 100
    return { total, failuresLastHour, tenants, successRate }
  }, [liveEntries, historyQ.data])

  const hasActiveFilters = filters.companyId !== 'all' || !!filters.service || !!filters.status || !!search
  const clearAll = () => { setFilters({ companyId: 'all', page: 1, limit: 50 }); setSearch('') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="anim-fade-up">
      {/* Header — on-canvas: always light text (canvas is dark navy in all themes) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={20} style={{ color: 'var(--blue)' }} /> System Activity
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            Every action, every tenant, in real time — the trial-monitoring feed. Super admin only.
          </p>
        </div>
        <LiveIndicator connected={connected} live={live} onToggle={() => setLive((v) => !v)} />
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KpiCard label="Events (loaded)" value={String(kpis.total)} icon={Activity} tone="var(--blue)" />
        <KpiCard label="Failures — last hour" value={String(kpis.failuresLastHour)} icon={AlertTriangle} tone="var(--red)" />
        <KpiCard label="Tenants active" value={String(kpis.tenants)} icon={Building2} tone="var(--violet)" />
        <KpiCard label="Success rate" value={`${kpis.successRate}%`} icon={CheckCircle2} tone="var(--cyan)" />
      </div>

      {/* Body: compact filter rail + timeline feed */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <FilterRail
          filters={filters}
          setFilters={setFilters}
          companies={companiesQ.data ?? []}
          search={search}
          setSearch={setSearch}
          onClear={clearAll}
          hasActiveFilters={hasActiveFilters}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 0 }}>
            {rows.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                {historyQ.isLoading ? (
                  <p style={{ fontSize: 13, color: 'var(--t3)' }}>Loading activity…</p>
                ) : (
                  <>
                    <Activity size={28} style={{ color: 'var(--t4)', marginBottom: 8 }} />
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>
                      {hasActiveFilters ? 'No activity matches these filters' : 'No activity yet'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>
                      {hasActiveFilters
                        ? 'Try clearing a filter to widen the feed.'
                        : 'Actions across every service will appear here the moment they happen.'}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {rows.map((entry, i) => (
                  <TimelineRow
                    key={entry.id}
                    entry={entry}
                    isNew={liveEntries.some((e) => e.id === entry.id)}
                    isLast={i === rows.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {historyQ.data && historyQ.data.total > (filters.page ?? 1) * (filters.limit ?? 50) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'center' }}
              onClick={() => setFilters((f) => ({ ...f, limit: (f.limit ?? 50) + 50 }))}
            >
              <ArrowDownToLine size={13} /> Load older activity
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
