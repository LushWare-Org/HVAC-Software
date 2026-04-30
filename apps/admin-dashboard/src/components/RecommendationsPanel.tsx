import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Lightbulb, DollarSign, TrendingUp, TrendingDown, Minus,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Zap,
  Settings2, ChevronDown, ChevronUp, Users, Clock,
} from 'lucide-react'
import { useRecommendations } from '../hooks/useAnalytics'
import api from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import type { Recommendation, ExecuteActionResponse } from '../types/api'

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

// ─── Default params per action ────────────────────────────────────────────────

type ParamDef = { label: string; key: string; type: 'number' | 'select'; min?: number; max?: number; options?: { value: string; label: string }[] }

const ACTION_PARAMS: Record<string, { params: ParamDef[]; defaults: Record<string, unknown> }> = {
  discount_20: {
    defaults: { discount: 20, segment: 'inactive_30_days' },
    params: [
      { key: 'discount', label: 'Discount %', type: 'number', min: 5, max: 20 },
      {
        key: 'segment', label: 'Target segment', type: 'select',
        options: [
          { value: 'inactive_30_days', label: 'Inactive 30 days' },
          { value: 'new_leads',        label: 'New leads' },
          { value: 'high_value',       label: 'High-value customers' },
        ],
      },
    ],
  },
  call: {
    defaults: { priority: 'high' },
    params: [
      {
        key: 'priority', label: 'Task priority', type: 'select',
        options: [
          { value: 'high',   label: 'High — same day' },
          { value: 'medium', label: 'Medium — within 48 h' },
          { value: 'low',    label: 'Low — this week' },
        ],
      },
    ],
  },
  increase_price: {
    defaults: { increasePercent: 12, serviceCategory: 'all' },
    params: [
      { key: 'increasePercent', label: 'Increase %', type: 'number', min: 1, max: 25 },
      {
        key: 'serviceCategory', label: 'Service category', type: 'select',
        options: [
          { value: 'all',         label: 'All services' },
          { value: 'hvac',        label: 'HVAC installs' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'repair',      label: 'Repairs' },
        ],
      },
    ],
  },
  geo_target_discount: {
    defaults: { discount: 10, radiusKm: 15 },
    params: [
      { key: 'discount',  label: 'Discount %',   type: 'number', min: 5,  max: 15 },
      { key: 'radiusKm',  label: 'Radius (km)',   type: 'number', min: 5,  max: 50 },
    ],
  },
  same_day_offer: {
    defaults: { discount: 10 },
    params: [
      { key: 'discount', label: 'Discount %', type: 'number', min: 5, max: 10 },
    ],
  },
}

function getDefaults(action: string): Record<string, unknown> {
  return ACTION_PARAMS[action]?.defaults ?? {}
}

// ─── Modify params panel ──────────────────────────────────────────────────────

