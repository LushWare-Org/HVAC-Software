/**
 * AgreementDrawer — full agreement detail slide-over with lifecycle actions
 * (send / renew / cancel) and amendment history. Shared by the Agreements
 * page and the Day Planner so agreement details look the same everywhere.
 */
import { useState } from 'react'
import {
  Loader2, Send, RefreshCw, XCircle, Pencil, X, CheckCircle2, AlarmClock, History,
  FileSignature, CalendarClock, Download,
} from 'lucide-react'
import {
  useServiceAgreement, useSendAgreement, useRenewAgreement, useCancelAgreement, useDownloadAgreementPdf,
  type Agreement,
} from '../../hooks/useAgreements'
import { useToast } from '../../contexts/ToastContext'
import { AgreementStatusBadge, VisitMeter, intervalLabel, fmtDate, fmtMoney, daysUntil, SectionLabel } from './shared'

function AmendmentHistory({ agreement, expanded, onExpand }: { agreement: Agreement; expanded: boolean; onExpand: () => void }) {
  const amendments = agreement.amendments ?? []
  if (amendments.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--t4)' }}>No changes since the agreement was created.</p>
  }
  const visible = expanded ? amendments : amendments.slice(0, 3)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {visible.map(a => (
        <div key={a.id} style={{ padding: '10px 12px', background: 'var(--bg-card-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
              {a.changedByName || 'Staff'} changed {Object.keys(a.changedFields).length} term{Object.keys(a.changedFields).length === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{fmtDate(a.createdAt)}</span>
          </div>
          {Object.entries(a.changedFields).map(([field, change]) => (
            <p key={field} style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0' }}>
              <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{field}</span>
              {': '}{String(change.from ?? '—')} → {String(change.to ?? '—')}
            </p>
          ))}
          <p style={{ fontSize: 11, marginTop: 6, color: a.customerConfirmedAt ? 'var(--green)' : 'var(--amber)' }}>
            {a.customerConfirmedAt
              ? `Customer confirmed ${fmtDate(a.customerConfirmedAt)}`
              : a.customerNotifiedAt ? 'Waiting for customer to confirm' : 'Customer not yet notified'}
          </p>
        </div>
      ))}
      {!expanded && amendments.length > 3 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={onExpand}
        >
          Show all {amendments.length} changes
        </button>
      )}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '6px 0' }}>
      <span style={{ color: 'var(--t3)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--t1)', textAlign: 'right' }}>{children}</span>
    </div>
  )
}

