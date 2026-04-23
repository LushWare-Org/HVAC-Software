import { useState } from 'react'
import {
    BarChart3, DollarSign, Wrench, TrendingUp,
    ChevronLeft, ChevronRight, Search, Maximize2, Minimize2,
    Filter, AlertCircle, RefreshCw, Bot, Target, Activity,
    CheckCircle2, Percent, Database,
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
    useRevenueAgentSummary,
    useRevenueAgentTrends,
    useRevenueAgentLogs,
} from '../hooks/useAnalytics'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const RECENT_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 9 + i)
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

type ChartPayloadItem = {
    color?: string
    dataKey?: string
    name?: string
    value?: number | string
}

type ChartTipProps = {
    active?: boolean
    payload?: ChartPayloadItem[]
    label?: string
}

type PieLabelProps = {
    cx?: number | string
    cy?: number | string
    midAngle?: number
    innerRadius?: number | string
    outerRadius?: number | string
    name?: string
    percent?: number
}

type ChartView = 'monthly' | 'yearly'

// Job status labels for pie chart
const JOB_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pending', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed', INVOICED: 'Invoiced', PAID: 'Paid',
    CANCELLED: 'Cancelled', ON_HOLD: 'On Hold',
}

// Static service categories removed — now fetched from API

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 14 }: { h?: number }) {
    return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

/** Build ISO date range strings for the revenue series hook */
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

const ChartTip = ({ active, payload, label }: ChartTipProps) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {p.name === 'Revenue ($k)' ? `$${p.value}k` : p.value}
                </div>
            ))}
        </div>
    )
}

const RevenueAgentTip = ({ active, payload, label }: ChartTipProps) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {p.dataKey === 'impact' ? formatMoney(p.value) : `${Math.round(Number(p.value) * 100)}%`}
                </div>
            ))}
        </div>
    )
}

function formatPercent(value?: number) {
    if (value == null || Number.isNaN(value)) return '0%'
    return `${Math.round(value * 100)}%`
}

function formatMoney(value?: number | string) {
    if (value == null || Number.isNaN(value)) return '$0'
    return `$${Math.round(Number(value)).toLocaleString()}`
}

function formatNumber(value?: number) {
    if (value == null || Number.isNaN(value)) return '0'
    return Math.round(value).toLocaleString()
}

