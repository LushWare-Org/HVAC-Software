/**
 * AgreementConfirm — public landing page for the email confirm link.
 * No login required: access is gated by the one-time token in the URL.
 */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useAgreementByToken, useConfirmAgreement } from '../hooks/useMyAgreements'
import { formatMoney } from '../lib/format'

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const INTERVALS: Record<string, string> = {
  MONTHLY: 'Every month', BI_MONTHLY: 'Every 2 months', QUARTERLY: 'Every 3 months',
  BI_ANNUAL: 'Twice a year', ANNUAL: 'Once a year',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', fontSize: 14, borderBottom: '1px solid var(--bd)' }}>
      <span style={{ color: 'var(--t3)' }}>{label}</span>
      <span style={{ color: 'var(--t1)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function AgreementConfirm() {
  const { token } = useParams<{ token: string }>()
  const { data: agreement, isLoading, isError } = useAgreementByToken(token)
  const confirmMut = useConfirmAgreement()
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)

  const shell = (children: React.ReactNode) => (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg, #0f1117)', padding: 16,
    }}>
      <div className="card" style={{ width: 520, maxWidth: '100%', padding: 28 }}>{children}</div>
    </div>
  )

  if (isLoading) {
    return shell(<div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={26} className="spin" style={{ color: 'var(--t3)' }} /></div>)
  }

  if (isError || !agreement) {
    return shell(
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <AlertCircle size={36} style={{ color: 'var(--red)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>This link is no longer valid</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>
          It may have already been used, or the agreement was updated since it was sent.
          Sign in to your portal to see your current plans, or call our office.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Go to portal</Link>
      </div>,
    )
  }

  if (done || agreement.customerConfirmedAt) {
    return shell(
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <CheckCircle2 size={40} style={{ color: 'var(--green)', marginBottom: 12 }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>You're all set</h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--t2)' }}>{agreement.name}</strong> is confirmed.
          We'll schedule your visits and email you before each one.
        </p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>View my plans in the portal</Link>
      </div>,
    )
  }

  const freq = agreement.serviceInterval === 'CUSTOM'
    ? (agreement.serviceIntervalDays ? `Every ${agreement.serviceIntervalDays} days` : null)
    : INTERVALS[agreement.serviceInterval ?? ''] ?? null

  return shell(
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <ShieldCheck size={20} style={{ color: 'var(--blue)' }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          {agreement.company?.name ?? 'Your service provider'}
        </p>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: '0 0 4px' }}>{agreement.name}</h1>
      <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 18px' }}>
        Hi {agreement.customer?.firstName ?? 'there'} — review your service plan below and confirm to activate it.
      </p>

      <div style={{ marginBottom: 18 }}>
        {agreement.serviceType && <Row label="Service" value={agreement.serviceType} />}
        {freq && <Row label="Frequency" value={freq} />}
        {agreement.visitsIncluded != null && <Row label="Visits included" value={agreement.visitsIncluded} />}
        <Row label="Starts" value={fmtDate(agreement.startDate)} />
        {agreement.endDate && <Row label="Ends" value={fmtDate(agreement.endDate)} />}
        {agreement.value != null && <Row label="Total price" value={formatMoney(agreement.value)} />}
        {agreement.billingCycle && (
          <Row label="Billing" value={
            `${agreement.billingCycle.charAt(0) + agreement.billingCycle.slice(1).toLowerCase()}${agreement.billingAmount != null ? ` — ${formatMoney(agreement.billingAmount)} per period` : ''}`
          } />
        )}
      </div>

      {agreement.description && (
        <p style={{
          fontSize: 13, color: 'var(--t2)', whiteSpace: 'pre-wrap', lineHeight: 1.6,
          background: 'var(--bg-card-2)', borderRadius: 8, padding: '12px 14px', margin: '0 0 18px',
        }}>
          {agreement.description}
        </p>
      )}

      <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6 }}>
        Your name (signs the agreement)
      </label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Full name"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 14,
          borderRadius: 8, border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
          color: 'var(--t1)', marginBottom: 14,
        }}
      />

      {confirmMut.isError && (
        <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
          Couldn't confirm — the link may have expired. Call our office and we'll sort it out.
        </p>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 14 }}
        disabled={confirmMut.isPending}
        onClick={() =>
          confirmMut.mutate(
            { token: token!, confirmedByName: name.trim() || undefined },
            { onSuccess: () => setDone(true) },
          )
        }
      >
        {confirmMut.isPending ? <><Loader2 size={14} className="spin" /> Confirming…</> : 'Confirm agreement'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', marginTop: 12 }}>
        By confirming you accept the plan terms above. You'll get an email copy for your records.
      </p>
    </>,
  )
}
