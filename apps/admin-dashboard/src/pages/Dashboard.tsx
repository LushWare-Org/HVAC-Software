import { useState, useEffect, lazy, Suspense } from 'react'
import {
    DollarSign, Briefcase, Users, CheckCircle,
    ArrowRight, Clock, ChevronLeft, ChevronRight, Eye, AlertCircle, RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardKpis, useRecentJobs, useUpcomingAppointments } from '../hooks/useDashboard'
import { useRevenueSeries, useJobsByStatus } from '../hooks/useAnalytics'
import { useCompany } from '../hooks/useSettings'
import RecommendationsPanel from '../components/RecommendationsPanel'
import ComponentIssuesAlert from '../components/ComponentIssuesAlert'
import type { Job, Appointment } from '../types/api'
import { formatMoneyCompact } from '../lib/format'

// recharts (~120KB gzip) is kept out of Dashboard's own chunk — Dashboard is
// the post-login landing page and loads eagerly, so pulling the chart lib in
// directly would put it on the critical path for every login.
const RevenueAreaChart = lazy(() => import('../components/DashboardCharts').then(m => ({ default: m.RevenueAreaChart })))
const JobStatusPieChart = lazy(() => import('../components/DashboardCharts').then(m => ({ default: m.JobStatusPieChart })))

function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

// ─── Status maps: backend UPPER_CASE → display ────────────────────────────────

const JOB_STATUS_MAP: Record<string, { label: string; css: string }> = {
    PENDING:     { label: 'Pending',     css: 'badge-amber' },
    SCHEDULED:   { label: 'Scheduled',   css: 'badge-violet' },
    IN_PROGRESS: { label: 'In Progress', css: 'badge-blue' },
    COMPLETED:   { label: 'Completed',   css: 'badge-green' },
    INVOICED:    { label: 'Invoiced',    css: 'badge-cyan' },
    PAID:        { label: 'Paid',        css: 'badge-green' },
    CANCELLED:   { label: 'Cancelled',  css: 'badge-red' },
    ON_HOLD:     { label: 'On Hold',     css: 'badge-neutral' },
    // legacy lowercase from mock data
    in_progress: { label: 'In Progress', css: 'badge-blue' },
    scheduled:   { label: 'Scheduled',   css: 'badge-violet' },
    completed:   { label: 'Completed',   css: 'badge-green' },
    pending:     { label: 'Pending',     css: 'badge-amber' },
    invoiced:    { label: 'Invoiced',    css: 'badge-cyan' },
    cancelled:   { label: 'Cancelled',  css: 'badge-red' },
}


const JOB_STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444']

function fmt(n: number) {
    return formatMoneyCompact(n)
}

