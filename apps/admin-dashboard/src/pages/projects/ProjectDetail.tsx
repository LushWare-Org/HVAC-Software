/**
 * ProjectDetail — one engagement, everything about it.
 * Tabs: Overview · Crew roster (signature: 7-day strip with day-by-day
 * swaps and reserved-capacity messaging) · Jobs · Agreements · Finances.
 *
 * DEMO: reads/writes the mock store; roster edits update live.
 */
import { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Pencil, MapPin, CalendarRange, Users2, FileSignature,
  Wrench, Wallet, LayoutList, HardHat, Plus, RotateCcw, X, Moon,
  AlertTriangle, StickyNote, CalendarClock, Loader2, Link2, Unlink, UserPlus, Home, ChevronRight,
  User, Mail, ExternalLink,
} from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../contexts/ToastContext'
import { useCustomer } from '../../hooks/useCustomers'
import CustomerPickerWithCreate from '../../components/CustomerPickerWithCreate'
import {
  useProjectFull, useProjectRoster, useSetRosterDay, useTechDirectory,
  useLinkJobToProject, useLinkAgreement, useUpdateProject, projectProgress, projectFinances,
  invalidateProjectLinks, toDateKey, addDays, techById,
  STATUS_META, WEEKDAYS, type Project, type ProjectJob, type RosterDay,
} from './projectsApi'
import { useHouses, ACCOUNT_STATUS_META, type House } from './housesApi'
import { AvatarStack, TechAvatar, ProjectStatusBadge, ProgressBar, fmtMoney, fmtDate } from './shared'
import ProjectEditorModal from './ProjectEditorModal'
import AddTechnicianModal from '../../components/AddTechnicianModal'
import CreateJobModal from '../dispatch/CreateJobModal'
import AddQuoteModal from '../finance/AddQuoteModal'
import AddInvoiceModal from '../finance/AddInvoiceModal'
import AgreementEditorModal from '../agreements/AgreementEditorModal'
import type { Agreement } from '../../hooks/useAgreements'
import type { Job } from '../../types/api'
import HousesTab from './HousesTab'
import HouseIssuesAlert from '../../components/HouseIssuesAlert'

// Consistent with every other consumer of this modal (DayPlanner, Finance,
// AgreementDrawer, Topbar) — lazy-loaded, same component app-wide.
const JobDetailModal = lazy(() => import('../jobs/JobDetailModal'))

type Tab = 'overview' | 'roster' | 'jobs' | 'agreements' | 'finances' | 'houses'