function formatDateTime(value?: string) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function actionLabel(value?: string) {
    if (!value) return '-'
    return value.replaceAll('_', ' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Analytics() {
    const [page, setPage]         = useState(1)
    const [search, setSearch]     = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [sortBy, setSortBy]     = useState('revenue')

    // Revenue Overview (full-width chart) controls
    const [revViewFull, setRevViewFull]   = useState<ChartView>('monthly')
    const [revYearFull, setRevYearFull]   = useState(CURRENT_YEAR.toString())
    const [revMonthFull, setRevMonthFull] = useState(String(new Date().getMonth()))

    // Revenue & Jobs (small chart) controls
    const [trendView, setTrendView]   = useState<ChartView>('monthly')
    const [trendYear, setTrendYear]   = useState(CURRENT_YEAR.toString())
    const [trendMonth, setTrendMonth] = useState(String(new Date().getMonth()))

    const itemsPerPage = 10

    // ── API queries ──────────────────────────────────────────────────────────────
    const kpiQuery = useAnalyticsKpis()
    const kpis     = kpiQuery.data

    const revRange       = chartDateRange(revViewFull, revMonthFull, revYearFull)
    const revSeriesQuery = useRevenueSeries(revRange.granularity, revRange.from, revRange.to)

    const trendRange       = chartDateRange(trendView, trendMonth, trendYear)
    const trendSeriesQuery = useRevenueSeries(trendRange.granularity, trendRange.from, trendRange.to)

    const jobStatusQuery  = useJobsByStatus()
    const acquisitionQuery = useCustomerAcquisition()
    const leaderboardQuery = useTechLeaderboard(100)
    const categoryQuery    = useRevenueByCategory()
    const revenueAgentSummaryQuery = useRevenueAgentSummary()
    const revenueAgentTrendsQuery = useRevenueAgentTrends(14)
    const revenueAgentLogsQuery = useRevenueAgentLogs(10)

    // ── Derived / mapped data ────────────────────────────────────────────────────
    // Revenue: values in dollars, display as $k
    const revChartData = (revSeriesQuery.data ?? []).map(d => ({
        m:    d.period,
        rev:  Math.round(d.revenue / 100) / 10,   // dollars → $k
        jobs: d.invoiceCount ?? d.jobCount ?? 0,
    }))

    const trendChartData = (trendSeriesQuery.data ?? []).map(d => ({
        m:    d.period,
        rev:  Math.round(d.revenue / 100) / 10,
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

    const revenueAgentTrendData = (revenueAgentTrendsQuery.data ?? []).map(d => ({
        date: d.date,
        revenue: d.revenue_accuracy,
        demand: d.demand_accuracy,
        utilization: d.utilization_accuracy,
        impact: d.pricing_impact,
    }))

    const revenueAgentLogs = revenueAgentLogsQuery.data ?? []
    const revenueAgentSummary = revenueAgentSummaryQuery.data

    // Leaderboard: filter + sort client-side (full list already fetched)
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

    const totalPages    = Math.max(1, Math.ceil(filteredTechs.length / itemsPerPage))
    const paginatedTechs = filteredTechs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    // KPI: avg revenue per job
    const avgRevPerJob = kpis && kpis.jobsCompleted.value > 0
        ? `$${Math.round(kpis.revenue.value / kpis.jobsCompleted.value).toLocaleString()}`
        : '—'

    return (
        <div className="anim-fade-up">

            {!isExpanded && (
                <>
                    {/* ── KPI cards ───────────────────────────────────────────────── */}
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: DollarSign,  v: kpis?.revenue.formattedValue ?? '—',                                                      l: 'Total Revenue',  loading: kpiQuery.isLoading },
                            { icon: Wrench,      v: kpis?.jobsCompleted.formattedValue ?? '—',                                                 l: 'Jobs Completed', loading: kpiQuery.isLoading },
                            { icon: TrendingUp,  v: kpis?.revenue.trend != null ? `${kpis.revenue.trend > 0 ? '+' : ''}${kpis.revenue.trend}%` : '—', l: 'Revenue Growth',  loading: kpiQuery.isLoading },
                            { icon: BarChart3,   v: avgRevPerJob,                                                                              l: 'Avg Rev / Job',  loading: kpiQuery.isLoading },
                        ].map(k => (
                            <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
                                <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.l}</div>
                                    <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                                </div>
                                {k.loading
                                    ? <Skeleton h={28} />
                                    : <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{k.v}</div>
                                }
                            </div>
                        ))}
                    </div>

                    <div className="card card-hover anim-fade-up delay-1 mb-5">
                        <div className="card-header pb-2 border-b-0 flex flex-wrap gap-3 justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot size={17} color="var(--blue)" />
                                <div className="card-title text-[15px]">Revenue Agent Observability</div>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                                onClick={() => {
                                    revenueAgentSummaryQuery.refetch()
                                    revenueAgentTrendsQuery.refetch()
                                    revenueAgentLogsQuery.refetch()
                                }}
                            >
                                <RefreshCw size={13} /> Refresh
                            </button>
                        </div>
                        <div className="card-body">
                            {revenueAgentSummaryQuery.isError && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
                                    <AlertCircle size={14} />
                                    Revenue Agent API is unavailable. Start it with python -m api.analytics_routes.
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
                                {[
                                    { icon: Target, label: 'Revenue Accuracy', value: formatPercent(revenueAgentSummary?.revenue_accuracy), loading: revenueAgentSummaryQuery.isLoading },
                                    { icon: Activity, label: 'Demand Accuracy', value: formatPercent(revenueAgentSummary?.demand_accuracy), loading: revenueAgentSummaryQuery.isLoading },
                                    { icon: Percent, label: 'Utilization Accuracy', value: formatPercent(revenueAgentSummary?.utilization_accuracy), loading: revenueAgentSummaryQuery.isLoading },
                                    { icon: CheckCircle2, label: 'Action Success', value: formatPercent(revenueAgentSummary?.action_success_rate), loading: revenueAgentSummaryQuery.isLoading },
                                    { icon: DollarSign, label: 'Pricing Impact', value: formatMoney(revenueAgentSummary?.pricing_impact), loading: revenueAgentSummaryQuery.isLoading },
                                ].map(k => (
                                    <div key={k.label} className="kpi-card" style={{ padding: '14px 16px', borderRadius: 'var(--r-md)' }}>
                                        <div className="kpi-card-top" style={{ marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div className="kpi-label" style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.label}</div>
                                            <k.icon size={15} strokeWidth={1.7} color="var(--t3)" />
                                        </div>
                                        {k.loading ? <Skeleton h={24} /> : <div className="kpi-value" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>{k.value}</div>}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] gap-5">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[13px] font-semibold text-[var(--t2)]">Accuracy Trend</div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-[var(--t3)]">
                                            <Database size={13} /> {formatNumber(revenueAgentSummary?.sample_size)} runs
                                        </div>
                                    </div>
                                    {revenueAgentTrendsQuery.isLoading ? <Skeleton h={260} /> : (
                                        <div style={{ height: 260 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueAgentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="gAgentRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.22} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                        </linearGradient>
                                                        <linearGradient id="gAgentDemand" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                                    <XAxis dataKey="date" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(Number(v) * 100)}%`} domain={[0, 1]} />
                                                    <Tooltip content={<RevenueAgentTip />} />
                                                    <Area type="monotone" dataKey="revenue" name="Revenue accuracy" stroke="#3B82F6" strokeWidth={2} fill="url(#gAgentRevenue)" dot={false} activeDot={{ r: 4 }} />
                                                    <Area type="monotone" dataKey="demand" name="Demand accuracy" stroke="#10B981" strokeWidth={2} fill="url(#gAgentDemand)" dot={false} activeDot={{ r: 4 }} />
                                                    <Area type="monotone" dataKey="utilization" name="Utilization accuracy" stroke="#F59E0B" strokeWidth={2} fill="transparent" dot={false} activeDot={{ r: 4 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[13px] font-semibold text-[var(--t2)]">Recent Agent Runs</div>
                                        <div className="text-[12px] text-[var(--t3)]">Latest 10</div>
                                    </div>
                                    <div className="table-container" style={{ maxHeight: 300 }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Action</th>
                                                    <th>Actual</th>
                                                    <th>Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenueAgentLogsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
                                                    <tr key={i}>{Array.from({ length: 4 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                                ))}
                                                {!revenueAgentLogsQuery.isLoading && revenueAgentLogs.map(log => {
                                                    const impact = (log.actual_revenue ?? 0) - (log.baseline_revenue ?? 0)
                                                    return (
                                                        <tr key={`${log.timestamp}-${log.action}-${log.job_id ?? ''}`}>
                                                            <td className="text-[12px] text-[var(--t3)]">{formatDateTime(log.timestamp)}</td>
                                                            <td className="td-primary capitalize">{actionLabel(log.action)}</td>
                                                            <td className="td-primary">{formatMoney(log.actual_revenue)}</td>
                                                            <td style={{ color: impact >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                                                                {impact >= 0 ? '+' : ''}{formatMoney(impact)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                {!revenueAgentLogsQuery.isLoading && revenueAgentLogs.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4}>
                                                            <div className="empty-state">
                                                                <div className="empty-icon"><Bot size={22} /></div>
                                                                <div className="empty-title">No Revenue Agent runs logged</div>
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
                    </div>

                    {/* ── Revenue Overview (full width) ────────────────────────────── */}
                    <div className="card card-hover anim-fade-up delay-1 mb-5">
                        <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                            <div className="card-title text-[15px]">Revenue Overview</div>
                            <div className="flex gap-2 items-center">
                                <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 120 }}
                                    value={revViewFull} onChange={e => setRevViewFull(e.target.value as ChartView)}>
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
                            {revSeriesQuery.isLoading ? <Skeleton h={280} /> : (
                                <div style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="m" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}k`} />
                                            <Tooltip content={<ChartTip />} />
                                            <Area type="monotone" dataKey="rev" name="Revenue ($k)" stroke="#3B82F6" strokeWidth={2} fill="url(#gRev)" dot={false} activeDot={{ r: 4 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* ── Revenue & Jobs (small) ───────────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0 flex flex-wrap gap-4 justify-between items-center">
                                <div className="card-title text-[15px]">Revenue & Jobs</div>
                                <div className="flex gap-2 items-center">
                                    <select className="select text-xs h-[28px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]" style={{ minWidth: 120 }}
                                        value={trendView} onChange={e => setTrendView(e.target.value as ChartView)}>
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
                                    <div style={{ height: 280 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                                <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTip />} />
                                                <Area type="monotone" dataKey="rev"  name="Revenue ($k)" stroke="#3B82F6" strokeWidth={2} fill="url(#gRevSmall)" dot={false} activeDot={{ r: 4 }} />
                                                <Area type="monotone" dataKey="jobs" name="Jobs"          stroke="#10B981" strokeWidth={2} fill="url(#gJobSmall)" dot={false} activeDot={{ r: 4 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
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

                        {/* ── Job Status Distribution ──────────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Job Status Distribution</div>
                            </div>
                            <div className="card-body">
                                {jobStatusQuery.isLoading ? <Skeleton h={250} /> : (
                                    <div style={{ height: 250 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={65} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {jobStatusData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<ChartTip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* ── Customer Acquisition ────────────────────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0 flex justify-between items-center">
                                <div className="card-title text-[15px]">Customer Acquisition</div>
                            </div>
                            <div className="card-body">
                                {acquisitionQuery.isLoading ? <Skeleton h={260} /> : (
                                    <div style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
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
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Service Categories (from API) ─────────────────── */}
                        <div className="card card-hover anim-fade-up delay-2">
                            <div className="card-header pb-2 border-b-0">
                                <div className="card-title text-[15px]">Service Categories</div>
                            </div>
                            <div className="card-body flex flex-col justify-center">
                                {categoryQuery.isLoading ? <Skeleton h={260} /> : serviceCategoryData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-[var(--t4)] gap-3">
                                        <BarChart3 size={32} />
                                        <span className="text-sm">No category data available</span>
                                    </div>
                                ) : (
                                <div style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={serviceCategoryData}
                                                cx="50%" cy="50%" outerRadius={85} dataKey="value" stroke="none"
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: PieLabelProps) => {
                                                    const R = Math.PI / 180
                                                    const centerX = Number(cx ?? 0)
                                                    const centerY = Number(cy ?? 0)
                                                    const inner = Number(innerRadius ?? 0)
                                                    const outer = Number(outerRadius ?? 0)
                                                    const angle = Number(midAngle ?? 0)
                                                    const r = inner + (outer - inner) * 1.5
                                                    const x = centerX + r * Math.cos(-angle * R)
                                                    const y = centerY + r * Math.sin(-angle * R)
                                                    return (
                                                        <text x={x} y={y} fill="var(--t1)" fontSize={11} fontWeight={600} textAnchor={x > centerX ? 'start' : 'end'} dominantBaseline="central">
                                                            {`${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Technician Leaderboard ───────────────────────────────────────── */}
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
                                            className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                                        >
                                            <td><span style={{ fontSize: 16 }}>{rank + 1}</span></td>
                                            <td>
                                                <div className="cell-user">
                                                    <span className="cell-name">{t.technicianName}</span>
                                                </div>
                                            </td>
                                            <td className="td-primary">{t.jobsCompleted}</td>
                                            <td className="td-primary font-600">${(t.totalRevenue ?? 0).toLocaleString()}</td>
                                            <td>
                                                <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                                                    ★ {t.avgRating?.toFixed(1) ?? '—'}
                                                </span>
                                            </td>
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
                        Showing {filteredTechs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredTechs.length)} of {filteredTechs.length} technicians
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
