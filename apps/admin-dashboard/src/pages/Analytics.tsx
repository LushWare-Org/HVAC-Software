import { useState } from 'react'
import {
    BarChart3, DollarSign, Wrench, TrendingUp, Users,
    ChevronLeft, ChevronRight, Search, Maximize2, Minimize2,
    Filter, AlertCircle, RefreshCw, CheckCircle, XCircle,
    PauseCircle, Star, MapPin, Trophy,
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
    useAnalyticsKpis,
    useRevenueSeries,
    useJobsByStatus,
    useTechLeaderboard,
    useCustomerAcquisition,
    useRevenueByCategory,
    useRevenueSummary,
    useJobsByTrade,
    useJobTrends,
    useJobCompletionRates,
    useTopJobs,
} from '../hooks/useAnalytics'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const RECENT_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 9 + i)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899']

const JOB_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed', INVOICED: 'Invoiced', PAID: 'Paid',
    CANCELLED: 'Cancelled', ON_HOLD: 'On Hold',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 14 }: { h?: number }) {
    return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

function fmt$(v: number) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
    return `$${v.toLocaleString()}`
}

function chartDateRange(view: 'monthly' | 'yearly', month: string, year: string) {
    const yr = parseInt(year)
    const mo = parseInt(month)
    if (view === 'yearly') {
        return { granularity: 'month' as const, from: `${yr}-01-01`, to: `${yr}-12-31` }
    }
    const lastDay = new Date(yr, mo + 1, 0).getDate()
    const mm = String(mo + 1).padStart(2, '0')
    return {
        granularity: 'day' as const,
        from: `${yr}-${mm}-01`,
        to:   `${yr}-${mm}-${String(lastDay).padStart(2, '0')}`,
    }
}

function defaultYearRange() {
    const yr = CURRENT_YEAR
    return { from: `${yr}-01-01`, to: `${yr}-12-31` }
}

const ChartTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? fmt$(p.value) : p.value}
                </div>
            ))}
        </div>
    )
}

