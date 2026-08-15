/**
 * Projects — long-running customer engagements (Lotus Tower-scale contracts,
 * housing schemes) with dedicated day-by-day crews.
 *
 * DEMO: reads the in-memory mock store (projectsMock.ts). The page structure
 * (filters → KPI strip → project cards) is final; swapping mocks for real
 * hooks later doesn't change this file's layout.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, Plus, Search, MapPin, CalendarRange, Users2, HardHat,
  TrendingUp, Wallet, MessageSquareWarning, Layers,
} from 'lucide-react'
import {
  useProjectsFull, useTechDirectory, projectProgress, projectFinances,
  toDateKey, STATUS_META, prefetchProjectDetail, type Project, type ProjectStatus,
} from './projectsApi'
import { useOpenComponentIssues } from './componentsApi'
import { useProjectTemplates } from './templatesApi'
import { AvatarStack, ProjectStatusBadge, ProgressBar, fmtMoney, fmtDate } from './shared'
import ProjectEditorModal from './ProjectEditorModal'

const FILTERS: { value: ProjectStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function Projects() {
  const navigate = useNavigate()
  const { projects, isLoading } = useProjectsFull()
  useTechDirectory() // primes avatar names/colors
  const { data: openIssues } = useOpenComponentIssues()
  const { data: templates } = useProjectTemplates()
  const openIssueCountByProject = useMemo(() => {
    const map = new Map<string, number>()
    for (const issue of openIssues ?? []) map.set(issue.projectId, (map.get(issue.projectId) ?? 0) + 1)
    return map
  }, [openIssues])
  const [filter, setFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [showEditor, setShowEditor] = useState(false)

  const todayKey = toDateKey(new Date())

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (filter !== 'ALL' && p.status !== filter) return false
      if (search) {
        const text = `${p.name} ${p.customerName} ${p.category ?? ''} ${p.siteAddress ?? ''}`.toLowerCase()
        if (!text.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [projects, filter, search])

  const kpis = useMemo(() => {
    const active = projects.filter(p => p.status === 'ACTIVE')
    const crewToday = active.reduce((s, p) => s + p.rosterToday.techUserIds.length, 0)
    const activeValue = active.reduce((s, p) => s + projectFinances(p).quoted, 0)
    const outstanding = projects.reduce((s, p) => s + projectFinances(p).outstanding, 0)
    return { active: active.length, crewToday, activeValue, outstanding }
  }, [projects, todayKey])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="anim-fade-up">
      {/* Header — on-canvas: always light text (canvas is dark navy in all themes) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderKanban size={20} style={{ color: 'var(--blue)' }} /> Projects
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            Long-running engagements with dedicated crews — installations, retrofits, housing schemes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects/templates')}>
            <Layers size={13} /> Templates{templates && templates.length > 0 ? ` · ${templates.length}` : ''}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEditor(true)}>
            <Plus size={13} /> New project
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Active projects', value: String(kpis.active), icon: HardHat, tone: 'var(--green)' },
          { label: 'Crew on projects today', value: String(kpis.crewToday), icon: Users2, tone: 'var(--blue)' },
          { label: 'Active contract value', value: fmtMoney(kpis.activeValue), icon: TrendingUp, tone: 'var(--violet)' },
          { label: 'Outstanding billing', value: fmtMoney(kpis.outstanding), icon: Wallet, tone: 'var(--amber)' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="kpi-card">
              <div className="kpi-card-top">
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: 'var(--bg-card-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: k.tone }} />
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{k.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            className="btn btn-sm"
            style={filter === f.value
              ? { background: 'var(--blue)', color: 'white', border: '1px solid var(--blue)' }
              : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <div className="filter-search" style={{ marginLeft: 'auto', minWidth: 220 }}>
          <Search size={13} color="var(--t4)" />
          <input placeholder="Search projects, customers, sites…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Project cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 180, background: 'var(--bg-card)', opacity: 0.6 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '52px 24px', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--blue-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <FolderKanban size={22} style={{ color: 'var(--blue)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No projects match</p>
          <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '4px 0 14px' }}>
            Projects group weeks of work — jobs, crew and billing — under one roof.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEditor(true)}>
            <Plus size={13} /> Create the first project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 14 }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} openIssueCount={openIssueCountByProject.get(p.id) ?? 0} onOpen={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {showEditor && <ProjectEditorModal onClose={() => setShowEditor(false)} />}
    </div>
  )
}

function ProjectCard({ project: p, openIssueCount, onOpen }: { project: Project; openIssueCount: number; onOpen: () => void }) {
  const prog = projectProgress(p)
  const fin = projectFinances(p)
  const roster = p.rosterToday
  const short = p.requiredHeadcount != null && roster.techUserIds.length > 0 && roster.techUserIds.length < p.requiredHeadcount
  const hasOpenIssue = openIssueCount > 0
  const statusColor = hasOpenIssue ? 'var(--red)' : STATUS_META[p.status].color

  return (
    <div
      className="card card-hover"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      onMouseEnter={() => prefetchProjectDetail(p.id)}
      onFocus={() => prefetchProjectDetail(p.id)}
      style={{
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        border: hasOpenIssue ? '1px solid var(--red)' : undefined,
        boxShadow: hasOpenIssue ? '0 0 0 1px var(--red-dim)' : undefined,
      }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${statusColor}, transparent)` }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0, lineHeight: 1.3 }}>{p.name}</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '3px 0 0' }}>{p.customerName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {hasOpenIssue && (
              <span title={`${openIssueCount} open issue${openIssueCount === 1 ? '' : 's'} reported`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700,
                color: 'var(--red)', background: 'var(--red-dim)', padding: '2px 7px', borderRadius: 999,
              }}>
                <MessageSquareWarning size={11} /> {openIssueCount}
              </span>
            )}
            <ProjectStatusBadge status={p.status} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '12px 0' }}>
          {p.siteAddress && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--t3)' }}>
              <MapPin size={11} /> {p.siteAddress.split(',')[0]}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--t3)' }}>
            <CalendarRange size={11} /> {fmtDate(p.startDate)} → {fmtDate(p.targetEndDate)}
          </span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}><ProgressBar pct={prog.pct} color={statusColor} /></div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
            {prog.total === 0 ? 'No jobs yet' : `${prog.done}/${prog.total} jobs · ${prog.pct}%`}
          </span>
        </div>

        {/* Footer: crew + money */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AvatarStack userIds={p.status === 'ACTIVE' ? (roster.techUserIds.length ? roster.techUserIds : p.baseTeamUserIds) : p.baseTeamUserIds} />
            {p.status === 'ACTIVE' && (
              roster.techUserIds.length === 0 ? (
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)' }}>No crew today</span>
              ) : (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: short ? 'var(--amber-dim)' : 'var(--green-dim)',
                  color: short ? 'var(--amber)' : 'var(--green)',
                }}>
                  {roster.techUserIds.length}{p.requiredHeadcount ? `/${p.requiredHeadcount}` : ''} on site today{short ? ' — short' : ''}
                </span>
              )
            )}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
            <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{fmtMoney(fin.invoiced)}</span>
            {' '}of {fmtMoney(fin.quoted)} billed
          </div>
        </div>
      </div>
    </div>
  )
}
