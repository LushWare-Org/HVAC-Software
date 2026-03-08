import React, { useState, useEffect } from 'react'
import {
    DollarSign, Briefcase, Users, CheckCircle,
    ArrowRight, Clock, ChevronLeft, ChevronRight, Eye
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const revenueData = [
    { month: 'Jan', revenue: 52000 },
    { month: 'Feb', revenue: 48000 },
    { month: 'Mar', revenue: 61000 },
    { month: 'Apr', revenue: 57000 },
    { month: 'May', revenue: 65000 },
    { month: 'Jun', revenue: 72000 },
    { month: 'Jul', revenue: 69000 },
    { month: 'Aug', revenue: 75000 },
    { month: 'Sep', revenue: 63000 },
    { month: 'Oct', revenue: 78000 },
    { month: 'Nov', revenue: 84000 },
    { month: 'Dec', revenue: 81000 },
]

const jobStatusData = [
    { name: 'Completed', value: 42 },
    { name: 'In Progress', value: 18 },
    { name: 'Scheduled', value: 8 },
    { name: 'Pending', value: 3 },
]

const JOB_STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280']

const recentJobs = [
    { id: 'JOB-1204', customer: 'Clifford Johnson', service: 'HVAC Maintenance', tech: 'Mike Davis', status: 'in_progress', amount: 385, date: '04 Mar 2025' },
    { id: 'JOB-1203', customer: 'Sarah Williams', service: 'AC Installation', tech: 'Tom Baker', status: 'scheduled', amount: 2400, date: '05 Mar 2025' },
    { id: 'JOB-1202', customer: 'Robert Chen', service: 'Electrical Panel Upgrade', tech: 'Anna Smith', status: 'completed', amount: 1100, date: '03 Mar 2025' },
    { id: 'JOB-1201', customer: 'Maria Garcia', service: 'Plumbing Repair', tech: 'James Lee', status: 'pending', amount: 290, date: '03 Mar 2025' },
    { id: 'JOB-1200', customer: 'Tech Solutions', service: 'Commercial HVAC Service', tech: 'Tom Baker', status: 'invoiced', amount: 4800, date: '02 Mar 2025' },
]

const appointments = [
    { id: 1, date: '2025-03-05', time: '09:00 AM', serviceType: 'HVAC Maintenance', customerName: 'James Carter', assignedTo: 'Mike Davis' },
    { id: 2, date: '2025-03-05', time: '11:30 AM', serviceType: 'AC Installation', customerName: 'Priya Menon', assignedTo: 'Tom Baker' },
    { id: 3, date: '2025-03-06', time: '02:00 PM', serviceType: 'Boiler Service', customerName: 'George Allen', assignedTo: 'Anna Smith' },
    { id: 4, date: '2025-03-07', time: '10:00 AM', serviceType: 'Electrical Inspection', customerName: 'Sandra Lee', assignedTo: 'James Lee' },
]

const techs = [
    { name: 'Mike Davis', role: 'HVAC Lead', status: 'on_job', statusLabel: 'On Job', jobs: 3, rating: 4.8 },
    { name: 'Tom Baker', role: 'HVAC Tech', status: 'en_route', statusLabel: 'En Route', jobs: 2, rating: 4.2 },
    { name: 'Anna Smith', role: 'Electrician', status: 'available', statusLabel: 'Available', jobs: 0, rating: 4.9 },
    { name: 'James Lee', role: 'Plumber', status: 'on_job', statusLabel: 'On Job', jobs: 1, rating: 4.5 },
    { name: 'Chris Park', role: 'HVAC Tech', status: 'available', statusLabel: 'Available', jobs: 0, rating: 4.7 },
]

const STATUS = {
    in_progress: { label: 'In Progress', css: 'badge-blue' },
    scheduled: { label: 'Scheduled', css: 'badge-violet' },
    completed: { label: 'Completed', css: 'badge-green' },
    pending: { label: 'Pending', css: 'badge-amber' },
    invoiced: { label: 'Invoiced', css: 'badge-cyan' },
    cancelled: { label: 'Cancelled', css: 'badge-red' },
}

const TECH_STATUS_CSS: Record<string, string> = {
    on_job: 'badge-blue',
    en_route: 'badge-amber',
    available: 'badge-green'
}

function fmt(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}` }

const statCards: { title: string; value: string; sub: string; icon: React.ElementType; grad: string }[] = [
    {
        title: 'Total Revenue',
        value: '$81,240',
        sub: 'vs $72k last month',
        icon: DollarSign,
        grad: 'kpi-grad-green',
    },
    {
        title: 'Total Jobs',
        value: '71',
        sub: '7 in progress',
        icon: Briefcase,
        grad: 'kpi-grad-blue',
    },
    {
        title: 'Active Customers',
        value: '1,248',
        sub: '34 active leads',
        icon: Users,
        grad: 'kpi-grad-violet',
    },
    {
        title: 'Completion Rate',
        value: '92%',
        sub: 'This month',
        icon: CheckCircle,
        grad: 'kpi-grad-amber',
    },
]

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ fontSize: 12, color: p.color, fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {p.dataKey === 'revenue' ? `$${(p.value / 1000).toFixed(0)}k` : p.value}
                </div>
            ))}
        </div>
    )
}

export default function Dashboard() {
    const [mounted, setMounted] = useState(false)
    const [page, setPage] = useState(1)
    const itemsPerPage = 10

    const totalPages = Math.ceil(recentJobs.length / itemsPerPage)
    const paginatedJobs = recentJobs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    useEffect(() => { setMounted(true) }, [])

    return (
        <div className="anim-fade-up">
            <div className="kpi-grid mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div key={index} className={`kpi-card card-hover anim-fade-up delay-${index + 1}`} style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
                            <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{stat.title}</div>
                                <Icon size={16} strokeWidth={1.5} color="var(--t3)" />
                            </div>
                            <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{stat.value}</div>
                        </div>
                    )
                })}
            </div>


            <div className="grid-2 mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Revenue Area Chart */}
                <div className="card card-hover anim-fade-up delay-2">
                    <div className="card-header mb-4">
                        <div>
                            <div className="card-title">Revenue Overview</div>
                        </div>
                        <div className="flex gap-2">
                            <span className="badge badge-neutral">This Year</span>
                        </div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 0 }}>
                        <div className="chart-wrap" style={{ height: 260 }}>
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#635bff" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fill: 'var(--t4)', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `$${v / 1000}k`}
                                            domain={[0, 'auto']}
                                        />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            stroke="#635bff"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#gradRevenue)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#635bff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Status Chart */}
                <div className="card card-hover anim-fade-up delay-3">
                    <div className="card-header mb-4">
                        <div>
                            <div className="card-title">Job Status</div>
                            <div className="card-subtitle">Current month · 71 total</div>
                        </div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 0 }}>
                        <div style={{ height: 180 }}>
                            {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={jobStatusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={52}
                                            outerRadius={72}
                                            paddingAngle={5}
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="var(--bg-card)"
                                        >
                                            {jobStatusData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={JOB_STATUS_COLORS[index % JOB_STATUS_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'var(--bg-card-2)',
                                                border: '1px solid var(--bd-md)',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 12 }}>
                            {jobStatusData.map((item, index) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: JOB_STATUS_COLORS[index],
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span className="text-sm text-3" style={{ flex: 1, fontSize: 11 }}>{item.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Jobs Table */}
            <div className="card card-hover mb-5 anim-fade-up delay-3">
                <div className="card-header">
                    <div>
                        <div className="card-title">Recent Jobs</div>
                        <div className="card-subtitle">Latest work orders across all technicians</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            View All <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
                <div className="card-body-flush mt-4">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Job</th>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Technician</th>
                                    <th>Status</th>
                                    <th className="text-right">Amount</th>
                                    <th style={{ textAlign: 'center', width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedJobs.map(j => {
                                    const s = STATUS[j.status as keyof typeof STATUS]
                                    return (
                                        <tr key={j.id}>
                                            <td><span className="td-mono td-primary">{j.id}</span></td>
                                            <td>
                                                <div className="cell-user">
                                                    <div>
                                                        <span className="cell-name">{j.customer}</span>
                                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>{j.date}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{j.service}</td>
                                            <td>{j.tech}</td>
                                            <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                                            <td className="td-primary font-600">{fmt(j.amount)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Job Details">
                                                    <Eye size={14} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <span className="text-[13px] text-[var(--t3)]">
                        Showing {recentJobs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, recentJobs.length)} of {recentJobs.length} jobs
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                            style={{ width: 32, height: 32 }}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[13px] text-[var(--t2)] mx-2">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                            style={{ width: 32, height: 32 }}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid-2 mb-5 anim-fade-up delay-4">
                {/* Left */}
                <div className="card card-hover">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Field Team</div>
                            <div className="card-subtitle">Real-time status · 3 active now</div>
                        </div>
                    </div>
                    <div className="card-body-flush mt-3 px-2">
                        {techs.map(t => (
                            <div key={t.name} className="tech-row hover:bg-[var(--bg-hover)] rounded-lg px-2 py-3 transition-colors border-b border-[var(--bd-md)]/30 last:border-0 mb-1">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-600 text-1 truncate">{t.name}</span>
                                        <span className="text-[10px] text-amber-500 font-700">★ {t.rating}</span>
                                    </div>
                                    <div className="text-[11px] text-3 capitalize">{t.role} · {t.jobs} jobs today</div>
                                </div>
                                <span className={`badge ${TECH_STATUS_CSS[t.status]} text-[10px] py-0.5 px-2`}>
                                    {t.statusLabel}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right*/} 
                <div className="card card-hover">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Upcoming Appointments</div>
                            <div className="card-subtitle">Next scheduled visits</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue)' }}>
                            View Calendar <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="card-body mt-3">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {appointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '10px 12px',
                                        borderRadius: 'var(--r-lg)',
                                        background: 'var(--bg-hover)',
                                        transition: 'background var(--dur-fast)',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                >
                                    <div style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 'var(--r-md)',
                                        background: 'var(--blue-dim)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {new Date(apt.date).toLocaleDateString('en-GB', { month: 'short' })}
                                        </span>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)', lineHeight: 1.1 }}>
                                            {new Date(apt.date).getDate()}
                                        </span>
                                    </div>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {apt.serviceType}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>{apt.customerName}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={11} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                                            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{apt.time}</span>
                                            <span style={{ fontSize: 11, color: 'var(--t4)' }}>·</span>
                                            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{apt.assignedTo}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
