import { useState } from 'react';
import {
    CheckCircle, Clock, DollarSign, FileText,
    ChevronRight, User, Calendar, AlertCircle, ArrowRight,
    ChevronLeft, Eye
} from 'lucide-react';
import { jobs, invoices, appointments } from '../data/mockData';

const JOB_STATUS: Record<string, { label: string; css: string }> = {
    completed: { label: 'Completed', css: 'badge-green' },
    scheduled: { label: 'Scheduled', css: 'badge-violet' },
    pending: { label: 'Pending', css: 'badge-amber' },
};

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
    const [page, setPage] = useState(1);

    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const totalSpent = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const upcomingCount = appointments.length;

    const totalPages = Math.max(1, Math.ceil(jobs.length / ITEMS_PER_PAGE));
    const paginatedJobs = jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const statCards = [
        {
            title: 'Jobs Completed',
            value: String(completedJobs),
            sub: '+100% this month',
            icon: CheckCircle,
            grad: 'kpi-grad-blue',
        },
        {
            title: 'Upcoming',
            value: String(upcomingCount),
            sub: 'Appointments scheduled',
            icon: Calendar,
            grad: 'kpi-grad-amber',
        },
        {
            title: 'Pending Invoices',
            value: String(pendingInvoices.length),
            sub: 'Action needed',
            icon: FileText,
            grad: 'kpi-grad-violet',
        },
        {
            title: 'Total Spent',
            value: `$${totalSpent.toLocaleString()}`,
            sub: 'All time',
            icon: DollarSign,
            grad: 'kpi-grad-green',
        },
    ];

    return (
        <div className="anim-fade-up">
            <div className="kpi-grid mb-5">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`kpi-card card-hover anim-fade-up delay-${index + 1}`}>
                            <div className="kpi-card-top">
                                <div className="kpi-label">{stat.title}</div>
                                <Icon size={16} strokeWidth={1.5} color="var(--t3)" />
                            </div>
                            <div className="kpi-value">{stat.value}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Recent Jobs */}
                <div className="card card-hover anim-fade-up delay-2">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Recent Jobs</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue)' }}>
                            View All <ChevronRight size={12} />
                        </button>
                    </div>

                    <div className="card-body-flush" style={{ marginTop: 12 }}>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Date</th>
                                        <th>Technician</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedJobs.map((job) => {
                                        const s = JOB_STATUS[job.status] || { label: job.status, css: 'badge-neutral' };
                                        return (
                                            <tr key={job.id}>
                                                <td className="td-primary">{job.service}</td>
                                                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{job.date}</td>
                                                <td>{job.technician}</td>
                                                <td>
                                                    <span className={`badge ${s.css}`}>{s.label}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button className="action-btn" title="View Details">
                                                        <Eye size={13} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="table-footer">
                            <span className="table-count">
                                Showing {jobs.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
                                {Math.min(page * ITEMS_PER_PAGE, jobs.length)} of {jobs.length} jobs
                            </span>
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="pagination-label">Page {page} of {totalPages}</span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card card-hover anim-fade-up delay-3">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Next Appointment</div>
                            <div className="card-subtitle">Upcoming scheduled visit</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {appointments.length > 0 ? (
                            <div style={{
                                padding: 14,
                                borderRadius: 'var(--r-lg)',
                                background: 'var(--blue-dim)',
                                border: '1px solid var(--bd-md)',
                                display: 'flex',
                                gap: 12
                            }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 'var(--r-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--bd)',
                                    fontSize: 11,
                                    color: 'var(--t3)',
                                    fontWeight: 600,
                                    flexShrink: 0
                                }}>
                                    <span style={{ fontSize: 10, textTransform: 'uppercase' }}>Feb</span>
                                    <span style={{ fontSize: 20, color: 'var(--blue)', fontWeight: 700, lineHeight: 1 }}>20</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                                        {appointments[0].service}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={11} /> {appointments[0].time}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <User size={11} /> {appointments[0].technician}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>
                                <Calendar size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                <div style={{ fontSize: 13 }}>No upcoming appointments</div>
                            </div>
                        )}

                        {appointments.slice(1).map((apt, i) => (
                            <div key={i} style={{
                                marginTop: 10,
                                padding: '10px 12px',
                                borderRadius: 'var(--r-md)',
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--bd)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--r)',
                                    background: 'var(--blue-dim)', display: 'flex',
                                    flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0
                                }}>
                                    <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>Feb</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{20 + i + 1}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{apt.service}</div>
                                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>{apt.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {pendingInvoices.length > 0 && (
                <div className="card anim-fade-up delay-4" style={{
                    borderColor: 'var(--amber)',
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    background: 'white',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(217, 119, 6, 0.15)'
                        }}>
                            <AlertCircle size={20} color="var(--amber)" />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                                Pending Invoices
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                                You have {pendingInvoices.length} invoice(s) totaling{' '}
                                <span style={{ fontWeight: 600 }}>
                                    ${pendingInvoices.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary">
                        Pay Now <ArrowRight size={12} />
                    </button>
                </div>
            )}
        </div>
    );
}