// ─── Small loading skeleton ────────────────────────────────────────────────────

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: string | number }) {
    return (
        <div
            style={{
                width: w,
                height: h,
                background: 'var(--bg-hover)',
                borderRadius: 6,
                animation: 'pulse 1.5s infinite',
            }}
        />
    )
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
    const [mounted, setMounted] = useState(false)
    const [page, setPage] = useState(1)
    const itemsPerPage = 10
    const navigate = useNavigate()

    useEffect(() => { setMounted(true) }, [])

    // ── API data ─────────────────────────────────────────────────────────────
    const kpiQuery = useDashboardKpis()
    const recentJobsQuery = useRecentJobs(page, itemsPerPage)
    const appointmentsQuery = useUpcomingAppointments(4)
    const revenueQuery = useRevenueSeries('month')
    const jobStatusQuery = useJobsByStatus()
    const companyQuery = useCompany()
    const company = companyQuery.data

    // ── Derived data ──────────────────────────────────────────────────────────

    // Revenue chart data — from analytics service or empty fallback
    const revenueData = (revenueQuery.data ?? []).map((s) => ({
        month: new Date(s.period).toLocaleDateString('en-US', { month: 'short' }),
        revenue: s.revenue,
    }))

    // Job status pie chart — from analytics service
    const jobStatusData = (jobStatusQuery.data ?? []).map((s) => ({
        name: s.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: s.count,
    }))

    // Recent jobs from API
    const jobs: Job[] = recentJobsQuery.data?.data ?? []
    const totalJobs = recentJobsQuery.data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(totalJobs / itemsPerPage))
    const paginatedJobs = jobs

    // Upcoming appointments from API
    const appointments: Appointment[] = appointmentsQuery.data?.data ?? []

    // KPI values from API (with formatted fallbacks while loading)
    const kpi = kpiQuery.data
    const statCards = [
        {
            title: 'Total Revenue',
            value: kpi?.revenue.formattedValue ?? '—',
            sub: kpi?.revenue.trend != null ? `${kpi.revenue.trend > 0 ? '+' : ''}${kpi.revenue.trend}% vs prior period` : 'Loading…',
            icon: DollarSign,
            loading: kpiQuery.isLoading,
            href: '/finance',
        },
        {
            title: 'Jobs Completed',
            value: kpi?.jobsCompleted.formattedValue ?? '—',
            sub: kpi?.jobsCompleted.trend != null ? `${kpi.jobsCompleted.trend > 0 ? '+' : ''}${kpi.jobsCompleted.trend}% vs prior period` : 'Loading…',
            icon: Briefcase,
            loading: kpiQuery.isLoading,
            href: '/jobs',
        },
        {
            title: 'Active Customers',
            value: kpi?.activeCustomers.formattedValue ?? '—',
            sub: 'Current active accounts',
            icon: Users,
            loading: kpiQuery.isLoading,
            href: '/customers',
        },
        {
            title: 'Lead Conversion',
            value: kpi?.leadConversionRate.formattedValue ?? '—',
            sub: kpi?.leadConversionRate.unit ?? 'leads converted',
            icon: CheckCircle,
            loading: kpiQuery.isLoading,
            href: '/customers',
        },
    ]

    // ── Error banner ──────────────────────────────────────────────────────────
    const hasError = kpiQuery.isError || recentJobsQuery.isError

    return (
        <div className="anim-fade-up">

            {/* Error banner */}
            {hasError && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', marginBottom: 16,
                    background: 'var(--red-dim)', borderRadius: 8,
                    color: 'var(--red)', fontSize: 13,
                }}>
                    <AlertCircle size={14} />
                    <span>Some data could not be loaded — services may be offline.</span>
                    <button
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => {
                            kpiQuery.refetch()
                            recentJobsQuery.refetch()
                            appointmentsQuery.refetch()
                        }}
                    >
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            {/* Company welcome header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                marginBottom: 24, padding: '18px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r-lg)',
                borderLeft: '4px solid var(--blue)',
            }}>
                {company?.logoUrl ? (
                    <img
                        src={company.logoUrl}
                        alt={company.name ?? 'Company'}
                        style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'var(--bg-surface)', padding: 4, flexShrink: 0 }}
                    />
                ) : (
                    <div style={{
                        width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#fff', fontSize: 20,
                    }}>
                        {(company?.name ?? 'H')[0].toUpperCase()}
                    </div>
                )}
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--t4)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
                        {getGreeting()}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                        {company?.name ?? 'HVACtor.ai'}
                    </div>
                    {company?.city && (
                        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                            {[company.city, company.state].filter(Boolean).join(', ')}
                        </div>
                    )}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>{kpi?.activeCustomers.formattedValue ?? '—'}</div>
                        <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 500, marginTop: 1 }}>Customers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{kpi?.revenue.formattedValue ?? '—'}</div>
                        <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 500, marginTop: 1 }}>Revenue</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>{kpi?.jobsCompleted.formattedValue ?? '—'}</div>
                        <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 500, marginTop: 1 }}>Jobs Done</div>
                    </div>
                </div>
            </div>

            <ComponentIssuesAlert />

            {/* KPI Cards */}
            <div className="kpi-grid mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <div key={index} className={`kpi-card card-hover anim-fade-up delay-${index + 1}`} style={{ padding: '16px 20px', borderRadius: 'var(--r-md)', cursor: stat.href ? 'pointer' : 'default' }} onClick={() => stat.href && navigate(stat.href)}>
                            <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{stat.title}</div>
                                <Icon size={16} strokeWidth={1.5} color="var(--t3)" />
                            </div>
                            {stat.loading
                                ? <Skeleton h={28} w="60%" />
                                : <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{stat.value}</div>
                            }
                            {stat.sub && !stat.loading && <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>{stat.sub}</div>}
                        </div>
                    )
                })}
            </div>

            <RecommendationsPanel limit={3} />

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
                                revenueQuery.isLoading
                                    ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Skeleton w="80%" h={180} /></div>
                                    : <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Skeleton w="80%" h={180} /></div>}>
                                        <RevenueAreaChart data={revenueData} />
                                    </Suspense>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Status Chart */}
                <div className="card card-hover anim-fade-up delay-3">
                    <div className="card-header mb-4">
                        <div>
                            <div className="card-title">Job Status</div>
                            <div className="card-subtitle">Current period</div>
                        </div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 0 }}>
                        <div style={{ height: 180 }}>
                            {mounted && (
                                jobStatusQuery.isLoading
                                    ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Skeleton w="80%" h={120} /></div>
                                    : <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Skeleton w="80%" h={120} /></div>}>
                                        <JobStatusPieChart data={jobStatusData} />
                                    </Suspense>
                            )}
                        </div>
                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 12 }}>
                            {jobStatusData.map((item, index) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: JOB_STATUS_COLORS[index], flexShrink: 0 }} />
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
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => navigate('/jobs')}
                        >
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
                                {recentJobsQuery.isLoading && (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j}><Skeleton h={14} /></td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                                {!recentJobsQuery.isLoading && paginatedJobs.map(j => {
                                    const s = JOB_STATUS_MAP[j.status] ?? { label: j.status, css: 'badge-neutral' }
                                    const amount = j.finalAmount ?? j.estimatedAmount ?? 0
                                    return (
                                        <tr key={j.id}>
                                            <td><span className="td-mono td-primary">{j.id}</span></td>
                                            <td>
                                                <div className="cell-user">
                                                    <div>
                                                        <span className="cell-name">{j.customerName ?? '—'}</span>
                                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>
                                                            {j.scheduledStart ? new Date(j.scheduledStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{j.title}</td>
                                            <td>{j.assignedToName ?? '—'}</td>
                                            <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                                            <td className="td-primary font-600 text-right">{fmt(amount)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Job Details">
                                                    <Eye size={14} strokeWidth={2.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!recentJobsQuery.isLoading && paginatedJobs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>
                                            No jobs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                    <span className="text-[13px] text-[var(--t3)]">
                        Showing {jobs.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, totalJobs)} of {totalJobs} jobs
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
                            Page {page} of {totalPages}
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

            {/* Bottom row: Upcoming Appointments */}
            <div className="grid-2 mb-5 anim-fade-up delay-4">
                <div className="card card-hover">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Upcoming Appointments</div>
                            <div className="card-subtitle">Next scheduled visits</div>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue)' }}
                            onClick={() => navigate('/scheduling?view=calendar')}
                        >
                            View Calendar <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="card-body mt-3">
                        {appointmentsQuery.isLoading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} h={60} />
                                ))}
                            </div>
                        )}
                        {!appointmentsQuery.isLoading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {appointments.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--t4)', padding: '16px 0', fontSize: 13 }}>
                                        No upcoming appointments
                                    </div>
                                )}
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '10px 12px', borderRadius: 'var(--r-lg)',
                                            background: 'var(--bg-hover)', transition: 'background var(--dur-fast)', cursor: 'default',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-active)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    >
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 'var(--r-md)',
                                            background: 'var(--blue-dim)', display: 'flex',
                                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {new Date(apt.scheduledStart).toLocaleDateString('en-GB', { month: 'short' })}
                                            </span>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)', lineHeight: 1.1 }}>
                                                {new Date(apt.scheduledStart).getDate()}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {apt.serviceType ?? 'Service'}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>{apt.customerName ?? '—'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Clock size={11} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                                                <span style={{ fontSize: 11, color: 'var(--t4)' }}>
                                                    {new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {apt.technicianName && (
                                                    <>
                                                        <span style={{ fontSize: 11, color: 'var(--t4)' }}>·</span>
                                                        <span style={{ fontSize: 11, color: 'var(--t4)' }}>{apt.technicianName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Outstanding invoices summary */}
                <div className="card card-hover">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Finance Summary</div>
                            <div className="card-subtitle">Outstanding & overdue</div>
                        </div>
                    </div>
                    <div className="card-body mt-3">
                        {kpiQuery.isLoading
                            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={40} /><Skeleton h={40} /></div>
                            : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-hover)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Outstanding Invoices</div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>
                                            {kpi?.outstandingInvoices.formattedValue ?? '—'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>{kpi?.outstandingInvoices.unit}</div>
                                    </div>
                                    <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-hover)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>Avg Rating</div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>
                                            ★ {kpi?.avgRating.formattedValue ?? '—'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>customer satisfaction</div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
