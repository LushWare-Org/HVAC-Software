import { useState, useMemo, useEffect, useCallback } from 'react'
import { DollarSign, FileText, AlertCircle, TrendingUp, Plus, CreditCard, Maximize2, Minimize2, ChevronLeft, ChevronRight, Search, Mail, Edit2, Eye, CheckCircle, Trash2, Receipt, RefreshCw, Download, UploadCloud, Briefcase } from 'lucide-react'
import { useInvoices, useQuotes, useExpenses, useFinanceKpis, decimalToNumber, useDeleteExpense, useSendInvoice, useQBStatus, useQBSyncInvoice } from '../../hooks/useFinance'
import { useJobs } from '../../hooks/useJobs'
import { useToast } from '../../contexts/ToastContext'
import type { Invoice, Quote, Expense } from '../../types/api'
import AddQuoteModal from './AddQuoteModal'
import AddInvoiceModal from './AddInvoiceModal'
import AddExpenseModal from './AddExpenseModal'
import RecommendationsPanel from '../../components/RecommendationsPanel'
import { humanizeStatus, normalizeStatus, formatMoney } from '../../lib/format'

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
  return formatMoney(n)
}

function PillGroup({ options, value, onChange }: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 4 }}>
      {options.map(o => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: '1.5px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderColor: active ? 'var(--blue)' : 'var(--bd-md)',
              background: active ? 'var(--blue)' : 'var(--bg-card)',
              color: active ? '#fff' : 'var(--t2)',
              boxShadow: active ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function exportToCsv(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const INV_STATUS_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]
const QUO_STATUS_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
  { label: 'Expired', value: 'expired' },
]
const EXP_STATUS_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
]

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

  const openJobDetail = (jobId: string, jobTitle?: string | null) => {
    // Look up full job from the pre-loaded list first; fall back to a stub
    // that JobDetailModal can enrich via its internal useJob(id) fetch.
    const full = (jobsLookupQuery.data?.data ?? []).find(j => j.id === jobId)
    const payload = full ?? {
      id: jobId,
      companyId: '',
      title: jobTitle || jobId.slice(0, 8),
      status: 'PENDING' as const,
      priority: 'NORMAL' as const,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    window.dispatchEvent(new CustomEvent('open-job-detail', { detail: payload }))
  }

  const kpi = kpiQuery.data
  const deleteExpense = useDeleteExpense()
  const sendInvoice = useSendInvoice()
  const qbStatus = useQBStatus()
  const qbSync = useQBSyncInvoice()
  const qbConnected = qbStatus.data?.connected ?? false

  const handleExport = useCallback(() => {
    if (tab === 'invoices') {
      exportToCsv('invoices.csv',
        invoices.map(inv => [
          inv.invoiceNumber,
          inv.customerName ?? '',
          inv.jobTitle ?? '',
          fmtDecimal(inv.total),
          inv.status,
          inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '',
          inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
        ]),
        ['Invoice No', 'Customer', 'Job', 'Amount', 'Status', 'Issue Date', 'Due Date'],
      )
    } else if (tab === 'quotes') {
      exportToCsv('quotes.csv',
        quotes.map(q => [
          q.quoteNumber,
          q.customerName ?? '',
          q.title,
          fmtDecimal(q.total),
          q.status,
          q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
          q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '',
        ]),
        ['Quote No', 'Customer', 'Title', 'Amount', 'Status', 'Created', 'Valid Until'],
      )
    } else {
      exportToCsv('expenses.csv',
        expenses.map(exp => [
          exp.id.slice(0, 8),
          exp.category,
          exp.vendor ?? '',
          fmtDecimal(exp.amount),
          exp.status,
          exp.date ? new Date(exp.date).toLocaleDateString() : '',
        ]),
        ['Ref', 'Category', 'Vendor', 'Amount', 'Status', 'Date'],
      )
    }
  }, [tab, invoices, quotes, expenses])

  useEffect(() => {
    const handler = () => handleExport()
    window.addEventListener('finance-export', handler)
    return () => window.removeEventListener('finance-export', handler)
  }, [handleExport])

  return (
    <div className="anim-fade-up">

      {/* KPIs */}
      {!isExpanded && (
        <div className="kpi-grid mb-5">
          {[
            { icon: DollarSign, v: kpi?.revenue.formattedValue ?? '—', l: 'Revenue This Month', loading: kpiQuery.isLoading, onClick: () => setTab('invoices') },
            { icon: FileText, v: kpi?.outstandingInvoices.formattedValue ?? '—', l: 'Accounts Receivable', loading: kpiQuery.isLoading, onClick: () => setTab('invoices') },
            { icon: AlertCircle, v: '—', l: 'Overdue Balance', loading: false, onClick: () => setTab('invoices') },
            { icon: TrendingUp, v: '—', l: 'Gross Profit Margin', loading: false, onClick: undefined },
            { icon: CreditCard, v: '—', l: 'Pending Quotes', loading: false, onClick: () => setTab('quotes') },
          ].map(k => (
            <div key={k.l} className="kpi-card" style={{ padding: '16px 20px', borderRadius: 'var(--r-md)', cursor: k.onClick ? 'pointer' : 'default' }} onClick={k.onClick}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="filter-bar">
                <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search invoices…" value={invSearch} onChange={e => { setInvSearch(e.target.value); setInvPage(1); }} /></div>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={handleExport}><Download size={12} /> Export CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAddInvoiceOpen(true)}><Plus size={12} /> Create Invoice</button>
                  <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                  </button>
                </div>
              </div>
              <PillGroup options={INV_STATUS_PILLS} value={invStatus} onChange={v => { setInvStatus(v); setInvPage(1); }} />
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
                    {qbConnected && <th style={{ textAlign: 'center' }}>QB</th>}
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQuery.isLoading && Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><Skeleton /></td>)}</tr>)}
                  {!invoicesQuery.isLoading && invoices.map(inv => (
                    <tr key={inv.id} onClick={() => window.dispatchEvent(new CustomEvent("open-invoice-detail", { detail: inv }))} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group">
                      <td><span className="td-mono td-primary">{inv.invoiceNumber}</span></td>
                      <td>
                        {inv.jobId ? (
                          <button
                            onClick={e => { e.stopPropagation(); openJobDetail(inv.jobId!, inv.jobTitle || getJobTitle(inv.jobId)) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.18)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(59,130,246,0.12)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
                            title="View job details"
                          >
                            <Briefcase size={10} />
                            {inv.jobTitle || getJobTitle(inv.jobId) || inv.jobId!.slice(0, 8)}
                          </button>
                        ) : '—'}
                      </td>
                      <td><div className="cell-user"><span className="cell-name">{inv.customerName ?? '—'}</span></div></td>
                      <td className="td-primary font-600">{fmtDecimal(inv.total)}</td>
                      <td className="text-sm text-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`badge ${INV_CSS[normalizeStatus(inv.status)] ?? 'badge-neutral'}`}>
                          {humanizeStatus(inv.status)}
                        </span>
                      </td>
                      {qbConnected && (
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          {inv.quickbooksId ? (
                            <span title={`Synced to QB: ${inv.quickbooksId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#2CA01C', background: 'rgba(44,160,28,0.12)', border: '1px solid rgba(44,160,28,0.3)', borderRadius: 999, padding: '2px 7px' }}>
                              QB ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => qbSync.mutate(inv.id, {
                                onSuccess: () => showSuccess(`Invoice ${inv.invoiceNumber} pushed to QuickBooks.`, 'Synced'),
                                onError: () => showError('QuickBooks sync failed. Ensure QB is connected and the invoice is valid.'),
                              })}
                              disabled={qbSync.isPending || inv.status === 'VOID'}
                              title="Push to QuickBooks"
                              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--t4)', fontSize: 11, fontWeight: 600 }}
                            >
                              <UploadCloud size={12} /> Sync
                            </button>
                          )}
                        </td>
                      )}
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
                  {!invoicesQuery.isLoading && invoices.length === 0 && <tr><td colSpan={qbConnected ? 9 : 8} style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>No invoices found</td></tr>}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="filter-bar">
                <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search quotes…" value={quoSearch} onChange={e => { setQuoSearch(e.target.value); setQuoPage(1); }} /></div>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={handleExport}><Download size={12} /> Export CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAddQuoteOpen(true)}><Plus size={12} /> Create Quote</button>
                  <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                  </button>
                </div>
              </div>
              <PillGroup options={QUO_STATUS_PILLS} value={quoStatus} onChange={v => { setQuoStatus(v); setQuoPage(1); }} />
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
                      <td>
                        {q.jobId ? (
                          <button
                            onClick={e => { e.stopPropagation(); openJobDetail(q.jobId!, q.jobTitle || getJobTitle(q.jobId)) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.18)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(59,130,246,0.12)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
                            title="View job details"
                          >
                            <Briefcase size={10} />
                            {q.jobTitle || getJobTitle(q.jobId) || q.jobId!.slice(0, 8)}
                          </button>
                        ) : '—'}
                      </td>
                      <td><div className="cell-user"><span className="cell-name">{q.customerName ?? '—'}</span></div></td>
                      <td>{q.title}</td>
                      <td className="td-primary font-600">{fmtDecimal(q.total)}</td>
                      <td className="text-sm text-3">{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="filter-bar">
                <div className="filter-search"><Search size={13} color="var(--t4)" /><input placeholder="Search expenses…" value={expSearch} onChange={e => { setExpSearch(e.target.value); setExpPage(1); }} /></div>
                <div className="flex items-center gap-2 ml-auto">
                  <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={handleExport}><Download size={12} /> Export CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsAddExpenseOpen(true)}><Plus size={12} /> Log Expense</button>
                  <button className="btn btn-secondary btn-sm flex items-center gap-1.5" style={{ padding: '0 12px', fontWeight: 600 }} onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <><Minimize2 size={14} /> Collapse</> : <><Maximize2 size={14} /> Expand</>}
                  </button>
                </div>
              </div>
              <PillGroup options={EXP_STATUS_PILLS} value={expStatus} onChange={v => { setExpStatus(v); setExpPage(1); }} />
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
                      <td>
                        {exp.jobId ? (
                          <button
                            onClick={e => { e.stopPropagation(); openJobDetail(exp.jobId!, getJobTitle(exp.jobId)) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.18)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(59,130,246,0.12)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
                            title="View job details"
                          >
                            <Briefcase size={10} />
                            {getJobTitle(exp.jobId) || exp.jobId!.slice(0, 8)}
                          </button>
                        ) : '—'}
                      </td>
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
