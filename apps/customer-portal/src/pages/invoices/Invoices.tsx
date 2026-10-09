import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  CreditCard,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useApproveMyInvoice, useDeclineMyInvoice, useMyInvoices } from '../../hooks/useCustomerPortal'
import { useMyComponents } from '../../hooks/useMyComponent'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import InvoiceDetailModal from './InvoiceDetailModal.tsx'
import PayInvoiceModal from './PayInvoiceModal.tsx'
import type { Invoice } from '../../types/api'
import { featureEnabled, formatMoney } from '../../lib/format'
import { useCompany } from '../../contexts/CompanyContext'
import FilterChips, { type FilterOption } from '../../components/rowtable/FilterChips'
import Pager, { PAGE_SIZE } from '../../components/rowtable/Pager'
import { StatusLabel } from '../../components/rowtable/labels'
import '../../components/rowtable/rowTable.css'

/** What each status is called on an invoice (a SENT invoice is simply unpaid). */
const INVOICE_WORDS: Record<string, string> = { SENT: 'Unpaid', PARTIALLY_PAID: 'Part paid' }
const STATUS_ORDER = ['OVERDUE', 'SENT', 'PARTIALLY_PAID', 'PAID', 'VOID']
const AMOUNTS: Array<[string, string]> = [['under200', `Under ${formatMoney(200, { decimals: 0 })}`], ['200to500', `${formatMoney(200, { decimals: 0 })} to ${formatMoney(500, { decimals: 0 })}`], ['over500', `Over ${formatMoney(500, { decimals: 0 })}`]]
const DATES: Array<[string, string]> = [['month', 'This month'], ['quarter', 'Last 3 months'], ['year', 'This year']]