// Semi-circle gauge
function Gauge({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
    const r = 42, cx = 56, cy = 56
    const circ = Math.PI * r
    const dash = (pct / 100) * circ
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={112} height={64} viewBox="0 0 112 64">
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--bg-hover)" strokeWidth={10} strokeLinecap="round" />
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`} />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--t1)" fontSize={17} fontWeight={700}>{pct}%</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--t3)" fontSize={10}>{label}</text>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{sub}</span>
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Analytics() {
    const [page, setPage]         = useState(1)
    const [search, setSearch]     = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [sortBy, setSortBy]     = useState('revenue')

    // Revenue Overview controls
    const [revViewFull, setRevViewFull]   = useState<'monthly' | 'yearly'>('monthly')
    const [revYearFull, setRevYearFull]   = useState(CURRENT_YEAR.toString())
    const [revMonthFull, setRevMonthFull] = useState(String(new Date().getMonth()))

    // Revenue & Jobs small chart controls
    const [trendView, setTrendView]   = useState<'monthly' | 'yearly'>('monthly')
    const [trendYear, setTrendYear]   = useState(CURRENT_YEAR.toString())
    const [trendMonth, setTrendMonth] = useState(String(new Date().getMonth()))

    // Job Trends controls
    const [jobTrendGran, setJobTrendGran] = useState<'day'|'week'|'month'>('week')

    const itemsPerPage = 10

    // ── API queries ──────────────────────────────────────────────────────────────
    const kpiQuery = useAnalyticsKpis()
    const kpis     = kpiQuery.data

    const revRange       = chartDateRange(revViewFull, revMonthFull, revYearFull)
    const revSeriesQuery = useRevenueSeries(revRange.granularity, revRange.from, revRange.to)

    const trendRange       = chartDateRange(trendView, trendMonth, trendYear)
    const trendSeriesQuery = useRevenueSeries(trendRange.granularity, trendRange.from, trendRange.to)

    const yearRange = defaultYearRange()

    const jobStatusQuery     = useJobsByStatus()
    const acquisitionQuery   = useCustomerAcquisition()
    const leaderboardQuery   = useTechLeaderboard(100)
    const categoryQuery      = useRevenueByCategory()
    const revSummaryQuery    = useRevenueSummary(yearRange.from, yearRange.to)
    const jobsByTradeQuery   = useJobsByTrade(yearRange.from, yearRange.to)
    const jobTrendsQuery     = useJobTrends(jobTrendGran, yearRange.from, yearRange.to)
    const completionQuery    = useJobCompletionRates(yearRange.from, yearRange.to)
    const topJobsQuery       = useTopJobs(5, yearRange.from, yearRange.to)

    // ── Derived data ─────────────────────────────────────────────────────────────
    const revChartData = (revSeriesQuery.data ?? []).map(d => ({
        m:    d.period,
        rev:  Math.round(d.revenue),
        jobs: d.invoiceCount ?? d.jobCount ?? 0,
    }))

    const trendChartData = (trendSeriesQuery.data ?? []).map(d => ({
        m:    d.period,
        rev:  Math.round(d.revenue),
        jobs: d.invoiceCount ?? d.jobCount ?? 0,
    }))

    const jobStatusData = (jobStatusQuery.data ?? []).map(d => ({
        name:  JOB_STATUS_LABELS[d.status] ?? d.status,
        value: d.count,
    }))

    const acquisitionData = (acquisitionQuery.data ?? []).map(d => ({
        year:      d.period,
        new:       d.newCustomers,
        returning: d.returningCustomers,
    }))

    const serviceCategoryData = (categoryQuery.data ?? []).map(d => ({
        name:  d.category,
        value: d.percentage,
    }))

    const tradeData = (jobsByTradeQuery.data ?? []).map(d => ({
        name:     d.tradeType,
        jobs:     d.jobCount,
        revenue:  d.revenue,
        rating:   d.avgRating,
        complete: d.completionRate,
    }))

    const jobTrendData = (jobTrendsQuery.data ?? []).map(d => ({
        period:    d.period,
        created:   d.created,
        completed: d.completed,
        cancelled: d.cancelled,
    }))

    const rs = revSummaryQuery.data
    const cr = completionQuery.data

    // Leaderboard filter + sort
    const allTechs     = leaderboardQuery.data ?? []
    let filteredTechs  = allTechs.filter(t =>
        (t.technicianName ?? '').toLowerCase().includes(search.toLowerCase())
    )
    filteredTechs = [...filteredTechs].sort((a, b) => {
        if (sortBy === 'revenue')    return b.totalRevenue - a.totalRevenue
        if (sortBy === 'jobs')       return b.jobsCompleted - a.jobsCompleted
        if (sortBy === 'rating')     return (b.avgRating ?? 0) - (a.avgRating ?? 0)
        if (sortBy === 'completion') return (b.completionRate ?? 0) - (a.completionRate ?? 0)
        return 0
    })
    const totalPages     = Math.max(1, Math.ceil(filteredTechs.length / itemsPerPage))
    const paginatedTechs = filteredTechs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const avgRevPerJob = kpis && kpis.jobsCompleted.value > 0
        ? fmt$(Math.round(kpis.revenue.value / kpis.jobsCompleted.value))
        : '—'

    return (
        <div className="anim-fade-up">

            {!isExpanded && (
                <>
                    {/* ── KPI cards ─────────────────────────────────────────────── */}
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: DollarSign, v: kpis?.revenue.formattedValue ?? '—',                                                           l: 'Total Revenue',   trend: kpis?.revenue.trend,        loading: kpiQuery.isLoading },
                            { icon: Wrench,     v: kpis?.jobsCompleted.formattedValue ?? '—',                                                      l: 'Jobs Completed',  trend: kpis?.jobsCompleted.trend,  loading: kpiQuery.isLoading },
                            { icon: TrendingUp, v: kpis?.revenue.trend != null ? `${kpis.revenue.trend > 0 ? '+' : ''}${kpis.revenue.trend}%` : '—', l: 'Revenue Growth',  trend: undefined,                  loading: kpiQuery.isLoading },
                            { icon: BarChart3,  v: avgRevPerJob,                                                                                    l: 'Avg Rev / Job',   trend: undefined,                  loading: kpiQuery.isLoading },
                            { icon: Users,      v: kpis?.activeCustomers.formattedValue ?? '—',                                                     l: 'Active Customers',trend: undefined,                  loading: kpiQuery.isLoading },
                            { icon: Star,       v: kpis?.avgRating.value && kpis.avgRating.value > 0 ? `${kpis.avgRating.value.toFixed(1)}/5` : '—', l: 'Avg Rating',      trend: undefined,                  loading: kpiQuery.isLoading },
                        ].map(k => (
                            <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500 }}>{k.l}</div>
                                    <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                                </div>
                                {k.loading ? <Skeleton h={28} /> : (
                                    <>
                                        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{k.v}</div>
                                        {k.trend != null && (
                                            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: k.trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                {k.trend >= 0 ? '▲' : '▼'} {Math.abs(k.trend)}% vs prior period
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Revenue Summary strip ──────────────────────────────────── */}
                    <div className="card card-hover anim-fade-up delay-1 mb-5">
                        <div className="card-header pb-2 border-b-0 flex justify-between items-center">
                            <div className="card-title text-[15px]">Revenue Summary — {CURRENT_YEAR}</div>
                        </div>
                        <div className="card-body">
                            {revSummaryQuery.isLoading ? <Skeleton h={90} /> : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                                    {[
                                        { label: 'Collected',       value: rs?.collected ?? 0,       color: 'var(--green)', icon: CheckCircle },
                                        { label: 'Outstanding',     value: rs?.outstanding ?? 0,     color: 'var(--amber)', icon: PauseCircle },
                                        { label: 'Overdue',         value: rs?.overdue ?? 0,         color: 'var(--red)',   icon: AlertCircle },
                                        { label: 'Total Invoiced',  value: rs?.totalInvoiced ?? 0,   color: 'var(--blue)',  icon: DollarSign  },
                                        { label: 'Collection Rate', value: null,                     color: rs && rs.collectionRate >= 80 ? 'var(--green)' : 'var(--amber)', icon: TrendingUp, pct: rs?.collectionRate },
                                    ].map(item => (
                                        <div key={item.label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--r-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <item.icon size={13} color={item.color} />
                                                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{item.label}</span>
                                            </div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>
                                                {item.pct != null ? `${item.pct}%` : fmt$(item.value!)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Revenue Overview (full width) ──────────────────────────── */}
                    <div className="card card-hover anim-fade-up delay-1 mb-5">
                        <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                            <div className="card-title text-[15px]">Revenue Overview</div>
                            <div className="flex gap-2 items-center">
                                <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 120 }}
                                    value={revViewFull} onChange={e => setRevViewFull(e.target.value as any)}>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                {revViewFull === 'monthly' && (
                                    <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 100 }}
                                        value={revMonthFull} onChange={e => setRevMonthFull(e.target.value)}>
                                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                    </select>
                                )}
                                <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 80 }}
                                    value={revYearFull} onChange={e => setRevYearFull(e.target.value)}>
                                    {[...RECENT_YEARS].reverse().map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="card-body" style={{ paddingTop: 0 }}>
                            {revSeriesQuery.isLoading ? <Skeleton h={280} /> : revChartData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--t4)]">
                                    <BarChart3 size={32} />
                                    <span className="text-sm">No revenue data for this period</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                                        <AreaChart data={revChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="m" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt$(v)} />
                                            <Tooltip content={<ChartTip />} />
                                            <Area type="monotone" dataKey="rev" name="Revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#gRev)" dot={false} activeDot={{ r: 4 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ── Job Volume Trends (full width) ─────────────────────────── */}
                    <div className="card card-hover anim-fade-up delay-2 mb-5">
                        <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                            <div>
                                <div className="card-title text-[15px]">Job Volume Trends — {CURRENT_YEAR}</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>Created, completed and cancelled jobs over time</div>
                            </div>
                            <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 100 }}
                                value={jobTrendGran} onChange={e => setJobTrendGran(e.target.value as any)}>
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                            </select>
                        </div>
                        <div className="card-body" style={{ paddingTop: 0 }}>
                            {jobTrendsQuery.isLoading ? <Skeleton h={260} /> : jobTrendData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--t4)]">
                                    <Wrench size={30} />
                                    <span className="text-sm">No job trend data for this period</span>
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={260} minWidth={0}>
                                            <AreaChart data={jobTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                    </linearGradient>
                                                    <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                                                    </linearGradient>
                                                    <linearGradient id="gCancelled" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis dataKey="period" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTip />} />
                                                <Area type="monotone" dataKey="created"   name="Created"   stroke="#3B82F6" strokeWidth={2} fill="url(#gCreated)"   dot={false} activeDot={{ r: 4 }} />
                                                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2} fill="url(#gCompleted)" dot={false} activeDot={{ r: 4 }} />
                                                <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#EF4444" strokeWidth={1.5} fill="url(#gCancelled)" dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    <div className="flex gap-5 mt-3 justify-center">
                                        {[{ c: '#3B82F6', l: 'Created' }, { c: '#10B981', l: 'Completed' }, { c: '#EF4444', l: 'Cancelled' }].map(i => (
                                            <div key={i.l} className="flex items-center gap-1.5">
                                                <div style={{ width: 12, height: 4, background: i.c, borderRadius: 2 }} />
                                                <span className="text-xs font-semibold text-[var(--t3)]">{i.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Row: Revenue & Jobs | Job Status Distribution ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                                <div className="card-title text-[15px]">Revenue & Jobs</div>
                                <div className="flex gap-2 items-center">
                                    <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 120 }}
                                        value={trendView} onChange={e => setTrendView(e.target.value as any)}>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    {trendView === 'monthly' && (
                                        <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 100 }}
                                            value={trendMonth} onChange={e => setTrendMonth(e.target.value)}>
                                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                        </select>
                                    )}
                                    <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 80 }}
                                        value={trendYear} onChange={e => setTrendYear(e.target.value)}>
                                        {[...RECENT_YEARS].reverse().map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="card-body">
                                {trendSeriesQuery.isLoading ? <Skeleton h={280} /> : (
                                    <ResponsiveContainer width="100%" height={280} minWidth={0}>
                                            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                                <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt$(v)} />
                                                <Tooltip content={<ChartTip />} />
                                                <Area type="monotone" dataKey="rev"  name="Revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#gRevSmall)" dot={false} activeDot={{ r: 4 }} />
                                                <Area type="monotone" dataKey="jobs" name="Jobs"    stroke="#10B981" strokeWidth={2} fill="url(#gJobSmall)" dot={false} activeDot={{ r: 4 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                )}
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

                        {/* ── Job Status Distribution ───────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Job Status Distribution</div>
                            </div>
                            <div className="card-body">
                                {jobStatusQuery.isLoading ? <Skeleton h={250} /> : (
                                    <ResponsiveContainer width="100%" height={250} minWidth={0}>
                                            <PieChart>
                                                <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={65} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {jobStatusData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<ChartTip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                )}
                                <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-3">
                                    {jobStatusData.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between bg-[var(--bg-card-2)] p-2 rounded-[var(--r-sm)]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="text-[11px] font-medium text-[var(--t2)] truncate">{item.name}</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-[var(--t1)]">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Row: Jobs by Trade | Completion Rates ─────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* ── Jobs by Trade ────────────────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Jobs by Trade Type — {CURRENT_YEAR}</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>Volume and revenue per service trade</div>
                            </div>
                            <div className="card-body">
                                {jobsByTradeQuery.isLoading ? <Skeleton h={260} /> : tradeData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--t4)]">
                                        <Wrench size={30} />
                                        <span className="text-sm">No trade data available</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260} minWidth={0}>
                                            <BarChart data={tradeData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                                <XAxis type="number" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--t3)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                                                <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--bg-hover)' }} />
                                                <Bar dataKey="jobs" name="Jobs" fill="#3B82F6" radius={[0,4,4,0]} barSize={14} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                )}
                                {/* Trade revenue table */}
                                {tradeData.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--t4)', fontSize: 11 }}>
                                                    <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 600 }}>Trade</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Jobs</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Revenue</th>
                                                    <th style={{ textAlign: 'right', paddingBottom: 6, fontWeight: 600 }}>Done%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tradeData.slice(0, 6).map((t, i) => (
                                                    <tr key={t.name} style={{ borderTop: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '6px 0', color: 'var(--t2)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                                            {t.name}
                                                        </td>
                                                        <td style={{ textAlign: 'right', color: 'var(--t1)', fontWeight: 700 }}>{t.jobs}</td>
                                                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 700 }}>{fmt$(t.revenue)}</td>
                                                        <td style={{ textAlign: 'right', color: t.complete >= 80 ? 'var(--green)' : t.complete >= 50 ? 'var(--amber)' : 'var(--red)', fontWeight: 700 }}>{t.complete}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Completion Rates ──────────────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Job Completion Rates — {CURRENT_YEAR}</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>How jobs are progressing this year</div>
                            </div>
                            <div className="card-body">
                                {completionQuery.isLoading ? <Skeleton h={200} /> : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', paddingTop: 8 }}>
                                            <Gauge pct={cr?.completionRate ?? 0}   color="#10B981" label="Completion"   sub={`${cr?.completed ?? 0} jobs done`} />
                                            <Gauge pct={cr?.cancellationRate ?? 0} color="#EF4444" label="Cancellation" sub={`${cr?.cancelled ?? 0} cancelled`} />
                                            <Gauge pct={cr?.totalJobs && cr.onHold ? Math.round((cr.onHold / cr.totalJobs) * 100) : 0} color="#F59E0B" label="On Hold" sub={`${cr?.onHold ?? 0} paused`} />
                                        </div>
                                        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            {[
                                                { icon: CheckCircle, color: 'var(--green)', label: 'Completed',  v: cr?.completed ?? 0 },
                                                { icon: XCircle,     color: 'var(--red)',   label: 'Cancelled',  v: cr?.cancelled ?? 0 },
                                                { icon: PauseCircle, color: 'var(--amber)', label: 'On Hold',    v: cr?.onHold ?? 0 },
                                                { icon: BarChart3,   color: 'var(--blue)',  label: 'Total Jobs', v: cr?.totalJobs ?? 0 },
                                            ].map(item => (
                                                <div key={item.label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--r-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <item.icon size={20} color={item.color} strokeWidth={1.5} />
                                                    <div>
                                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>{item.label}</div>
                                                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>{item.v.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Row: Customer Acquisition | Service Categories ─────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Customer Acquisition</div>
                            </div>
                            <div className="card-body">
                                {acquisitionQuery.isLoading ? <Skeleton h={260} /> : acquisitionData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-[var(--t4)]">
                                        <Users size={30} />
                                        <span className="text-sm">No acquisition data available</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260} minWidth={0}>
                                            <BarChart data={acquisitionData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                <XAxis dataKey="year" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--bg-hover)' }} />
                                                <Bar dataKey="new"       name="New Customers" fill="#3B82F6" radius={[4,4,0,0]} barSize={12} />
                                                <Bar dataKey="returning" name="Returning"      fill="#10B981" radius={[4,4,0,0]} barSize={12} />
                                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, color: 'var(--t3)' }} iconType="circle" iconSize={8} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Service Categories</div>
                            </div>
                            <div className="card-body flex flex-col justify-center">
                                {categoryQuery.isLoading ? <Skeleton h={260} /> : serviceCategoryData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 text-[var(--t4)] gap-3">
                                        <BarChart3 size={32} />
                                        <span className="text-sm">No category data available</span>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260} minWidth={0}>
                                            <PieChart>
                                                <Pie
                                                    data={serviceCategoryData}
                                                    cx="50%" cy="50%" outerRadius={85} dataKey="value" stroke="none"
                                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
                                                        const R = Math.PI / 180
                                                        const r = innerRadius + (outerRadius - innerRadius) * 1.5
                                                        const x = cx + r * Math.cos(-midAngle * R)
                                                        const y = cy + r * Math.sin(-midAngle * R)
                                                        return (
                                                            <text x={x} y={y} fill="var(--t1)" fontSize={11} fontWeight={600} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                                                {`${name} ${(percent * 100).toFixed(0)}%`}
                                                            </text>
                                                        )
                                                    }}
                                                    labelLine={false}
                                                >
                                                    {serviceCategoryData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<ChartTip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Top 5 Jobs ────────────────────────────────────────────── */}
                    <div className="card card-hover anim-fade-up delay-3 mb-5">
                        <div className="card-header pb-2 border-b-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy size={16} color="var(--amber)" />
                                <div className="card-title text-[15px]">Top Revenue Jobs — {CURRENT_YEAR}</div>
                            </div>
                        </div>
                        <div className="card-body-flush">
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Job</th>
                                            <th>Customer</th>
                                            <th>Location</th>
                                            <th>Completed</th>
                                            <th>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topJobsQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                        ))}
                                        {!topJobsQuery.isLoading && (topJobsQuery.data ?? []).length === 0 && (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="empty-state">
                                                        <div className="empty-icon"><Trophy size={22} /></div>
                                                        <div className="empty-title">No completed jobs with payments yet</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {!topJobsQuery.isLoading && (topJobsQuery.data ?? []).map((job, i) => (
                                            <tr key={job.jobId}>
                                                <td>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--t2)' : 'var(--t4)' }}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                    </span>
                                                </td>
                                                <td className="td-primary font-600">{job.jobNumber}</td>
                                                <td><div className="cell-user"><span className="cell-name">{job.customerName}</span></div></td>
                                                <td>
                                                    <div className="flex items-center gap-1.5 text-[var(--t3)]">
                                                        <MapPin size={11} />
                                                        <span style={{ fontSize: 12 }}>{job.serviceAddress || '—'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--t3)' }}>
                                                    {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{fmt$(job.revenue)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Technician Leaderboard ─────────────────────────────────────── */}
            <div className="card card-hover anim-fade-up delay-3">
                {leaderboardQuery.isError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
                        <AlertCircle size={14} /> Failed to load leaderboard.
                        <button onClick={() => leaderboardQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                            <RefreshCw size={12} /> Retry
                        </button>
                    </div>
                )}
                <div className="card-body" style={{ paddingBottom: 0 }}>
                    <div className="filter-bar">
                        <div className="filter-search">
                            <Search size={13} color="var(--t4)" />
                            <input placeholder="Search technicians..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                        </div>
                        <select className="select" style={{ width: 140 }} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}>
                            <option value="revenue">Sort: Revenue</option>
                            <option value="jobs">Sort: Jobs</option>
                            <option value="rating">Sort: Rating</option>
                            <option value="completion">Sort: Completion</option>
                        </select>
                        <button className="btn btn-secondary btn-sm"><Filter size={12} /> More Filters</button>
                        <button className="btn btn-secondary btn-sm flex items-center gap-1.5 ml-auto" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                        </button>
                    </div>
                </div>

                <div className="card-body-flush mt-2">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Rank</th><th>Technician</th><th>Jobs</th>
                                    <th>Revenue</th><th>Rating</th><th>Completion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                ))}
                                {!leaderboardQuery.isLoading && paginatedTechs.map((t, i) => {
                                    const rank = (page - 1) * itemsPerPage + i
                                    return (
                                        <tr
                                            key={t.technicianId}
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-technician-detail', { detail: t }))}
                                            className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                                        >
                                            <td><span style={{ fontSize: 16 }}>{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}</span></td>
                                            <td><div className="cell-user"><span className="cell-name">{t.technicianName}</span></div></td>
                                            <td className="td-primary">{t.jobsCompleted}</td>
                                            <td className="td-primary font-600">{fmt$(t.totalRevenue ?? 0)}</td>
                                            <td><span style={{ color: 'var(--amber)', fontWeight: 700 }}>★ {t.avgRating?.toFixed(1) ?? '—'}</span></td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="progress flex-1" style={{ maxWidth: 100 }}>
                                                        <div className="progress-fill" style={{ width: `${Math.round((t.completionRate ?? 0) * 100)}%`, background: '#3B82F6' }} />
                                                    </div>
                                                    <span className="text-xs text-3">{Math.round((t.completionRate ?? 0) * 100)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!leaderboardQuery.isLoading && filteredTechs.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="empty-state">
                                                <div className="empty-icon"><BarChart3 size={22} /></div>
                                                <div className="empty-title">No technicians found</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <span className="text-[13px] text-[var(--t3)]">
                        Showing {filteredTechs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}–{Math.min(page * itemsPerPage, filteredTechs.length)} of {filteredTechs.length} technicians
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[13px] text-[var(--t2)] mx-2">Page {page} of {totalPages}</span>
                        <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
