import { useState } from 'react'
import { BarChart3, DollarSign, Wrench, TrendingUp, ChevronLeft, ChevronRight, Search, Maximize2, Minimize2, Filter } from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const CURRENT_YEAR = new Date().getFullYear();
const RECENT_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 9 + i);

const JOB_STATUS = [
    { name: 'Completed', value: 45 },
    { name: 'In Progress', value: 25 },
    { name: 'Scheduled', value: 20 },
    { name: 'Cancelled', value: 10 },
]

const SERVICE_CATEGORIES = [
    { name: 'AC Repair', value: 35 },
    { name: 'Installation', value: 30 },
    { name: 'Maintenance', value: 25 },
    { name: 'Commercial', value: 10 },
]

const CUSTOMER_ACQ = RECENT_YEARS.map((year, i) => ({
    year: year.toString(),
    new: 120 + (i * 45) + Math.floor((year % 6) * 5),
    returning: 80 + (i * 50) + Math.floor((year % 3) * 8),
}))

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const TECHS = [
    { name: 'Mike Davis', color: '#3B82F6', jobs: 24, rev: 18400, rating: 4.9, cmplt: 96 },
    { name: 'Tom Baker', color: '#3B82F6', jobs: 21, rev: 16200, rating: 4.7, cmplt: 91 },
    { name: 'Anna Smith', color: '#3B82F6', jobs: 18, rev: 13100, rating: 4.8, cmplt: 94 },
    { name: 'James Lee', color: '#3B82F6', jobs: 14, rev: 9800, rating: 4.6, cmplt: 88 },
    { name: 'Chris Park', color: '#3B82F6', jobs: 10, rev: 7200, rating: 4.5, cmplt: 83 },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const generateDayWiseData = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const baseRevenue = 45 + (month * 2)
    const baseJobs = 42 + (month * 2)
    
    return Array.from({ length: daysInMonth }, (_, day) => ({
        m: `Day ${day + 1}`,
        rev: baseRevenue + Math.floor(Math.random() * 15 - 5),
        jobs: baseJobs + Math.floor(Math.random() * 12 - 4),
    }))
}

const generateYearlyData = (year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return monthNames.map((month, idx) => ({
        m: month,
        rev: 45 + (idx * 4) + Math.floor((year % 5) * 2),
        jobs: 42 + (idx * 3) + Math.floor((year % 4) * 2),
    }))
}

const ChartTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {p.name === 'Revenue ($k)' ? `$${p.value}k` : p.value}
                </div>
            ))}
        </div>
    )
}

