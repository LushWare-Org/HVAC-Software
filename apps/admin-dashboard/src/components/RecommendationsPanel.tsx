import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  Lightbulb, DollarSign, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle, Sparkles, Filter, HelpCircle, X,
  Database, MessageSquare, Flag, Percent,
} from 'lucide-react'
import { useRecommendations } from '../hooks/useAnalytics'
import type { Recommendation } from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recommendations that quantify a specific set of real entities ("9 quote(s)…",
 * "3 high-value customer(s)…") get a Filter button that jumps straight to that
 * tab's list, pre-filtered with the exact same predicate the recommendation's
 * count was computed from (see crm-service CustomersService.findRetentionRiskCustomerIds
 * and finance-service QuotesService.findAll's `pendingAging` branch — both
 * mirror apps/analytics-service's InsightDataService formulas exactly).
 * `low_demand`/`discount_20` and the never-generated `same_day_offer` describe
 * idle capacity, not a listed entity set, so they intentionally have no entry
 * here and fall back to Dismiss-only.
 */
function filterDestination(action: string, forecastDays?: number): string | undefined {
  switch (action) {
    case 'call':
      return '/customers?filter=retention_risk'
    case 'geo_target_discount':
      return '/finance?tab=quotes&filter=pending_quotes'
    case 'increase_price':
      return `/jobs?filter=high_utilization${forecastDays ? `&forecastDays=${forecastDays}` : ''}`
    default:
      return undefined
  }
}

function Skeleton({ h = 14 }: { h?: number }) {
  return (
    <div style={{ width: '100%', height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
  )
}

const PRIORITY_CONFIG = {
  high:   { color: 'var(--red)',   bg: 'var(--red-dim)',            label: 'HIGH',   borderColor: '#ef4444' },
  medium: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.12)',     label: 'MEDIUM', borderColor: '#f59e0b' },
  low:    { color: 'var(--green)', bg: 'rgba(16,185,129,0.12)',     label: 'LOW',    borderColor: '#10b981' },
} as const

// Compact-strip tag per action type — mirrors the color language of ACTION_PARAMS.
const ACTION_TAG: Record<string, { label: string; color: string; bg: string }> = {
  discount_20:         { label: 'DISCOUNT',      color: '#D97706', bg: 'rgba(217,158,6,0.12)' },
  same_day_offer:      { label: 'SAME-DAY',      color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  increase_price:      { label: 'PRICE UP',      color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  geo_target_discount: { label: 'GEO OFFER',     color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  call:                { label: 'OUTREACH',      color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  upsell:              { label: 'UPSELL',        color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  review_request:      { label: 'REVIEW',        color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
}
function tagFor(rec: Recommendation) {
  return ACTION_TAG[rec.action] ?? { label: rec.priority.toUpperCase(), color: PRIORITY_CONFIG[rec.priority].color, bg: PRIORITY_CONFIG[rec.priority].bg }
}

function TrendIcon({ trend }: { trend: Recommendation['trend'] }) {
  if (trend === 'up')   return <TrendingUp  size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
  if (trend === 'down') return <TrendingDown size={13} style={{ color: 'var(--red)',   flexShrink: 0 }} />
  return <Minus size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
}

// ─── Expected outcome copy per action type ────────────────────────────────────

function getExpectedOutcome(rec: Recommendation): string {
  const impact = `$${rec.impact.toLocaleString()}`
  const conf = Math.round(rec.confidence * 100)
  switch (rec.action) {
    case 'discount_20':
      return `Reactivating inactive customers with a targeted offer is projected to recover ${impact} in revenue this period (${conf}% confidence based on your past campaign data).`
    case 'call':
      return `Direct outreach to at-risk accounts can prevent an estimated ${impact} in churn. Past calls in this segment converted at ${conf}%.`
    case 'increase_price':
      return `Based on your current job volume and market rates, a price adjustment could add ${impact} to annual revenue without a meaningful drop in bookings.`
    case 'geo_target_discount':
      return `A targeted follow-up to prospects with pending quotes converts at ~${conf}% based on your history. Closing the open pipeline could bring in approximately ${impact} without acquiring new leads.`
    case 'same_day_offer':
      return `Prospects near tomorrow's job routes are primed for a same-day offer. Filling 2–3 idle slots this way is projected to generate ${impact} in revenue at minimal marginal cost.`
    case 'upsell':
      return `Customers with this service history convert to upsells at ${conf}%. Reaching out now is projected to add ${impact} in average order value.`
    case 'review_request':
      return `A well-timed review request to recently satisfied customers lifts your average rating within 30 days and is projected to drive ${impact} in new leads via improved local search ranking.`
    default:
      return `This action has a ${conf}% confidence rating and is projected to generate up to ${impact} in additional revenue based on your current customer data.`
  }
}

// ─── Reason popup ─────────────────────────────────────────────────────────────

function ReasonModal({ rec, onClose }: { rec: Recommendation; onClose: () => void }) {
  const explanation = rec.explanation
  const p = PRIORITY_CONFIG[rec.priority]

  const rows = explanation
    ? [
        { icon: <Database size={14} />, label: 'Ground truth', text: explanation.groundTruth },
        { icon: <MessageSquare size={14} />, label: 'Message', text: explanation.message },
        { icon: <Flag size={14} />, label: 'Priority', text: explanation.priority },
        { icon: <TrendingUp size={14} />, label: 'Expected outcome', text: explanation.expectedOutcome },
        { icon: <Lightbulb size={14} />, label: 'Action', text: explanation.action },
        { icon: <DollarSign size={14} />, label: 'Impact', text: explanation.impact },
        { icon: <Percent size={14} />, label: 'Confidence', text: explanation.confidence },
      ]
    : []

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <HelpCircle size={18} style={{ color: '#fff', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Why this recommendation?</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rec.title}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              color: '#fff', background: 'rgba(255,255,255,0.2)',
              borderRadius: 4, padding: '2px 7px',
            }}>
              {p.label}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', color: '#fff' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!explanation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, color: 'var(--t3)', fontSize: 13 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              This recommendation was served from cache before the Reason breakdown existed — click Refresh above to regenerate it with a full explanation.
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 'var(--r-sm)', padding: '9px 12px',
              }}>
                <Sparkles size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                {explanation.usedLlm
                  ? 'Copy was LLM-written; every number was computed by the rule engine, not the LLM.'
                  : 'No live LLM response was available — copy and numbers both come straight from the rule engine.'}
              </div>

              {rows.map((row) => (
                <div key={row.label} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                  borderRadius: 'var(--r-sm)', padding: '10px 12px',
                }}>
                  <span style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                      {row.label}
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--t1)', margin: 0, lineHeight: 1.6 }}>{row.text}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onIgnore,
  onFilter,
}: {
  rec: Recommendation
  onIgnore: (id: string) => void
  onFilter?: () => void
}) {
  const p = PRIORITY_CONFIG[rec.priority]
  const [showReason, setShowReason] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--bd)',
      borderLeft: `3px solid ${p.borderColor}`,
      borderRadius: 'var(--r-md)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <TrendIcon trend={rec.trend} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3 }}>
            {rec.title}
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
          color: p.color, background: p.bg,
          padding: '2px 8px', borderRadius: 999, flexShrink: 0, marginTop: 1,
        }}>
          {p.label}
        </span>
      </div>

      {/* ── Description ── */}
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, lineHeight: 1.65 }}>
        {rec.description}
      </p>

      {/* ── Expected outcome ── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-start',
        background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)',
        borderRadius: 'var(--r-sm)', padding: '9px 12px',
      }}>
        <TrendingUp size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
            Expected outcome
          </div>
          <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
            {getExpectedOutcome(rec)}
          </p>
        </div>
      </div>

      {/* ── Recommended action ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card-2)', borderRadius: 'var(--r-sm)', padding: '9px 12px',
      }}>
        <Lightbulb size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Action:</span>
        <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600 }}>{rec.actionLabel}</span>
      </div>

      {/* ── Metrics row ── */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <DollarSign size={13} style={{ color: 'var(--green)' }} />
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Impact:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
            +${rec.impact.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp size={13} style={{ color: 'var(--blue)' }} />
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Confidence:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
            {Math.round(rec.confidence * 100)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onFilter && (
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: 'fit-content', justifyContent: 'center' }}
            onClick={onFilter}
            title="Filter the matching entities below"
          >
            <Filter size={12} />
            Filter
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: 'fit-content', justifyContent: 'center' }}
          onClick={() => setShowReason(true)}
          title="Show the reason and calculation behind this recommendation"
        >
          <HelpCircle size={12} />
          Reason
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: 'fit-content', justifyContent: 'center' }}
          onClick={() => onIgnore(rec.id)}
        >
          Dismiss
        </button>
      </div>

      {showReason && <ReasonModal rec={rec} onClose={() => setShowReason(false)} />}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

