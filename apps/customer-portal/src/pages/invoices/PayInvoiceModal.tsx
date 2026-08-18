import { AlertCircle, CheckCircle, CreditCard, Loader2, Lock, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useCreatePaymentIntent } from '../../hooks/useCustomerPortal'
import api from '../../lib/api'
import type { Invoice } from '../../types/api'
import { formatMoney } from '../../lib/format'

interface PayInvoiceModalProps {
  onClose: () => void
  invoice: Invoice
}

type PayMethod = 'card' | 'bank'
type PayState = 'idle' | 'opening' | 'polling' | 'success' | 'cancelled' | 'bankConfirm'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_MS = 10 * 60 * 1000 // 10 minutes

export default function PayInvoiceModal({ onClose, invoice }: PayInvoiceModalProps) {
  const fmtMoney = (value?: string | number) => formatMoney(value, { currency: invoice.currency })
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [payState, setPayState] = useState<PayState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [confirmedInvoice, setConfirmedInvoice] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<Window | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef = useRef<number>(0)
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent()

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      stopPolling()
      popupRef.current?.close()
    }
  }, [])

  function stopPolling() {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  function startPolling(invoiceId: string) {
    pollStartRef.current = Date.now()

    pollTimerRef.current = setInterval(async () => {
      // Enforce max duration
      if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
        stopPolling()
        popupRef.current?.close()
        setPayState('cancelled')
        return
      }

      const popup = popupRef.current

      // Once Stripe redirects it back to our domain we can read the URL.
      if (popup && !popup.closed) {
        try {
          const href = popup.location.href
          if (href.includes('payment=success')) {
            stopPolling()
            popup.close()
            try {
              const { data } = await api.get(`/finance/invoices/${invoiceId}`)
              setConfirmedInvoice(data)
            } catch { /* use invoice prop as fallback */ }
            setPayState('success')
            return
          }
          if (href.includes('payment=cancelled')) {
            stopPolling()
            popup.close()
            setPayState('cancelled')
            return
          }
        } catch {
        }
      }

      try {
        if (popup?.closed) {
          stopPolling()
          const { data } = await api.get(`/finance/invoices/${invoiceId}`)
          if (data.status === 'PAID' || data.status === 'PARTIALLY_PAID') {
            setConfirmedInvoice(data)
            setPayState('success')
          } else {
            setPayState('cancelled')
          }
          return
        }

        const { data } = await api.get(`/finance/invoices/${invoiceId}`)
        if (data.status === 'PAID' || data.status === 'PARTIALLY_PAID') {
          stopPolling()
          popup?.close()
          setConfirmedInvoice(data)
          setPayState('success')
        }
      } catch {
      }
    }, POLL_INTERVAL_MS)
  }

  const handlePay = async () => {
    setErrorMessage(null)

    if (payMethod === 'bank') {
      setPayState('bankConfirm')
      return
    }

    setPayState('opening')

    // Open a blank popup window NOW — synchronously, while still inside the
    const popup = window.open('', 'stripe_checkout', 'width=640,height=740,scrollbars=yes,resizable=yes')

    try {
      const paymentIntent = await createPaymentIntent(invoice.id)
      if (!paymentIntent.paymentUrl) {
        popup?.close()
        throw new Error('Payment link unavailable for this invoice')
      }

      if (popup && !popup.closed) {
        popup.location.href = paymentIntent.paymentUrl
        popupRef.current = popup
      } else {
        // Popup was blocked despite the pre-open — fall back to new tab
        window.open(paymentIntent.paymentUrl, '_blank', 'noopener,noreferrer')
      }

      setPayState('polling')
      startPolling(invoice.id)
    } catch (error: any) {
      popup?.close()
      setPayState('idle')
      setErrorMessage(error?.response?.data?.message ?? error?.message ?? 'Unable to start payment right now.')
    }
  }

  const handleCancelPolling = () => {
    stopPolling()
    popupRef.current?.close()
    popupRef.current = null
    setPayState('idle')
  }

  // ── Content per state ───────────────────────────────────────────────────────

  function renderBody() {
    if (payState === 'success') {
      const fullyPaid = confirmedInvoice?.status === 'PAID'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={38} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Payment Successful!</div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
              {fullyPaid
                ? `Invoice ${invoice.invoiceNumber} has been fully paid. Thank you!`
                : `Partial payment of ${fmtMoney(confirmedInvoice?.amountPaid)} received for Invoice ${invoice.invoiceNumber}.`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ marginTop: 8, padding: '12px 48px', borderRadius: 9, border: 'none', background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            OK
          </button>
        </div>
      )
    }

    if (payState === 'cancelled') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={38} style={{ color: '#CA8A04' }} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Payment Not Completed</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              The payment window was closed before completing the payment.<br />Your invoice remains unpaid.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setPayState('idle')}
              style={{ padding: '10px 28px', borderRadius: 9, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              style={{ padding: '10px 28px', borderRadius: 9, border: 'none', background: '#F3F4F6', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Close
            </button>
          </div>
        </div>
      )
    }

    if (payState === 'polling') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', border: '5px solid #DBEAFE', borderTop: '5px solid #2563EB', animation: 'spin 0.9s linear infinite' }} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Payment In Progress</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              Complete your payment in the Stripe window that opened.<br />
              This page will update automatically once your payment is confirmed.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#1D4ED8' }}>Waiting for payment confirmation…</span>
          </div>
          <button
            onClick={handleCancelPolling}
            style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit', textDecoration: 'underline' }}
          >
            Cancel
          </button>
        </div>
      )
    }

    if (payState === 'bankConfirm') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={38} style={{ color: '#16A34A' }} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Transfer Details Confirmed</div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              {receiptFile
                ? `Receipt "${receiptFile.name}" noted. Our team will confirm your payment within 1–2 business days.`
                : 'Transfer the exact amount using the bank details provided. Our team will confirm receipt within 1–2 business days.'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ marginTop: 4, padding: '11px 40px', borderRadius: 9, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Done
          </button>
        </div>
      )
    }

    // idle / opening
    return (
      <>
        {/* Amount summary */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Amount Due</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1D4ED8' }}>{fmtMoney(outstanding)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Due Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: invoice.status === 'OVERDUE' ? '#DC2626' : '#374151' }}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Payment method tabs */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Payment Method
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['card', 'bank'] as PayMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setPayMethod(m)}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${payMethod === m ? '#2563EB' : '#E5E7EB'}`,
                  background: payMethod === m ? '#EFF6FF' : '#F9FAFB',
                  color: payMethod === m ? '#1D4ED8' : '#374151',
                  fontSize: 13, fontWeight: payMethod === m ? 600 : 500, transition: 'all 0.15s',
                }}
              >
                {m === 'card' ? 'Card' : 'Bank Transfer'}
              </button>
            ))}
          </div>
        </div>

        {payMethod === 'card' && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Lock size={16} style={{ color: '#16A34A' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803D', marginBottom: 4 }}>Secure Stripe Checkout</div>
              <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                A secure Stripe payment window will open. Enter your card details there — this page will update automatically once your payment is confirmed.
              </div>
            </div>
          </div>
        )}

        {payMethod === 'bank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 18 }}>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
                Transfer the exact amount to the following account:
              </p>
              {[
                { label: 'Account Name', value: 'HVACtor.ai Services Ltd' },
                { label: 'Account Number', value: '**** **** 1234' },
                { label: 'Sort Code', value: '12-34-56' },
                { label: 'Reference', value: invoice.invoiceNumber },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                  <span style={{ color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Upload Receipt <span style={{ color: '#D1D5DB', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 9,
                  border: `2px dashed ${receiptFile ? '#2563EB' : '#D1D5DB'}`,
                  background: receiptFile ? '#EFF6FF' : '#F9FAFB',
                  color: receiptFile ? '#1D4ED8' : '#6B7280',
                  fontSize: 13, fontWeight: receiptFile ? 600 : 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                <Upload size={15} />
                {receiptFile ? receiptFile.name : 'Click to upload receipt (image or PDF)'}
              </button>
              {receiptFile && (
                <button onClick={() => setReceiptFile(null)} style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div style={{ borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', padding: '12px 14px', fontSize: 12, color: '#B91C1C', lineHeight: 1.6 }}>
            {errorMessage}
          </div>
        )}
      </>
    )
  }

  const showFooter = payState === 'idle' || payState === 'opening'
  const showCloseX = payState !== 'polling' && payState !== 'opening'

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={payState === 'idle' ? onClose : undefined}
    >
      <div
        className="cp-modal-container"
        style={{ background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'modalIn 0.2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pay Invoice</h2>
              <p style={{ color: '#BFDBFE', fontSize: 12, marginTop: 2 }}>{invoice.invoiceNumber}</p>
            </div>
          </div>
          {showCloseX && (
            <button
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#BFDBFE', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {renderBody()}
        </div>

        {/* Footer — only in idle/opening states */}
        {showFooter && (
          <div style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 24px', borderRadius: 9, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={payState === 'opening'}
              style={{
                padding: '10px 26px', borderRadius: 9, border: 'none',
                background: payState === 'opening' ? '#93C5FD' : '#2563EB',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: payState === 'opening' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
              }}
            >
              {payState === 'opening'
                ? <Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} />
                : <CreditCard size={15} />}
              {payState === 'opening'
                ? 'Opening Stripe…'
                : payMethod === 'card'
                  ? `Pay ${fmtMoney(outstanding)} Securely`
                  : receiptFile ? 'Submit Receipt' : "I've Made the Transfer"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
      `}</style>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}
