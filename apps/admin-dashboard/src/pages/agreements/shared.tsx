/**
 * Shared building blocks for service-agreement UI (page + customer sidebar tab).
 */
import { Infinity as InfinityIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Agreement, AgreementStatus } from '../../hooks/useAgreements'
import { formatMoney } from '../../lib/format'

export const STATUS_STYLES: Record<AgreementStatus, { bg: string; color: string; label: string }> = {
  DRAFT:           { bg: 'var(--bg-card-2)', color: 'var(--t3)',    label: 'Draft' },
  SENT:            { bg: 'var(--blue-glow)', color: 'var(--blue)',  label: 'Awaiting confirmation' },
  ACTIVE:          { bg: 'var(--green-dim)', color: 'var(--green)', label: 'Active' },
  PENDING_RENEWAL: { bg: 'var(--amber-dim)', color: 'var(--amber)', label: 'Pending renewal' },
  RENEWED:         { bg: 'var(--bg-card-2)', color: 'var(--t3)',    label: 'Renewed' },
  EXPIRED:         { bg: 'var(--red-dim)',   color: 'var(--red)',   label: 'Expired' },
  CANCELLED:       { bg: 'var(--red-dim)',   color: 'var(--red)',   label: 'Cancelled' },
}

export function AgreementStatusBadge({ status }: { status: AgreementStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

/**
 * Visit meter — one pip per included visit. Filled = used, ringed = next due.
 * Unlimited plans show a compact infinity chip instead.
 */
export function VisitMeter({ agreement, size = 10 }: { agreement: Agreement; size?: number }) {
  const { visitsIncluded, visitsUsed, status } = agreement
  if (visitsIncluded == null) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
        color: 'var(--t3)', background: 'var(--bg-card-2)', padding: '2px 8px', borderRadius: 'var(--r-full)',
      }}>
        <InfinityIcon size={11} /> unlimited visits
      </span>
    )
  }
  const pips = Array.from({ length: Math.min(visitsIncluded, 12) }, (_, i) => {
    const used = i < visitsUsed
    const isNext = i === visitsUsed && status === 'ACTIVE'
    return (
      <span
        key={i}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: used ? 'var(--green)' : 'var(--bg-card-2)',
          border: isNext ? '2px solid var(--amber)' : '1px solid var(--bd)',
          boxSizing: 'border-box', flexShrink: 0,
        }}
      />
    )
  })
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title={`${visitsUsed} of ${visitsIncluded} visits used`}>
      {pips}
      {visitsIncluded > 12 && <span style={{ fontSize: 10, color: 'var(--t3)' }}>+{visitsIncluded - 12}</span>}
      <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{visitsUsed}/{visitsIncluded}</span>
    </span>
  )
}

export const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly', BI_MONTHLY: 'Every 2 months', QUARTERLY: 'Quarterly',
  BI_ANNUAL: 'Twice a year', ANNUAL: 'Yearly', CUSTOM: 'Custom',
}

export function intervalLabel(a: Pick<Agreement, 'serviceInterval' | 'serviceIntervalDays'>): string {
  if (!a.serviceInterval) return '—'
  if (a.serviceInterval === 'CUSTOM') return a.serviceIntervalDays ? `Every ${a.serviceIntervalDays} days` : 'Custom'
  return INTERVAL_LABELS[a.serviceInterval] ?? a.serviceInterval
}

export function SectionLabel({ icon: Icon, children }: { icon?: ComponentType<{ size?: number }>; children: React.ReactNode }) {
  return (
    <p style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', margin: '4px 0 0',
    }}>
      {Icon && <Icon size={12} />}
      {children}
    </p>
  )
}

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const fmtMoney = (v?: string | number | null) =>
  v != null && v !== '' ? formatMoney(v) : '—'

export function daysUntil(d?: string | null): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}
