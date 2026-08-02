import { useState } from 'react'
import {
  Lightbulb, DollarSign, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle, Sparkles, Filter,
} from 'lucide-react'
import { useRecommendations } from '../hooks/useAnalytics'
import type { Recommendation } from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

      <div style={{ display: 'flex', gap: 8 }}>
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
          onClick={() => onIgnore(rec.id)}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function RecommendationsPanel({
  filterActions,
  limit,
  forecastDays,
  filterHandlers,
}: {
  filterActions?: string[]
  limit?: number
  forecastDays?: number
  /** Maps a recommendation's `action` to a handler that filters this tab's own entity list down to the set the recommendation refers to. Actions without a handler here only get a Dismiss button — this tab doesn't list that entity type. */
  filterHandlers?: Partial<Record<string, () => void>>
} = {}) {
  const { data, isLoading, isError, refetch, isFetching } = useRecommendations(forecastDays)
  const [ignored, setIgnored] = useState<Set<string>>(new Set())

  const visible = (data ?? [])
    .filter((r) => !ignored.has(r.id))
    .filter((r) => !filterActions || filterActions.includes(r.action))
    .slice(0, limit)

  function handleIgnore(id: string) {
    setIgnored((prev) => new Set([...prev, id]))
  }

  return (
    <div className="card card-hover anim-fade-up mb-5">
      {/* ── Card header ── */}
      <div className="card-header pb-2 border-b-0 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles size={17} color="var(--amber)" />
          <div className="card-title text-[15px]">AI Revenue Recommendations</div>
          {!isLoading && visible.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--amber)', background: 'rgba(245,158,11,0.12)',
              padding: '2px 8px', borderRadius: 999,
            }}>
              {visible.length} insight{visible.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
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
      </div>

      <div className="card-body">
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                padding: 18, background: 'var(--bg-card)',
                border: '1px solid var(--bd)', borderLeft: '3px solid var(--bd)',
                borderRadius: 'var(--r-md)',
              }}>
                <Skeleton h={18} />
                <Skeleton h={44} />
                <Skeleton h={34} />
                <Skeleton h={20} />
                <Skeleton h={34} />
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
        ) : (
          /* ── Recommendation cards grid ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {visible.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onIgnore={handleIgnore}
                onFilter={filterHandlers?.[rec.action]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
