import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, addDays, subDays } from 'date-fns'
import { CalendarDays, MapPin, Users, Zap, Plus, ChevronLeft, ChevronRight, Search, Edit2, Navigation, MessageSquare } from 'lucide-react'
import { SchedulingCalendar } from './components/SchedulingCalendar'
import { LiveMap } from './components/LiveMap'
import { AddScheduleModal } from './components/AddScheduleModal'

const TECHS = [
    { name: 'Mike Davis', color: '#3B82F6', role: 'HVAC Lead', status: 'on-job', statusLabel: 'On Job', jobs: 3, nextAvailable: '2:30 PM', area: 'North Zone', currentJob: 'JOB-1204' },
    { name: 'Tom Baker', color: '#10B981', role: 'HVAC Tech', status: 'en-route', statusLabel: 'En Route', jobs: 2, nextAvailable: '1:45 PM', area: 'Central', currentJob: 'JOB-1203' },
    { name: 'Anna Smith', color: '#8B5CF6', role: 'Electrician', status: 'available', statusLabel: 'Available', jobs: 1, nextAvailable: 'Now', area: 'West End', currentJob: '—' },
    { name: 'James Lee', color: '#F59E0B', role: 'Plumber', status: 'on-job', statusLabel: 'On Job', jobs: 2, nextAvailable: '4:15 PM', area: 'South Side', currentJob: 'JOB-1201' },
    { name: 'Chris Park', color: '#06B6D4', role: 'HVAC Tech', status: 'available', statusLabel: 'Available', jobs: 0, nextAvailable: 'Now', area: 'Central', currentJob: '—' },
]

const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm']

const SCHEDULES: Record<string, Record<string, { start: number; span: number; label: string; id: string }[]>> = {
    '2026-03-08': {
        'Mike Davis': [
            { start: 0, span: 2, label: 'JOB-1204 · HVAC Maint.', id: '1204' },
            { start: 4, span: 3, label: 'JOB-1200 · Furnace Repr.', id: '1200' },
        ],
        'Tom Baker': [
            { start: 2, span: 3, label: 'JOB-1203 · AC Install', id: '1203' },
            { start: 6, span: 2, label: 'JOB-1199 · Comm. HVAC', id: '1199' },
        ],
        'Anna Smith': [
            { start: 3, span: 2, label: 'JOB-1202 · Panel Upgrade', id: '1202' },
        ],
        'James Lee': [
            { start: 0, span: 1, label: 'JOB-1201 · Plumbing', id: '1201' },
            { start: 4, span: 2, label: 'JOB-1198 · Drain Clear', id: '1198' },
        ],
        'Chris Park': [],
    },
    '2026-03-07': {
        'Mike Davis': [
            { start: 1, span: 4, label: 'JOB-1180 · Full Install', id: '1180' },
        ],
        'Tom Baker': [
            { start: 0, span: 2, label: 'JOB-1181 · Inspection', id: '1181' },
            { start: 4, span: 2, label: 'JOB-1182 · Leak Repr.', id: '1182' },
        ],
        'Chris Park': [
            { start: 2, span: 2, label: 'JOB-1185 · Filter Swap', id: '1185' },
        ],
    },
    '2026-03-09': {
        'Mike Davis': [
            { start: 2, span: 3, label: 'JOB-1250 · Duct Clean', id: '1250' },
        ],
        'Anna Smith': [
            { start: 0, span: 2, label: 'JOB-1251 · EV Charger', id: '1251' },
            { start: 5, span: 2, label: 'JOB-1252 · Rewiring', id: '1252' },
        ],
    }
}