const JOB_BADGE: Record<string, string> = {
  PENDING: 'badge-amber', SCHEDULED: 'badge-violet', EN_ROUTE: 'badge-blue',
  ON_SITE: 'badge-blue', COMPLETED: 'badge-green', INVOICED: 'badge-cyan',
  PAID: 'badge-green', CANCELLED: 'badge-red',
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { project, isLoading } = useProjectFull(id)
  useTechDirectory() // primes avatar names/colors
  // Warm the Houses tab's data while the user is still on Overview, so
  // switching tabs never shows a loading state.
  useEffect(() => {
    if (id) import('./housesApi').then(m => m.prefetchHousesForProject(id))
  }, [id])
  // Deep link from the alert banners: ?house=<id> opens the Houses tab with
  // that house's detail modal already open, instead of dropping you on the
  // project and making you find it yourself.
  const deepLinkHouseId = searchParams.get('house')
  const [tab, setTab] = useState<Tab>(deepLinkHouseId ? 'houses' : 'overview')
  const [showEditor, setShowEditor] = useState(false)

  if (isLoading) {
    return (
      <div className="card" style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--t3)' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--t2)', fontWeight: 600 }}>Project not found</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/projects')}>
          <ArrowLeft size={13} /> Back to projects
        </button>
      </div>
    )
  }

  const prog = projectProgress(project)
  const fin = projectFinances(project)
  const statusColor = STATUS_META[project.status].color

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutList },
    ...(project.templateType === 'HOUSING_SCHEME'
      ? [{ key: 'houses' as Tab, label: 'Houses', icon: Home }]
      : []),
    { key: 'roster', label: 'Crew roster', icon: Users2 },
    { key: 'jobs', label: 'Jobs', icon: Wrench, count: project.jobs.length },
    { key: 'agreements', label: 'Agreements', icon: FileSignature, count: project.agreements.length },
    { key: 'finances', label: 'Finances', icon: Wallet },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="anim-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')} aria-label="Back">
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 5, fontSize: 12.5, color: '#94A3B8' }}>
            {project.customerName ? (
              <span>{project.customerName}</span>
            ) : (
              <ProjectCustomerPicker project={project} />
            )}
            {project.siteAddress && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} /> {project.siteAddress}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CalendarRange size={11} /> {fmtDate(project.startDate)} → {fmtDate(project.targetEndDate)}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowEditor(true)}>
          <Pencil size={12} /> Edit
        </button>
      </div>

      {project.templateType === 'HOUSING_SCHEME' && <HouseIssuesAlert projectId={project.id} />}

      {/* Progress + money strip */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(3, 1fr)', gap: 18, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
                {prog.total === 0 ? '—' : `${prog.done}/${prog.total} jobs · ${prog.pct}%`}
              </span>
            </div>
            <ProgressBar pct={prog.pct} color={statusColor} height={8} />
          </div>
          {[
            { label: 'Quoted', value: fmtMoney(fin.quoted) },
            { label: 'Invoiced', value: fmtMoney(fin.invoiced) },
            { label: 'Paid', value: fmtMoney(fin.paid) },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{m.label}</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: '3px 0 0' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          const showAlert = t.key === 'houses' && (project.openIssueCount ?? 0) > 0
          return (
            <button key={t.key} className="btn btn-sm" onClick={() => setTab(t.key)}
              style={active
                ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 6 }
                : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon size={13} /> {t.label}{t.count != null ? ` · ${t.count}` : ''}
              {showAlert && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : 'var(--red)' }} />
              )}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && <OverviewTab project={project} />}
      {tab === 'houses' && (
        <HousesTab
          projectId={project.id}
          projectName={project.name}
          initialOpenHouseId={deepLinkHouseId}
          onInitialHouseConsumed={() => setSearchParams(prev => { prev.delete('house'); return prev }, { replace: true })}
        />
      )}
      {tab === 'roster' && <RosterTab project={project} />}
      {tab === 'jobs' && <JobsTab project={project} />}
      {tab === 'agreements' && <AgreementsTab project={project} />}
      {tab === 'finances' && <FinancesTab project={project} />}

      {showEditor && <ProjectEditorModal project={project} onClose={() => setShowEditor(false)} />}
    </div>
  )
}