function ModifyPanel({
  action,
  params,
  onChange,
}: {
  action: string
  params: Record<string, unknown>
  onChange: (updated: Record<string, unknown>) => void
}) {
  const defs = ACTION_PARAMS[action]?.params ?? []
  if (defs.length === 0) return null

  function set(key: string, value: unknown) {
    onChange({ ...params, [key]: value })
  }

  return (
    <div style={{
      background: 'var(--bg-card-2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Modify Parameters
      </div>
      {defs.map((def) =>
        def.type === 'select' ? (
          <label key={def.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, color: 'var(--t3)', fontWeight: 500 }}>{def.label}</span>
            <select
              value={String(params[def.key] ?? '')}
              onChange={(e) => set(def.key, e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--t1)',
                fontSize: 12.5,
                padding: '5px 8px',
                cursor: 'pointer',
              }}
            >
              {def.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <label key={def.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--t3)', fontWeight: 500 }}>{def.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
                {params[def.key] as number}
                {def.key.toLowerCase().includes('percent') || def.key === 'discount' ? '%' : ''}
              </span>
            </div>
            <input
              type="range"
              min={def.min}
              max={def.max}
              value={Number(params[def.key] ?? def.min)}
              onChange={(e) => set(def.key, Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--blue)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t4)' }}>
              <span>{def.min}{def.key.toLowerCase().includes('percent') || def.key === 'discount' ? '%' : ''}</span>
              <span>{def.max}{def.key.toLowerCase().includes('percent') || def.key === 'discount' ? '%' : ''}</span>
            </div>
          </label>
        )
      )}
    </div>
  )
}

// ─── Execution result summary ─────────────────────────────────────────────────

function ExecutionResult({ result }: { result: ExecuteActionResponse['result'] }) {
  if (!result) return null

  return (
    <div style={{
      background: 'rgba(16,185,129,0.08)',
      border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: 'var(--r-sm)',
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
        {result.summary}
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {result.affectedCount !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={11} style={{ color: 'var(--t4)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
              {result.affectedCount} affected
            </span>
          </div>
        )}
        {result.estimatedRevenue !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={11} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--green)', fontWeight: 600 }}>
              +${result.estimatedRevenue.toLocaleString()} est.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onIgnore,
}: {
  rec: Recommendation
  onIgnore: (id: string) => void
}) {
  const { showSuccess, showError } = useToast()
  const queryClient = useQueryClient()

  const [executed, setExecuted]             = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecuteActionResponse | null>(null)
  const [showModify, setShowModify]         = useState(false)
  const [modifyParams, setModifyParams]     = useState<Record<string, unknown>>(getDefaults(rec.action))

  const hasParamDefs = (ACTION_PARAMS[rec.action]?.params.length ?? 0) > 0

  const p = PRIORITY_CONFIG[rec.priority]

  const mutation = useMutation<ExecuteActionResponse, Error, Record<string, unknown>>({
    mutationFn: (params) =>
      api
        .post<ExecuteActionResponse>('/analytics/recommendations/execute', {
          action: rec.action,
          params,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setExecuted(true)
      setExecutionResult(data)
      showSuccess(`"${rec.actionLabel}" is now in progress.`, 'Action Executed')
      queryClient.invalidateQueries({ queryKey: ['analytics', 'recommendations'] })
    },
    onError: () => {
      showError('Could not execute the action. Please try again.', 'Execute Failed')
    },
  })

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

      {/* ── Modify params panel (expandable) ── */}
      {!executed && hasParamDefs && (
        <>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: showModify ? 'var(--blue)' : 'var(--t4)',
              fontSize: 11.5, fontWeight: 600, padding: 0,
              transition: 'color 0.15s',
            }}
            onClick={() => setShowModify((v) => !v)}
          >
            <Settings2 size={12} />
            {showModify ? 'Hide parameters' : 'Modify parameters'}
            {showModify ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showModify && (
            <ModifyPanel
              action={rec.action}
              params={modifyParams}
              onChange={setModifyParams}
            />
          )}
        </>
      )}

      {/* ── Execution result / Actions ── */}
      {executed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--green)', fontWeight: 600,
          }}>
            <CheckCircle2 size={14} />
            Executed
            {executionResult?.executedAt && (
              <span style={{ fontSize: 11, color: 'var(--t4)', fontWeight: 400, marginLeft: 4 }}>
                <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                {new Date(executionResult.executedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <ExecutionResult result={executionResult?.result} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            onClick={() => mutation.mutate(modifyParams)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Zap size={12} style={{ opacity: 0.7 }} />
                Running...
              </>
            ) : (
              <>
                <Zap size={12} />
                Execute
              </>
            )}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onIgnore(rec.id)}
            disabled={mutation.isPending}
          >
            Ignore
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function RecommendationsPanel({
  filterActions,
  limit,
}: {
  filterActions?: string[]
  limit?: number
} = {}) {
  const { data, isLoading, isError, refetch, isFetching } = useRecommendations()
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
              All recommendations have been actioned or ignored. Click Refresh to check for new insights.
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
              <RecommendationCard key={rec.id} rec={rec} onIgnore={handleIgnore} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