function fmtMoney(val?: string | number, currency?: string) {
  return formatMoney(val, { currency })
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusSel, setStatusSel] = useState<string[]>([])
  const [amountSel, setAmountSel] = useState<string[]>([])
  const [dateSel, setDateSel] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [shut, setShut] = useState<Set<string>>(new Set())

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const { settings: companySettings } = useCompany()
  const canPayOnline = featureEnabled(companySettings?.features, 'onlinePayments')
  const [showPay, setShowPay] = useState(false)
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null)
  const [invoiceStatusOverrides, setInvoiceStatusOverrides] = useState<Record<string, Invoice['status']>>({})
  const [invoiceDecisionDone, setInvoiceDecisionDone] = useState<Record<string, boolean>>({})
  const [invoiceActionPendingId, setInvoiceActionPendingId] = useState<string | null>(null)
  const { showError, showInfo, showSuccess } = useToast()

  const { data, isLoading, refetch } = useMyInvoices({ page: 1, limit: 200 })
  const approveInvoice = useApproveMyInvoice()
  const declineInvoice = useDeclineMyInvoice()
  const invoices = data?.data ?? []
  const { data: components } = useMyComponents()
  const componentLabelById = new Map((components ?? []).map(c => [c.id, c.label]))

  const invoicesView = useMemo(
    () => invoices.map(inv => ({ ...inv, status: invoiceStatusOverrides[inv.id] ?? inv.status })),
    [invoices, invoiceStatusOverrides],
  )

  const amountKey = (total: number) => (total < 200 ? 'under200' : total <= 500 ? '200to500' : 'over500')
  const dateKeys = (iso?: string): string[] => {
    if (!iso) return []
    const d = new Date(iso), now = new Date()
    const out: string[] = []
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) out.push('month')
    if (d >= new Date(now.getFullYear(), now.getMonth() - 2, 1)) out.push('quarter')
    if (d.getFullYear() === now.getFullYear()) out.push('year')
    return out
  }
  const matches = (inv: Invoice, skip?: 'status' | 'amount' | 'date') => {
    const firstLine = inv.lineItems?.[0]?.description ?? ''
    const q = searchQuery.toLowerCase()
    if (q && !inv.invoiceNumber.toLowerCase().includes(q) && !firstLine.toLowerCase().includes(q)) return false
    if (skip !== 'status' && statusSel.length && !statusSel.includes(inv.status)) return false
    if (skip !== 'amount' && amountSel.length && !amountSel.includes(amountKey(Number(inv.total)))) return false
    if (skip !== 'date' && dateSel.length && !dateKeys(inv.issueDate).some(k => dateSel.includes(k))) return false
    return true
  }
  const filtered = useMemo(() => invoicesView.filter(i => matches(i)), [invoicesView, searchQuery, statusSel, amountSel, dateSel]) // eslint-disable-line react-hooks/exhaustive-deps
  const paginated = filtered.slice((Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))) * PAGE_SIZE)
  const countOf = (pick: (i: Invoice) => string[], skip: 'status' | 'amount' | 'date') => {
    const m: Record<string, number> = {}
    for (const i of invoicesView) if (matches(i, skip)) for (const k of pick(i)) m[k] = (m[k] ?? 0) + 1
    return m
  }
  const statusCounts = countOf(i => [i.status], 'status')
  const amountCounts = countOf(i => [amountKey(Number(i.total))], 'amount')
  const dateCounts = countOf(i => dateKeys(i.issueDate), 'date')
  const statusOptions: FilterOption[] = STATUS_ORDER.map(v => ({ value: v, node: <StatusLabel status={v} bare label={INVOICE_WORDS[v]} />, count: statusCounts[v] ?? 0 }))
  const amountOptions: FilterOption[] = AMOUNTS.map(([v, l]) => ({ value: v, node: <span>{l}</span>, count: amountCounts[v] ?? 0 }))
  const dateOptions: FilterOption[] = DATES.map(([v, l]) => ({ value: v, node: <span>{l}</span>, count: dateCounts[v] ?? 0 }))
  const flip = (set: Set<string>, id: string, on: boolean) => { const n = new Set(set); if (on) n.add(id); else n.delete(id); return n }
  const pin = (id: string) => { const was = pinned.has(id); setPinned(p => flip(p, id, !was)); setShut(x => flip(x, id, was)) }
  useEffect(() => { setPage(1) }, [searchQuery, statusSel, amountSel, dateSel])

  const paidTotal = invoicesView.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0)
  const pendingTotal = invoicesView.filter(i => ['SENT', 'PARTIALLY_PAID'].includes(i.status)).reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)
  const overdueTotal = invoicesView.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)

  const hasActiveFilters = statusSel.length > 0 || amountSel.length > 0 || dateSel.length > 0 || !!searchQuery

  const clearFilters = () => {
    setSearchQuery('')
    setStatusSel([])
    setAmountSel([])
    setDateSel([])
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

      <div className="pt-card anim-fade-up delay-2">
        <div className="jf-bar" style={{ paddingTop: 20 }}>
          <label className="jf-search">
            <Search size={14} aria-hidden="true" />
            <input placeholder="Search invoices, services" aria-label="Search invoices" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </label>
          {hasActiveFilters && <button type="button" className="jf-clear" onClick={clearFilters}>Clear all filters</button>}
          <span style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => refetch()}><Download size={13} /> Refresh</button>
        </div>
        <div className="jc-wrap">
          <FilterChips label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} loading={isLoading} />
          <FilterChips label="Amount" options={amountOptions} selected={amountSel} onChange={setAmountSel} loading={isLoading} />
          <FilterChips label="Issued" options={dateOptions} selected={dateSel} onChange={setDateSel} loading={isLoading} />
        </div>

        <div className="jt-wrap">
          <div className="jt" role="table" aria-label="Invoices">
            <div className="jt-grid pt-invoices jt-head" role="row">
              <span className="jt-th" role="columnheader">Invoice</span>
              <span className="jt-th pt-hide-sm" role="columnheader">House</span>
              <span className="jt-th" role="columnheader">Dates</span>
              <span className="jt-th is-right" role="columnheader">Amount due</span>
              <span className="jt-th" role="columnheader">Status</span>
              <span className="jt-th is-right pt-hide-sm" role="columnheader">Actions</span>
            </div>

            {isLoading && [1, 2, 3].map(i => (
              <div key={i} className="jt-row" aria-hidden="true"><div className="jt-main jt-grid pt-invoices"><span style={{ gridColumn: '1 / -1', height: 14, borderRadius: 6, background: 'var(--bg-hover)' }} /></div></div>
            ))}

            {!isLoading && paginated.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)' }}>
                <FileText size={26} style={{ opacity: 0.35, display: 'block', margin: '0 auto 10px' }} aria-hidden="true" />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>{hasActiveFilters ? 'No invoices match your filters' : 'No invoices yet'}</div>
                {hasActiveFilters && <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>Clear filters</button>}
              </div>
            )}

            {!isLoading && paginated.map(invoice => {
              const outstanding = Number(invoice.total) - Number(invoice.amountPaid)
              const canPay = canPayOnline && ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status)
              const alreadyDecided = Boolean(invoice.approvedAt) || Boolean(invoice.declinedAt) || invoiceDecisionDone[invoice.id]
              const canDecide = !alreadyDecided && ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status)
              const isRowPending = invoiceActionPendingId === invoice.id
              const isPinned = pinned.has(invoice.id)
              const title = invoice.lineItems?.[0]?.description || 'Invoice'
              const house = invoice.componentId ? componentLabelById.get(invoice.componentId) : undefined
              return (
                <div key={invoice.id} role="row" className={`jt-row${isPinned ? ' is-pinned' : ''}${shut.has(invoice.id) ? ' is-shut' : ''}${invoice.status === 'OVERDUE' ? ' is-urgent' : ''}`}
                  onClick={() => openDetail(invoice)}
                  onMouseLeave={() => { if (shut.has(invoice.id)) setShut(x => flip(x, invoice.id, false)) }}>
                  <div className="jt-main jt-grid pt-invoices">
                    <div className="jt-c" role="cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button type="button" className="jt-chev" aria-label={isPinned ? 'Hide details' : 'Keep details open'} aria-expanded={isPinned}
                        onClick={e => { e.stopPropagation(); pin(invoice.id) }}><ChevronRight size={15} aria-hidden="true" /></button>
                      <div style={{ minWidth: 0 }}>
                        <div className="jt-t1 jt-svc" title={title}>{title}</div>
                        <div className="jt-t2">{invoice.invoiceNumber}{invoice.lineItems && invoice.lineItems.length > 1 ? ` · +${invoice.lineItems.length - 1} more` : ''}</div>
                      </div>
                    </div>
                    <div className="jt-c pt-hide-sm" role="cell"><div className="jt-t1 is-soft">{house ?? <span className="jt-t2">None</span>}</div></div>
                    <div className="jt-c" role="cell">
                      <div className="jt-t1 is-soft">Issued {fmtDate(invoice.issueDate)}</div>
                      <div className="jt-t2" style={invoice.status === 'OVERDUE' ? { color: 'var(--red)' } : undefined}>Due {fmtDate(invoice.dueDate)}</div>
                    </div>
                    <div className="jt-t1 jt-amount" role="cell">{fmtMoney(outstanding > 0 ? outstanding : invoice.total, invoice.currency)}</div>
                    <div role="cell"><StatusLabel status={invoice.status} label={INVOICE_WORDS[invoice.status]} /></div>
                    <div className="jt-actions pt-hide-sm" role="cell" onClick={e => e.stopPropagation()}>
                      {canPay && <button type="button" className="jt-act" style={{ background: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }} onClick={() => openPay(invoice)}><CreditCard size={13} /> Pay</button>}
                      {canDecide && (
                        <>
                          <button type="button" className="jt-act jt-icon" title="Approve this invoice" aria-label="Approve this invoice" disabled={isRowPending} style={{ color: 'var(--green)' }} onClick={() => handleApproveInvoice(invoice)}>
                            {isRowPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          </button>
                          <button type="button" className="jt-act jt-icon" title="Decline this invoice" aria-label="Decline this invoice" disabled={isRowPending} onClick={() => handleDeclineInvoice(invoice)}>
                            {isRowPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="jt-more">
                    <div className="jt-more-in">
                      <div className="jt-detail" style={{ paddingLeft: 52 }}>
                        <div className="jt-facts">
                          <span className="jt-fact"><span className="k">Total</span> {fmtMoney(invoice.total, invoice.currency)}</span>
                          <span className="jt-fact"><span className="k">Paid</span> {fmtMoney(invoice.amountPaid, invoice.currency)}</span>
                          {house && <span className="jt-fact"><span className="k">House</span> {house}</span>}
                        </div>
                        <div className="jt-facts" onClick={e => e.stopPropagation()}>
                          <button type="button" className="jt-act" onClick={() => openDetail(invoice)}>Open invoice</button>
                          {canPay && <button type="button" className="jt-act" onClick={() => openPay(invoice)}><CreditCard size={13} /> Pay securely</button>}
                          {invoice.status === 'PAID' && <button type="button" className="jt-act" onClick={() => handleViewPdf(invoice)}><FileText size={13} /> View PDF</button>}
                          {invoice.status === 'PAID' && <button type="button" className="jt-act" onClick={() => handleDownloadPdf(invoice)}><Download size={13} /> Download PDF</button>}
                          {canDecide && <button type="button" className="jt-act" disabled={isRowPending} onClick={() => handleApproveInvoice(invoice)}>Approve</button>}
                          {canDecide && <button type="button" className="jt-act" disabled={isRowPending} onClick={() => handleDeclineInvoice(invoice)}>Decline</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Pager total={filtered.length} page={page} onPage={setPage} noun="invoices" />
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
