import { useState } from 'react';
import {
    Download, Eye, ChevronLeft, ChevronRight,
    CheckCircle, Clock, AlertCircle, FileText,
    Search, CreditCard, X
} from 'lucide-react';
import { invoices as mockInvoices } from '../../data/mockData';
import InvoiceDetailModal from './InvoiceDetailModal';
import PayInvoiceModal from './PayInvoiceModal';

const STATUS_MAP: Record<string, { label: string; css: string }> = {
    paid: { label: 'Paid', css: 'badge-green' },
    pending: { label: 'Pending', css: 'badge-amber' },
    overdue: { label: 'Overdue', css: 'badge-red' },
};

const ITEMS_PER_PAGE = 10;

export default function Invoices() {
    const [invoices, setInvoices] = useState(mockInvoices || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [amountFilter, setAmountFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showPay, setShowPay] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState<any>(null);

    const filtered = invoices.filter(inv => {
        const matchSearch =
            inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.items[0] || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
        const matchAmount = amountFilter === 'all' ||
            (amountFilter === 'under200' && inv.amount < 200) ||
            (amountFilter === '200to500' && inv.amount >= 200 && inv.amount <= 500) ||
            (amountFilter === 'over500' && inv.amount > 500);
        return matchSearch && matchStatus && matchAmount;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const paidTotal = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const overdueTotal = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

    const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || amountFilter !== 'all' || searchQuery;

    const clearFilters = () => {
        setSearchQuery(''); setStatusFilter('all'); setDateFilter('all'); setAmountFilter('all'); setPage(1);
    };

    const openDetail = (inv: any) => { setSelectedInvoice(inv); setShowDetail(true); };
    const openPay = (inv: any) => { setInvoiceToPay(inv); setShowPay(true); };

    const handlePaid = (invoiceId: string) => {
        setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'paid' } : i));
    };

    const statCards = [
        { title: 'Total Paid', value: `$${paidTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'paid').length} invoices`, icon: CheckCircle },
        { title: 'Pending', value: `$${pendingTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'pending').length} invoices`, icon: Clock },
        { title: 'Overdue', value: `$${overdueTotal.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'overdue').length} invoices`, icon: AlertCircle },
        { title: 'Total Invoices', value: String(invoices.length), sub: 'All time', icon: FileText },
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
                            <div className="kpi-sub">{stat.sub}</div>
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
                                placeholder="Search invoices, services…"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select className="select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>
                        <select className="select" style={{ width: 150 }} value={amountFilter} onChange={e => { setAmountFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Amounts</option>
                            <option value="under200">Under $200</option>
                            <option value="200to500">$200 – $500</option>
                            <option value="over500">Over $500</option>
                        </select>
                        <select className="select" style={{ width: 150 }} value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Dates</option>
                            <option value="month">This Month</option>
                            <option value="quarter">Last 3 Months</option>
                            <option value="year">This Year</option>
                        </select>
                        {hasActiveFilters && (
                            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={clearFilters}>
                                <X size={12} /> Clear
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Download size={13} /> Export
                        </button>
                    </div>
                </div>

                <div className="card-body-flush">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Service</th>
                                    <th>Date</th>
                                    <th>Due Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'left', width: 130 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length > 0 ? (
                                    paginated.map(invoice => {
                                        const s = STATUS_MAP[invoice.status] || { label: invoice.status, css: 'badge-neutral' };
                                        return (
                                            <tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(invoice)}>
                                                <td><span className="td-mono td-primary">{invoice.id}</span></td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--t1)', fontSize: 13 }}>{invoice.items[0] || '-'}</div>
                                                    {invoice.items.length > 1 && (
                                                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>+{invoice.items.length - 1} more</div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{invoice.date}</td>
                                                <td style={{ fontSize: 12, color: invoice.status === 'overdue' ? 'var(--red)' : 'var(--t3)' }}>{invoice.dueDate}</td>
                                                <td className="td-primary font-600">${invoice.amount.toLocaleString()}</td>
                                                <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                                                        <button title="View Invoice" onClick={() => openDetail(invoice)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                                            onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                                                            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                                            <Eye size={15} />
                                                        </button>
                                                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                                            <button title="Pay Now" onClick={() => openPay(invoice)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--green)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                                                onMouseOver={e => (e.currentTarget.style.background = '#F0FDF4')}
                                                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                                                <CreditCard size={15} />
                                                            </button>
                                                        )}
                                                        {invoice.status === 'paid' && (
                                                            <button title="Download PDF"
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                                                onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                                                <Download size={15} />
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
                                                <div className="empty-icon"><FileText size={22} /></div>
                                                <div className="empty-title">No invoices match your filters</div>
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
                        {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} invoices
                    </span>
                    <div className="pagination">
                        <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
                        <span className="pagination-label">Page {page} of {totalPages}</span>
                        <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={15} /></button>
                    </div>
                </div>
            </div>

            <InvoiceDetailModal isOpen={showDetail} onClose={() => setShowDetail(false)} invoice={selectedInvoice} />
            <PayInvoiceModal isOpen={showPay} onClose={() => setShowPay(false)} invoice={invoiceToPay} onPaid={handlePaid} />
        </div>
    );
}
