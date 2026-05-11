import { useState, useMemo } from 'react'
import { DollarSign, FileText, AlertCircle, TrendingUp, Plus, CreditCard, Maximize2, Minimize2, ChevronLeft, ChevronRight, Search, Mail, Edit2, Eye, CheckCircle, Trash2, Receipt, RefreshCw } from 'lucide-react'
import { useInvoices, useQuotes, useExpenses, useFinanceKpis, decimalToNumber, useDeleteExpense, useSendInvoice } from '../../hooks/useFinance'
import { useJobs } from '../../hooks/useJobs'
import { useToast } from '../../contexts/ToastContext'
import type { Invoice, Quote, Expense } from '../../types/api'
import AddQuoteModal from './AddQuoteModal'
import AddInvoiceModal from './AddInvoiceModal'
import AddExpenseModal from './AddExpenseModal'
import RecommendationsPanel from '../../components/RecommendationsPanel'
import { humanizeStatus, normalizeStatus } from '../../lib/format'

// ─── Status CSS maps (backend UPPER_CASE = source of truth) ───────────────────
// All map keys are UPPER_SNAKE_CASE to match backend Prisma enums. Lookups
// normalize via normalizeStatus() so any unexpected casing is handled at one
// callsite, not by mirrored map entries.

const INV_CSS: Record<string, string> = {
  DRAFT: 'badge-neutral', SENT: 'badge-blue', PARTIALLY_PAID: 'badge-amber',
  PAID: 'badge-green', OVERDUE: 'badge-red', CANCELLED: 'badge-red', VOID: 'badge-neutral',
}
const QUO_CSS: Record<string, string> = {
  DRAFT: 'badge-neutral', SENT: 'badge-blue', VIEWED: 'badge-blue', ACCEPTED: 'badge-green',
  REJECTED: 'badge-red', DECLINED: 'badge-red', EXPIRED: 'badge-amber', CONVERTED: 'badge-cyan',
}
const EXP_CSS: Record<string, string> = {
  DRAFT: 'badge-neutral', PENDING: 'badge-amber', APPROVED: 'badge-blue',
  REJECTED: 'badge-red', PAID: 'badge-green',
}