// ─── Professional AI badge ─────────────────────────────────────────────────────

function AiBadge() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 4px rgba(37,99,235,0.35)',
    }}>
      <Sparkles size={14} color="#fff" strokeWidth={2.2} />
    </div>
  )
}

// ─── Compact strip (default, collapsed view) ───────────────────────────────────

function CompactStrip({ visible }: { visible: Recommendation[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
      {visible.map((rec) => {
        const tag = tagFor(rec)
        return (
          <div key={rec.id} style={{
            display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px', minWidth: 200,
            background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-sm)', padding: '9px 12px',
          }}>
            <span style={{
              alignSelf: 'flex-start', fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
              color: tag.color, background: tag.bg, padding: '2px 7px', borderRadius: 4,
            }}>
              {tag.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.35 }}>
              {rec.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function RecommendationsPanel({
  filterActions,
  limit,
  forecastDays,
  headerExtra,
  defaultExpanded = false,
}: {
  filterActions?: string[]
  limit?: number
  forecastDays?: number
  headerExtra?: ReactNode
  defaultExpanded?: boolean
} = {}) {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch, isFetching } = useRecommendations(forecastDays)
  const [ignored, setIgnored] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(defaultExpanded)

  const visible = (data ?? [])
    .filter((r) => !ignored.has(r.id))
    .filter((r) => !filterActions || filterActions.includes(r.action))
    .slice(0, limit)

  function handleIgnore(id: string) {
    setIgnored((prev) => new Set([...prev, id]))
  }

  return (
    <div className="card card-hover anim-fade-up mb-5" style={{
      background: 'linear-gradient(160deg,var(--bg-active),var(--bg-card))',
    }}>
      {/* ── Header (always visible, doubles as the expand/collapse trigger) ── */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-wrap gap-3 justify-between items-center"
        style={{ padding: '14px 18px', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2.5">
          <AiBadge />
          <div className="card-title text-[14px]" style={{ margin: 0 }}>AI recommendations</div>
          {!isLoading && visible.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--blue)', background: 'var(--blue-dim)',
              padding: '2px 8px', borderRadius: 999,
            }}>
              {visible.length} insight{visible.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {headerExtra}
          <button
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              size={13}
              style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
            />
            Refresh
          </button>
          <button
            className="btn btn-secondary btn-sm flex items-center justify-center"
            style={{ width: 30, padding: 0 }}
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse' : 'Expand full view'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ paddingTop: 0 }}>
        {/* ── API error banner ── */}
        {isError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', background: 'var(--red-dim)',
            borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16,
          }}>
            <AlertCircle size={14} />
            Recommendations API unavailable. Start the analytics service to see live insights.
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton h={16} />
                <Skeleton h={16} />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          /* ── Empty state ── */
          <div className="empty-state">
            <div className="empty-icon"><Sparkles size={22} /></div>
            <div className="empty-title">No active recommendations</div>
            <div className="empty-desc">
              All recommendations have been dismissed. Click Refresh to check for new insights.
            </div>
          </div>
        ) : !expanded ? (
          /* ── Compact one-line-per-insight strip ── */
          <CompactStrip visible={visible} />
        ) : (
          /* ── Full recommendation cards grid ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {visible.map((rec) => {
              const dest = filterDestination(rec.action, forecastDays)
              return (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onIgnore={handleIgnore}
                  onFilter={dest ? () => navigate(dest) : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
