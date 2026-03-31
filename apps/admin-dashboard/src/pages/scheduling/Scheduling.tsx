import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import {
    CalendarDays, MapPin, Users, Zap, Plus,
    ChevronLeft, ChevronRight, Search, Edit2, Navigation, MessageSquare,
    AlertCircle, RefreshCw, Wifi, WifiOff,
} from 'lucide-react'
import { SchedulingCalendar } from './components/SchedulingCalendar'
import { LiveMap } from './components/LiveMap'
import { AddScheduleModal } from './components/AddScheduleModal'
import { useTechnicians, useDispatchWebSocket, useAllTechAssignments } from '../../hooks/useScheduling'
import { useJobs } from '../../hooks/useJobs'
import type { Technician } from '../../types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm']

/** Colour palette for technicians (cycled by index when API has no colour) */
const TECH_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#F97316']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 14 }: { h?: number }) {
    return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

function techColor(index: number) {
    return TECH_COLORS[index % TECH_COLORS.length]
}

/** Map backend technician status string → UI labels & badge class */
function techStatusInfo(status?: string): { label: string; css: string; key: string } {
    const s = (status ?? 'AVAILABLE').toUpperCase()
    const map: Record<string, { label: string; css: string; key: string }> = {
        AVAILABLE: { label: 'Available', css: 'badge-green',   key: 'available' },
        ON_JOB:    { label: 'On Job',    css: 'badge-blue',    key: 'on-job'    },
        EN_ROUTE:  { label: 'En Route',  css: 'badge-amber',   key: 'en-route'  },
        OFFLINE:   { label: 'Offline',   css: 'badge-neutral', key: 'offline'   },
        BREAK:     { label: 'On Break',  css: 'badge-neutral', key: 'offline'   },
    }
    return map[s] ?? { label: s.replace(/_/g, ' '), css: 'badge-neutral', key: 'available' }
}

/**
 * Convert a list of DispatchAssignments for a given day into the dispatch-grid shape.
 * Key: technicianId → array of { start (0-based hour slot), span (hours), label, id }
 * Used with assignments from the Go scheduling service.
 */
function buildDispatchMap(assignments: { technicianId: string; jobId: string; scheduledStart?: string; scheduledEnd?: string; status: string; id: string }[], jobTitleMap: Record<string, string> = {}) {
    const map: Record<string, { start: number; span: number; label: string; id: string }[]> = {}
    for (const a of assignments) {
        if (!a.scheduledStart) continue
        const startDt   = new Date(a.scheduledStart)
        const slotStart = Math.max(0, Math.min(9, startDt.getHours() - 8))

        const endDt     = a.scheduledEnd
            ? new Date(a.scheduledEnd)
            : new Date(startDt.getTime() + 3_600_000) // default 1 h

        const durationH = Math.max(1, Math.round((endDt.getTime() - startDt.getTime()) / 3_600_000))
        const slotSpan  = Math.min(durationH, 10 - slotStart)

        const jobTitle = jobTitleMap[a.jobId] || a.jobId
        const label = `${jobTitle} · ${a.status.replace(/_/g, ' ')}`

        if (!map[a.technicianId]) map[a.technicianId] = []
        map[a.technicianId].push({ start: slotStart, span: slotSpan, label, id: a.id })
    }
    return map
}