function Skeleton({ h = 14 }: { h?: number }) {
  return <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

function fmtDecimal(val: string | number | undefined | null): string {
  const n = decimalToNumber(val)
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Finance() {
  const { showError, showSuccess } = useToast()
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
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false)
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const itemsPerPage = 10

  // ── API ───────────────────────────────────────────────────────────────────

  const kpiQuery = useFinanceKpis()
  const invoicesQuery = useInvoices({ page: invPage, limit: itemsPerPage, search: invSearch || undefined, status: invStatus !== 'all' ? invStatus : undefined })
  const quotesQuery = useQuotes({ page: quoPage, limit: itemsPerPage, search: quoSearch || undefined, status: quoStatus !== 'all' ? quoStatus : undefined })
  const expensesQuery = useExpenses({ page: expPage, limit: itemsPerPage, search: expSearch || undefined, status: expStatus !== 'all' ? expStatus : undefined })

  const invoices: Invoice[] = invoicesQuery.data?.data ?? []
  const totalInvoices = invoicesQuery.data?.total ?? 0
  const totalInvPages = Math.max(1, invoicesQuery.data?.totalPages ?? 1)

  const quotes: Quote[] = quotesQuery.data?.data ?? []
  const totalQuotes = quotesQuery.data?.total ?? 0
  const totalQuoPages = Math.max(1, quotesQuery.data?.totalPages ?? 1)

  const expenses: Expense[] = expensesQuery.data?.data ?? []
  const totalExpenses = expensesQuery.data?.total ?? 0
  const totalExpPages = Math.max(1, expensesQuery.data?.totalPages ?? 1)

  // Look up job titles for invoices/quotes/expenses
  const jobsLookupQuery = useJobs({ limit: 200 })
  const jobTitleMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const j of jobsLookupQuery.data?.data ?? []) {
      map[j.id] = j.title
    }
    return map
  }, [jobsLookupQuery.data])

  const getJobTitle = (jobId: string | undefined) => {
    if (!jobId) return null
    return jobTitleMap[jobId] || null
  }

  const kpi = kpiQuery.data
  const deleteExpense = useDeleteExpense()
  const sendInvoice = useSendInvoice()

  return (
    <div className="anim-fade-up">

      {/* KPIs */}
      {!isExpanded && (
        <div className="kpi-grid mb-5">
          {[
            { icon: DollarSign, v: kpi?.revenue.formattedValue ?? '—', l: 'Revenue This Month', loading: kpiQuery.isLoading },
            { icon: FileText, v: kpi?.outstandingInvoices.formattedValue ?? '—', l: 'Accounts Receivable', loading: kpiQuery.isLoading },
            { icon: AlertCircle, v: '—', l: 'Overdue Balance', loading: false },
            { icon: TrendingUp, v: '—', l: 'Gross Profit Margin', loading: false },
            { icon: CreditCard, v: '—', l: 'Pending Quotes', loading: false },
          ].map(k => (
            <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)' }}>
              <div className="kpi-card-top" style={{ marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="kpi-label" style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, margin: 0 }}>{k.l}</div>
                <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
              </div>
              {k.loading ? <Skeleton h={28} /> : <div className="kpi-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>{k.v}</div>}
            </div>
          ))}
        </div>
      )}

      {!isExpanded && <RecommendationsPanel filterActions={['discount_20', 'increase_price', 'geo_target_discount']} />}

      <div className="page-tabs">
        <button className={`tab-btn ${tab === 'invoices' ? 'active' : ''}`} onClick={() => setTab('invoices')}>
          <FileText size={14} /> Invoices <span className="tab-count">{totalInvoices}</span>
        </button>
        <button className={`tab-btn ${tab === 'quotes' ? 'active' : ''}`} onClick={() => setTab('quotes')}>
          <DollarSign size={14} /> Quotes <span className="tab-count">{totalQuotes}</span>
        </button>
        <button className={`tab-btn ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
          <CreditCard size={14} /> Expenses <span className="tab-count">{totalExpenses}</span>
        </button>
      </div>

      {/* ── Invoices ── */}
      {tab === 'invoices' && (
        <div className="card anim-fade-in">
          {invoicesQuery.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 8, color: 'var(--red)', fontSize: 13, margin: '0 0 4px' }}>
              <AlertCircle size={14} /> Failed to load invoices.
              <button onClick={() => invoicesQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}><RefreshCw size={12} /> Retry</button>
            </div>
          )}
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search invoices…" value={invSearch} onChange={e => { setInvSearch(e.target.value); setInvPage(1); }} /></div>
              <select className="select" style={{ width: 140 }} value={invStatus} onChange={e => { setInvStatus(e.target.value); setInvPage(1); }}>
                <option value="all">All Status</option>
                <option value="sent">Sent</option><option value="paid">Paid</option>
                <option value="overdue">Overdue</option><option value="draft">Draft</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddInvoiceOpen(true)}><Plus size={12} /> Create Invoice</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
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
                    <th style={{ textAlign: 'left' }}>Invoice NO</th>
                    <th style={{ textAlign: 'left' }}>Job Ref</th>
                    <th style={{ textAlign: 'left' }}>Customer</th>
                    <th style={{ textAlign: 'left' }}>Amount</th>
                    <th style={{ textAlign: 'left' }}>Issue Date</th>
                    <th style={{ textAlign: 'left' }}>Due Date</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!invoicesQuery.isLoading && invoices.map(inv => (
                    <tr key={inv.id} onClick={() => window.dispatchEvent(new CustomEvent("open-invoice-detail", { detail: inv }))} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                      <td><span className="td-mono td-primary">{inv.invoiceNumber}</span></td>
                      <td>{inv.jobId ? <div><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">{inv.jobTitle || getJobTitle(inv.jobId) || inv.jobId.slice(0, 8)}</span></div> : '—'}</td>
                      <td><div className="cell-user"><span className="cell-name">{inv.customerName ?? '—'}</span></div></td>
                      <td className="td-primary font-600">{fmtDecimal(inv.total)}</td>
                      <td className="text-sm text-3">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}</td>
                      <td className="text-sm">{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`badge ${INV_CSS[normalizeStatus(inv.status)] ?? 'badge-neutral'}`}>
                          {humanizeStatus(inv.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1 justify-end">
                          <button onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-invoice-detail", { detail: inv })); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Invoice"><Eye size={14} strokeWidth={2.5} /></button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              sendInvoice.mutate(inv.id, {
                                onSuccess: () => showSuccess('Invoice email sent with PDF attachment.', 'Invoice Sent'),
                                onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to send invoice.'),
                              })
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title={inv.status === 'DRAFT' ? 'Send Invoice' : 'Resend Invoice'}
                            disabled={sendInvoice.isPending || inv.status === 'VOID'}
                          >
                            <Mail size={14} strokeWidth={2.5} />
                          </button>
                          <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="Edit Invoice"><Edit2 size={14} strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!invoicesQuery.isLoading && invoices.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No invoices found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalInvoices > 0 ? (invPage - 1) * itemsPerPage + 1 : 0} to {Math.min(invPage * itemsPerPage, totalInvoices)} of {totalInvoices} invoices</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {invPage} of {totalInvPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setInvPage(p => Math.min(totalInvPages, p + 1))} disabled={invPage === totalInvPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quotes ── */}
      {tab === 'quotes' && (
        <div className="card anim-fade-in">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search quotes…" value={quoSearch} onChange={e => { setQuoSearch(e.target.value); setQuoPage(1); }} /></div>
              <select className="select" style={{ width: 140 }} value={quoStatus} onChange={e => { setQuoStatus(e.target.value); setQuoPage(1); }}>
                <option value="all">All Status</option>
                <option value="sent">Sent</option><option value="accepted">Accepted</option>
                <option value="draft">Draft</option><option value="declined">Declined</option><option value="expired">Expired</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddQuoteOpen(true)}><Plus size={12} /> Create Quote</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
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
                    <th style={{ textAlign: 'left' }}>Quote NO</th>
                    <th style={{ textAlign: 'left' }}>Job</th>
                    <th style={{ textAlign: 'left' }}>Customer</th>
                    <th style={{ textAlign: 'left' }}>Title</th>
                    <th style={{ textAlign: 'left' }}>Amount</th>
                    <th style={{ textAlign: 'left' }}>Expires</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotesQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!quotesQuery.isLoading && quotes.map(q => (
                    <tr key={q.id} onClick={() => window.dispatchEvent(new CustomEvent("open-quote-detail", { detail: q }))} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                      <td><span className="td-mono td-primary">{q.quoteNumber}</span></td>
                      <td>{q.jobId ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">{q.jobTitle || getJobTitle(q.jobId) || q.jobId.slice(0, 8)}</span> : '—'}</td>
                      <td><div className="cell-user"><span className="cell-name">{q.customerName ?? '—'}</span></div></td>
                      <td>{q.title}</td>
                      <td className="td-primary font-600">{fmtDecimal(q.total)}</td>
                      <td className="text-sm text-3">{q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`badge ${QUO_CSS[normalizeStatus(q.status)] ?? 'badge-neutral'}`}>
                          {humanizeStatus(q.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1 justify-end">
                          <button onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-quote-detail", { detail: q })); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="View Quote"><Eye size={14} strokeWidth={2.5} /></button>
                          <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Quote"><Edit2 size={14} strokeWidth={2.5} /></button>
                          <button onClick={e => e.stopPropagation()} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors" title="Convert to Invoice"><CheckCircle size={14} strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!quotesQuery.isLoading && quotes.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No quotes found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalQuotes > 0 ? (quoPage - 1) * itemsPerPage + 1 : 0} to {Math.min(quoPage * itemsPerPage, totalQuotes)} of {totalQuotes} quotes</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setQuoPage(p => Math.max(1, p - 1))} disabled={quoPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {quoPage} of {totalQuoPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setQuoPage(p => Math.min(totalQuoPages, p + 1))} disabled={quoPage === totalQuoPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expenses ── */}
      {tab === 'expenses' && (
        <div className="card anim-fade-in">
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="filter-bar">
              <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search expenses…" value={expSearch} onChange={e => { setExpSearch(e.target.value); setExpPage(1); }} /></div>
              <select className="select" style={{ width: 140 }} value={expStatus} onChange={e => { setExpStatus(e.target.value); setExpPage(1); }}>
                <option value="all">All Status</option>
                <option value="paid">Paid</option><option value="pending">Pending</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddExpenseOpen(true)}><Plus size={12} /> Log Expense</button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
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
                    <th style={{ textAlign: 'left' }}>Expense NO</th>
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
                  {expensesQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!expensesQuery.isLoading && expenses.map(exp => (
                    <tr key={exp.id} onClick={() => window.dispatchEvent(new CustomEvent("open-expense-detail", { detail: exp }))} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                      <td><span className="td-mono td-primary">{exp.id.slice(0, 8)}</span></td>
                      <td>{exp.jobId ? <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">{getJobTitle(exp.jobId) || exp.jobId.slice(0, 8)}</span> : '—'}</td>
                      <td><span className="font-600 text-[13px]">{exp.category}</span></td>
                      <td className="text-sm text-2">{exp.vendor ?? '—'}</td>
                      <td className="text-sm text-3">{exp.date ? new Date(exp.date).toLocaleDateString() : '—'}</td>
                      <td className="td-primary font-700">{fmtDecimal(exp.amount)}</td>
                      <td>
                        <span className={`badge ${EXP_CSS[normalizeStatus(exp.status)] ?? 'badge-neutral'}`}>
                          {humanizeStatus(exp.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1 justify-end">
                          <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-expense-detail", { detail: exp })); }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors" title="View Receipt"><Receipt size={14} strokeWidth={2.5} /></button>
                          <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open-expense-detail", { detail: exp })); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit Expense"><Edit2 size={14} strokeWidth={2.5} /></button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!confirm('Delete this expense?')) return
                              deleteExpense.mutate(exp.id, {
                                onSuccess: () => showSuccess('Expense removed successfully.', 'Expense Deleted'),
                                onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to delete expense.'),
                              })
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!expensesQuery.isLoading && expenses.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No expenses found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="text-[13px] text-[var(--t3)]">Showing {totalExpenses > 0 ? (expPage - 1) * itemsPerPage + 1 : 0} to {Math.min(expPage * itemsPerPage, totalExpenses)} of {totalExpenses} expenses</span>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setExpPage(p => Math.max(1, p - 1))} disabled={expPage === 1}><ChevronLeft size={18} /></button>
              <span className="text-[13px] text-[var(--t2)] mx-2">Page {expPage} of {totalExpPages}</span>
              <button className="btn btn-secondary btn-sm flex items-center justify-center p-1" style={{ width: 32, height: 32 }} onClick={() => setExpPage(p => Math.min(totalExpPages, p + 1))} disabled={expPage === totalExpPages}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      )}
      <AddQuoteModal isOpen={isAddQuoteOpen} onClose={() => setIsAddQuoteOpen(false)} />
      <AddInvoiceModal isOpen={isAddInvoiceOpen} onClose={() => setIsAddInvoiceOpen(false)} />
      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
    </div>
  )
}