export default function Scheduling() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [techSearch, setTechSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const mainView = (searchParams.get('view') as any) || 'dispatch';
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTechForAdd, setSelectedTechForAdd] = useState('');
    const [selectedTimeForAdd, setSelectedTimeForAdd] = useState('');

    const filteredTechs = TECHS.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
            t.role.toLowerCase().includes(techSearch.toLowerCase());
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
    const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    useEffect(() => {
        const handleViewChange = (e: any) => {
            setSearchParams({ view: e.detail });
        };

        window.addEventListener('changeSchedulingView', handleViewChange);
        return () => window.removeEventListener('changeSchedulingView', handleViewChange);
    }, [setSearchParams]);

    return (
        <div className="anim-fade-up">
            {mainView === 'dispatch' && (
                <>
                    {/* KPIs */}
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: Users, c: 'kpi-icon-blue', v: '5/5', l: 'Technicians Active', sub: '3 on jobs now' },
                            { icon: CalendarDays, c: 'kpi-icon-green', v: '12', l: 'Jobs Scheduled Today', sub: '8 remaining' },
                            { icon: Zap, c: 'kpi-icon-amber', v: '28min', l: 'Avg Response Time', sub: '↓4min vs last wk' },
                            { icon: MapPin, c: 'kpi-icon-violet', v: '92%', l: 'Route Efficiency', sub: 'PostGIS optimized' },
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
                        {/* Dispatch Board */}
                        <div className="card card-hover shadow-sm border-[var(--bd)] overflow-hidden">
                            <div className="card-header border-b border-[var(--bd)]/50 pb-4 relative">
                                <div className="flex-1">
                                    <div className="card-title text-base flex items-center gap-2">
                                        Dispatch Board
                                    </div>
                                    <div className="card-subtitle">Real-time scheduling overview</div>
                                </div>

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
                                    <button
                                        className="px-4 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                        onClick={handleToday}
                                    >
                                        Today
                                    </button>
                                </div>

                                <div className="flex-1 flex justify-end gap-2 items-center">
                                    <button className="btn btn-primary btn-sm ml-2 bg-blue-600 hover:bg-blue-700 border-none px-4"><Plus size={14} /> Assign Job</button>
                                </div>
                            </div>
                            <div className="card-body" style={{ overflowX: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(10, 1fr)', gap: 3, marginBottom: 4 }}>
                                    <div />
                                    {HOURS.map(h => (
                                        <div key={h} style={{ fontSize: 10, color: 'var(--t4)', textAlign: 'center', fontWeight: 600, padding: '4px 0' }}>{h}</div>
                                    ))}
                                </div>
                                <div className="divider" style={{ margin: '0 0 6px' }} />
                                {TECHS.map(tech => {
                                    const dateKey = format(currentDate, 'yyyy-MM-dd')
                                    const dayJobs = SCHEDULES[dateKey] ?? {}
                                    const jobs = dayJobs[tech.name] ?? []
                                    const occupied: Record<number, { label: string; span: number; color: string } | null> = {}
                                    jobs.forEach(j => {
                                        occupied[j.start] = { label: j.label, span: j.span, color: tech.color }
                                        for (let i = j.start + 1; i < j.start + j.span; i++) occupied[i] = null
                                    })

                                    return (
                                        <div key={tech.name} style={{ display: 'grid', gridTemplateColumns: '150px repeat(10, 1fr)', gap: 3, marginBottom: 3, alignItems: 'center' }}>
                                            <div className="flex items-center gap-2" style={{ padding: '0 4px' }}>
                                                <div className="min-w-0">
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech.name}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>{tech.role}</div>
                                                </div>
                                            </div>

                                            {Array.from({ length: 10 }, (_, col) => {
                                                if (occupied[col] === null) return null
                                                const job = occupied[col]
                                                if (job) {
                                                    const jobId = jobs.find(j => j.label === job.label)?.id
                                                    return (
                                                        <div key={col} style={{ gridColumn: `span ${job.span}` }}>
                                                            <div
                                                                className="dispatch-job cursor-pointer"
                                                                style={{ background: job.color + '28', border: `1px solid ${job.color}55`, color: job.color }}
                                                                title={job.label}
                                                                onClick={() => {
                                                                    const schedule = {
                                                                        id: jobId,
                                                                        label: job.label,
                                                                        techName: tech.name,
                                                                        role: tech.role,
                                                                        serviceArea: tech.area,
                                                                        nextAvailable: tech.nextAvailable,
                                                                        status: 'scheduled',
                                                                    };
                                                                    window.dispatchEvent(new CustomEvent("open-scheduling-detail", { detail: schedule }));
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
                                                            setSelectedTechForAdd(tech.name);
                                                            const hour = 8 + col;
                                                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                                                            setSelectedTimeForAdd(timeStr);
                                                            setShowAddModal(true);
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

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
                                    <select
                                        className="select"
                                        style={{ width: 160 }}
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="available">Available</option>
                                        <option value="en-route">En Route</option>
                                        <option value="on-job">On Job</option>
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
                                                <th style={{ textAlign: 'left' }}>Current Job</th>
                                                <th style={{ textAlign: 'left' }}>Service Area</th>
                                                <th style={{ textAlign: 'left' }}>Next Available</th>
                                                <th style={{ textAlign: 'center' }}>Jobs Today</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTechs.map(t => (
                                                <tr
                                                    key={t.name}
                                                    onClick={() => window.dispatchEvent(new CustomEvent("open-technician-detail", { detail: t }))}
                                                    className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                                >
                                                    <td>
                                                        <div className="cell-user">
                                                            <div className="flex flex-col">
                                                                <span className="cell-name">{t.name}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-sm font-medium text-[var(--t2)]">{t.role}</td>
                                                    <td>
                                                        <span className={`badge ${t.status === 'available' ? 'badge-green' :
                                                            t.status === 'en-route' ? 'badge-amber' :
                                                                'badge-blue'
                                                            }`}>
                                                            {t.statusLabel}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`text-xs font-bold ${t.currentJob !== '—' ? 'text-[var(--t2)] px-2 py-1 rounded' : 'text-[var(--t4)]'}`}>
                                                            {t.currentJob}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-neutral text-[10px] uppercase tracking-wider">{t.area}</span>
                                                    </td>
                                                    <td className="text-xs font-semibold text-[var(--t2)]">
                                                        {t.nextAvailable}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-[var(--t1)] px-2 py-0.5 text-xs font-bold">{t.jobs}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="flex gap-1 justify-end">
                                                            <button onClick={() => window.dispatchEvent(new CustomEvent("open-technician-detail", { detail: t }))} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Technician">
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {mainView === 'calendar' && <SchedulingCalendar schedules={SCHEDULES} techs={TECHS} />}
            {mainView === 'map' && <LiveMap />}

            <AddScheduleModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                date={currentDate}
                techs={TECHS}
                initialTech={selectedTechForAdd}
                initialTime={selectedTimeForAdd}
            />
        </div>
    );
}