/** Shape expected by SchedulingCalendar for techs prop */
function adaptTechForCalendar(t: Technician, index: number) {
    const si = techStatusInfo(t.isActive ? 'AVAILABLE' : 'OFFLINE')
    return {
        id:            t.id,
        name:          t.name,
        color:         techColor(index),
        role:          t.skills?.length ? t.skills[0] : 'Technician',
        status:        si.key,
        statusLabel:   si.label,
        jobs:          0,
        nextAvailable: si.key === 'available' ? 'Now' : '—',
        area:          '—',
        currentJob:    '—',
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Scheduling() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [currentDate, setCurrentDate]   = useState(new Date())
    const [techSearch, setTechSearch]     = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showAddModal, setShowAddModal]   = useState(false)
    const [selectedTechIdForAdd, setSelectedTechIdForAdd]   = useState('')
    const [selectedTechForAdd, setSelectedTechForAdd]       = useState('')
    const [selectedTimeForAdd, setSelectedTimeForAdd]       = useState('')

    const mainView = (searchParams.get('view') as any) || 'dispatch'

    // ── API queries ──────────────────────────────────────────────────────────────
    const techsQuery = useTechnicians()
    const techs: Technician[] = techsQuery.data ?? []

    // Pre-load existing assignments for all technicians
    const techIds = useMemo(() => techs.map(t => t.id), [techs])
    const allAssignmentsQuery = useAllTechAssignments(techIds)
    const preloadedAssignments = allAssignmentsQuery.data ?? []

    // Fetch jobs to show titles on the dispatch board
    const jobsQuery = useJobs({ limit: 200 })
    const jobTitleMap = useMemo(() => {
        const m: Record<string, string> = {}
        for (const j of (jobsQuery.data?.data ?? [])) {
            m[j.id] = j.title
        }
        return m
    }, [jobsQuery.data])

    // WebSocket for live dispatch board updates (also pushes ASSIGNMENT_CREATED events)
    const { status: wsStatus, lastEvent } = useDispatchWebSocket()

    // Live WS assignments that arrive after page load
    const [wsAssignments, setWsAssignments] = useState<{ technicianId: string; jobId: string; scheduledStart?: string; scheduledEnd?: string; status: string; id: string }[]>([])

    // Update local assignments when a new ASSIGNMENT_CREATED event arrives
    useEffect(() => {
        if (lastEvent?.type === 'ASSIGNMENT_CREATED' && lastEvent.payload) {
            const p = lastEvent.payload as any
            if (p.technicianId && p.jobId && p.id) {
                setWsAssignments(prev => {
                    // Avoid duplicates
                    if (prev.some(a => a.id === p.id)) return prev
                    return [...prev, p]
                })
            }
        }
    }, [lastEvent])

    // Merge pre-loaded + live WS assignments (de-duplicate by id)
    const allAssignments = (() => {
        const seen = new Set<string>()
        const merged: typeof wsAssignments = []
        for (const a of [...preloadedAssignments, ...wsAssignments]) {
            if (!seen.has(a.id)) { seen.add(a.id); merged.push(a) }
        }
        return merged
    })()

    const dispatchMap = buildDispatchMap(allAssignments, jobTitleMap)

    // ── Derived data ─────────────────────────────────────────────────────────────
    const filteredTechs = techs.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
            (t.skills?.join(' ') ?? '').toLowerCase().includes(techSearch.toLowerCase())
        const si         = techStatusInfo(t.isActive ? 'AVAILABLE' : 'OFFLINE')
        const matchStatus = statusFilter === 'all' || si.key === statusFilter
        return matchSearch && matchStatus
    })

    // Adapted techs for SchedulingCalendar + AddScheduleModal
    const techsForCalendar = techs.map(adaptTechForCalendar)

    // Build schedules map for SchedulingCalendar from assignments
    const calendarSchedules = useMemo(() => {
        const techNameById: Record<string, string> = {}
        techs.forEach(t => { techNameById[t.id] = t.name })

        const result: Record<string, Record<string, { start: number; span: number; label: string; id: string }[]>> = {}
        for (const a of allAssignments) {
            if (!a.scheduledStart) continue
            const dateStr = new Date(a.scheduledStart).toISOString().slice(0, 10)
            const techName = techNameById[a.technicianId] ?? a.technicianId
            const startHour = new Date(a.scheduledStart).getHours() - 8 // offset from 8am
            const endHour = a.scheduledEnd ? new Date(a.scheduledEnd).getHours() - 8 : startHour + 2
            const span = Math.max(1, endHour - startHour)

            if (!result[dateStr]) result[dateStr] = {}
            if (!result[dateStr][techName]) result[dateStr][techName] = []
            result[dateStr][techName].push({
                start: Math.max(0, startHour),
                span,
                label: `Job · ${a.jobId.slice(0, 8)}`,
                id: a.id,
            })
        }
        return result
    }, [allAssignments, techs])

    // KPI counters from live data
    const activeTechs    = techs.filter(t => t.isActive).length
    const onJobTechs     = 0 // cannot determine from static model — would need assignment state
    const todayAssigns   = allAssignments.length
    const pendingAssigns = allAssignments.filter(a => a.status === 'ASSIGNED').length

    // ── Navigation ───────────────────────────────────────────────────────────────
    const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1))
    const handleNextDay = () => setCurrentDate(addDays(currentDate, 1))
    const handleToday   = () => setCurrentDate(new Date())

    useEffect(() => {
        const handler = (e: any) => setSearchParams({ view: e.detail })
        window.addEventListener('changeSchedulingView', handler)
        return () => window.removeEventListener('changeSchedulingView', handler)
    }, [setSearchParams])

    return (
        <div className="anim-fade-up">

            {mainView === 'dispatch' && (
                <>
                    {/* ── Error banners ────────────────────────────────────────────── */}
                    {techsQuery.isError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
                            <AlertCircle size={14} />
                            Failed to load technicians.
                            <button
                                onClick={() => techsQuery.refetch()}
                                style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                            >
                                <RefreshCw size={12} /> Retry
                            </button>
                        </div>
                    )}

                    {/* ── KPI cards ────────────────────────────────────────────────── */}
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: Users,       v: techsQuery.isLoading ? '—' : `${activeTechs}/${techs.length}`, l: 'Technicians Active',  sub: `${onJobTechs} on jobs now` },
                            { icon: CalendarDays, v: String(todayAssigns),                                          l: 'Jobs Scheduled Today', sub: `${pendingAssigns} pending` },
                            { icon: Zap,         v: '—',                                                            l: 'Avg Response Time',   sub: 'Live dispatch' },
                            { icon: MapPin,      v: wsStatus === 'connected' ? 'Live' : 'Offline',                 l: 'Dispatch Status',      sub: wsStatus === 'connected' ? 'WebSocket active' : 'Reconnecting…' },
                        ].map(k => (
                            <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
                                <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.l}</div>
                                    <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                                </div>
                                <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{k.v}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* ── Dispatch Board ───────────────────────────────────────── */}
                        <div className="card card-hover shadow-sm border-[var(--bd)] overflow-hidden">
                            <div className="card-header border-b border-[var(--bd)]/50 pb-4 relative">
                                <div className="flex-1">
                                    <div className="card-title text-base flex items-center gap-2">
                                        Dispatch Board
                                        {wsStatus === 'connected'
                                            ? <Wifi size={13} className="text-green-500" />
                                            : <WifiOff size={13} className="text-[var(--t4)]" />
                                        }
                                    </div>
                                    <div className="card-subtitle">Real-time scheduling overview</div>
                                </div>

                                {/* Date navigation */}
                                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
                                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors group" onClick={handlePrevDay}>
                                        <ChevronLeft size={20} className="text-[var(--t3)] group-hover:text-blue-500" />
                                    </button>
                                    <div className="px-4 text-center min-w-[160px]">
                                        <span className="text-sm font-bold text-[var(--t1)]">{format(currentDate, 'MMMM d, yyyy')}</span>
                                    </div>
                                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors group" onClick={handleNextDay}>
                                        <ChevronRight size={20} className="text-[var(--t3)] group-hover:text-blue-500" />
                                    </button>
                                    <div className="w-px h-6 bg-[var(--bd)] mx-2" />
                                    <button className="px-4 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors" onClick={handleToday}>
                                        Today
                                    </button>
                                </div>

                                <div className="flex-1 flex justify-end gap-2 items-center">
                                    <button className="btn btn-primary btn-sm ml-2 bg-blue-600 hover:bg-blue-700 border-none px-4" onClick={() => setShowAddModal(true)}>
                                        <Plus size={14} /> Assign Job
                                    </button>
                                </div>
                            </div>

                            <div className="card-body" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                              <div style={{ minWidth: 900 }}>
                                {/* Hour headers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(10, 1fr)', gap: 3, marginBottom: 4 }}>
                                    <div />
                                    {HOURS.map(h => (
                                        <div key={h} style={{ fontSize: 10, color: 'var(--t4)', textAlign: 'center', fontWeight: 600, padding: '4px 0' }}>{h}</div>
                                    ))}
                                </div>
                                <div className="divider" style={{ margin: '0 0 6px' }} />

                                {/* Loading skeleton */}
                                {techsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px repeat(10, 1fr)', gap: 3, marginBottom: 3 }}>
                                        <div><Skeleton h={36} /></div>
                                        {Array.from({ length: 10 }).map((_, j) => <div key={j}><Skeleton h={36} /></div>)}
                                    </div>
                                ))}

                                {/* Technician rows */}
                                {!techsQuery.isLoading && techs.map((tech, techIdx) => {
                                    const color    = techColor(techIdx)
                                    const techJobs = dispatchMap[tech.id] ?? []
                                    const occupied: Record<number, { label: string; span: number } | null> = {}
                                    techJobs.forEach(j => {
                                        occupied[j.start] = { label: j.label, span: j.span }
                                        for (let i = j.start + 1; i < j.start + j.span; i++) occupied[i] = null
                                    })

                                    return (
                                        <div key={tech.id} style={{ display: 'grid', gridTemplateColumns: '150px repeat(10, 1fr)', gap: 3, marginBottom: 3, alignItems: 'center' }}>
                                            <div className="flex items-center gap-2" style={{ padding: '0 4px' }}>
                                                <div className="min-w-0">
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech.name}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>{tech.skills?.[0] ?? 'Technician'}</div>
                                                </div>
                                            </div>

                                            {Array.from({ length: 10 }, (_, col) => {
                                                if (occupied[col] === null) return null
                                                const job = occupied[col]
                                                if (job) {
                                                    const apptId = techJobs.find(j => j.label === job.label)?.id
                                                    return (
                                                        <div key={col} style={{ gridColumn: `span ${job.span}` }}>
                                                            <div
                                                                className="dispatch-job cursor-pointer"
                                                                style={{ background: color + '28', border: `1px solid ${color}55`, color }}
                                                                title={job.label}
                                                                onClick={() => {
                                                                    window.dispatchEvent(new CustomEvent('open-scheduling-detail', {
                                                                        detail: {
                                                                            id:          apptId,
                                                                            label:       job.label,
                                                                            techName:    tech.name,
                                                                            role:        tech.skills?.[0] ?? 'Technician',
                                                                            status:      'scheduled',
                                                                        },
                                                                    }))
                                                                }}
                                                            >
                                                                {job.label}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div
                                                        key={col}
                                                        className="dispatch-slot cursor-pointer hover:bg-blue-500/10 transition-colors"
                                                        title="Click to schedule"
                                                        onClick={() => {
                                                            setSelectedTechIdForAdd(tech.id)
                                                            setSelectedTechForAdd(tech.name)
                                                            setSelectedTimeForAdd(`${String(8 + col).padStart(2, '0')}:00`)
                                                            setShowAddModal(true)
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    )
                                })}

                                {!techsQuery.isLoading && techs.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-icon"><Users size={22} /></div>
                                        <div className="empty-title">No technicians found</div>
                                    </div>
                                )}
                              </div>
                            </div>
                        </div>

                        {/* ── Technician Table ─────────────────────────────────────── */}
                        <div className="card anim-fade-in mb-5">
                            <div className="card-body" style={{ paddingBottom: 0 }}>
                                <div className="filter-bar">
                                    <div className="filter-search">
                                        <Search size={13} color="var(--t4)" />
                                        <input
                                            placeholder="Search team..."
                                            value={techSearch}
                                            onChange={e => setTechSearch(e.target.value)}
                                        />
                                    </div>
                                    <select className="select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                        <option value="all">All Status</option>
                                        <option value="available">Available</option>
                                        <option value="en-route">En Route</option>
                                        <option value="on-job">On Job</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button className="btn btn-primary btn-sm"><Plus size={12} /> Add Technician</button>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body-flush">
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left' }}>Technician</th>
                                                <th style={{ textAlign: 'left' }}>Primary Role</th>
                                                <th style={{ textAlign: 'left' }}>Current Status</th>
                                                <th style={{ textAlign: 'center' }}>Active Jobs</th>
                                                <th style={{ textAlign: 'center' }}>Rating</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {techsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
                                                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                            ))}
                                            {!techsQuery.isLoading && filteredTechs.map(t => {
                                                const si = techStatusInfo(t.isActive ? 'AVAILABLE' : 'OFFLINE')
                                                return (
                                                    <tr
                                                        key={t.id}
                                                        onClick={() => window.dispatchEvent(new CustomEvent('open-technician-detail', { detail: t }))}
                                                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                                    >
                                                        <td>
                                                            <div className="cell-user">
                                                                <div className="flex flex-col">
                                                                    <span className="cell-name">{t.name}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-sm font-medium text-[var(--t2)]">{t.skills?.length ? t.skills[0] : '—'}</td>
                                                        <td>
                                                            <span className={`badge ${si.css}`}>{si.label}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="text-[var(--t1)] px-2 py-0.5 text-xs font-bold">{t.maxDailyJobs}</span>
                                                        </td>
                                                        <td className="text-center">
                                                            {t.rating != null
                                                                ? <span style={{ color: 'var(--amber)', fontWeight: 700 }}>★ {t.rating.toFixed(1)}</span>
                                                                : <span className="text-[var(--t4)]">—</span>
                                                            }
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="flex gap-1 justify-end">
                                                                <button onClick={() => window.dispatchEvent(new CustomEvent('open-technician-detail', { detail: t }))} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Technician">
                                                                    <Edit2 size={14} strokeWidth={2.5} />
                                                                </button>
                                                                <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="Track on Map">
                                                                    <Navigation size={14} strokeWidth={2.5} />
                                                                </button>
                                                                <button className="p-2 hover:bg-violet-50 rounded-lg text-violet-600 transition-colors" title="Send Message">
                                                                    <MessageSquare size={14} strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {!techsQuery.isLoading && filteredTechs.length === 0 && (
                                                <tr>
                                                    <td colSpan={6}>
                                                        <div className="empty-state">
                                                            <div className="empty-icon"><Users size={22} /></div>
                                                            <div className="empty-title">No technicians match your filters</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {mainView === 'calendar' && <SchedulingCalendar schedules={calendarSchedules} techs={techsForCalendar} />}
            {mainView === 'map'      && <LiveMap />}

            <AddScheduleModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                date={currentDate}
                techs={techs.map(t => ({ id: t.id, name: t.name }))}
                initialTechId={selectedTechIdForAdd}
                initialTech={selectedTechForAdd}
                initialTime={selectedTimeForAdd}
            />
        </div>
    )
}
