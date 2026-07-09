import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { X, FileText, Calendar, Download, CheckCircle2, Eye } from 'lucide-react'
import { useMyQuote } from '../../hooks/useCustomerPortal'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import type { Quote } from '../../types/api'
import { formatMoney } from '../../lib/format'

interface QuoteDetailModalProps {
  quote: Quote
  onClose: () => void
}

type TabType = 'details' | 'items' | 'timeline'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  DRAFT: { label: 'Draft', css: 'badge-neutral' },
  SENT: { label: 'Sent', css: 'badge-amber' },
  VIEWED: { label: 'Viewed', css: 'badge-blue' },
  ACCEPTED: { label: 'Accepted', css: 'badge-green' },
  DECLINED: { label: 'Declined', css: 'badge-red' },
  EXPIRED: { label: 'Expired', css: 'badge-red' },
  CONVERTED: { label: 'Converted', css: 'badge-cyan' },
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  color: '#374151',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

function fmtMoney(value?: string | number) {
  return formatMoney(value)
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function QuoteDetailModal({ quote: initialQuote, onClose }: QuoteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const { data } = useMyQuote(initialQuote.id)
  const quote = data ?? initialQuote
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const status = STATUS_MAP[quote.status] ?? { label: quote.status, css: 'badge-neutral' }

  const handleViewPdf = async () => {
    try {
      await viewPdf(`/finance/quotes/${quote.id}/pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to open quote PDF right now.')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf(`/finance/quotes/${quote.id}/pdf`, `${quote.quoteNumber}.pdf`)
      showSuccess(`Downloaded ${quote.quoteNumber}.pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to download quote PDF right now.')
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Quote Details', icon: <FileText size={14} /> },
    { id: 'items', label: 'Line Items', icon: <CheckCircle2 size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <Calendar size={14} /> },
  ]

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cp-modal-container"
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 760,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          height: 640,
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="cp-modal-header"
          style={{
            background: 'linear-gradient(135deg, #0F766E, #0D9488)',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ color: '#CCFBF1', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
                {quote.quoteNumber}
              </span>
              <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>
                {status.label}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{quote.title}</h2>
            <p style={{ color: '#CCFBF1', fontSize: 13, marginTop: 2 }}>
              Total: {fmtMoney(quote.total)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#CCFBF1',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cp-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '13px 22px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? '#0F766E' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#0F766E' : '#6B7280',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="cp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {activeTab === 'details' && (
            <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Field label="Quote Number"><div style={fieldStyle}>{quote.quoteNumber}</div></Field>
              <Field label="Status"><span className={`badge ${status.css}`} style={{ fontSize: 13 }}>{status.label}</span></Field>
              <Field label="Created On"><div style={fieldStyle}>{fmtDate(quote.createdAt)}</div></Field>
              <Field label="Valid Until"><div style={fieldStyle}>{fmtDate(quote.validUntil)}</div></Field>
              <Field label="Subtotal"><div style={fieldStyle}>{fmtMoney(quote.subtotal)}</div></Field>
              <Field label="Tax"><div style={fieldStyle}>{fmtMoney(quote.taxAmount)}</div></Field>
              <Field label="Total" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, fontWeight: 700, color: '#0F766E' }}>{fmtMoney(quote.total)}</div>
              </Field>
              <Field label="Notes" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, minHeight: 84, lineHeight: 1.55 }}>{quote.notes || 'No notes provided.'}</div>
              </Field>
            </div>
          )}

          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cp-modal-grid-4col" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Qty</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Unit Price</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</span>
              </div>
              {(quote.lineItems ?? []).map(item => (
                <div key={item.id} className="cp-modal-grid-4col" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.description}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right' }}>{item.quantity}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right' }}>{fmtMoney(item.unitPrice)}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 700, textAlign: 'right' }}>{fmtMoney(item.lineTotal)}</span>
                </div>
              ))}
              {(quote.lineItems ?? []).length === 0 && (
                <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 0' }}>No line items available for this quote.</div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Quote created', date: quote.createdAt },
                { label: 'Quote sent', date: quote.sentAt },
                { label: 'Quote viewed', date: quote.viewedAt },
                { label: 'Quote approved', date: quote.approvedAt ?? quote.acceptedAt },
              ].filter(x => !!x.date).map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: 18 }}>•</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{e.label}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(e.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="cp-modal-footer"
          style={{
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: 9,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
          <button
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: '1px solid #0F766E',
              background: '#F0FDFA',
              color: '#0F766E',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="View PDF"
            onClick={handleViewPdf}
          >
            <Eye size={14} /> View PDF
          </button>
          <button
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: '1px solid #0F766E',
              background: 'transparent',
              color: '#0F766E',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Download PDF"
            onClick={handleDownloadPdf}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
