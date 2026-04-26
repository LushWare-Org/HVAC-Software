import { useState } from 'react'
import {
    Brain, TrendingUp, Target, Zap, DollarSign, BarChart3,
    RefreshCw, AlertCircle, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
    LineChart, Line, AreaChart, Area,
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts'
import {
    useBanditSummary,
    useBanditRewardTrend,
    useBanditActions,
    useBanditExploration,
    useBanditRevenueImpact,
    useBanditContextPerformance,
    useBanditRegret,
} from '../hooks/useBanditDashboard'
import type { BanditAgent } from '../types/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENTS: { value: BanditAgent | undefined; label: string }[] = [
    { value: undefined,    label: 'All Agents' },
    { value: 'revenue',    label: 'Revenue'    },
    { value: 'retention',  label: 'Retention'  },
    { value: 'upsell',     label: 'Upsell'     },
    { value: 'followup',   label: 'Follow-up'  },
]

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

type ChartPayloadItem = {
    color?: string
    dataKey?: string
    name?: string
    value?: number | string
}
type ChartTipProps = { active?: boolean; payload?: ChartPayloadItem[]; label?: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 14 }: { h?: number }) {
    return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

function fmt(v?: number | null, decimals = 2) {
    if (v == null || Number.isNaN(v)) return '—'
    return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtMoney(v?: number | null) {
    if (v == null) return '—'
    return `$${Math.round(v).toLocaleString()}`
}
function fmtPct(v?: number | null) {
    if (v == null) return '—'
    return `${Math.round(v * 100)}%`
}
function actionLabel(s?: string) {
    if (!s) return '—'
    return s.replace(/_/g, ' ')
}
function stateKeyLabel(key: (string | number)[]) {
    if (!key?.length) return '—'
    return `[${key.join(', ')}]`
}

// ─── Tooltip components ───────────────────────────────────────────────────────

const DefaultTip = ({ active, payload, label }: ChartTipProps) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {p.value}
                </div>
            ))}
        </div>
    )
}

