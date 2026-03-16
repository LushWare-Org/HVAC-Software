import { CheckCircle, CreditCard, X } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useCreatePaymentIntent } from '../../hooks/useCustomerPortal'
import type { Invoice } from '../../types/api'

interface PayInvoiceModalProps {
  onClose: () => void
  invoice: Invoice
}

type PayMethod = 'card' | 'bank'

function fmtMoney(value?: string | number) {
  return `$${Number(value ?? 0).toLocaleString()}`
}

export default function PayInvoiceModal({ onClose, invoice }: PayInvoiceModalProps) {
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const { mutateAsync: createPaymentIntent } = useCreatePaymentIntent()

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardData(prev => ({ ...prev, [name]: value }))
  }

  const handlePay = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      if (payMethod === 'card') {
        const paymentIntent = await createPaymentIntent(invoice.id)
        if (!paymentIntent.paymentUrl) {
          throw new Error('Payment link is unavailable for this invoice')
        }
        window.open(paymentIntent.paymentUrl, '_blank', 'noopener,noreferrer')
        setStatusMessage('Secure payment page opened. Once payment is completed, your invoice status will update automatically.')
      } else {
        setStatusMessage('Use the bank transfer details below and include the invoice number as your payment reference.')
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? error?.message ?? 'Unable to start payment right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 9,
    border: '1px solid #D1D5DB',
    background: '#fff',
    color: '#111827',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const modal = (
    <div
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
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Pay Invoice</h2>
              <p style={{ color: '#BFDBFE', fontSize: 12, marginTop: 2 }}>{invoice.invoiceNumber}</p>
            </div>
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
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#BFDBFE',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {statusMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={32} style={{ color: '#16A34A' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {payMethod === 'card' ? 'Continue Payment Securely' : 'Bank Transfer Details Ready'}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{statusMessage}</div>
              </div>
            </div>
          ) : (
            <>
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

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Payment Method
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ id: 'card' as PayMethod, label: 'Card' }, { id: 'bank' as PayMethod, label: 'Bank Transfer' }].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: 9,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        border: `2px solid ${payMethod === m.id ? '#2563EB' : '#E5E7EB'}`,
                        background: payMethod === m.id ? '#EFF6FF' : '#F9FAFB',
                        color: payMethod === m.id ? '#1D4ED8' : '#374151',
                        fontSize: 13,
                        fontWeight: payMethod === m.id ? 600 : 500,
                        transition: 'all 0.15s',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Card Number</label>
                    <input type="text" name="number" value={cardData.number} onChange={handleChange} placeholder="1234 5678 9012 3456" maxLength={19} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Cardholder Name</label>
                    <input type="text" name="name" value={cardData.name} onChange={handleChange} placeholder="As shown on card" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Expiry Date</label>
                      <input type="text" name="expiry" value={cardData.expiry} onChange={handleChange} placeholder="MM / YY" maxLength={7} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>CVV / CVC</label>
                      <input type="password" name="cvv" value={cardData.cvv} onChange={handleChange} placeholder="•••" maxLength={4} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'bank' && (
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 18 }}>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
                    Transfer the exact amount to the following account:
                  </p>
                  {[
                    { label: 'Account Name', value: 'T&S Field Services Ltd' },
                    { label: 'Account Number', value: '**** **** 1234' },
                    { label: 'Sort Code', value: '12-34-56' },
                    { label: 'Reference Number', value: invoice.invoiceNumber },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {errorMessage && (
                <div style={{ borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', padding: '12px 14px', fontSize: 12, color: '#B91C1C', lineHeight: 1.6 }}>
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </div>

        {!statusMessage && (
          <div
            style={{
              background: '#F9FAFB',
              borderTop: '1px solid #E5E7EB',
              padding: '16px 24px',
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
                padding: '10px 24px',
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
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={isLoading}
              style={{
                padding: '10px 26px',
                borderRadius: 9,
                border: 'none',
                background: isLoading ? '#93C5FD' : '#2563EB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <CreditCard size={15} />
              {isLoading ? 'Preparing…' : payMethod === 'card' ? `Pay ${fmtMoney(outstanding)}` : 'I have the bank details'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}
