/**
 * Operations dashboard: what is happening today and what needs a person now.
 * Charts and long-range numbers live on Analytics; this page is for acting.
 * Every colour comes from the theme variables, so light, dark and black all work.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Briefcase, Plus, CheckCircle2, AlertTriangle, ArrowUpRight, Navigation, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../hooks/useSettings'
import { useJobs } from '../hooks/useJobs'
import { useTechnicians, useDispatchWebSocket, useAllTechAssignments, type DispatchEvent } from '../hooks/useScheduling'
import { useToast } from '../contexts/ToastContext'
import { describeLiveEvent, type JobRef } from './scheduling/liveToasts'
import { useRescheduleInbox } from '../hooks/useReschedule'
import { useQuotes } from '../hooks/useFinance'
import { useLeads } from '../hooks/useCustomers'
import { usePendingTechnicians } from '../hooks/useTeam'
import { useDashboardMoney, useUpcomingAppointments } from '../hooks/useDashboard'
import { formatMoney } from '../lib/format'
import RecommendationsPanel from '../components/RecommendationsPanel'
import MorningBrief from './dashboard/MorningBrief'
import RunningBehind from './dashboard/RunningBehind'
import ComponentIssuesAlert from '../components/ComponentIssuesAlert'
import AddJobModal from './jobs/AddJobModal'
import type { Job, Technician } from '../types/api'
import { ago, buildAttention, buildLiveMoves, buildStages, buildTechRows, clock, minutesSince, todaysJobs, type LiveMove, type StageKey, type TechState } from './dashboard/opsData'

const LiveMovesMap = lazy(() => import('./dashboard/LiveMovesMap'))

const MONEY_ROLES = new Set(['super_admin', 'company_admin', 'office_manager'])
/** Roles the analytics brief endpoint serves. */
const BRIEF_ROLES = new Set(['super_admin', 'company_admin', 'office_manager', 'dispatcher'])

const STAGE_TONE: Record<StageKey, { bg: string; fg: string }> = {
    DONE: { bg: 'var(--green-dim)', fg: 'var(--green)' },
    ON_SITE: { bg: 'var(--amber-dim)', fg: 'var(--amber)' },
    EN_ROUTE: { bg: 'var(--cyan-dim)', fg: 'var(--cyan)' },
    SCHEDULED: { bg: 'var(--violet-dim)', fg: 'var(--violet)' },
    UNASSIGNED: { bg: 'var(--bg-card-2)', fg: 'var(--t2)' },
}

const TECH_TONE: Record<TechState, { dot: string; label: string }> = {
    LATE: { dot: 'var(--red)', label: 'Late' },
    ON_SITE: { dot: 'var(--amber)', label: 'On site' },
    EN_ROUTE: { dot: 'var(--cyan)', label: 'En route' },
    NEXT: { dot: 'var(--violet)', label: 'Scheduled' },
    FREE: { dot: 'var(--green)', label: 'Free' },
    OFFLINE: { dot: 'var(--t4)', label: 'Offline' },
}

function useNow(intervalMs = 60_000) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), intervalMs)
        return () => window.clearInterval(id)
    }, [intervalMs])
    return now
}

function Panel({ title, meta, link, children, className = '' }: { title: string; meta?: string; link?: { to: string; label: string }; children: React.ReactNode; className?: string }) {
    return (
        <section className={`ops-panel ${className}`} aria-label={title}>
            <header className="ops-panel-head">
                <h2>{title}</h2>
                {meta && <span className="ops-meta">{meta}</span>}
                {link && <Link to={link.to} className="ops-link">{link.label}<ArrowUpRight size={14} aria-hidden="true" /></Link>}
            </header>
            {children}
        </section>
    )
}

/** "14:00" today, "Tue 09:30" another day. */
function visitWhen(iso: string, now: Date): string {
    const d = new Date(iso)
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay ? clock(iso) : `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${clock(iso)}`
}

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string | number }) {
    return <div className="ops-skeleton" style={{ height: h, width: w }} />
}

/** A GPS fix older than this is called out: the position on the map may be stale. */
const GPS_STALE_S = 5 * 60