const PctTip = ({ active, payload, label }: ChartTipProps) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey || p.name} style={{ fontSize: 12, color: p.color ?? 'var(--t1)', fontWeight: 600, marginBottom: 2 }}>
                    {p.name}: {Math.round(Number(p.value) * 100)}%
                </div>
            ))}
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BanditDashboard() {
    const [agent, setAgent] = useState<BanditAgent | undefined>(undefined)
    const [ctxPage, setCtxPage]   = useState(1)
    const CTX_PAGE_SIZE = 10

    // ── Queries ──────────────────────────────────────────────────────────────
    const summaryQ     = useBanditSummary(agent)
    const trendQ       = useBanditRewardTrend(agent, 30)
    const actionsQ     = useBanditActions(agent)
    const explorationQ = useBanditExploration(agent, 30)
    const revenueQ     = useBanditRevenueImpact(agent, 30)
    const contextQ     = useBanditContextPerformance(agent)
    const regretQ      = useBanditRegret(agent)

    const isError = summaryQ.isError

    function refetchAll() {
        summaryQ.refetch()
        trendQ.refetch()
        actionsQ.refetch()
        explorationQ.refetch()
        revenueQ.refetch()
        contextQ.refetch()
        regretQ.refetch()
    }

    // ── Derived data ─────────────────────────────────────────────────────────
    const summary        = summaryQ.data
    const trendData      = trendQ.data ?? []
    const actionsData    = actionsQ.data ?? []
    const exploration    = explorationQ.data
    const revenue        = revenueQ.data
    const contextRows    = contextQ.data ?? []
    const regret         = regretQ.data

    // Exploration bar chart data
    const exploreBarData = exploration
        ? [
            { name: 'Exploration', value: exploration.explored,  fill: '#F59E0B' },
            { name: 'Exploitation', value: exploration.exploited, fill: '#3B82F6' },
          ]
        : []

    // Exploration trend for line chart
    const exploreTrendData = (exploration?.trend ?? []).map(d => ({
        date: d.date,
        rate: d.exploration_rate,
    }))

    // Revenue uplift trend data
    const upliftTrendData = (revenue?.trend ?? []).map(d => ({
        date:    d.date,
        uplift:  d.avg_uplift,
        total:   d.total_uplift,
    }))

    // Regret trend data
    const regretTrendData = (regret?.trend ?? []).map(d => ({
        date:   d.date,
        regret: d.daily_regret,
        avg:    d.avg_daily_regret,
    }))

    // Context table pagination
    const ctxTotal = contextRows.length
    const ctxPages = Math.max(1, Math.ceil(ctxTotal / CTX_PAGE_SIZE))
    const ctxSlice = contextRows.slice((ctxPage - 1) * CTX_PAGE_SIZE, ctxPage * CTX_PAGE_SIZE)

    return (
        <div className="anim-fade-up">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                    <Brain size={20} color="var(--blue)" />
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                            Bandit Observability
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, marginTop: 2 }}>
                            Multi-agent contextual bandit learning &amp; performance
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Agent filter */}
                    <select
                        className="select text-xs h-[30px] px-2 py-0 min-h-0 bg-[var(--bg-surface)]"
                        style={{ minWidth: 130 }}
                        value={agent ?? ''}
                        onChange={e => {
                            setAgent((e.target.value as BanditAgent) || undefined)
                            setCtxPage(1)
                        }}
                    >
                        {AGENTS.map(a => (
                            <option key={a.label} value={a.value ?? ''}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={refetchAll}>
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>
            </div>

            {/* API unavailable banner */}
            {isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 20 }}>
                    <AlertCircle size={14} />
                    Bandit API unavailable — start it with{' '}
                    <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>
                        python -m api.bandit_routes
                    </code>
                </div>
            )}

            {/* ── Section 1: KPI summary cards ──────────────────────────────── */}
            <div className="kpi-grid mb-5">
                {[
                    {
                        icon: TrendingUp,
                        label: 'Avg Reward',
                        value: summaryQ.isLoading ? null : fmt(summary?.avg_reward),
                        sub:   `${summary?.sample_size ?? 0} decisions`,
                        color: 'var(--blue)',
                    },
                    {
                        icon: Zap,
                        label: 'Exploration Rate',
                        value: summaryQ.isLoading ? null : fmtPct(summary?.exploration_rate),
                        sub:   'ε-greedy random draws',
                        color: 'var(--amber)',
                    },
                    {
                        icon: Target,
                        label: 'Top Action',
                        value: summaryQ.isLoading ? null : actionLabel(summary?.top_action ?? undefined),
                        sub:   'most-selected action',
                        color: 'var(--green)',
                    },
                    {
                        icon: DollarSign,
                        label: 'Revenue Uplift',
                        value: summaryQ.isLoading ? null : fmtMoney(summary?.revenue_uplift),
                        sub:   'actual − baseline',
                        color: 'var(--green)',
                    },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
                        <div className="kpi-card-top" style={{ marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="kpi-label" style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.label}</div>
                            <k.icon size={15} strokeWidth={1.7} color={k.color} />
                        </div>
                        {k.value == null
                            ? <Skeleton h={28} />
                            : <div className="kpi-value" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>{k.value}</div>
                        }
                        <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Section 2: Learning curve + Action distribution ───────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)] gap-5 mb-5">

                {/* Learning curve */}
                <div className="card card-hover anim-fade-up delay-1">
                    <div className="card-header pb-2 border-b-0 flex items-center gap-2">
                        <TrendingUp size={15} color="var(--blue)" />
                        <div className="card-title text-[14px]">Learning Curve — Avg Reward Over Time</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>
                            A rising curve confirms the bandit is converging on higher-reward actions.
                        </div>
                        {trendQ.isLoading ? <Skeleton h={240} /> : (
                            <div style={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gReward" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DefaultTip />} />
                                        <Area
                                            type="monotone" dataKey="avg_reward" name="Avg Reward"
                                            stroke="#3B82F6" strokeWidth={2}
                                            fill="url(#gReward)" dot={false} activeDot={{ r: 4 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action distribution pie */}
                <div className="card card-hover anim-fade-up delay-1">
                    <div className="card-header pb-2 border-b-0 flex items-center gap-2">
                        <Target size={15} color="var(--green)" />
                        <div className="card-title text-[14px]">Action Distribution</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>
                            Uneven distribution = bandit has learned action preferences.
                        </div>
                        {actionsQ.isLoading ? <Skeleton h={180} /> : actionsData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-[var(--t4)] gap-2">
                                <Brain size={24} />
                                <span className="text-xs">No data — run agents to populate</span>
                            </div>
                        ) : (
                            <>
                                <div style={{ height: 180 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={actionsData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="count">
                                                {actionsData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null
                                                    const d = payload[0].payload
                                                    return (
                                                        <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{actionLabel(d.action)}</div>
                                                            <div style={{ color: 'var(--t3)' }}>{d.count} times ({fmtPct(d.pct)})</div>
                                                        </div>
                                                    )
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 mt-2">
                                    {actionsData.slice(0, 6).map((row, i) => (
                                        <div key={row.action} className="flex items-center gap-1.5 bg-[var(--bg-card-2)] px-2 py-1.5 rounded-[var(--r-sm)]">
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            <span className="text-[11px] font-medium text-[var(--t2)] truncate flex-1">{actionLabel(row.action)}</span>
                                            <span className="text-[11px] font-bold text-[var(--t1)]">{fmtPct(row.pct)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Section 3: Exploration vs Exploitation ────────────────────── */}
            <div className="card card-hover anim-fade-up delay-2 mb-5">
                <div className="card-header pb-2 border-b-0 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Zap size={15} color="var(--amber)" />
                        <div className="card-title text-[14px]">Exploration vs Exploitation</div>
                    </div>
                    {exploration && (
                        <div className="flex gap-3 text-[12px]">
                            <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                                Explored: {exploration.explored.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>
                                Exploited: {exploration.exploited.toLocaleString()}
                            </span>
                            <span style={{ color: 'var(--t3)' }}>
                                Rate: {fmtPct(exploration.overall_rate)}
                            </span>
                        </div>
                    )}
                </div>
                <div className="card-body" style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 12 }}>
                        A declining exploration rate over time indicates the bandit is maturing.
                        Target: ~20% early deployment → ~5% at maturity.
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Aggregate bar */}
                        <div>
                            <div className="text-[12px] font-semibold text-[var(--t2)] mb-2">Aggregate Split</div>
                            {explorationQ.isLoading ? <Skeleton h={160} /> : (
                                <div style={{ height: 160 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={exploreBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<DefaultTip />} cursor={{ fill: 'var(--bg-hover)' }} />
                                            <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                                                {exploreBarData.map((d, i) => (
                                                    <Cell key={i} fill={d.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        {/* Daily trend line */}
                        <div>
                            <div className="text-[12px] font-semibold text-[var(--t2)] mb-2">Exploration Rate Trend</div>
                            {explorationQ.isLoading ? <Skeleton h={160} /> : (
                                <div style={{ height: 160 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={exploreTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: 'var(--t4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                                            <Tooltip content={<PctTip />} />
                                            <Line type="monotone" dataKey="rate" name="Exploration Rate" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 4: Revenue Impact ─────────────────────────────────── */}
            <div className="card card-hover anim-fade-up delay-2 mb-5">
                <div className="card-header pb-2 border-b-0 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <DollarSign size={15} color="var(--green)" />
                        <div className="card-title text-[14px]">Revenue Impact — Actual vs Baseline</div>
                    </div>
                </div>
                <div className="card-body" style={{ paddingTop: 4 }}>
                    {/* KPI mini-cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                        {[
                            { label: 'Avg Uplift / Decision', value: revenueQ.isLoading ? null : fmtMoney(revenue?.avg_uplift),   icon: TrendingUp, color: 'var(--green)'  },
                            { label: 'Total Revenue Uplift',  value: revenueQ.isLoading ? null : fmtMoney(revenue?.total_uplift),  icon: DollarSign,  color: 'var(--green)'  },
                            { label: 'Revenue Sample Size',   value: revenueQ.isLoading ? null : (revenue?.sample_size ?? 0).toLocaleString(), icon: Activity, color: 'var(--blue)' },
                        ].map(k => (
                            <div key={k.label} className="kpi-card" style={{ padding: '12px 16px', borderRadius: 'var(--r-md)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{k.label}</div>
                                    <k.icon size={13} color={k.color} strokeWidth={1.8} />
                                </div>
                                {k.value == null
                                    ? <Skeleton h={22} />
                                    : <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>{k.value}</div>
                                }
                            </div>
                        ))}
                    </div>
                    {/* Uplift trend */}
                    {revenueQ.isLoading ? <Skeleton h={200} /> : (
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={upliftTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: 'var(--t4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload?.length) return null
                                            return (
                                                <div style={{ background: 'var(--bg-card-2)', border: '1px solid var(--bd-md)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--t3)', marginBottom: 4 }}>{label}</div>
                                                    {payload.map((p, i) => (
                                                        <div key={i} style={{ color: p.color ?? 'var(--t1)', fontWeight: 700 }}>
                                                            {p.name}: {fmtMoney(Number(p.value))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        }}
                                        cursor={{ fill: 'var(--bg-hover)' }}
                                    />
                                    <Bar dataKey="uplift" name="Avg Uplift" fill="#10B981" radius={[4, 4, 0, 0]} barSize={14} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'var(--t3)' }} iconType="circle" iconSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Section 5: Context Insights ───────────────────────────────── */}
            <div className="card card-hover anim-fade-up delay-3 mb-5">
                <div className="card-header pb-2 border-b-0 flex items-center gap-2">
                    <Brain size={15} color="var(--blue)" />
                    <div className="card-title text-[14px]">Context Insights — Learned Policy</div>
                </div>
                <div className="card-body" style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>
                        What the bandit has learned works best in each context bucket.
                        High avg_reward + high count = high-confidence learned preference.
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Context (State Key)</th>
                                    <th>Action</th>
                                    <th>Avg Reward</th>
                                    <th>Observations</th>
                                    <th>Confidence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contextQ.isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                ))}
                                {!contextQ.isLoading && ctxSlice.map((row, i) => {
                                    const confidence = Math.min(1, row.count / 20)
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <code style={{ fontSize: 11, background: 'var(--bg-card-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--t2)' }}>
                                                    {stateKeyLabel(row.state_key)}
                                                </code>
                                            </td>
                                            <td className="td-primary capitalize">{actionLabel(row.action)}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: row.avg_reward >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                                    {fmt(row.avg_reward)}
                                                </span>
                                            </td>
                                            <td className="td-primary">{row.count}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="progress flex-1" style={{ maxWidth: 80 }}>
                                                        <div className="progress-fill" style={{ width: `${Math.round(confidence * 100)}%`, background: confidence > 0.7 ? '#10B981' : confidence > 0.3 ? '#F59E0B' : '#EF4444' }} />
                                                    </div>
                                                    <span className="text-xs text-3">{Math.round(confidence * 100)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!contextQ.isLoading && contextRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="empty-state">
                                                <div className="empty-icon"><Brain size={22} /></div>
                                                <div className="empty-title">No context data yet</div>
                                                <div className="empty-desc">Run agents to populate the learned policy table</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {ctxTotal > CTX_PAGE_SIZE && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px 4px' }}>
                            <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                                Showing {Math.min(ctxTotal, (ctxPage - 1) * CTX_PAGE_SIZE + 1)}–{Math.min(ctxTotal, ctxPage * CTX_PAGE_SIZE)} of {ctxTotal}
                            </span>
                            <div className="flex items-center gap-2">
                                <button className="btn btn-secondary btn-sm p-1" style={{ width: 28, height: 28 }} onClick={() => setCtxPage(p => Math.max(1, p - 1))} disabled={ctxPage === 1}>
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: 12, color: 'var(--t2)' }}>Page {ctxPage} / {ctxPages}</span>
                                <button className="btn btn-secondary btn-sm p-1" style={{ width: 28, height: 28 }} onClick={() => setCtxPage(p => Math.min(ctxPages, p + 1))} disabled={ctxPage >= ctxPages}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Section 6: Regret analysis ────────────────────────────────── */}
            <div className="card card-hover anim-fade-up delay-3 mb-5">
                <div className="card-header pb-2 border-b-0 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={15} color="var(--red)" />
                        <div className="card-title text-[14px]">Regret — Opportunity Cost</div>
                    </div>
                    {regret && (
                        <div className="flex gap-3 text-[12px]">
                            <span style={{ color: 'var(--t2)', fontWeight: 600 }}>
                                Total: <span style={{ color: 'var(--red)' }}>{fmt(regret.total_regret)}</span>
                            </span>
                            <span style={{ color: 'var(--t2)', fontWeight: 600 }}>
                                Avg: <span style={{ color: 'var(--amber)' }}>{fmt(regret.avg_regret)}</span>
                            </span>
                        </div>
                    )}
                </div>
                <div className="card-body" style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 12 }}>
                        Regret = best possible reward − actual reward per decision (empirical oracle).
                        Declining daily regret = the bandit is leaving less reward on the table.
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_240px] gap-5">
                        {/* Regret trend chart */}
                        <div>
                            {regretQ.isLoading ? <Skeleton h={200} /> : (
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={regretTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gRegret" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: 'var(--t4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: 'var(--t4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<DefaultTip />} />
                                            <Area type="monotone" dataKey="regret" name="Daily Regret" stroke="#EF4444" strokeWidth={2} fill="url(#gRegret)" dot={false} activeDot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="avg" name="Avg Regret" stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        {/* Per-agent regret breakdown */}
                        <div>
                            <div className="text-[12px] font-semibold text-[var(--t2)] mb-3">Regret by Agent</div>
                            {regretQ.isLoading ? <Skeleton h={140} /> : (
                                <div className="flex flex-col gap-2">
                                    {Object.entries(regret?.regret_by_agent ?? {}).length === 0 ? (
                                        <div style={{ fontSize: 12, color: 'var(--t4)' }}>No per-agent data yet</div>
                                    ) : (
                                        Object.entries(regret?.regret_by_agent ?? {})
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([ag, r], i) => (
                                                <div key={ag} className="flex items-center justify-between bg-[var(--bg-card-2)] px-3 py-2 rounded-[var(--r-sm)]">
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', textTransform: 'capitalize' }}>{ag}</span>
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{fmt(r)}</span>
                                                </div>
                                            ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
