import { useState } from 'react'
import { DollarSign, FileText, AlertCircle, TrendingUp, Plus, CreditCard, Maximize2, Minimize2, ChevronLeft, ChevronRight, Search, Mail, Edit2, Eye, CheckCircle, Trash2, Receipt } from 'lucide-react'

const INVOICES = [
    { id: 'INV-0895', customer: 'Tech Solutions Inc.', color: '#06B6D4', amount: 4800, issued: '2026-03-01', due: '2026-03-31', status: 'sent', age: 2, jobRef: 'JOB-1204' },
    { id: 'INV-0894', customer: 'Sarah Williams', color: '#10B981', amount: 2400, issued: '2026-02-28', due: '2026-03-28', status: 'paid', age: 3, jobRef: 'JOB-1200' },
    { id: 'INV-0893', customer: 'Robert Chen', color: '#8B5CF6', amount: 1100, issued: '2026-02-27', due: '2026-03-27', status: 'paid', age: 4, jobRef: 'JOB-1199' },
    { id: 'INV-0892', customer: 'David Kim', color: '#EF4444', amount: 1400, issued: '2026-02-01', due: '2026-03-01', status: 'overdue', age: 30, jobRef: 'JOB-1180' },
    { id: 'INV-0891', customer: 'Clifford Johnson', color: '#3B82F6', amount: 385, issued: '2026-02-25', due: '2026-03-25', status: 'draft', age: 6, jobRef: 'JOB-1198' },
]

const QUOTES = [
    { id: 'QUO-0234', customer: 'Jennifer Adams', color: '#3B82F6', service: 'HVAC System Install', amount: 6800, status: 'sent', exp: 'Mar 15, 2026', jobRef: 'Est. #120' },
    { id: 'QUO-0233', customer: 'Carlos Rivera', color: '#10B981', service: 'AC Seasonal Tune-Up', amount: 280, status: 'accepted', exp: 'Mar 10, 2026', jobRef: 'JOB-1203' },
    { id: 'QUO-0232', customer: 'Laura White', color: '#8B5CF6', service: 'Electrical Panel Upgrade', amount: 2200, status: 'draft', exp: 'Mar 20, 2026', jobRef: 'Est. #118' },
]

const EXPENSES = [
    { id: 'EXP-1042', category: 'Materials', vendor: 'HVAC Wholesalers Ltd', date: '2026-03-05', amount: 1250, status: 'paid', reference: 'JOB-1204', invoiceNo: 'INV-0895' },
    { id: 'EXP-1041', category: 'Labour', vendor: 'Mike Davis (Contract)', date: '2026-03-04', amount: 450, status: 'pending', reference: 'JOB-1200', invoiceNo: 'INV-0894' },
    { id: 'EXP-1040', category: 'Fuel', vendor: 'Shell Stations', date: '2026-03-03', amount: 85, status: 'paid', reference: 'Fleet', invoiceNo: '—' },
    { id: 'EXP-1039', category: 'Equipment', vendor: 'Tool Master', date: '2026-03-01', amount: 890, status: 'paid', reference: 'Internal', invoiceNo: '—' },
]

const INV_CSS: Record<string, string> = { sent: 'badge-blue', paid: 'badge-green', overdue: 'badge-red', draft: 'badge-neutral', partial: 'badge-amber' }
const QUO_CSS: Record<string, string> = { sent: 'badge-blue', accepted: 'badge-green', draft: 'badge-neutral', rejected: 'badge-red', expired: 'badge-amber' }
const EXP_CSS: Record<string, string> = { paid: 'badge-green', pending: 'badge-amber', rejected: 'badge-red' }


