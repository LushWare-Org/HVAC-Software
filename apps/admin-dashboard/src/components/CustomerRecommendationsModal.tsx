import { useState } from 'react'
import {
  X, Sparkles, CheckCircle2, AlertCircle, Zap, RefreshCw,
  Phone, TrendingUp, ShieldCheck, Loader2, DollarSign,
} from 'lucide-react'
import { useCustomerStatusSummary } from '../hooks/useCustomers'
import { useExecuteFollowup, useExecuteRetention, useExecuteUpsell, useExecuteRevenueAgent } from '../hooks/useCustomers'
import { customerName } from '../types/api'
import type { Customer, CustomerStatusSummary } from '../types/api'
import { formatMoney } from '../lib/format'

const INACTIVE_ACTIONS = new Set(['no_action', 'no_upsell', 'no_opportunity'])

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { color: 'var(--red)',   bg: 'rgba(239,68,68,0.10)',   border: '#ef4444', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.10)',  border: '#f59e0b', label: 'MEDIUM' },
  low:    { color: 'var(--green)', bg: 'rgba(16,185,129,0.10)',  border: '#10b981', label: 'LOW' },
} as const

type Priority = keyof typeof PRIORITY_CONFIG

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '2px 6px',
    }}>
      {cfg.label}
    </span>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, padding: '20px 0' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 150, background: 'var(--bg-hover)', borderRadius: 10, opacity: 0.6 + i * 0.05 }} />
      ))}
    </div>
  )
}

function ResultBanner({ success, message }: { success: boolean; message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      borderRadius: 8, marginTop: 10, fontSize: 13,
      background: success ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
      color: success ? 'var(--green)' : 'var(--red)',
      border: `1px solid ${success ? '#10b981' : '#ef4444'}`,
    }}>
      {success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      <span>{message}</span>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode
  title: string
  priority: Priority
  children: React.ReactNode
}

