import { useEffect, useMemo, useState } from 'react'
import { FileText, Search, CheckCircle, Clock, AlertCircle, ChevronRight, Download, Loader2, XCircle, CheckCircle2 } from 'lucide-react'
import { useAcceptMyQuote, useDeclineMyQuote, useMyQuotes } from '../../hooks/useCustomerPortal'
import { useMyComponents } from '../../hooks/useMyComponent'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import QuoteDetailModal from './QuoteDetailModal'
import type { Quote } from '../../types/api'
import { formatMoney } from '../../lib/format'
import FilterChips, { type FilterOption } from '../../components/rowtable/FilterChips'
import Pager, { PAGE_SIZE } from '../../components/rowtable/Pager'
import { StatusLabel } from '../../components/rowtable/labels'
import '../../components/rowtable/rowTable.css'

const STATUS_ORDER = ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED']

function fmtMoney(val?: string | number, currency?: string) {
  return formatMoney(val, { currency })
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Quotes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusSel, setStatusSel] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [shut, setShut] = useState<Set<string>>(new Set())
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [quoteStatusOverrides, setQuoteStatusOverrides] = useState<Record<string, Quote['status']>>({})
  const [quoteDecisionDone, setQuoteDecisionDone] = useState<Record<string, boolean>>({})
  const [quoteActionPendingId, setQuoteActionPendingId] = useState<string | null>(null)
  const { showError, showInfo, showSuccess } = useToast()

  const { data, isLoading, refetch } = useMyQuotes({ page: 1, limit: 200 })
  const acceptQuote = useAcceptMyQuote()
  const declineQuote = useDeclineMyQuote()
  const quotes = data?.data ?? []
  const { data: components } = useMyComponents()
  const componentLabelById = new Map((components ?? []).map(c => [c.id, c.label]))

  const quotesView = useMemo(
    () => quotes.map(quote => ({ ...quote, status: quoteStatusOverrides[quote.id] ?? quote.status })),
    [quotes, quoteStatusOverrides],
  )

  const norm = (q: Quote) => String(q.status ?? '').toUpperCase()
  const matchesSearch = (q: Quote) => {
    const t = searchQuery.toLowerCase()
    return !t || q.quoteNumber.toLowerCase().includes(t) || q.title.toLowerCase().includes(t)
  }
  const filtered = useMemo(
    () => quotesView.filter(q => matchesSearch(q) && (!statusSel.length || statusSel.includes(norm(q)))),
    [quotesView, searchQuery, statusSel], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const statusCounts: Record<string, number> = {}
  for (const q of quotesView) if (matchesSearch(q)) statusCounts[norm(q)] = (statusCounts[norm(q)] ?? 0) + 1
  const statusOptions: FilterOption[] = STATUS_ORDER.map(v => ({ value: v, node: <StatusLabel status={v} bare />, count: statusCounts[v] ?? 0 }))
  const flip = (set: Set<string>, id: string, on: boolean) => { const n = new Set(set); if (on) n.add(id); else n.delete(id); return n }
  const pin = (id: string) => { const was = pinned.has(id); setPinned(p => flip(p, id, !was)); setShut(x => flip(x, id, was)) }
  useEffect(() => { setPage(1) }, [searchQuery, statusSel])
  const hasFilters = !!searchQuery || statusSel.length > 0
  const clearAll = () => { setSearchQuery(''); setStatusSel([]) }

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

      <div className="pt-card anim-fade-up delay-2">
        <div className="jf-bar" style={{ paddingTop: 20 }}>
          <label className="jf-search">
            <Search size={14} aria-hidden="true" />
            <input placeholder="Search quote number or title" aria-label="Search quotes" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </label>
          {hasFilters && <button type="button" className="jf-clear" onClick={clearAll}>Clear all filters</button>}
        </div>
        <div className="jc-wrap">
          <FilterChips label="Status" options={statusOptions} selected={statusSel} onChange={setStatusSel} loading={isLoading} />
        </div>

        <div className="jt-wrap">
          <div className="jt" role="table" aria-label="Quotes">
            <div className="jt-grid pt-quotes jt-head" role="row">
              <span className="jt-th" role="columnheader">Quote</span>
              <span className="jt-th pt-hide-sm" role="columnheader">House</span>
              <span className="jt-th" role="columnheader">Status</span>
              <span className="jt-th is-right" role="columnheader">Total</span>
              <span className="jt-th is-right pt-hide-sm" role="columnheader">Actions</span>
            </div>

            {isLoading && [1, 2, 3].map(i => (
              <div key={i} className="jt-row" aria-hidden="true"><div className="jt-main jt-grid pt-quotes"><span style={{ gridColumn: '1 / -1', height: 14, borderRadius: 6, background: 'var(--bg-hover)' }} /></div></div>
            ))}

            {!isLoading && paginated.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)' }}>
                <FileText size={26} style={{ opacity: 0.35, display: 'block', margin: '0 auto 10px' }} aria-hidden="true" />
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>{hasFilters ? 'No quotes match your filters' : 'No quotes yet'}</div>
                {hasFilters && <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearAll}>Clear filters</button>}
              </div>
            )}

            {!isLoading && paginated.map(quote => {
              const status = norm(quote)
              const canDecide = !quoteDecisionDone[quote.id] && ['DRAFT', 'SENT', 'VIEWED'].includes(status)
              const isRowPending = quoteActionPendingId === quote.id
              const isPinned = pinned.has(quote.id)
              const house = quote.componentId ? componentLabelById.get(quote.componentId) : undefined
              return (
                <div key={quote.id} role="row" className={`jt-row${isPinned ? ' is-pinned' : ''}${shut.has(quote.id) ? ' is-shut' : ''}`}
                  onClick={() => openDetail(quote)}
                  onMouseLeave={() => { if (shut.has(quote.id)) setShut(x => flip(x, quote.id, false)) }}>
                  <div className="jt-main jt-grid pt-quotes">
                    <div className="jt-c" role="cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button type="button" className="jt-chev" aria-label={isPinned ? 'Hide details' : 'Keep details open'} aria-expanded={isPinned}
                        onClick={e => { e.stopPropagation(); pin(quote.id) }}><ChevronRight size={15} aria-hidden="true" /></button>
                      <div style={{ minWidth: 0 }}>
                        <div className="jt-t1 jt-svc" title={quote.title}>{quote.title}</div>
                        <div className="jt-t2">{quote.quoteNumber} · {fmtDate(quote.createdAt)}</div>
                      </div>
                    </div>
                    <div className="jt-c pt-hide-sm" role="cell"><div className="jt-t1 is-soft">{house ?? <span className="jt-t2">None</span>}</div></div>
                    <div role="cell"><StatusLabel status={status} label={status === 'SENT' ? 'Waiting for you' : undefined} /></div>
                    <div className="jt-t1 jt-amount" role="cell">{fmtMoney(quote.total, quote.currency)}</div>
                    <div className="jt-actions pt-hide-sm" role="cell" onClick={e => e.stopPropagation()}>
                      {canDecide && (
                        <>
                          <button type="button" className="jt-act" style={{ background: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }} disabled={isRowPending} onClick={() => handleAcceptQuote(quote)}>
                            {isRowPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Approve
                          </button>
                          <button type="button" className="jt-act jt-icon" title="Decline this quote" aria-label="Decline this quote" disabled={isRowPending} onClick={() => handleDeclineQuote(quote)}><XCircle size={15} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="jt-more">
                    <div className="jt-more-in">
                      <div className="jt-detail" style={{ paddingLeft: 52 }}>
                        <div className="jt-facts">
                          <span className="jt-fact"><span className="k">Total</span> {fmtMoney(quote.total, quote.currency)}</span>
                          {quote.validUntil && <span className="jt-fact"><span className="k">Valid until</span> {fmtDate(quote.validUntil)}</span>}
                          {house && <span className="jt-fact"><span className="k">House</span> {house}</span>}
                        </div>
                        {quote.notes && <div className="jt-desc">{quote.notes}</div>}
                        <div className="jt-facts" onClick={e => e.stopPropagation()}>
                          <button type="button" className="jt-act" onClick={() => openDetail(quote)}>Open quote</button>
                          <button type="button" className="jt-act" onClick={() => handleViewPdf(quote)}><FileText size={13} /> View PDF</button>
                          <button type="button" className="jt-act" onClick={() => handleDownloadPdf(quote)}><Download size={13} /> Download PDF</button>
                          {canDecide && <button type="button" className="jt-act" disabled={isRowPending} onClick={() => handleDeclineQuote(quote)}>Decline</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Pager total={filtered.length} page={safePage} onPage={setPage} noun="quotes" />
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