export default function Finance() {
    const [tab, setTab] = useState<'invoices' | 'quotes' | 'expenses'>('invoices')
    const [isExpanded, setIsExpanded] = useState(false)
    const [invPage, setInvPage] = useState(1)
    const [invSearch, setInvSearch] = useState('')
    const [invStatus, setInvStatus] = useState('all')
    const [quoPage, setQuoPage] = useState(1)
    const [quoSearch, setQuoSearch] = useState('')
    const [quoStatus, setQuoStatus] = useState('all')
    const [expPage, setExpPage] = useState(1)
    const [expSearch, setExpSearch] = useState('')
    const [expStatus, setExpStatus] = useState('all')
    const itemsPerPage = 10

    const filteredInvoices = INVOICES.filter(inv => {
        const matchSearch = inv.id.toLowerCase().includes(invSearch.toLowerCase()) ||
            inv.customer.toLowerCase().includes(invSearch.toLowerCase());
        const matchStatus = invStatus === 'all' || inv.status === invStatus;
        return matchSearch && matchStatus;
    });

    const totalInvPages = Math.ceil(filteredInvoices.length / itemsPerPage)
    const paginatedInvoices = filteredInvoices.slice((invPage - 1) * itemsPerPage, invPage * itemsPerPage)

    const filteredQuotes = QUOTES.filter(quo => {
        const matchSearch = quo.id.toLowerCase().includes(quoSearch.toLowerCase()) ||
            quo.customer.toLowerCase().includes(quoSearch.toLowerCase()) ||
            quo.service.toLowerCase().includes(quoSearch.toLowerCase());
        const matchStatus = quoStatus === 'all' || quo.status === quoStatus;
        return matchSearch && matchStatus;
    });

    const totalQuoPages = Math.ceil(filteredQuotes.length / itemsPerPage)
    const paginatedQuotes = filteredQuotes.slice((quoPage - 1) * itemsPerPage, quoPage * itemsPerPage)

    const filteredExpenses = EXPENSES.filter(exp => {
        const matchSearch = exp.id.toLowerCase().includes(expSearch.toLowerCase()) ||
            exp.category.toLowerCase().includes(expSearch.toLowerCase()) ||
            exp.vendor.toLowerCase().includes(expSearch.toLowerCase()) ||
            exp.reference.toLowerCase().includes(expSearch.toLowerCase());
        const matchStatus = expStatus === 'all' || exp.status === expStatus;
        return matchSearch && matchStatus;
    });

    const totalExpPages = Math.ceil(filteredExpenses.length / itemsPerPage)
    const paginatedExpenses = filteredExpenses.slice((expPage - 1) * itemsPerPage, expPage * itemsPerPage)

    return (
        <div className="anim-fade-up">

            {/* KPIs */}
            {!isExpanded && (
                <>
                    <div className="kpi-grid mb-5">
                        {[
                            { icon: DollarSign, g: 'kpi-grad-green', v: '$81,240', l: 'Revenue This Month', sub: '↑12.4% vs Feb', delta: '+12.4%', up: true },
                            { icon: FileText, g: 'kpi-grad-blue', v: '$14,800', l: 'Accounts Receivable', sub: '8 open invoices', delta: '', up: true },
                            { icon: AlertCircle, g: 'kpi-grad-red', v: '$1,400', l: 'Overdue Balance', sub: '1 invoice 30d+', delta: '!', up: false },
                            { icon: TrendingUp, g: 'kpi-grad-violet', v: '68%', l: 'Gross Profit Margin', sub: 'vs 61% last yr', delta: '+7pp', up: true },
                            { icon: CreditCard, g: 'kpi-grad-cyan', v: '$6,800', l: 'Pending Quotes', sub: '3 awaiting sign', delta: 'New', up: true },
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
                </>
            )}

            <div className="page-tabs">
                <button className={`tab-btn ${tab === 'invoices' ? 'active' : ''}`} onClick={() => setTab('invoices')}>
                    <FileText size={14} /> Invoices <span className="tab-count">5</span>
                </button>
                <button className={`tab-btn ${tab === 'quotes' ? 'active' : ''}`} onClick={() => setTab('quotes')}>
                    <DollarSign size={14} /> Quotes <span className="tab-count">3</span>
                </button>
                <button className={`tab-btn ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
                    <CreditCard size={14} /> Expenses
                </button>
            </div>

            {tab === 'invoices' && (
                <div className="card anim-fade-in">
                    <div className="card-body" style={{ paddingBottom: 0 }}>
                        <div className="filter-bar">
                            <div className="filter-search">
                                <Search size={13} color="var(--t4)" />
                                <input placeholder="Search invoices…" value={invSearch} onChange={e => { setInvSearch(e.target.value); setInvPage(1); }} />
                            </div>
                            <select className="select" style={{ width: 140 }} value={invStatus} onChange={e => { setInvStatus(e.target.value); setInvPage(1); }}>
                                <option value="all">All Status</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="draft">Draft</option>
                            </select>
                            <div className="flex items-center gap-2 ml-auto">
                                <button className="btn btn-primary btn-sm" id="btn-create-invoice"><Plus size={12} /> Create Invoice</button>
                                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse View" : "Expand View"}>
                                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body-flush mt-2">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Invoice NO:</th>
                                        <th style={{ textAlign: 'left' }}>Job Ref</th>
                                        <th style={{ textAlign: 'left' }}>Customer</th>
                                        <th style={{ textAlign: 'left' }}>Amount</th>
                                        <th style={{ textAlign: 'left' }}>Issue Date</th>
                                        <th style={{ textAlign: 'left' }}>Due Date</th>
                                        <th style={{ textAlign: 'left' }}>Status</th>
                                        <th style={{ textAlign: 'left' }}>Age</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td><span className="td-mono td-primary">{inv.id}</span></td>
                                            <td>
                                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                                                    {inv.jobRef}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-user">
                                                    <span className="cell-name">{inv.customer}</span>
                                                </div>
                                            </td>
                                            <td className="td-primary font-600">${inv.amount.toLocaleString()}</td>
                                            <td className="text-sm text-3">{inv.issued}</td>
                                            <td className="text-sm">{inv.due}</td>
                                            <td>
                                                <span className={`badge ${INV_CSS[inv.status]}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td><span className={`text-xs font-500 ${inv.status === 'overdue' ? 'text-red' : ''}`}>{inv.age}d</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => window.dispatchEvent(new CustomEvent("open-invoice-detail", { detail: inv }))} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Invoice">
                                                        <Eye size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Send Email">
                                                        <Mail size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Edit Invoice">
                                                        <Edit2 size={14} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                        <span className="text-[13px] text-[var(--t3)]">
                            Showing {filteredInvoices.length > 0 ? (invPage - 1) * itemsPerPage + 1 : 0} to {Math.min(invPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setInvPage(p => Math.max(1, p - 1))}
                                disabled={invPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-[13px] text-[var(--t2)] mx-2">
                                Page {invPage} of {Math.max(1, totalInvPages)}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setInvPage(p => Math.min(totalInvPages, p + 1))}
                                disabled={invPage === totalInvPages || totalInvPages === 0}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'quotes' && (
                <div className="card anim-fade-in">
                    <div className="card-body" style={{ paddingBottom: 0 }}>
                        <div className="filter-bar">
                            <div className="filter-search">
                                <Search size={13} color="var(--t4)" />
                                <input placeholder="Search quotes…" value={quoSearch} onChange={e => { setQuoSearch(e.target.value); setQuoPage(1); }} />
                            </div>
                            <select className="select" style={{ width: 140 }} value={quoStatus} onChange={e => { setQuoStatus(e.target.value); setQuoPage(1); }}>
                                <option value="all">All Status</option>
                                <option value="sent">Sent</option>
                                <option value="accepted">Accepted</option>
                                <option value="draft">Draft</option>
                                <option value="rejected">Rejected</option>
                                <option value="expired">Expired</option>
                            </select>
                            <div className="flex items-center gap-2 ml-auto">
                                <button className="btn btn-primary btn-sm" id="btn-create-quote"><Plus size={12} /> Create Quote</button>
                                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse View" : "Expand View"}>
                                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body-flush mt-2">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Quote NO:</th>
                                        <th style={{ textAlign: 'left' }}>Job Ref</th>
                                        <th style={{ textAlign: 'left' }}>Customer</th>
                                        <th style={{ textAlign: 'left' }}>Service</th>
                                        <th style={{ textAlign: 'left' }}>Amount</th>
                                        <th style={{ textAlign: 'left' }}>Expires</th>
                                        <th style={{ textAlign: 'left' }}>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuotes.map(q => (
                                        <tr key={q.id}>
                                            <td><span className="td-mono td-primary">{q.id}</span></td>
                                            <td>
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                                    {q.jobRef}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-user">
                                                    <span className="cell-name">{q.customer}</span>
                                                </div>
                                            </td>
                                            <td>{q.service}</td>
                                            <td className="td-primary font-600">${q.amount.toLocaleString()}</td>
                                            <td className="text-sm text-3">{q.exp}</td>
                                            <td><span className={`badge ${QUO_CSS[q.status]}`}>{q.status}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => window.dispatchEvent(new CustomEvent("open-quote-detail", { detail: q }))} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Quote">
                                                        <Eye size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Quote">
                                                        <Edit2 size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors" title="Convert to Invoice">
                                                        <CheckCircle size={14} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                        <span className="text-[13px] text-[var(--t3)]">
                            Showing {filteredQuotes.length > 0 ? (quoPage - 1) * itemsPerPage + 1 : 0} to {Math.min(quoPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length} quotes
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setQuoPage(p => Math.max(1, p - 1))}
                                disabled={quoPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-[13px] text-[var(--t2)] mx-2">
                                Page {quoPage} of {Math.max(1, totalQuoPages)}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setQuoPage(p => Math.min(totalQuoPages, p + 1))}
                                disabled={quoPage === totalQuoPages || totalQuoPages === 0}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'expenses' && (
                <div className="card anim-fade-in">
                    <div className="card-body" style={{ paddingBottom: 0 }}>
                        <div className="filter-bar">
                            <div className="filter-search">
                                <Search size={13} color="var(--t4)" />
                                <input placeholder="Search expenses…" value={expSearch} onChange={e => { setExpSearch(e.target.value); setExpPage(1); }} />
                            </div>
                            <select className="select" style={{ width: 140 }} value={expStatus} onChange={e => { setExpStatus(e.target.value); setExpPage(1); }}>
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                            <div className="flex items-center gap-2 ml-auto">
                                <button className="btn btn-primary btn-sm" id="btn-create-expense"><Plus size={12} /> Log Expense</button>
                                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Collapse View" : "Expand View"}>
                                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body-flush mt-2">
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Expense NO:</th>
                                        <th style={{ textAlign: 'left' }}>Invoice NO:</th>
                                        <th style={{ textAlign: 'left' }}>Job Ref</th>
                                        <th style={{ textAlign: 'left' }}>Category</th>
                                        <th style={{ textAlign: 'left' }}>Vendor</th>
                                        <th style={{ textAlign: 'left' }}>Date</th>
                                        <th style={{ textAlign: 'left' }}>Amount</th>
                                        <th style={{ textAlign: 'left' }}>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedExpenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td><span className="td-mono td-primary">{exp.id}</span></td>
                                            <td><span className="text-sm font-500 text-[var(--t2)]">{exp.invoiceNo}</span></td>
                                            <td>
                                                <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                                                    {exp.reference}
                                                </span>
                                            </td>
                                            <td><span className="font-600 text-[13px]">{exp.category}</span></td>
                                            <td className="text-sm text-2">{exp.vendor}</td>
                                            <td className="text-sm text-3">{exp.date}</td>
                                            <td className="td-primary font-700">${exp.amount.toLocaleString()}</td>
                                            <td><span className={`badge ${EXP_CSS[exp.status]}`}>{exp.status}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => window.dispatchEvent(new CustomEvent("open-expense-detail", { detail: exp }))} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="View Receipt">
                                                        <Receipt size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Expense">
                                                        <Edit2 size={14} strokeWidth={2.5} />
                                                    </button>
                                                    <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete Expense">
                                                        <Trash2 size={14} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                        <span className="text-[13px] text-[var(--t3)]">
                            Showing {filteredExpenses.length > 0 ? (expPage - 1) * itemsPerPage + 1 : 0} to {Math.min(expPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setExpPage(p => Math.max(1, p - 1))}
                                disabled={expPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-[13px] text-[var(--t2)] mx-2">
                                Page {expPage} of {Math.max(1, totalExpPages)}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                                style={{ width: 32, height: 32 }}
                                onClick={() => setExpPage(p => Math.min(totalExpPages, p + 1))}
                                disabled={expPage === totalExpPages || totalExpPages === 0}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
