/**
 * CustomerAgreementsTab — real service agreements inside CustomerDetailsSidebar.
 * Compact cards with visit meters; create/edit via the shared editor modal.
 */
import { useState } from 'react'
import { ShieldCheck, Plus, Loader2, Send, RefreshCw, Pencil } from 'lucide-react'
import {
  useServiceAgreements, useSendAgreement, useRenewAgreement,
  type Agreement,
} from '../../hooks/useAgreements'
import { useToast } from '../../contexts/ToastContext'
import AgreementEditorModal from './AgreementEditorModal'
import { AgreementStatusBadge, VisitMeter, intervalLabel, fmtDate, fmtMoney } from './shared'

export default function CustomerAgreementsTab({ customerId, customerName }: {
  customerId: string
  customerName: string
}) {
  const { data, isLoading } = useServiceAgreements({ customerId, limit: 50 })
  const sendMut = useSendAgreement()
  const renewMut = useRenewAgreement()
  const toast = useToast()
  const [editorTarget, setEditorTarget] = useState<Agreement | null | 'new'>(null)

  const agreements = data?.data ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <ShieldCheck size={14} style={{ color: 'var(--blue)' }} /> Service agreements
        </p>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditorTarget('new')}>
          <Plus size={13} /> New agreement
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 size={20} className="spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : agreements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--t3)' }}>
          <ShieldCheck size={36} style={{ marginBottom: 10, opacity: 0.35 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No agreements yet</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 4 }}>
            Create a maintenance plan — recurring visits are scheduled from it automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agreements.map(a => (
            <div key={a.id} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{a.name}</p>
                  {(a.serviceType || a.serviceInterval) && (
                    <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>
                      {[a.serviceType, intervalLabel(a) !== '—' ? intervalLabel(a) : null].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <AgreementStatusBadge status={a.status} />
              </div>

              {(a.visitsIncluded != null || a.serviceInterval) && (
                <div style={{ margin: '8px 0' }}><VisitMeter agreement={a} /></div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>
                <span>Next visit: <span style={{ color: 'var(--t2)' }}>{fmtDate(a.nextServiceDate)}</span></span>
                <span>{fmtMoney(a.value)}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditorTarget(a)}><Pencil size={11} /> Edit</button>
                {['DRAFT', 'SENT'].includes(a.status) && (
                  <button
                    className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }}
                    disabled={sendMut.isPending}
                    onClick={() => sendMut.mutate(a.id, {
                      onSuccess: () => toast.showSuccess('Agreement emailed to customer'),
                      onError: (e: any) => toast.showError(e?.response?.data?.message ?? 'Could not send'),
                    })}
                  >
                    <Send size={11} /> {a.status === 'SENT' ? 'Resend' : 'Send'}
                  </button>
                )}
                {['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(a.status) && (
                  <button
                    className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }}
                    disabled={renewMut.isPending}
                    onClick={() => renewMut.mutate(a.id, {
                      onSuccess: () => toast.showSuccess('Renewal drafted'),
                      onError: (e: any) => toast.showError(e?.response?.data?.message ?? 'Could not renew'),
                    })}
                  >
                    <RefreshCw size={11} /> Renew
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editorTarget && (
        <AgreementEditorModal
          agreement={editorTarget === 'new' ? null : editorTarget}
          presetCustomerId={customerId}
          presetCustomerName={customerName}
          onClose={() => setEditorTarget(null)}
        />
      )}
    </div>
  )
}
