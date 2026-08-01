import { useMemo, useState } from 'react'
import { FileText, Search, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Eye, Download, Loader2, XCircle, CheckCircle2 } from 'lucide-react'
import { useAcceptMyQuote, useDeclineMyQuote, useMyQuotes } from '../../hooks/useCustomerPortal'
import { useMyHouses } from '../../hooks/useMyHouse'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import QuoteDetailModal from './QuoteDetailModal'
import type { Quote } from '../../types/api'
import { formatMoney } from '../../lib/format'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  DRAFT: { label: 'Draft', css: 'badge-neutral' },
  SENT: { label: 'Sent', css: 'badge-amber' },
  VIEWED: { label: 'Viewed', css: 'badge-blue' },
  ACCEPTED: { label: 'Accepted', css: 'badge-green' },
  DECLINED: { label: 'Declined', css: 'badge-red' },
  EXPIRED: { label: 'Expired', css: 'badge-red' },
  CONVERTED: { label: 'Converted', css: 'badge-cyan' },
}

const ITEMS_PER_PAGE = 10

function fmtMoney(val?: string | number) {
  return formatMoney(val)
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Quotes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [quoteStatusOverrides, setQuoteStatusOverrides] = useState<Record<string, Quote['status']>>({})
  const [quoteDecisionDone, setQuoteDecisionDone] = useState<Record<string, boolean>>({})
  const [quoteActionPendingId, setQuoteActionPendingId] = useState<string | null>(null)
  const { showError, showInfo, showSuccess } = useToast()

  const { data, isLoading, refetch } = useMyQuotes({ page, limit: ITEMS_PER_PAGE })
  const acceptQuote = useAcceptMyQuote()
  const declineQuote = useDeclineMyQuote()
  const quotes = data?.data ?? []
  const { data: houses } = useMyHouses()
  const houseLabelById = new Map((houses ?? []).map(h => [h.id, h.label]))

  const quotesView = useMemo(
    () => quotes.map(quote => ({ ...quote, status: quoteStatusOverrides[quote.id] ?? quote.status })),
    [quotes, quoteStatusOverrides],
  )

  const filtered = useMemo(() => {
    return quotesView.filter(q => {
      const matchSearch =
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = statusFilter === 'all' || q.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [quotesView, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const acceptedTotal = quotesView.filter(q => q.status === 'ACCEPTED').reduce((sum, q) => sum + Number(q.total), 0)
  const pendingCount = quotesView.filter(q => ['DRAFT', 'SENT', 'VIEWED'].includes(q.status)).length

  const statCards = [
    { title: 'Total Quotes', value: quotesView.length, icon: FileText },
    { title: 'Pending Review', value: pendingCount, icon: Clock },
    { title: 'Accepted Value', value: fmtMoney(acceptedTotal), icon: CheckCircle },
    { title: 'Needs Action', value: quotesView.filter(q => ['SENT', 'VIEWED'].includes(q.status)).length, icon: AlertCircle },
  ]

  const openDetail = (quote: Quote) => {
    setSelectedQuote(quote)
    setShowDetail(true)
  }

  const handleViewPdf = async (quote: Quote) => {
    try {
      await viewPdf(`/finance/quotes/${quote.id}/pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to open quote PDF right now.')
    }
  }

  const handleDownloadPdf = async (quote: Quote) => {
    try {
      await downloadPdf(`/finance/quotes/${quote.id}/pdf`, `${quote.quoteNumber}.pdf`)
      showSuccess(`Downloaded ${quote.quoteNumber}.pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to download quote PDF right now.')
    }
  }

  const handleAcceptQuote = async (quote: Quote) => {
    try {
      setQuoteActionPendingId(quote.id)
      await acceptQuote.mutateAsync(quote.id)
      setQuoteStatusOverrides(prev => ({ ...prev, [quote.id]: 'ACCEPTED' }))
      setQuoteDecisionDone(prev => ({ ...prev, [quote.id]: true }))
      showSuccess(`Quote ${quote.quoteNumber} approved.`)
      void refetch()
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to approve this quote right now.')
    } finally {
      setQuoteActionPendingId(null)
    }
  }

  const handleDeclineQuote = async (quote: Quote) => {
    try {
      setQuoteActionPendingId(quote.id)
      await declineQuote.mutateAsync({ quoteId: quote.id })
      setQuoteStatusOverrides(prev => ({ ...prev, [quote.id]: 'DECLINED' }))
      setQuoteDecisionDone(prev => ({ ...prev, [quote.id]: true }))
      showInfo(`Quote ${quote.quoteNumber} declined.`, 'Quote Declined')
      void refetch()
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to decline this quote right now.')
    } finally {
      setQuoteActionPendingId(null)
    }
  }

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
              <div className="kpi-value">{stat.value}</div>
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
                placeholder="Search quote number or title"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <select className="select" style={{ width: 180 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body-flush">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Title</th>
                  <th>House</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'left', width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7}>Loading quotes…</td></tr>
                ) : paginated.length > 0 ? (
                  paginated.map(quote => {
                    const normalizedStatus = String(quote.status ?? '').toUpperCase()
                    const s = STATUS_MAP[normalizedStatus] || { label: quote.status, css: 'badge-neutral' }
                    const canDecide =
                      !quoteDecisionDone[quote.id] && ['DRAFT', 'SENT', 'VIEWED'].includes(normalizedStatus)
                    const isRowPending = quoteActionPendingId === quote.id
                    return (
                      <tr key={quote.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(quote)}>
                        <td><span className="td-mono td-primary">{quote.quoteNumber}</span></td>
                        <td>
                          <div className="font-600" style={{ color: 'var(--t1)', fontSize: 13 }}>{quote.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{quote.notes || '—'}</div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{quote.houseId ? (houseLabelById.get(quote.houseId) ?? '—') : '—'}</td>
                        <td><span className={`badge ${s.css}`}>{s.label}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{fmtDate(quote.createdAt)}</td>
                        <td className="td-primary font-600">{fmtMoney(quote.total)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                            {canDecide && (
                              <button
                                title="Approve Quote"
                                onClick={() => handleAcceptQuote(quote)}
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
                                title="Decline Quote"
                                onClick={() => handleDeclineQuote(quote)}
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
                              title="View Details"
                              onClick={() => openDetail(quote)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                              onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              title="View PDF"
                              onClick={() => handleViewPdf(quote)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--blue)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                              onMouseOver={e => (e.currentTarget.style.background = '#EFF6FF')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(quote)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', transition: 'background var(--dur-fast)' }}
                              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Download size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan={7}>No quotes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-footer">
          <span className="table-count">
            Showing {filtered.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} quotes
          </span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
            <span className="pagination-label">Page {page} of {totalPages}</span>
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {showDetail && selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => { setShowDetail(false); setSelectedQuote(null) }}
        />
      )}
    </div>
  )
}
