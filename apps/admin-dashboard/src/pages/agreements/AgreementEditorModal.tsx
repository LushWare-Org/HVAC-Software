/**
 * AgreementEditorModal — create or edit a service agreement.
 * When editing an ACTIVE agreement, saving records an amendment and the
 * customer is emailed to re-confirm the new terms.
 */
import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Search, AlertCircle, FileSignature } from 'lucide-react'
import { useCustomers } from '../../hooks/useCustomers'
import {
  useCreateAgreement, useUpdateAgreement,
  type Agreement, type AgreementInput,
} from '../../hooks/useAgreements'
import { INTERVAL_LABELS } from './shared'

const BILLING_CYCLES = [
  { value: 'UPFRONT', label: 'Paid upfront' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Yearly' },
]

const toDateInput = (d?: string | null) => (d ? d.slice(0, 10) : '')

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', margin: '4px 0 0',
    }}>
      {children}
    </p>
  )
}

export default function AgreementEditorModal({
  agreement, presetCustomerId, presetCustomerName, onClose, onSaved,
}: {
  agreement?: Agreement | null
  presetCustomerId?: string
  presetCustomerName?: string
  onClose: () => void
  onSaved?: (a: Agreement) => void
}) {
  const isEdit = !!agreement

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createMut = useCreateAgreement()
  const updateMut = useUpdateAgreement()
  const pending = createMut.isPending || updateMut.isPending

  const [error, setError] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [form, setForm] = useState({
    customerId: agreement?.customerId ?? presetCustomerId ?? '',
    customerLabel: agreement?.customer
      ? `${agreement.customer.firstName} ${agreement.customer.lastName}`.trim()
      : presetCustomerName ?? '',
    name: agreement?.name ?? '',
    description: agreement?.description ?? '',
    startDate: toDateInput(agreement?.startDate) || new Date().toISOString().slice(0, 10),
    endDate: toDateInput(agreement?.endDate),
    value: agreement?.value != null ? String(agreement.value) : '',
    billingCycle: agreement?.billingCycle ?? '',
    billingAmount: agreement?.billingAmount != null ? String(agreement.billingAmount) : '',
    nextBillingDate: toDateInput(agreement?.nextBillingDate),
    serviceType: agreement?.serviceType ?? '',
    serviceInterval: agreement?.serviceInterval ?? '',
    serviceIntervalDays: agreement?.serviceIntervalDays != null ? String(agreement.serviceIntervalDays) : '',
    visitsIncluded: agreement?.visitsIncluded != null ? String(agreement.visitsIncluded) : '',
    autoCreateJobs: agreement?.autoCreateJobs ?? true,
    leadDays: String(agreement?.leadDays ?? 7),
    autoRenew: agreement?.autoRenew ?? false,
  })

  const customersQuery = useCustomers({ search: customerSearch, limit: 8 })
  const customerOptions = useMemo(
    () => (pickerOpen ? (customersQuery.data?.data ?? []) : []),
    [pickerOpen, customersQuery.data],
  )

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }))

  const handleSave = () => {
    setError('')
    if (!form.customerId) return setError('Pick a customer for this agreement.')
    if (!form.name.trim()) return setError('Give the agreement a name.')
    if (!form.startDate) return setError('Set a start date.')
    if (form.serviceInterval === 'CUSTOM' && !form.serviceIntervalDays) {
      return setError('Custom frequency needs the number of days between visits.')
    }

    const payload: AgreementInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      value: form.value !== '' ? Number(form.value) : undefined,
      billingCycle: form.billingCycle || undefined,
      billingAmount: form.billingAmount !== '' ? Number(form.billingAmount) : undefined,
      nextBillingDate: form.nextBillingDate || undefined,
      serviceType: form.serviceType.trim() || undefined,
      serviceInterval: form.serviceInterval || undefined,
      serviceIntervalDays: form.serviceIntervalDays !== '' ? Number(form.serviceIntervalDays) : undefined,
      visitsIncluded: form.visitsIncluded !== '' ? Number(form.visitsIncluded) : undefined,
      autoCreateJobs: form.autoCreateJobs,
      leadDays: form.leadDays !== '' ? Number(form.leadDays) : undefined,
      autoRenew: form.autoRenew,
    }

    const opts = {
      onSuccess: (a: Agreement) => { onSaved?.(a); onClose() },
      onError: (err: any) => setError(err?.response?.data?.message ?? 'Could not save the agreement.'),
    }
    if (isEdit) updateMut.mutate({ id: agreement!.id, ...payload }, opts)
    else createMut.mutate({ ...payload, customerId: form.customerId }, opts)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 16px',
      }}
      onClick={onClose}
    >
      <div
        className="card anim-fade-up"
        role="dialog"
        aria-modal="true"
        style={{
          width: 640, maxWidth: '95vw', padding: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          // Lock to the viewport: header + footer stay pinned, only the body scrolls
          height: 'min(720px, calc(100vh - 48px))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSignature size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="card-title">{isEdit ? 'Edit agreement' : 'New service agreement'}</div>
              <div className="card-subtitle">
                {isEdit && agreement?.status === 'ACTIVE'
                  ? 'Changes to an active agreement are sent to the customer to confirm'
                  : 'Structure it however this customer’s deal works — every field except the basics is optional'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'var(--red-dim)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 13,
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* ── Basics ── */}
          <SectionLabel>Agreement</SectionLabel>

          {!isEdit && !presetCustomerId && (
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Customer *</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 30 }}
                  placeholder="Search customers by name…"
                  value={form.customerId ? form.customerLabel : customerSearch}
                  onFocus={() => { setPickerOpen(true); if (form.customerId) { set({ customerId: '', customerLabel: '' }); setCustomerSearch('') } }}
                  onChange={e => { setCustomerSearch(e.target.value); setPickerOpen(true) }}
                />
              </div>
              {pickerOpen && customerOptions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40, marginTop: 2,
                  background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                }}>
                  {customerOptions.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className="btn btn-ghost"
                      style={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 0, fontSize: 13 }}
                      onClick={() => { set({ customerId: c.id, customerLabel: `${c.firstName} ${c.lastName}`.trim() }); setPickerOpen(false) }}
                    >
                      {c.firstName} {c.lastName}
                      {c.email && <span style={{ color: 'var(--t4)', marginLeft: 8, fontSize: 12 }}>{c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {(presetCustomerName || (isEdit && form.customerLabel)) && (
            <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
              Customer: <strong style={{ color: 'var(--t1)' }}>{form.customerLabel || presetCustomerName}</strong>
            </p>
          )}

          <div className="form-group">
            <label className="form-label">Agreement name *</label>
            <input className="form-input" placeholder="e.g. Annual AC Care Plan" value={form.name} onChange={e => set({ name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Terms & scope</label>
            <textarea
              className="form-input" rows={3} style={{ resize: 'vertical' }}
              placeholder="What's covered, response times, exclusions — the customer sees this in the confirmation email"
              value={form.description} onChange={e => set({ description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Starts *</label>
              <input type="date" className="form-input" value={form.startDate} onChange={e => set({ startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ends</label>
              <input type="date" className="form-input" value={form.endDate} onChange={e => set({ endDate: e.target.value })} />
            </div>
          </div>

          {/* ── Pricing ── */}
          <SectionLabel>Pricing</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Total value ($)</label>
              <input type="number" min="0" step="0.01" className="form-input" placeholder="1200.00" value={form.value} onChange={e => set({ value: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Billing</label>
              <select className="form-input" value={form.billingCycle} onChange={e => set({ billingCycle: e.target.value })}>
                <option value="">Not set</option>
                {BILLING_CYCLES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>
          {form.billingCycle && form.billingCycle !== 'UPFRONT' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Amount per period ($)</label>
                <input type="number" min="0" step="0.01" className="form-input" placeholder="100.00" value={form.billingAmount} onChange={e => set({ billingAmount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Next billing date</label>
                <input type="date" className="form-input" value={form.nextBillingDate} onChange={e => set({ nextBillingDate: e.target.value })} />
              </div>
            </div>
          )}

          {/* ── Service schedule ── */}
          <SectionLabel>Service schedule</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Service type</label>
              <input className="form-input" placeholder="e.g. AC Full Service" value={form.serviceType} onChange={e => set({ serviceType: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">How often</label>
              <select className="form-input" value={form.serviceInterval} onChange={e => set({ serviceInterval: e.target.value })}>
                <option value="">Not scheduled</option>
                {Object.entries(INTERVAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {form.serviceInterval === 'CUSTOM' && (
              <div className="form-group">
                <label className="form-label">Days between visits *</label>
                <input type="number" min="1" className="form-input" placeholder="45" value={form.serviceIntervalDays} onChange={e => set({ serviceIntervalDays: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Visits included</label>
              <input type="number" min="1" className="form-input" placeholder="Leave empty for unlimited" value={form.visitsIncluded} onChange={e => set({ visitsIncluded: e.target.value })} />
            </div>
          </div>

          {/* ── Automation ── */}
          <SectionLabel>Automation</SectionLabel>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.autoCreateJobs} onChange={e => set({ autoCreateJobs: e.target.checked })} />
            Create service jobs automatically when a visit comes due
          </label>
          {form.autoCreateJobs && (
            <div className="form-group" style={{ maxWidth: 220 }}>
              <label className="form-label">Create job this many days ahead</label>
              <input type="number" min="0" className="form-input" value={form.leadDays} onChange={e => set({ leadDays: e.target.value })} />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.autoRenew} onChange={e => set({ autoRenew: e.target.checked })} />
            Auto-renew when the agreement ends
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={pending}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={pending}>
            {pending
              ? <><Loader2 size={12} className="spin" /> Saving…</>
              : isEdit ? 'Save changes' : 'Create agreement'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
