/**
 * AgreementEditorModal — create or edit a service agreement.
 * When editing an ACTIVE agreement, saving records an amendment and the
 * customer is emailed to re-confirm the new terms.
 */
import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Search, AlertCircle, FileSignature, DollarSign, CalendarClock, Settings2 } from 'lucide-react'
import { useCustomers } from '../../hooks/useCustomers'
import {
  useCreateAgreement, useUpdateAgreement,
  type Agreement, type AgreementInput,
} from '../../hooks/useAgreements'
import { useDocumentTemplates } from '../finance/documentTemplatesApi'
import { INTERVAL_LABELS, SectionLabel } from './shared'

const BILLING_CYCLES = [
  { value: 'UPFRONT', label: 'Paid upfront' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Yearly' },
]

const toDateInput = (d?: string | null) => (d ? d.slice(0, 10) : '')

const sectionCardStyle: React.CSSProperties = {
  padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
  display: 'flex', flexDirection: 'column', gap: 12,
}

const fieldRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
}

export default function AgreementEditorModal({
  agreement, presetCustomerId, presetCustomerName, presetProjectId, presetComponentId, onClose, onSaved,
}: {
  agreement?: Agreement | null
  presetCustomerId?: string
  presetCustomerName?: string
  /** Attaches the agreement to a project on create. */
  presetProjectId?: string
  /** Attaches the agreement to a specific component within a templated project; projectId is auto-backfilled server-side if omitted. */
  presetComponentId?: string
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
    templateId: agreement?.templateId ?? '',
  })
  const templatesQ = useDocumentTemplates('AGREEMENT')
  const templates = templatesQ.data ?? []

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
      templateId: form.templateId || undefined,
    }

    const opts = {
      onSuccess: (a: Agreement) => { onSaved?.(a); onClose() },
      onError: (err: any) => setError(err?.response?.data?.message ?? 'Could not save the agreement.'),
    }
    if (isEdit) updateMut.mutate({ id: agreement!.id, ...payload }, opts)
    else createMut.mutate({ ...payload, customerId: form.customerId, projectId: presetProjectId, componentId: presetComponentId }, opts)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card anim-fade-up"
        role="dialog"
        aria-modal="true"
        style={{
          width: 900, maxWidth: '95vw', padding: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          // Grows to fit content; only scrolls internally once it would exceed 90% of the viewport
          maxHeight: '90vh',
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

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'var(--red-dim)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 13,
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* ── Basics ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={FileSignature}>Agreement</SectionLabel>

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

            <div style={fieldRowStyle}>
              <div className="form-group">
                <label className="form-label">Agreement name *</label>
                <input className="form-input" placeholder="e.g. Annual AC Care Plan" value={form.name} onChange={e => set({ name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Starts *</label>
                <input type="date" className="form-input" value={form.startDate} onChange={e => set({ startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ends</label>
                <input type="date" className="form-input" value={form.endDate} onChange={e => set({ endDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Terms & scope</label>
              <textarea
                className="form-input" rows={3} style={{ resize: 'vertical' }}
                placeholder="What's covered, response times, exclusions — the customer sees this in the confirmation email"
                value={form.description} onChange={e => set({ description: e.target.value })}
              />
            </div>
          </div>

          {/* ── Pricing ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={DollarSign}>Pricing</SectionLabel>
            <div style={fieldRowStyle}>
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
              {form.billingCycle && form.billingCycle !== 'UPFRONT' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Amount per period ($)</label>
                    <input type="number" min="0" step="0.01" className="form-input" placeholder="100.00" value={form.billingAmount} onChange={e => set({ billingAmount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next billing date</label>
                    <input type="date" className="form-input" value={form.nextBillingDate} onChange={e => set({ nextBillingDate: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Service schedule ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={CalendarClock}>Service schedule</SectionLabel>
            <div style={fieldRowStyle}>
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
          </div>

          {/* ── Automation ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={Settings2}>Automation</SectionLabel>
            <div style={fieldRowStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.autoCreateJobs} onChange={e => set({ autoCreateJobs: e.target.checked })} />
                  Create service jobs automatically when a visit comes due
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.autoRenew} onChange={e => set({ autoRenew: e.target.checked })} />
                  Auto-renew when the agreement ends
                </label>
              </div>
              {form.autoCreateJobs && (
                <div className="form-group">
                  <label className="form-label">Create job this many days ahead</label>
                  <input type="number" min="0" className="form-input" value={form.leadDays} onChange={e => set({ leadDays: e.target.value })} />
                </div>
              )}
            </div>
          </div>

          {templates.length > 1 && (
            <div style={sectionCardStyle}>
              <SectionLabel icon={FileSignature}>Document</SectionLabel>
              <div className="form-group">
                <label className="form-label">Template</label>
                <select className="form-input" value={form.templateId} onChange={e => set({ templateId: e.target.value })}>
                  <option value="">Use default</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
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