function Section({ icon, title, priority, children }: SectionProps) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid var(--border)`,
        overflow: 'hidden',
        borderTop: `3px solid ${cfg.border}`,
        background: 'var(--bg-card)',
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 16px 10px', background: 'var(--bg-card)',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
          <span style={{ color: cfg.color }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', lineHeight: 1.25 }}>{title}</span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <PriorityBadge priority={priority} />
        </div>
      </div>
      <div style={{ padding: '0 16px 16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--t3)' }}>{label}</span>
      <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function pct(n: number) { return `${Math.round(n * 100)}%` }

const ACTION_LABELS: Record<string, string> = {
  RETENTION:         'Retention outreach',
  REENGAGEMENT:      'Re-engagement message',
  UPSELL:            'Upsell follow-up',
  LEAD_FOLLOWUP:     'Lead follow-up',
  premium_contract_offer:    'Premium contract offer',
  discount_retention_offer:  'Discount retention offer',
  maintenance_plan_offer:    'Maintenance plan offer',
  no_action:                 'No action required',
  maintenance_plan:  'Maintenance plan',
  replacement:       'Equipment replacement',
  service:           'Service visit',
  payment_collection: 'Payment collection',
  quote_recovery:      'Quote recovery',
  agreement_renewal:   'Agreement renewal',
  re_engagement:        'Re-engagement',
  no_opportunity:       'No opportunity right now',
}

function label(key: string) { return ACTION_LABELS[key] ?? key }

const CHANNEL_LABELS: Record<string, string> = { whatsapp: 'WhatsApp', email: 'Email', call: 'Phone call' }

function riskColor(level: 'High' | 'Medium' | 'Low') {
  if (level === 'High') return 'var(--red)'
  if (level === 'Medium') return 'var(--amber)'
  return 'var(--green)'
}

// ─── Overview strip ───────────────────────────────────────────────────────────

function RiskPill({ label, level, probability }: { label: string; level: 'High' | 'Medium' | 'Low'; probability: number }) {
  const color = riskColor(level)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, color,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      borderRadius: 20, padding: '3px 10px',
    }}>
      {label}: {level} ({pct(probability)})
    </span>
  )
}

function OverviewStrip({ summary }: { summary: CustomerStatusSummary }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--t2)', flex: '1 1 auto' }}>{summary.currentStatus}</span>
      <RiskPill label="Failure" level={summary.failurePrediction.level} probability={summary.failurePrediction.probability} />
      <RiskPill label="Churn" level={summary.churnPrediction.level} probability={summary.churnPrediction.probability} />
    </div>
  )
}

// ─── Follow-up section ────────────────────────────────────────────────────────

function FollowupSection({ summary, customerId }: { summary: CustomerStatusSummary; customerId: string }) {
  const exec = useExecuteFollowup()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const churn = summary.churnPrediction
  const priority: Priority = churn.level === 'High' ? 'high' : churn.level === 'Medium' ? 'medium' : 'low'
  const channel = summary.retentionPrediction?.recommendedChannel ?? 'email'

  const handleExecute = async () => {
    setResult(null)
    try {
      const res = await exec.mutateAsync(customerId)
      if (res.queued) {
        setResult({ success: true, message: `Follow-up queued — ${label(res.action ?? 'action')} via ${CHANNEL_LABELS[channel] ?? channel}.` })
      } else {
        setResult({ success: false, message: res.reason ?? 'Follow-up could not be queued.' })
      }
    } catch {
      setResult({ success: false, message: 'Request failed. Try again.' })
    }
  }

  return (
    <Section icon={<Phone size={15} />} title="Follow-up Recommendation" priority={priority}>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.5 }}>
          {summary.proposedNextStep}
        </p>
        <Detail label="Recommended channel" value={CHANNEL_LABELS[channel] ?? channel} />
      </div>
      {result && <ResultBanner success={result.success} message={result.message} />}
      <button
        onClick={handleExecute}
        disabled={exec.isPending}
        className="btn btn-primary btn-sm"
        style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {exec.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
        {exec.isPending ? 'Queuing…' : 'Execute Follow-up'}
      </button>
    </Section>
  )
}

// ─── Retention section ────────────────────────────────────────────────────────

function RetentionSection({ summary, customerId }: { summary: CustomerStatusSummary; customerId: string }) {
  const exec = useExecuteRetention()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const ret = summary.retentionPrediction
  if (!ret) return null

  const priority: Priority = ret.priority as Priority

  const handleExecute = async () => {
    setResult(null)
    try {
      const res = await exec.mutateAsync(customerId)
      if (res.queued) {
        setResult({ success: true, message: `Retention action queued — ${label(ret.action)} via ${CHANNEL_LABELS[ret.recommendedChannel] ?? ret.recommendedChannel}.` })
      } else {
        setResult({ success: false, message: res.reason ?? 'Retention action could not be queued.' })
      }
    } catch {
      setResult({ success: false, message: 'Request failed. Try again.' })
    }
  }

  const isActionable = !INACTIVE_ACTIONS.has(ret.action)

  return (
    <Section icon={<ShieldCheck size={15} />} title="Retention Recommendation" priority={priority}>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: isActionable ? 10 : 0, lineHeight: 1.5 }}>
          {ret.reason}
        </p>
        {isActionable && (
          <>
            <Detail label="Action" value={label(ret.action)} />
            <Detail
              label="Offer"
              value={ret.offer.discount > 0 ? `${ret.offer.type} (${ret.offer.discount}% off)` : ret.offer.type}
            />
            <Detail label="Channel" value={CHANNEL_LABELS[ret.recommendedChannel] ?? ret.recommendedChannel} />
            {ret.triggerImmediately && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> Immediate trigger recommended
              </div>
            )}
          </>
        )}
      </div>
      {result && <ResultBanner success={result.success} message={result.message} />}
      {isActionable && (
        <button
          onClick={handleExecute}
          disabled={exec.isPending}
          className="btn btn-primary btn-sm"
          style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {exec.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          {exec.isPending ? 'Queuing…' : 'Execute Retention'}
        </button>
      )}
    </Section>
  )
}

// ─── Upsell section ───────────────────────────────────────────────────────────

function UpsellSection({ summary, customerId }: { summary: CustomerStatusSummary; customerId: string }) {
  const exec = useExecuteUpsell()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const up = summary.upsellRecommendation
  if (!up) return null

  const score = up.priorityScore ?? 0
  const priority: Priority = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low'

  const handleExecute = async () => {
    setResult(null)
    try {
      const res = await exec.mutateAsync(customerId)
      const success = res.status !== 'failures'
      setResult({
        success,
        message: success
          ? `Upsell recommendation refreshed — ${label(up.recommendedOffer)} offer prepared.`
          : 'Upsell generation failed. Try again.',
      })
    } catch {
      setResult({ success: false, message: 'Request failed. Try again.' })
    }
  }

  const isActionable = !INACTIVE_ACTIONS.has(up.recommendedOffer)

  return (
    <Section icon={<TrendingUp size={15} />} title="Upsell Recommendation" priority={priority}>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, flex: 1 }}>
        <Detail label="Recommended offer" value={label(up.recommendedOffer)} />
        {isActionable && <Detail label="Confidence" value={pct(up.confidence)} />}
      </div>
      {result && <ResultBanner success={result.success} message={result.message} />}
      <button
        onClick={handleExecute}
        disabled={exec.isPending}
        className="btn btn-secondary btn-sm"
        style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {exec.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        {exec.isPending ? 'Refreshing…' : 'Refresh Upsell'}
      </button>
    </Section>
  )
}

// ─── Revenue section ──────────────────────────────────────────────────────────

function RevenueSection({ summary, customerId }: { summary: CustomerStatusSummary; customerId: string }) {
  const exec = useExecuteRevenueAgent()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const rev = summary.revenueRecommendation
  if (!rev) return null

  const priority: Priority = rev.priority as Priority

  const handleExecute = async () => {
    setResult(null)
    try {
      await exec.mutateAsync(customerId)
      setResult({ success: true, message: `Revenue recommendation refreshed — ${label(rev.category)}.` })
    } catch {
      setResult({ success: false, message: 'Request failed. Try again.' })
    }
  }

  const isActionable = !INACTIVE_ACTIONS.has(rev.category)

  return (
    <Section icon={<DollarSign size={15} />} title="Revenue Recommendation" priority={priority}>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: isActionable ? 10 : 0, lineHeight: 1.5 }}>
          {rev.reason}
        </p>
        {isActionable && rev.expectedRevenueImpact != null && (
          <Detail label="Expected impact" value={formatMoney(rev.expectedRevenueImpact, { decimals: 0 })} />
        )}
      </div>
      {result && <ResultBanner success={result.success} message={result.message} />}
      {isActionable && (
        <button
          onClick={handleExecute}
          disabled={exec.isPending}
          className="btn btn-primary btn-sm"
          style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {exec.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
          {exec.isPending ? 'Refreshing…' : 'Refresh Revenue Recommendation'}
        </button>
      )}
    </Section>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  customer: Customer
  onClose: () => void
}

export default function CustomerRecommendationsModal({ customer, onClose }: Props) {
  const statusQuery = useCustomerStatusSummary(customer.id)
  const summary = statusQuery.data

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 980,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} style={{ color: '#fff' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>AI Recommendations</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 }}>{customerName(customer)}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', color: '#fff' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px' }}>
          {statusQuery.isLoading && <Skeleton />}

          {statusQuery.isError && !summary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, color: 'var(--red)', fontSize: 13 }}>
              <AlertCircle size={15} />
              Failed to load recommendations. Please try again.
            </div>
          )}

          {summary && (
            <>
              <OverviewStrip summary={summary} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 12,
                alignItems: 'stretch',
              }}>
                <FollowupSection   summary={summary} customerId={customer.id} />
                <RetentionSection  summary={summary} customerId={customer.id} />
                <UpsellSection     summary={summary} customerId={customer.id} />
                <RevenueSection    summary={summary} customerId={customer.id} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