function LiveNow({ moves }: { moves: LiveMove[] }) {
    // Its own clock: "GPS 20s ago" needs to tick faster than the page's minute.
    const now = useNow(10_000)
    const driving = moves.filter(m => m.state === 'EN_ROUTE').length
    const onSite = moves.length - driving
    return (
        <Panel
            title="Live now"
            meta={[driving && `${driving} driving`, onSite && `${onSite} on site`].filter(Boolean).join(', ')}
            link={{ to: '/scheduling', label: 'Open board' }}
            className="ops-live-panel"
        >
            <div className="ops-live-grid">
                <ul className="ops-live-list">
                    {moves.map(m => {
                        const mins = minutesSince(m.since, now)
                        const age = m.gpsAt ? Math.max(0, Math.round((now.getTime() - new Date(m.gpsAt).getTime()) / 1000)) : null
                        const stale = age === null || age > GPS_STALE_S
                        return (
                            <li key={m.techId}>
                                <Link to="/scheduling?view=active" className="ops-live-row">
                                    <span className={`ops-live-icon ${m.state === 'EN_ROUTE' ? 'is-driving' : 'is-onsite'}`} aria-hidden="true">
                                        {m.state === 'EN_ROUTE' ? <Navigation size={15} /> : <Wrench size={15} />}
                                    </span>
                                    <span className="ops-live-body">
                                        <span className="ops-live-line">
                                            <strong>{m.name}</strong>
                                            <span className={`ops-live-chip ${m.state === 'EN_ROUTE' ? 'is-driving' : 'is-onsite'}`}>{m.state === 'EN_ROUTE' ? 'En route' : 'On site'}</span>
                                        </span>
                                        <span className="ops-live-job">{m.job.jobNumber}{m.job.customer ? `, ${m.job.customer}` : ''}</span>
                                        <span className="ops-live-meta">
                                            {m.state === 'EN_ROUTE'
                                                ? <>{m.distanceKm !== null ? `${m.distanceKm < 1 ? `${Math.round(m.distanceKm * 1000)} m` : `${m.distanceKm.toFixed(1)} km`} away, about ${m.etaMin} min` : 'Distance unknown'}{mins !== null ? `. Left ${mins} min ago` : ''}</>
                                                : <>{mins !== null ? `Working for ${mins} min` : 'Working'}</>}
                                        </span>
                                        <span className={`ops-live-gps${stale ? ' is-stale' : ''}`}>{age === null ? 'No GPS signal yet' : `GPS ${ago(age)}`}</span>
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
                <Suspense fallback={<div className="ops-live-map ops-skeleton" />}>
                    <LiveMovesMap moves={moves} />
                </Suspense>
            </div>
        </Panel>
    )
}

export default function Dashboard() {
    const now = useNow()
    const { user } = useAuth()
    const showMoney = MONEY_ROLES.has(String(user?.role ?? '').toLowerCase())
    const toast = useToast()
    // Changes made by others (a technician in the field, another dispatcher)
    // announce themselves here too. jobsRef is read at event time so the toast
    // can name a job the payload did not describe.
    const jobsRef = useRef<Record<string, JobRef>>({})
    const recentToasts = useRef<Map<string, number>>(new Map())
    const onLiveEvent = useCallback((event: DispatchEvent) => {
        const t = describeLiveEvent(event, user?.id, (id) => jobsRef.current[id])
        if (!t) return
        const at = Date.now()
        const last = recentToasts.current.get(t.key)
        if (last && at - last < 5_000) return
        recentToasts.current.set(t.key, at)
        toast.showToast({ title: t.title, message: t.message, variant: t.variant, durationMs: 6_000 })
    }, [toast, user?.id])
    useDispatchWebSocket(onLiveEvent)
    const [showNewJob, setShowNewJob] = useState(false)

    const company = useCompany().data
    const jobsQuery = useJobs({ limit: 200 })
    const techQuery = useTechnicians()
    const reschedules = useRescheduleInbox().data?.meta?.total ?? 0
    const agingQuotes = useQuotes({ pendingAging: true, limit: 1 }).data?.total ?? 0
    const newLeads = useLeads({ status: 'NEW', limit: 1 }).data?.total ?? 0
    const pendingTechs = usePendingTechnicians().data?.total ?? 0
    const moneyQuery = useDashboardMoney(showMoney)
    const appointments = useUpcomingAppointments(12).data?.data

    const jobs: Job[] = jobsQuery.data?.data ?? []
    // The appointments feed can include visits that already started; show only what's ahead.
    const nextVisits = (appointments ?? []).filter(v => new Date(v.scheduledStart).getTime() >= now.getTime() - 30 * 60_000)
    const techs: Technician[] = techQuery.data ?? []
    const techIds = useMemo(() => techs.map(t => t.id), [techs])
    const assignments = useAllTechAssignments(techIds).data
    const moves = useMemo(() => buildLiveMoves(jobs, techs, assignments ?? []), [jobs, techs, assignments])
    useEffect(() => {
        jobsRef.current = Object.fromEntries(jobs.map(j => [j.id, { jobNumber: j.jobNumber, title: j.title }]))
    }, [jobs])
    const today = useMemo(() => todaysJobs(jobs, now), [jobs, now])
    const stages = useMemo(() => buildStages(today), [today])
    const lateCount = useMemo(() => buildTechRows(techs, today, now).filter(r => r.state === 'LATE').length, [techs, today, now])
    const techRows = useMemo(() => buildTechRows(techs, today, now), [techs, today, now])
    const money = moneyQuery.data
    const attention = useMemo(() => buildAttention({
        jobs, now, reschedules, agingQuotes, newLeads, pendingTechs,
        overdueCount: showMoney ? money?.overdueCount : undefined,
        overdueAmountLabel: showMoney && money ? formatMoney(money.overdueAmount, { decimals: 0 }) : undefined,
    }), [jobs, now, reschedules, agingQuotes, newLeads, pendingTechs, showMoney, money])

    const working = techRows.filter(r => r.state !== 'OFFLINE').length
    const total = stages.reduce((s, x) => s + x.count, 0)

    return (
        <div className="ops anim-fade-up">
            <ComponentIssuesAlert />
            {BRIEF_ROLES.has(String(user?.role ?? '').toLowerCase()) && <RunningBehind />}
            {BRIEF_ROLES.has(String(user?.role ?? '').toLowerCase()) && <MorningBrief />}

            <section aria-label="Today" className="ops-panel ops-today">
            <header className="ops-top">
                <div>
                    <h1>Today</h1>
                    <p className="ops-meta">
                        <span className="ops-live" aria-hidden="true" />
                        {company?.name ? `${company.name}, ` : ''}live, updated {clock(now.toISOString())}
                    </p>
                </div>
                <nav className="ops-actions" aria-label="Quick actions">
                    <Link to="/scheduling" className="ops-btn"><CalendarDays size={16} aria-hidden="true" />Scheduling</Link>
                    <Link to="/jobs" className="ops-btn"><Briefcase size={16} aria-hidden="true" />All jobs</Link>
                    <button type="button" onClick={() => setShowNewJob(true)} className="ops-btn ops-btn-primary"><Plus size={16} aria-hidden="true" />New job</button>
                </nav>
            </header>

            <div className="ops-stages-wrap">
                {jobsQuery.isLoading ? <Skeleton h={64} /> : total === 0 ? (
                    <div className="ops-empty-row">No jobs scheduled for today. <Link to="/scheduling" className="ops-link">Plan the day</Link></div>
                ) : (
                    <div className="ops-stages">
                        {stages.filter(s => s.count > 0).map(s => (
                            <Link
                                key={s.key} to={s.href}
                                className={`ops-stage${s.key === 'UNASSIGNED' ? ' ops-stage-open' : ''}`}
                                style={{ flexGrow: s.count, background: STAGE_TONE[s.key].bg }}
                            >
                                <span className="ops-stage-n" style={{ color: STAGE_TONE[s.key].fg }}>{s.count}</span>
                                <span className="ops-stage-l">{s.label}</span>
                            </Link>
                        ))}
                    </div>
                )}
                <p className="ops-meta">
                    {total} {total === 1 ? 'job' : 'jobs'} today{lateCount ? `, ${lateCount} running late` : ''}{total ? '. Select a stage to open those jobs.' : '.'}
                </p>
            </div>
            </section>

            {moves.length > 0 && <LiveNow moves={moves} />}

            <div className="ops-grid">
                <Panel title="Needs attention" meta={attention.length ? String(attention.length) : undefined} className="ops-attention">
                    {jobsQuery.isLoading ? (
                        <div className="ops-list"><Skeleton h={56} /><Skeleton h={56} /><Skeleton h={56} /></div>
                    ) : attention.length === 0 ? (
                        <div className="ops-caught-up"><CheckCircle2 size={22} aria-hidden="true" /><div><strong>You're all caught up.</strong><span>Nothing is waiting on you right now.</span></div></div>
                    ) : (
                        <ul className="ops-list">
                            {attention.map(item => (
                                <li key={item.id} className={`ops-item${item.tone === 'urgent' ? ' ops-item-urgent' : ''}`}>
                                    {item.tone === 'urgent' && <AlertTriangle size={16} className="ops-item-icon" aria-hidden="true" />}
                                    <div className="ops-item-body">
                                        <span className="ops-item-kind">{item.kind}</span>
                                        <strong>{item.title}</strong>
                                        <span className="ops-item-detail">{item.detail}</span>
                                    </div>
                                    {item.tel
                                        ? <a href={`tel:${item.tel}`} className="ops-btn ops-btn-sm">{item.action}</a>
                                        : <Link to={item.href} className={`ops-btn ops-btn-sm${item.action === 'Assign' ? ' ops-btn-primary' : ''}`}>{item.action}</Link>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <div className="ops-side">
                    <Panel title="Technicians" meta={techs.length ? `${working} working` : undefined} link={{ to: '/scheduling', label: 'Live map' }}>
                        {techQuery.isLoading ? <div className="ops-list"><Skeleton /><Skeleton /><Skeleton /></div> : techRows.length === 0 ? (
                            <p className="ops-meta">No technicians yet. <Link to="/team" className="ops-link">Add one</Link></p>
                        ) : (
                            <ul className="ops-techs">
                                {techRows.map(r => (
                                    <li key={r.id}>
                                        <Link to="/scheduling" className="ops-tech">
                                            <span className="ops-dot" style={{ background: TECH_TONE[r.state].dot }} aria-hidden="true" />
                                            <span className="ops-tech-name">{r.name}</span>
                                            <span className="ops-tech-detail">{r.detail}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel title="Next visits" link={{ to: '/scheduling?view=calendar', label: 'Calendar' }}>
                        {nextVisits.length === 0 ? <p className="ops-meta">No upcoming visits booked.</p> : (
                            <ul className="ops-visits">
                                {nextVisits.slice(0, 4).map(v => (
                                    <li key={v.id}>
                                        <span className="ops-visit-time">{visitWhen(v.scheduledStart, now)}</span>
                                        <span className="ops-visit-body"><strong>{v.customerName}</strong><span>{v.serviceType ?? 'Visit'}{v.technicianName ? `, ${v.technicianName}` : ''}</span></span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>
            </div>

            {showMoney && (
                <section aria-label="Money" className="ops-money">
                    {[
                        { label: 'Collected today', value: money?.collectedToday, to: '/finance?tab=invoices&status=PAID' },
                        { label: 'Collected this week', value: money?.collectedThisWeek, to: '/finance?tab=invoices&status=PAID' },
                        { label: 'Outstanding', value: money?.outstanding, to: '/finance?tab=invoices' },
                        { label: money?.overdueCount ? `Overdue, ${money.overdueCount} ${money.overdueCount === 1 ? 'invoice' : 'invoices'}` : 'Overdue', value: money?.overdueAmount, to: '/finance?tab=invoices&status=OVERDUE', alert: !!money?.overdueCount },
                    ].map(m => (
                        <Link key={m.label} to={m.to} className="ops-money-cell">
                            <span className="ops-meta">{m.label}</span>
                            {moneyQuery.isLoading ? <Skeleton h={26} w="60%" /> : moneyQuery.isError ? <span className="ops-meta">Unavailable</span> : (
                                <span className={`ops-money-v${m.alert ? ' ops-money-alert' : ''}`}>{formatMoney(m.value ?? 0, { decimals: 0 })}</span>
                            )}
                        </Link>
                    ))}
                </section>
            )}

            <RecommendationsPanel limit={3} />
            <AddJobModal isOpen={showNewJob} onClose={() => setShowNewJob(false)} />
        </div>
    )
}