export default function AgreementDrawer({ id, onClose, onEdit, variant = 'drawer' }: {
  id: string; onClose: () => void; onEdit?: (a: Agreement) => void
  /** 'drawer' slides in from the right (Agreements page); 'modal' renders a centered card matching JobDetailModal (Day Planner). */
  variant?: 'drawer' | 'modal'
}) {
  const { data: agreement, isLoading } = useServiceAgreement(id)
  const sendMut = useSendAgreement()
  const renewMut = useRenewAgreement()
  const cancelMut = useCancelAgreement()
  const downloadPdf = useDownloadAgreementPdf()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [showAllAmendments, setShowAllAmendments] = useState(false)

  const act = (mut: any, id: string, success: string) =>
    mut.mutate(id, {
      onSuccess: () => toast.showSuccess(success),
      onError: (e: any) => toast.showError(e?.response?.data?.message ?? 'Something went wrong'),
    })

  const onDownloadPdf = async () => {
    try {
      const blob = await downloadPdf.mutateAsync(agreement!.id)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `agreement-${agreement!.name}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.showError(e?.response?.data?.message ?? 'Could not download the PDF', 'Download failed')
    }
  }

  const content = (
    <>
        {isLoading || !agreement ? (
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: '60%', height: 18, borderRadius: 4, background: 'var(--bg-card-2)' }} />
              <div style={{ width: '40%', height: 13, borderRadius: 4, background: 'var(--bg-card-2)' }} />
              <div style={{ width: 90, height: 20, borderRadius: 'var(--r-full)', background: 'var(--bg-card-2)' }} />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ width: '100%', height: 64, borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)' }} />
            ))}
          </div>
        ) : (
          <>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileSignature size={16} style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {agreement.name}
                    <AgreementStatusBadge status={agreement.status} />
                  </div>
                  <div className="card-subtitle">
                    {agreement.customer ? `${agreement.customer.firstName} ${agreement.customer.lastName}` : agreement.customerId}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {onEdit && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onEdit(agreement)}><Pencil size={12} /> Edit</button>
                )}
                {['DRAFT', 'SENT'].includes(agreement.status) && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(sendMut, agreement.id, 'Agreement emailed to customer')} disabled={sendMut.isPending}>
                    {sendMut.isPending ? <Loader2 size={12} className="spin" /> : <Send size={12} />} {agreement.status === 'SENT' ? 'Resend' : 'Send to customer'}
                  </button>
                )}
                {['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(agreement.status) && (
                  <button className="btn btn-primary btn-sm" onClick={() => act(renewMut, agreement.id, 'Renewal drafted — review and send it to the customer')} disabled={renewMut.isPending}>
                    {renewMut.isPending ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Renew
                  </button>
                )}
                {!['CANCELLED', 'EXPIRED', 'RENEWED'].includes(agreement.status) && (
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)' }} onClick={() => setConfirmCancel(true)}>
                    <XCircle size={12} /> Cancel
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={onDownloadPdf} disabled={downloadPdf.isPending}>
                  {downloadPdf.isPending ? <Loader2 size={12} className="spin" /> : <Download size={12} />} Download PDF
                </button>
              </div>

              {/* Visits */}
              {(agreement.serviceInterval || agreement.visitsIncluded != null) && (
                <div style={{ padding: '12px 14px', background: 'var(--bg-card-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)' }}>
                  <div style={{ marginBottom: 8 }}><SectionLabel icon={CalendarClock}>Service visits</SectionLabel></div>
                  <VisitMeter agreement={agreement} size={12} />
                  <div style={{ marginTop: 10 }}>
                    <DetailRow label="Frequency">{intervalLabel(agreement)}</DetailRow>
                    <DetailRow label="Last visit">{fmtDate(agreement.lastServiceDate)}</DetailRow>
                    <DetailRow label="Next visit due">
                      {agreement.nextServiceDate ? (
                        <span style={{ color: (daysUntil(agreement.nextServiceDate) ?? 99) <= 7 ? 'var(--amber)' : 'var(--t1)' }}>
                          {fmtDate(agreement.nextServiceDate)}
                        </span>
                      ) : '—'}
                    </DetailRow>
                    <DetailRow label="Auto-create jobs">
                      {agreement.autoCreateJobs ? `Yes — ${agreement.leadDays} days ahead` : 'No'}
                    </DetailRow>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div style={{ padding: '12px 14px', background: 'var(--bg-card-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)' }}>
                <div style={{ marginBottom: 8 }}><SectionLabel icon={FileSignature}>Terms</SectionLabel></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', columnGap: 24 }}>
                  <DetailRow label="Service">{agreement.serviceType || '—'}</DetailRow>
                  <DetailRow label="Period">{fmtDate(agreement.startDate)} → {fmtDate(agreement.endDate)}</DetailRow>
                  <DetailRow label="Total value">{fmtMoney(agreement.value)}</DetailRow>
                  <DetailRow label="Billing">
                    {agreement.billingCycle
                      ? `${agreement.billingCycle.toLowerCase()}${agreement.billingAmount != null ? ` — ${fmtMoney(agreement.billingAmount)}/period` : ''}`
                      : '—'}
                  </DetailRow>
                  {agreement.nextBillingDate && <DetailRow label="Next billing">{fmtDate(agreement.nextBillingDate)}</DetailRow>}
                  <DetailRow label="Auto-renew">{agreement.autoRenew ? 'Yes' : 'No'}</DetailRow>
                </div>
                {agreement.description && (
                  <p style={{ fontSize: 13, color: 'var(--t2)', whiteSpace: 'pre-wrap', borderLeft: '3px solid var(--bd)', paddingLeft: 10, marginTop: 8 }}>
                    {agreement.description}
                  </p>
                )}
              </div>

              {/* Confirmation state */}
              <div style={{ marginBottom: -6 }}><SectionLabel icon={CheckCircle2}>Confirmation</SectionLabel></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                {agreement.customerConfirmedAt ? (
                  <><CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
                    <span style={{ color: 'var(--t2)' }}>
                      Confirmed by {agreement.signedByName || 'customer'} on {fmtDate(agreement.customerConfirmedAt)}
                    </span></>
                ) : (
                  <><AlarmClock size={14} style={{ color: 'var(--amber)' }} />
                    <span style={{ color: 'var(--t3)' }}>Not yet confirmed by the customer</span></>
                )}
              </div>

              {/* Amendments */}
              <div>
                <div style={{ marginBottom: 8 }}><SectionLabel icon={History}>Change history</SectionLabel></div>
                <AmendmentHistory agreement={agreement} expanded={showAllAmendments} onExpand={() => setShowAllAmendments(true)} />
              </div>
            </div>

            {confirmCancel && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
                <div className="card anim-fade-up" style={{ width: 400, maxWidth: '90vw', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <div className="card-header"><div className="card-title">Cancel this agreement?</div></div>
                  <div className="card-body">
                    <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                      No more service jobs will be created from it. This doesn't delete the record — the history stays on the customer.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirmCancel(false)}>Keep it</button>
                    <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white', border: 'none' }}
                      onClick={() => { act(cancelMut, agreement.id, 'Agreement cancelled'); setConfirmCancel(false) }} disabled={cancelMut.isPending}>
                      {cancelMut.isPending ? <Loader2 size={12} className="spin" /> : <XCircle size={12} />} Cancel agreement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </>
  )

  if (variant === 'modal') {
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="card anim-fade-up"
          role="dialog"
          aria-modal="true"
          style={{ width: 700, maxWidth: '95vw', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          onClick={e => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
      <div
        className="anim-fade-up"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 460, maxWidth: '95vw',
          background: 'var(--bg-card)', borderLeft: '1px solid var(--bd)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  )
}