export default function Analytics() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [sortBy, setSortBy] = useState('revenue')
    const [revViewFull, setRevViewFull] = useState<'monthly' | 'yearly'>('monthly')
    const [revYearFull, setRevYearFull] = useState(CURRENT_YEAR.toString())
    const [revMonthFull, setRevMonthFull] = useState('0')
    const [trendView, setTrendView] = useState<'monthly' | 'yearly'>('monthly')
    const [trendYear, setTrendYear] = useState(CURRENT_YEAR.toString())
    const [trendMonth, setTrendMonth] = useState('0')
    const itemsPerPage = 10

    let filteredTechs = TECHS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

    filteredTechs.sort((a, b) => {
        if (sortBy === 'revenue') return b.rev - a.rev
        if (sortBy === 'jobs') return b.jobs - a.jobs
        if (sortBy === 'rating') return b.rating - a.rating
        if (sortBy === 'completion') return b.cmplt - a.cmplt
        return 0
    })

    const totalPages = Math.ceil(filteredTechs.length / itemsPerPage)
    const paginatedTechs = filteredTechs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const getRevenueData = (view: string, month: string | number, year: string) => {
        if (view === 'yearly') {
            return generateYearlyData(parseInt(year))
        }
        return generateDayWiseData(parseInt(month as string), parseInt(year))
    }

    return (
        <div className="anim-fade-up">

            {!isExpanded && (
                <>
                    {/* KPIs */}
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: DollarSign, g: 'kpi-grad-green', v: '$404,940', l: 'Total Revenue', sub: '12-month total', delta: '+22%', up: true },
                            { icon: Wrench, g: 'kpi-grad-blue', v: '358', l: 'Jobs Completed', sub: 'Across all trades', delta: '+18%', up: true },
                            { icon: TrendingUp, g: 'kpi-grad-violet', v: '+22%', l: 'Revenue Growth', sub: 'vs same period', delta: '↑', up: true },
                            { icon: BarChart3, g: 'kpi-grad-amber', v: '$1,131', l: 'Avg Rev / Job', sub: 'Labour + parts', delta: '+8.2%', up: true },
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

                    {/* Revenue Chart */}
                    <div className="card card-hover anim-fade-up delay-1 mb-5">
                        <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                            <div className="card-title text-[15px]">Revenue Overview (Full Width)</div>
                            <div className="flex gap-2 items-center">
                                <select
                                    className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                    style={{ minWidth: 120 }}
                                    value={revViewFull}
                                    onChange={e => setRevViewFull(e.target.value as any)}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                {revViewFull === 'monthly' && (
                                    <select
                                        className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                        style={{ minWidth: 100 }}
                                        value={revMonthFull}
                                        onChange={e => setRevMonthFull(e.target.value)}
                                    >
                                        {MONTHS.map((month, idx) => (
                                            <option key={idx} value={idx}>{month}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                    style={{ minWidth: 80 }}
                                    value={revYearFull}
                                    onChange={e => setRevYearFull(e.target.value)}
                                >
                                    {[...RECENT_YEARS].reverse().map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="card-body" style={{ paddingTop: 0 }}>
                            <div style={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getRevenueData(revViewFull, revMonthFull, revYearFull)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="m" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                                        <Tooltip content={<ChartTip />} />
                                        <Area type="monotone" dataKey="rev" name="Revenue ($k)" stroke="#3B82F6" strokeWidth={2} fill="url(#gRev)" dot={false} activeDot={{ r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 mt-2 justify-center">
                                {[{ c: '#3B82F6', l: 'Revenue' }].map(i => (
                                    <div key={i.l} className="flex items-center gap-1.5">
                                        <div style={{ width: 12, height: 4, background: i.c, borderRadius: 2 }} />
                                        <span className="text-xs font-semibold text-[var(--t3)]">{i.l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* Revenue & Jobs Chart */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                                <div className="card-title text-[15px]">Revenue & Jobs</div>
                                <div className="flex gap-2 items-center">
                                    <select
                                        className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                        style={{ minWidth: 120 }}
                                        value={trendView}
                                        onChange={e => setTrendView(e.target.value as any)}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    {trendView === 'monthly' && (
                                        <select
                                            className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                            style={{ minWidth: 100 }}
                                            value={trendMonth}
                                            onChange={e => setTrendMonth(e.target.value)}
                                        >
                                            {MONTHS.map((month, idx) => (
                                                <option key={idx} value={idx}>{month}</option>
                                            ))}
                                        </select>
                                    )}
                                    <select
                                        className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                                        style={{ minWidth: 80 }}
                                        value={trendYear}
                                        onChange={e => setTrendYear(e.target.value)}
                                    >
                                        {[...RECENT_YEARS].reverse().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="card-body">
                                <div style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={getRevenueData(trendView, trendMonth, trendYear)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRevSmall" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                </linearGradient>
                                                <linearGradient id="gJobSmall" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="m" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                                            <Tooltip content={<ChartTip />} />
                                            <Area type="monotone" dataKey="rev" name="Revenue ($k)" stroke="#3B82F6" strokeWidth={2} fill="url(#gRevSmall)" dot={false} activeDot={{ r: 4 }} />
                                            <Area type="monotone" dataKey="jobs" name="Jobs" stroke="#10B981" strokeWidth={2} fill="url(#gJobSmall)" dot={false} activeDot={{ r: 4 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-4 mt-4 justify-center">
                                    {[{ c: '#3B82F6', l: 'Revenue' }, { c: '#10B981', l: 'Jobs' }].map(i => (
                                        <div key={i.l} className="flex items-center gap-1.5">
                                            <div style={{ width: 12, height: 4, background: i.c, borderRadius: 2 }} />
                                            <span className="text-xs font-semibold text-[var(--t3)]">{i.l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Job Status Chart */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Job Status Distribution</div>
                            </div>
                            <div className="card-body">
                                <div style={{ height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={JOB_STATUS}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {JOB_STATUS.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
                                    {JOB_STATUS.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between bg-[var(--bg-card-2)] p-2 rounded-[var(--r-sm)]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                                <span className="text-[11px] font-medium text-[var(--t2)] truncate">{item.name}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-[var(--t1)]">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0 flex justify-between items-center">
                                <div className="card-title text-[15px]">Customer Acquisition</div>
                            </div>
                            <div className="card-body">
                                <div style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={CUSTOMER_ACQ} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="year" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--bg-hover)' }} />
                                            <Bar dataKey="new" name="New Customers" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Bar dataKey="returning" name="Returning" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, color: 'var(--t3)' }} iconType="circle" iconSize={8} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Service Categories Chart */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Service Categories</div>
                            </div>
                            <div className="card-body flex flex-col justify-center">
                                <div style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={SERVICE_CATEGORIES}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={85}
                                                dataKey="value"
                                                stroke="none"
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    return (
                                                        <text x={x} y={y} fill="var(--t1)" fontSize={11} fontWeight={600} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                            {`${name} ${(percent * 100).toFixed(0)}%`}
                                                        </text>
                                                    );
                                                }}
                                                labelLine={false}
                                            >
                                                {SERVICE_CATEGORIES.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Technician Leaderboard */}
            <div className="card card-hover anim-fade-up delay-3">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                    <div className="filter-bar">
                        <div className="filter-search">
                            <Search size={13} color="var(--t4)" />
                            <input placeholder="Search technicians..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <select className="select" style={{ width: 140 }} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                            <option value="revenue">Sort: Revenue</option>
                            <option value="jobs">Sort: Jobs</option>
                            <option value="rating">Sort: Rating</option>
                            <option value="completion">Sort: Completion</option>
                        </select>
                        <button className="btn btn-secondary btn-sm"><Filter size={12} /> More Filters</button>
                        <button className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse View" : "Expand View"}>
                            {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                        </button>
                    </div>
                </div>
                <div className="card-body-flush mt-2">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>Rank</th><th>Technician</th><th>Jobs</th><th>Revenue</th><th>Rating</th><th>Completion</th></tr>
                            </thead>
                            <tbody>
                                {paginatedTechs.map((t, i) => {
                                    const rank = (page - 1) * itemsPerPage + i
                                    return (
                                        <tr key={t.name}>
                                            <td>
                                                <span style={{ fontSize: 16 }}>{rank + 1}</span>
                                            </td>
                                            <td>
                                                <div className="cell-user">
                                                    <span className="cell-name">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="td-primary">{t.jobs}</td>
                                            <td className="td-primary font-600">${t.rev.toLocaleString()}</td>
                                            <td>
                                                <span style={{ color: 'var(--amber)', fontWeight: 700 }}>★ {t.rating}</span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="progress flex-1" style={{ maxWidth: 100 }}>
                                                        <div className="progress-fill" style={{ width: `${t.cmplt}%`, background: '#3B82F6' }} />
                                                    </div>
                                                    <span className="text-xs text-3">{t.cmplt}%</span>
                                                </div>
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
                        Showing {filteredTechs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredTechs.length)} of {filteredTechs.length} technicians
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
        </div>
    )
}
