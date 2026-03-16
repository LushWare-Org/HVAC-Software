import { useMemo, useState } from 'react'
import {
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  CreditCard,
  X,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useApproveMyInvoice, useDeclineMyInvoice, useMyInvoices } from '../../hooks/useCustomerPortal'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import InvoiceDetailModal from './InvoiceDetailModal.tsx'
import PayInvoiceModal from './PayInvoiceModal.tsx'
import type { Invoice } from '../../types/api'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  DRAFT: { label: 'Draft', css: 'badge-amber' },
  SENT: { label: 'Pending', css: 'badge-amber' },
  PARTIALLY_PAID: { label: 'Partial', css: 'badge-blue' },
  PAID: { label: 'Paid', css: 'badge-green' },
  OVERDUE: { label: 'Overdue', css: 'badge-red' },
  VOID: { label: 'Void', css: 'badge-neutral' },
}

const ITEMS_PER_PAGE = 10

function fmtMoney(val?: string | number) {
  return `$${Number(val ?? 0).toLocaleString()}`
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null)
  const [invoiceStatusOverrides, setInvoiceStatusOverrides] = useState<Record<string, Invoice['status']>>({})
  const [invoiceDecisionDone, setInvoiceDecisionDone] = useState<Record<string, boolean>>({})
  const [invoiceActionPendingId, setInvoiceActionPendingId] = useState<string | null>(null)
  const { showError, showInfo, showSuccess } = useToast()

  const { data, isLoading, refetch } = useMyInvoices({ page, limit: ITEMS_PER_PAGE })
  const approveInvoice = useApproveMyInvoice()
  const declineInvoice = useDeclineMyInvoice()
  const invoices = data?.data ?? []

  const invoicesView = useMemo(
    () => invoices.map(inv => ({ ...inv, status: invoiceStatusOverrides[inv.id] ?? inv.status })),
    [invoices, invoiceStatusOverrides],
  )

  const filtered = useMemo(() => {
    return invoicesView.filter(inv => {
      const firstLine = inv.lineItems?.[0]?.description ?? ''
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firstLine.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter
      const total = Number(inv.total)
      const matchAmount =
        amountFilter === 'all' ||
        (amountFilter === 'under200' && total < 200) ||
        (amountFilter === '200to500' && total >= 200 && total <= 500) ||
        (amountFilter === 'over500' && total > 500)
      return matchSearch && matchStatus && matchAmount
    })
  }, [invoicesView, searchQuery, statusFilter, amountFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const paidTotal = invoicesView.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0)
  const pendingTotal = invoicesView.filter(i => ['SENT', 'PARTIALLY_PAID'].includes(i.status)).reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)
  const overdueTotal = invoicesView.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || amountFilter !== 'all' || !!searchQuery

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFilter('all')
    setAmountFilter('all')
    setPage(1)
  }

  const openDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetail(true)
  }

  const openPay = (invoice: Invoice) => {
    setInvoiceToPay(invoice)
    setShowPay(true)
  }

  const handleViewPdf = async (invoice: Invoice) => {
    try {
      await viewPdf(`/finance/invoices/${invoice.id}/pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to open invoice PDF right now.')
    }
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      await downloadPdf(`/finance/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`)
      showSuccess(`Downloaded ${invoice.invoiceNumber}.pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to download invoice PDF right now.')
    }
  }

  const handleApproveInvoice = async (invoice: Invoice) => {
    try {
      setInvoiceActionPendingId(invoice.id)
      await approveInvoice.mutateAsync(invoice.id)
      setInvoiceDecisionDone(prev => ({ ...prev, [invoice.id]: true }))
      showSuccess(`Invoice ${invoice.invoiceNumber} approved.`)
      void refetch()
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to approve this invoice right now.')
    } finally {
      setInvoiceActionPendingId(null)
    }
  }

  const handleDeclineInvoice = async (invoice: Invoice) => {
    try {
      setInvoiceActionPendingId(invoice.id)
      await declineInvoice.mutateAsync({ invoiceId: invoice.id })
      setInvoiceStatusOverrides(prev => ({ ...prev, [invoice.id]: 'VOID' }))
      setInvoiceDecisionDone(prev => ({ ...prev, [invoice.id]: true }))
      showInfo(`Invoice ${invoice.invoiceNumber} declined and marked void.`, 'Invoice Declined')
      void refetch()
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to decline this invoice right now.')
    } finally {
      setInvoiceActionPendingId(null)
    }
  }

  const statCards = [
    { title: 'Total Paid', value: fmtMoney(paidTotal), sub: `${invoicesView.filter(i => i.status === 'PAID').length} invoices`, icon: CheckCircle },
    { title: 'Pending', value: fmtMoney(pendingTotal), sub: `${invoicesView.filter(i => ['SENT', 'PARTIALLY_PAID'].includes(i.status)).length} invoices`, icon: Clock },
    { title: 'Overdue', value: fmtMoney(overdueTotal), sub: `${invoicesView.filter(i => i.status === 'OVERDUE').length} invoices`, icon: AlertCircle },
    { title: 'Total Invoices', value: String(data?.meta?.total ?? invoices.length), sub: 'All time', icon: FileText },
  ]

  return (
    <div className="anim-fade-up">
      <div className="kpi-grid mb-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`kpi-card card-hover anim-fade-up delay-${index + 1}`}>
              <div className="kpi-card-top">
                <div className="kpi-label">{stat.title}</div>
                <Icon size={16} strokeWidth={1.5} color="var(--t3)" />
              </div>
              <div className="kpi-value">{isLoading ? '…' : stat.value}</div>
              <div className="kpi-sub">{stat.sub}</div>
            </div>
          )
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
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <select className="select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select className="select" style={{ width: 150 }} value={amountFilter} onChange={e => { setAmountFilter(e.target.value); setPage(1) }}>
              <option value="all">All Amounts</option>
              <option value="under200">Under $200</option>
              <option value="200to500">$200 - $500</option>
              <option value="over500">Over $500</option>
            </select>
            <select className="select" style={{ width: 150 }} value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }}>
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
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => refetch()}>
              <Download size={13} /> Refresh
            </button>
          </div>
        </div>

        <div className="card-body-flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'left', width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--t3)', padding: '24px' }}>Loading invoices…</td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map(invoice => {
                    const s = STATUS_MAP[invoice.status] || { label: invoice.status, css: 'badge-neutral' }
                    const outstanding = Number(invoice.total) - Number(invoice.amountPaid)
                    const canPay = ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status)
                    const canDecide =
                      !invoiceDecisionDone[invoice.id] && ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status)
                    const isRowPending = invoiceActionPendingId === invoice.id
                    return (
                      <tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(invoice)}>
                        <td><span className="td-mono td-primary">{invoice.invoiceNumber}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--t1)', fontSize: 13 }}>{invoice.lineItems?.[0]?.description || 'Invoice'}</div>
                          {invoice.lineItems && invoice.lineItems.length > 1 && (
                            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>+{invoice.lineItems.length - 1} more</div>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{fmtDate(invoice.issueDate)}</td>
                        <td style={{ fontSize: 12, color: invoice.status === 'OVERDUE' ? 'var(--red)' : 'var(--t3)' }}>{fmtDate(invoice.dueDate)}</td>
                        <td className="td-primary font-600">{fmtMoney(outstanding > 0 ? outstanding : invoice.total)}</td>
                        <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                            {canDecide && (
                              <button
                                title="Approve Invoice"
                                onClick={() => handleApproveInvoice(invoice)}
                                disabled={isRowPending}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 28,
                                  height: 28,
                                  borderRadius: 'var(--r)',
                                  border: '1px solid #A7F3D0',
                                  background: '#ECFDF5',
                                  color: '#047857',
                                  cursor: isRowPending ? 'not-allowed' : 'pointer',
                                  opacity: isRowPending ? 0.7 : 1,
                                }}
                              >
                                {isRowPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              </button>
                            )}
                            {canDecide && (
                              <button
                                title="Decline Invoice"
                                onClick={() => handleDeclineInvoice(invoice)}
                                disabled={isRowPending}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 28,
                                  height: 28,
                                  borderRadius: 'var(--r)',
                                  border: '1px solid #FECACA',
                                  background: '#FEF2F2',
                                  color: '#B91C1C',
                                  cursor: isRowPending ? 'not-allowed' : 'pointer',
                                  opacity: isRowPending ? 0.7 : 1,
                                }}
                              >
                                {isRowPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                              </button>
                            )}
                            <button
                              title="View Invoice"
                              onClick={() => openDetail(invoice)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                              onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Eye size={15} />
                            </button>
                            {canPay && (
                              <button
                                title="Pay Securely"
                                onClick={() => openPay(invoice)}
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--green)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                onMouseOver={e => (e.currentTarget.style.background = '#F0FDF4')}
                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <CreditCard size={15} />
                              </button>
                            )}
                            {invoice.status === 'PAID' && (
                              <>
                                <button
                                  title="View PDF"
                                  onClick={() => handleViewPdf(invoice)}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                  onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <FileText size={15} />
                                </button>
                                <button
                                  title="Download PDF"
                                  onClick={() => handleDownloadPdf(invoice)}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Download size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
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
            Showing {filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} invoices
          </span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
            <span className="pagination-label">Page {page} of {totalPages}</span>
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {showDetail && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => { setShowDetail(false); setSelectedInvoice(null) }}
          onPay={() => openPay(selectedInvoice)}
        />
      )}
      {showPay && invoiceToPay && (
        <PayInvoiceModal
          invoice={invoiceToPay}
          onClose={() => { setShowPay(false); setInvoiceToPay(null); refetch() }}
        />
      )}
    </div>
  )
}
