import { useState } from 'react';
import {
    Briefcase, CheckCircle, Clock,
    ChevronLeft, ChevronRight, Eye, Plus,
    Search, XCircle, X
} from 'lucide-react';
import { jobs as initialJobs } from '../../data/mockData';
import JobDetailModal from './JobDetailModal';
import BookServiceModal from './BookServiceModal';
import CancelJobModal from './CancelJobModal';

const STATUS_MAP: Record<string, { label: string; css: string }> = {
    completed: { label: 'Completed', css: 'badge-green' },
    scheduled: { label: 'Scheduled', css: 'badge-violet' },
    pending: { label: 'Pending', css: 'badge-amber' },
    cancelled: { label: 'Cancelled', css: 'badge-red' },
};

const ITEMS_PER_PAGE = 10;

export default function MyJobs() {
    const [jobs, setJobs] = useState(initialJobs);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showBook, setShowBook] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [jobToCancel, setJobToCancel] = useState<any>(null);

    const filtered = jobs.filter(job => {
        const matchSearch =
            job.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.technician.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || job.status === statusFilter;
        const matchType = typeFilter === 'all' ||
            (typeFilter === 'maintenance' && job.service.toLowerCase().includes('maintenance')) ||
            (typeFilter === 'repair' && job.service.toLowerCase().includes('repair')) ||
            (typeFilter === 'installation' && job.service.toLowerCase().includes('installation'));
        return matchSearch && matchStatus && matchType;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const completedCount = jobs.filter(j => j.status === 'completed').length;
    const scheduledCount = jobs.filter(j => j.status === 'scheduled').length;
    const pendingCount = jobs.filter(j => j.status === 'pending').length;

    const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all' || searchQuery;

    const clearFilters = () => {
        setSearchQuery(''); setStatusFilter('all');
        setTypeFilter('all'); setDateFilter('all'); setPage(1);
    };

    const openDetail = (job: any) => { setSelectedJob(job); setShowDetail(true); };
    const openCancel = (job: any) => { setJobToCancel(job); setShowCancel(true); };

    const handleBooked = (newJob: any) => {
        setJobs(prev => [newJob, ...prev]);
    };

    const handleCancelConfirm = (jobId: string) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j));
    };

    const statCards = [
        { title: 'Completed', value: completedCount, icon: CheckCircle },
        { title: 'Scheduled', value: scheduledCount, icon: Clock },
        { title: 'Pending', value: pendingCount, icon: Briefcase },
        { title: 'Total Jobs', value: jobs.length, icon: Briefcase },
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

            <div className="card card-hover anim-fade-up delay-2">
                <div className="card-body" style={{ paddingBottom: 0 }}>
                    <div className="filter-bar">
                        <div className="filter-search">
                            <Search size={13} color="var(--t4)" />
                            <input
                                placeholder="Search jobs, services, technicians…"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select className="select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select className="select" style={{ width: 140 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Types</option>
                            <option value="repair">Repair</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="installation">Installation</option>
                        </select>
                        <select className="select" style={{ width: 150 }} value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                        {hasActiveFilters && (
                            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={clearFilters}>
                                <X size={12} /> Clear
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setShowBook(true)}>
                            <Plus size={13} /> New Service
                        </button>
                    </div>
                </div>

                <div className="card-body-flush">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Job ID</th>
                                    <th>Service</th>
                                    <th>Date</th>
                                    <th>Technician</th>
                                    <th>Status</th>
                                    <th>Cost</th>
                                    <th style={{ textAlign: 'left', width: 120 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length > 0 ? (
                                    paginated.map(job => {
                                        const s = STATUS_MAP[job.status] || { label: job.status, css: 'badge-neutral' };
                                        return (
                                            <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(job)}>
                                                <td><span className="td-mono td-primary">{job.id}</span></td>
                                                <td>
                                                    <div className="font-600" style={{ color: 'var(--t1)', fontSize: 13 }}>{job.service}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{job.description}</div>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{job.date}</td>
                                                <td>{job.technician}</td>
                                                <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                                                <td className="td-primary font-600">${job.cost}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                                                        <button title="View Details" onClick={() => openDetail(job)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                                            onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                                                            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                                            <Eye size={15} />
                                                        </button>
                                                        {(job.status === 'pending' || job.status === 'scheduled') && (
                                                            <button title="Cancel Job" onClick={() => openCancel(job)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                                                onMouseOver={e => (e.currentTarget.style.background = '#FEE2E2')}
                                                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="empty-state">
                                                <div className="empty-icon"><Briefcase size={22} /></div>
                                                <div className="empty-title">No jobs match your filters</div>
                                                {hasActiveFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="table-footer">
                    <span className="table-count">
                        Showing {filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to{' '}
                        {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} jobs
                    </span>
                    <div className="pagination">
                        <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
                        <span className="pagination-label">Page {page} of {totalPages}</span>
                        <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={15} /></button>
                    </div>
                </div>
            </div>

            <JobDetailModal isOpen={showDetail} onClose={() => setShowDetail(false)} job={selectedJob} />
            <BookServiceModal isOpen={showBook} onClose={() => setShowBook(false)} onBooked={handleBooked} />
            <CancelJobModal isOpen={showCancel} onClose={() => setShowCancel(false)} job={jobToCancel} onConfirm={handleCancelConfirm} />
        </div>
    );
}
