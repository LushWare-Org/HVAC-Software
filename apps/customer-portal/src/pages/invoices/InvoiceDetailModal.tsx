import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, FileText, Calendar, Download, CreditCard, Eye } from 'lucide-react'
import { useMyInvoice } from '../../hooks/useCustomerPortal'
import { useToast } from '../../contexts/ToastContext'
import { downloadPdf, viewPdf } from '../../lib/pdf'
import type { Invoice } from '../../types/api'

interface InvoiceDetailModalProps {
  invoice: Invoice
  onClose: () => void
  onPay?: () => void
}

type TabType = 'details' | 'items' | 'activity'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  PAID: { label: 'Paid', css: 'badge-green' },
  SENT: { label: 'Pending', css: 'badge-amber' },
  OVERDUE: { label: 'Overdue', css: 'badge-red' },
  PARTIALLY_PAID: { label: 'Partial', css: 'badge-blue' },
  DRAFT: { label: 'Draft', css: 'badge-neutral' },
  VOID: { label: 'Void', css: 'badge-neutral' },
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
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'default',
}

function fmtMoney(value?: string | number) {
  return `$${Number(value ?? 0).toLocaleString()}`
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InvoiceDetailModal({ invoice: initialInvoice, onClose, onPay }: InvoiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const { data } = useMyInvoice(initialInvoice.id)
  const invoice = data ?? initialInvoice
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    if (invoice) setActiveTab('details')
  }, [invoice])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!invoice) return null

  const status = STATUS_MAP[invoice.status] ?? { label: invoice.status, css: 'badge-neutral' }
  const outstanding = Number(invoice.total) - Number(invoice.amountPaid)
  const canPay = ['SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status)

  const handleViewPdf = async () => {
    try {
      await viewPdf(`/finance/invoices/${invoice.id}/pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to open invoice PDF right now.')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf(`/finance/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`)
      showSuccess(`Downloaded ${invoice.invoiceNumber}.pdf`)
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Unable to download invoice PDF right now.')
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Invoice Details', icon: <FileText size={14} /> },
    { id: 'items', label: 'Line Items', icon: <CreditCard size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Calendar size={14} /> },
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
          maxWidth: 700,
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
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ color: '#BFDBFE', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
                {invoice.invoiceNumber}
              </span>
              <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>
                {status.label}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
              {invoice.lineItems?.[0]?.description || 'Invoice'}
            </h2>
            <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 2 }}>
              Amount due: {fmtMoney(outstanding > 0 ? outstanding : invoice.total)}
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
              color: '#BFDBFE',
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
                borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#2563EB' : '#6B7280',
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
              <InvField label="Invoice Number">
                <div style={fieldStyle}>{invoice.invoiceNumber}</div>
              </InvField>
              <InvField label="Status">
                <span className={`badge ${status.css}`} style={{ fontSize: 13 }}>{status.label}</span>
              </InvField>
              <InvField label="Amount">
                <div style={fieldStyle}>{fmtMoney(invoice.total)}</div>
              </InvField>
              <InvField label="Issue Date">
                <div style={fieldStyle}>{fmtDate(invoice.issueDate)}</div>
              </InvField>
              <InvField label="Due Date">
                <div style={{ ...fieldStyle, color: invoice.status === 'OVERDUE' ? '#DC2626' : '#374151' }}>
                  {fmtDate(invoice.dueDate)}
                </div>
              </InvField>
            </div>
          )}

          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</span>
              </div>
              {(invoice.lineItems || []).map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.description}</span>
                  <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{fmtMoney(item.total)}</span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '14px 0', marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>{fmtMoney(invoice.total)}</span>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { event: 'Invoice created', date: fmtDate(invoice.issueDate), icon: '📄' },
                { event: `Payment ${invoice.status === 'PAID' ? 'received' : 'pending'}`, date: fmtDate(invoice.dueDate), icon: invoice.status === 'PAID' ? '✅' : '⏳' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{a.event}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{a.date}</div>
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
              border: '1px solid #2563EB',
              background: '#EFF6FF',
              color: '#1D4ED8',
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
              border: '1px solid #2563EB',
              background: 'transparent',
              color: '#2563EB',
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
          {canPay && onPay && (
            <button
              style={{
                padding: '9px 24px',
                borderRadius: 9,
                border: 'none',
                background: '#2563EB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => {
                onClose()
                onPay()
              }}
            >
              <CreditCard size={14} /> Pay Securely
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

function InvField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