// ── Add customer (header, when a project has none) ──────────────────────────
function ProjectCustomerPicker({ project }: { project: Project }) {
  const updateProject = useUpdateProject()
  const [picking, setPicking] = useState(false)
  const { showSuccess, showError } = useToast()

  const pick = async (c: { id: string; firstName: string; lastName: string }) => {
    try {
      await updateProject.mutateAsync({ id: project.id, customerId: c.id })
      showSuccess(`${project.name} is now linked to ${c.firstName} ${c.lastName}.`.trim(), 'Customer added')
      setPicking(false)
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not set this customer', 'Add customer failed')
    }
  }

  if (!picking) {
    return (
      <button
        onClick={() => setPicking(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5,
          color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', padding: 0,
        }}
      >
        <UserPlus size={12} /> No customer assigned — Add customer
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 320, padding: 12, zIndex: 20,
        background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <CustomerPickerWithCreate autoFocus onPick={pick} onCancel={() => setPicking(false)} />
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ project: p }: { project: Project }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>About this project</p>
          <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
            {p.description || 'No description yet.'}
          </p>
          {p.category && (
            <span style={{
              display: 'inline-block', marginTop: 12, fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 999, background: 'var(--bg-card-2)',
              border: '1px solid var(--bd)', color: 'var(--t2)',
            }}>
              {p.category}
            </span>
          )}
        </div>

        {p.notes && (
          <div className="card" style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <StickyNote size={11} /> Site notes
            </p>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{p.notes}</p>
          </div>
        )}

        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <HardHat size={11} /> Base team — default daily crew
            {p.requiredHeadcount != null && (
              <span style={{ marginLeft: 'auto', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
                requires {p.requiredHeadcount}
              </span>
            )}
          </p>
          {p.baseTeamUserIds.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>No base team yet — edit the project to assign one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.baseTeamUserIds.map(id => {
                const t = techById(id)
                if (!t) return null
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                    <TechAvatar userId={id} size={30} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{t.skills.join(' · ')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Schedule</p>
          {[
            ['Working days', p.workingDays.join(' · ')],
            ['Start', fmtDate(p.startDate)],
            ['Target end', fmtDate(p.targetEndDate)],
            ['Budget', fmtMoney(p.budget)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--t3)' }}>{k}</span>
              <span style={{ color: 'var(--t1)', fontWeight: 600, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} /> Site
          </p>
          <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 6px' }}>{p.siteAddress ?? 'No site set'}</p>
          {p.latitude != null && p.longitude != null && (
            <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
              {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)} — pinned on the Day Planner &amp; Dispatch maps
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Crew roster (signature) ───────────────────────────────────────────────────
function RosterTab({ project: p }: { project: Project }) {
  const [weekStart, setWeekStart] = useState(() => new Date())
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [showAddTech, setShowAddTech] = useState(false)
  const updateProject = useUpdateProject()
  const { showSuccess } = useToast()

  const handleTechCreated = ({ userId, name }: { userId: string; name: string }) => {
    // New hires join the project's default crew immediately — future days
    // pick them up automatically; already-overridden days are untouched.
    updateProject.mutate(
      { id: p.id, baseTeamUserIds: [...p.baseTeamUserIds, userId] },
      { onSuccess: () => showSuccess(`${name} joined the base crew for ${p.name}.`, 'Technician Added') },
    )
  }

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i)
      return { date: d, key: toDateKey(d) }
    }), [weekStart])

  const rosterQ = useProjectRoster(p.id, days[0].key, days[6].key)
  const rosterByKey = useMemo(
    () => new Map((rosterQ.data ?? []).map(d => [d.date, d])),
    [rosterQ.data],
  )
  const emptyDay = (key: string): RosterDay => ({ date: key, techUserIds: [], isOverride: false, isOff: false })

  const todayKey = toDateKey(new Date())

  if (p.status !== 'ACTIVE') {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <Moon size={22} style={{ color: 'var(--t4)', marginBottom: 10 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>
          Roster is only active while the project is Active
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '4px 0 0' }}>
          {p.status === 'PLANNING' ? 'Activate the project to start reserving the crew each day.' : 'This project is closed — no crew is reserved.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Daily crew — next 7 days</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '3px 0 0' }}>
              Rostered technicians are <b style={{ color: 'var(--t2)' }}>reserved</b> — they can't be assigned other jobs that day.
              Click a day to swap the crew.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddTech(true)}>
              <UserPlus size={12} /> Add technician
            </button>
            <div style={{ width: 1, background: 'var(--bd)', margin: '2px 2px' }} />
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(d => addDays(d, -7))}>‹ Prev</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(new Date())}>Today</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(d => addDays(d, 7))}>Next ›</button>
          </div>
        </div>

        {/* Week strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 12 }}>
          {days.map(({ date, key }) => {
            const r = rosterByKey.get(key) ?? emptyDay(key)
            const count = r.techUserIds.length
            const short = p.requiredHeadcount != null && count > 0 && count < p.requiredHeadcount
            const isToday = key === todayKey
            const isPast = key < todayKey
            const selected = editingDate === key
            const tone = r.isOff || count === 0 ? 'var(--t4)' : short ? 'var(--amber)' : 'var(--green)'

            return (
              <button
                key={key}
                disabled={isPast}
                onClick={() => setEditingDate(selected ? null : key)}
                style={{
                  textAlign: 'center', padding: '10px 6px 12px', borderRadius: 12, cursor: isPast ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: isPast ? 0.45 : 1,
                  border: selected ? '2px solid var(--blue)' : `1px solid ${isToday ? 'var(--blue)' : 'var(--bd)'}`,
                  background: selected ? 'var(--blue-dim)' : 'var(--bg-card-2)',
                  position: 'relative',
                }}
              >
                {r.isOverride && (
                  <span title="Adjusted for this day" style={{
                    position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--violet)',
                  }} />
                )}
                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--blue)' : 'var(--t4)', letterSpacing: '0.05em' }}>
                  {WEEKDAYS[date.getDay()]}{isToday ? ' · TODAY' : ''}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', margin: '2px 0 8px' }}>{date.getDate()}</div>
                {r.isOff ? (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Moon size={10} /> Day off
                  </div>
                ) : count === 0 ? (
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)' }}>No crew</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                      <AvatarStack userIds={r.techUserIds} max={4} size={22} />
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: tone }}>
                      {count}{p.requiredHeadcount ? `/${p.requiredHeadcount}` : ''}{short ? ' — short' : ''}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {editingDate && (
        <RosterDayEditor
          project={p}
          dateKey={editingDate}
          day={rosterByKey.get(editingDate) ?? emptyDay(editingDate)}
          onClose={() => setEditingDate(null)}
        />
      )}

      <AddTechnicianModal
        isOpen={showAddTech}
        onClose={() => setShowAddTech(false)}
        subtitle={`New hire joins ${p.name}'s base crew — a login account is created and a temporary password is emailed to them.`}
        onCreated={handleTechCreated}
      />
    </div>
  )
}

function RosterDayEditor({ project: p, dateKey, day: r, onClose }: { project: Project; dateKey: string; day: RosterDay; onClose: () => void }) {
  const setDay = useSetRosterDay()
  const { data: techs } = useTechDirectory()
  const short = p.requiredHeadcount != null && !r.isOff && r.techUserIds.length < p.requiredHeadcount
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const available = (techs ?? []).filter(t => !r.techUserIds.includes(t.userId))

  const removeTech = (id: string) => setDay.mutate({ projectId: p.id, date: dateKey, techUserIds: r.techUserIds.filter(x => x !== id) })
  const addTech = (id: string) => setDay.mutate({ projectId: p.id, date: dateKey, techUserIds: [...r.techUserIds, id] })

  return (
    <div className="card anim-fade-up" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={14} style={{ color: 'var(--blue)' }} /> {label}
            {r.isOverride && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--violet-dim)', color: 'var(--violet)' }}>
                ADJUSTED
              </span>
            )}
          </p>
          {short && (
            <p style={{ fontSize: 11.5, color: 'var(--amber)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={11} /> {p.requiredHeadcount! - r.techUserIds.length} below the required crew of {p.requiredHeadcount}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!r.isOff && (
            <button className="btn btn-secondary btn-sm" onClick={() => setDay.mutate({ projectId: p.id, date: dateKey, isOff: true })}>
              <Moon size={11} /> Mark day off
            </button>
          )}
          {r.isOff && (
            <button className="btn btn-secondary btn-sm" onClick={() => setDay.mutate({ projectId: p.id, date: dateKey, reset: true })}>
              Working day
            </button>
          )}
          {r.isOverride && !r.isOff && (
            <button className="btn btn-secondary btn-sm" onClick={() => setDay.mutate({ projectId: p.id, date: dateKey, reset: true })}>
              <RotateCcw size={11} /> Reset to base team
            </button>
          )}
          {setDay.isPending && <Loader2 size={13} className="animate-spin" style={{ color: 'var(--t3)' }} />}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close editor"><X size={13} /></button>
        </div>
      </div>

      {r.isOff ? (
        <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>
          Site closed this day — no crew reserved, everyone is free for normal jobs.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* On the crew */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              On the crew ({r.techUserIds.length})
            </p>
            {r.techUserIds.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>Nobody yet — add technicians from the right.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {r.techUserIds.map(id => {
                  const t = techById(id)
                  const isBase = p.baseTeamUserIds.includes(id)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                      <TechAvatar userId={id} size={26} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{t?.name ?? id}</span>
                        <span style={{ display: 'block', fontSize: 10.5, color: isBase ? 'var(--t4)' : 'var(--violet)' }}>
                          {isBase ? 'Base team' : 'Covering this day'}
                        </span>
                      </span>
                      <button className="btn btn-ghost btn-sm" title="Remove for this day" onClick={() => removeTech(id)}>
                        <X size={12} style={{ color: 'var(--red)' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Available */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Available to add
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {available.map(t => (
                <button key={t.userId} onClick={() => addTech(t.userId)} style={{
                  display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', cursor: 'pointer',
                  padding: '7px 10px', borderRadius: 10, background: 'var(--bg-card)', border: '1px dashed var(--bd)',
                  fontFamily: 'inherit',
                }}>
                  <TechAvatar userId={t.userId} size={26} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{t.name}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)' }}>{t.skills.join(' · ')}</span>
                  </span>
                  <Plus size={13} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PRIORITY_CSS: Record<string, string> = {
  LOW: 'badge-neutral', NORMAL: 'badge-neutral', HIGH: 'badge-amber',
  URGENT: 'badge-red', EMERGENCY: 'badge-red',
}

// ── Jobs ─────────────────────────────────────────────────────────────────────
function JobsTab({ project: p }: { project: Project }) {
  const [showLinker, setShowLinker] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [viewJob, setViewJob] = useState<ProjectJob | null>(null)
  const [openFullJob, setOpenFullJob] = useState(false)
  const linkJob = useLinkJobToProject()

  // Housing Scheme: resolve each job's houseId to a label + owner for display,
  // fetched once for the whole project rather than per job row.
  const housesQ = useHouses(p.templateType === 'HOUSING_SCHEME' ? p.id : undefined)
  const houseById = useMemo(() => {
    const map = new Map<string, House>()
    for (const h of housesQ.data ?? []) map.set(h.id, h)
    return map
  }, [housesQ.data])

  // Customer's jobs not yet in any project — candidates for linking
  const candidatesQ = useQuery({
    queryKey: ['projects', p.id, 'link-candidates'],
    queryFn: async () => {
      const res = await api.get('/jobs/jobs', { params: { customerId: p.customerId, limit: 100 } })
      const rows: any[] = res.data?.data ?? []
      return rows.filter(j => !j.projectId)
    },
    enabled: showLinker,
  })

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Jobs in this project</div>
          <div className="card-subtitle">Discrete billable visits — each still flows through dispatch as usual</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLinker(v => !v)} disabled={!p.customerId}
            title={!p.customerId ? 'Add a customer to this project first' : undefined}>
            <Link2 size={12} /> {showLinker ? 'Close' : 'Link existing'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} disabled={!p.customerId}
            title={!p.customerId ? 'Add a customer to this project first' : undefined}>
            <Plus size={12} /> Create job
          </button>
        </div>
      </div>

      {showLinker && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
            {p.customerName ?? 'This customer'}'s jobs not in a project
          </p>
          {candidatesQ.isLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
          ) : (candidatesQ.data ?? []).length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No unlinked jobs for this customer.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {(candidatesQ.data ?? []).map((j: any) => (
                <button key={j.id} className="btn btn-secondary btn-sm" style={{ justifyContent: 'space-between', width: '100%' }}
                  disabled={linkJob.isPending}
                  onClick={() => linkJob.mutate({ jobId: j.id, projectId: p.id })}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                  <Plus size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {p.jobs.length === 0 ? (
        <p style={{ padding: '28px 20px', fontSize: 13, color: 'var(--t4)', textAlign: 'center' }}>
          No jobs linked yet — link the customer's existing jobs, or set this project on a job when creating it.
        </p>
      ) : (
        <div>
          {p.jobs.map(j => {
            const house = j.houseId ? houseById.get(j.houseId) : undefined
            return (
            <button key={j.id} onClick={() => setViewJob(j)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--bd)',
              width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: 'var(--bg-card-2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wrench size={14} style={{ color: 'var(--t3)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{j.title}</p>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{fmtDate(j.scheduledStart)}{j.assignedToName ? ` · ${j.assignedToName}` : ' · Unassigned'}</span>
                  {house && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
                      color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 999,
                    }}>
                      <Home size={9} /> House {house.label}{house.ownerName ? ` · ${house.ownerName}` : ''}
                    </span>
                  )}
                </p>
              </div>
              <span className={`badge ${JOB_BADGE[j.status] ?? 'badge-neutral'}`}>{j.status.replace('_', ' ')}</span>
              <span title="Unlink from project" onClick={e => { e.stopPropagation(); linkJob.mutate({ jobId: j.id, projectId: null }) }}
                style={{ padding: 6, borderRadius: 8, display: 'flex', opacity: linkJob.isPending ? 0.5 : 1 }}>
                <Unlink size={12} style={{ color: 'var(--t4)' }} />
              </span>
              <ChevronRight size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
            </button>
            )
          })}
        </div>
      )}

      {viewJob && (
        <ProjectJobDetailModal
          job={viewJob}
          house={viewJob.houseId ? houseById.get(viewJob.houseId) : undefined}
          projectName={p.name}
          onClose={() => setViewJob(null)}
          onOpenFull={() => setOpenFullJob(true)}
          onUnlink={() => { linkJob.mutate({ jobId: viewJob.id, projectId: null }); setViewJob(null) }}
          unlinking={linkJob.isPending}
        />
      )}

      {openFullJob && viewJob && (
        <Suspense fallback={null}>
          <JobDetailModal isOpen={openFullJob} onClose={() => setOpenFullJob(false)} job={viewJob as unknown as Job} />
        </Suspense>
      )}

      <CreateJobModal
        isOpen={showCreate && !!p.customerId}
        onClose={() => setShowCreate(false)}
        presetCustomer={p.customerId ? { id: p.customerId, name: p.customerName ?? '—', address: p.siteAddress, lat: p.latitude, lng: p.longitude } : undefined}
        projectId={p.id}
        projectTemplateType={p.templateType}
        contextLabel={p.name}
        onCreated={() => invalidateProjectLinks(p.id)}
      />
    </div>
  )
}

/** A job's full context at a glance — schedule, customer, and (Housing Scheme) which
 * house and owner it's for — with a path into the full generic job modal for actual
 * management (status changes, work orders) rather than duplicating that here. */
function ProjectJobDetailModal({ job, house, projectName, onClose, onOpenFull, onUnlink, unlinking }: {
  job: ProjectJob
  house?: House
  projectName: string
  onClose: () => void
  onOpenFull: () => void
  onUnlink: () => void
  unlinking: boolean
}) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={job.title}
        style={{ width: 620, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wrench size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
              <div className="card-subtitle">{projectName}{job.jobNumber ? ` · ${job.jobNumber}` : ''}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${JOB_BADGE[job.status] ?? 'badge-neutral'}`}>{job.status.replace('_', ' ')}</span>
            {job.priority && <span className={`badge ${PRIORITY_CSS[job.priority] ?? 'badge-neutral'}`}>{job.priority.toLowerCase()}</span>}
          </div>

          <div style={{ padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarClock size={11} /> Schedule
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Date</span>
                <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{fmtDate(job.scheduledStart)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Technician</span>
                <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{job.assignedToName ?? 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <User size={11} /> Customer
            </p>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{job.customerName ?? '—'}</p>
            {job.serviceAddress && (
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={11} /> {job.serviceAddress}
              </p>
            )}
          </div>

          {house && (
            <div style={{ padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--blue)', background: 'var(--blue-dim)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> House
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{house.label}</p>
                  {house.address && <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>{house.address}</p>}
                </div>
                {house.accountStatus && (() => {
                  const m = ACCOUNT_STATUS_META[house.accountStatus]
                  return (
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: m.dim, color: m.color, whiteSpace: 'nowrap' }}>
                      {m.label}
                    </span>
                  )
                })()}
              </div>
              {house.ownerName && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{house.ownerName}</p>
                    {house.ownerEmail && (
                      <p style={{ fontSize: 11, color: 'var(--t3)', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={10} /> {house.ownerEmail}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {job.description && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Description</p>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{job.description}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={onUnlink} disabled={unlinking} style={{ color: 'var(--red)' }}>
            <Unlink size={12} /> {unlinking ? 'Unlinking…' : 'Unlink from project'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenFull}>
            <ExternalLink size={12} /> Open full job
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Agreements ───────────────────────────────────────────────────────────────
function AgreementsTab({ project: p }: { project: Project }) {
  const [showLinker, setShowLinker] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const linkAgreement = useLinkAgreement()

  // Housing Scheme: resolve each agreement's houseId to a label + owner for display.
  const housesQ = useHouses(p.templateType === 'HOUSING_SCHEME' ? p.id : undefined)
  const houseById = useMemo(() => {
    const map = new Map<string, House>()
    for (const h of housesQ.data ?? []) map.set(h.id, h)
    return map
  }, [housesQ.data])

  const candidatesQ = useQuery({
    queryKey: ['projects', p.id, 'agreement-candidates'],
    queryFn: async () => {
      const res = await api.get('/crm/agreements', { params: { customerId: p.customerId, limit: 100 } })
      const rows: any[] = res.data?.data ?? res.data ?? []
      const linked = new Set(p.agreements.map(a => a.id))
      return rows.filter(a => !linked.has(a.id))
    },
    enabled: showLinker,
  })

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Linked agreements</div>
          <div className="card-subtitle">Recurring maintenance stays in Agreements — visits auto-join this project</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLinker(v => !v)} disabled={!p.customerId}
            title={!p.customerId ? 'Add a customer to this project first' : undefined}>
            <Link2 size={12} /> {showLinker ? 'Close' : 'Link existing'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} disabled={!p.customerId}
            title={!p.customerId ? 'Add a customer to this project first' : undefined}>
            <Plus size={12} /> Create agreement
          </button>
        </div>
      </div>

      {showLinker && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
          {candidatesQ.isLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
          ) : (candidatesQ.data ?? []).length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No other agreements for this customer.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {(candidatesQ.data ?? []).map((a: any) => (
                <button key={a.id} className="btn btn-secondary btn-sm" style={{ justifyContent: 'space-between', width: '100%' }}
                  disabled={linkAgreement.isPending}
                  onClick={() => linkAgreement.mutate({ projectId: p.id, agreementId: a.id, link: true })}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <Plus size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {p.agreements.length === 0 ? (
        <p style={{ padding: '28px 20px', fontSize: 13, color: 'var(--t4)', textAlign: 'center' }}>
          No agreements linked — link one to fold its recurring visits into this project.
        </p>
      ) : (
        <div>
          {p.agreements.map(a => {
            const house = a.houseId ? houseById.get(a.houseId) : undefined
            return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: '1px solid var(--bd)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: 'var(--green-dim)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileSignature size={14} style={{ color: 'var(--green)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{a.name}</p>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{a.serviceType} · {a.interval}{a.nextVisit ? ` · next visit ${fmtDate(a.nextVisit)}` : ''}</span>
                  {house && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
                      color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 999,
                    }}>
                      <Home size={9} /> House {house.label}{house.ownerName ? ` · ${house.ownerName}` : ''}
                    </span>
                  )}
                </p>
              </div>
              <span className={`badge ${a.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'}`}>{a.status}</span>
              <button className="btn btn-ghost btn-sm" title="Unlink agreement"
                disabled={linkAgreement.isPending}
                onClick={() => linkAgreement.mutate({ projectId: p.id, agreementId: a.id, link: false })}>
                <Unlink size={12} style={{ color: 'var(--t4)' }} />
              </button>
            </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <AgreementEditorModal
          presetCustomerId={p.customerId ?? undefined}
          presetCustomerName={p.customerName ?? undefined}
          onClose={() => setShowCreate(false)}
          onSaved={(a: Agreement) => {
            linkAgreement.mutate({ projectId: p.id, agreementId: a.id, link: true })
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}

// ── Finances ─────────────────────────────────────────────────────────────────
function FinancesTab({ project: p }: { project: Project }) {
  const fin = projectFinances(p)
  const budget = p.budget ?? 0
  const overBudget = budget > 0 && fin.invoiced > budget
  const budgetPct = budget > 0 ? Math.round((fin.invoiced / budget) * 100) : 0

  const { data: customer } = useCustomer(p.customerId ?? '')
  const presetCustomer = p.customerId ? { id: p.customerId, name: p.customerName ?? '—', email: customer?.email } : undefined

  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)

  // Housing Scheme: resolve each quote/invoice's houseId to a label + owner for display.
  const housesQ = useHouses(p.templateType === 'HOUSING_SCHEME' ? p.id : undefined)
  const houseById = useMemo(() => {
    const map = new Map<string, House>()
    for (const h of housesQ.data ?? []) map.set(h.id, h)
    return map
  }, [housesQ.data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Quoted', value: fin.quoted, tone: 'var(--violet)' },
          { label: 'Invoiced', value: fin.invoiced, tone: 'var(--blue)' },
          { label: 'Paid', value: fin.paid, tone: 'var(--green)' },
          { label: 'Outstanding', value: fin.outstanding, tone: fin.outstanding > 0 ? 'var(--amber)' : 'var(--t3)' },
        ].map(m => (
          <div key={m.label} className="kpi-card">
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: m.tone, margin: '6px 0 0' }}>{fmtMoney(m.value)}</p>
          </div>
        ))}
      </div>

      {budget > 0 && (
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Budget utilisation
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: overBudget ? 'var(--red)' : 'var(--t1)' }}>
              {fmtMoney(fin.invoiced)} of {fmtMoney(budget)} ({budgetPct}%)
            </span>
          </div>
          <ProgressBar pct={budgetPct} color={overBudget ? 'var(--red)' : budgetPct > 85 ? 'var(--amber)' : 'var(--green)'} height={8} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <FinanceList title="Quotes" docs={p.quotes} paidStatus="ACCEPTED" actionLabel="New quote" onAction={() => setShowCreateQuote(true)} disabled={!p.customerId} houseById={houseById} />
        <FinanceList title="Invoices" docs={p.invoices} paidStatus="PAID" actionLabel="New invoice" onAction={() => setShowCreateInvoice(true)} disabled={!p.customerId} houseById={houseById} />
      </div>

      <AddQuoteModal
        isOpen={showCreateQuote}
        onClose={() => setShowCreateQuote(false)}
        presetCustomer={presetCustomer}
        projectId={p.id}
        contextLabel={p.name}
        onCreated={() => invalidateProjectLinks(p.id)}
      />
      <AddInvoiceModal
        isOpen={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        presetCustomer={presetCustomer}
        projectId={p.id}
        contextLabel={p.name}
        onCreated={() => invalidateProjectLinks(p.id)}
      />
    </div>
  )
}

function FinanceList({ title, docs, paidStatus, actionLabel, onAction, disabled, houseById }: {
  title: string; docs: Project['quotes']; paidStatus: string; actionLabel: string; onAction: () => void; disabled?: boolean
  houseById?: Map<string, House>
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div className="card-title">{title}</div>
        <button className="btn btn-primary btn-sm" onClick={onAction} disabled={disabled}
          title={disabled ? 'Add a customer to this project first' : undefined}>
          <Plus size={12} /> {actionLabel}
        </button>
      </div>
      {docs.length === 0 ? (
        <p style={{ padding: '22px 18px', fontSize: 12.5, color: 'var(--t4)', textAlign: 'center' }}>None yet.</p>
      ) : (
        docs.map(d => {
          const house = d.houseId ? houseById?.get(d.houseId) : undefined
          return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--bd)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{d.title}</p>
              <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{d.number} · {fmtDate(d.date)}</span>
                {house && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                    color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 6px', borderRadius: 999,
                  }}>
                    <Home size={8} /> House {house.label}
                  </span>
                )}
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{fmtMoney(d.total)}</span>
            <span className={`badge ${d.status === paidStatus ? 'badge-green' : 'badge-amber'}`}>{d.status}</span>
          </div>
          )
        })
      )}
    </div>
  )
}
