/**
 * ReschedulesInbox — the staff workspace for rescheduling.
 *
 * Four views, because "needs you" alone was hiding most of the picture: a
 * request staff opened and were waiting on a customer for appeared nowhere at
 * all, so there was no way to see what had been asked, chase it, or confirm it
 * landed. The tabs partition every request — nothing is unreachable now.
 *
 * "Needs you" stays the default and keeps its oldest-first ordering, so the
 * requests at risk of becoming no-shows still float to the top.
 */
import { useState } from 'react'
import { Loader2, Check, CalendarClock, AlertTriangle, Inbox, ArrowUpRight, User } from 'lucide-react'
import { RESCHEDULE_REASON_LABELS, formatSlot } from '../../lib/reschedule'
import { useToast } from '../../contexts/ToastContext'
import {
  useRescheduleInbox, useApplyReschedule, useRespondReschedule, useRescheduleStats,
  useRescheduleInboxCounts, type RescheduleScope,
} from '../../hooks/useReschedule'
import type { RescheduleInboxRow } from '../../types/api'
import { TechChip } from '../../components/TechAvatar'

function daysOld(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

const SCOPES: { key: RescheduleScope; label: string; empty: string }[] = [
  { key: 'action', label: 'Needs you', empty: 'Nothing waiting on you right now.' },
  { key: 'waiting', label: 'Waiting on customer', empty: "You haven't asked any customers to reschedule." },
  { key: 'closed', label: 'Resolved', empty: 'No reschedules have been resolved yet.' },
  { key: 'all', label: 'All', empty: 'No reschedule requests yet.' },
]

/** Human label + colour for a request's status, from either side. */
const STATUS_META: Record<string, { label: string; color: string }> = {
  AWAITING_RESPONSE: { label: 'Awaiting reply', color: 'var(--amber)' },
  SLOT_PICKED: { label: 'Time chosen', color: 'var(--green)' },
  APPLIED: { label: 'Applied', color: 'var(--green)' },
  DECLINED: { label: 'Declined', color: 'var(--red)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--t4)' },
  SUPERSEDED: { label: 'Superseded', color: 'var(--t4)' },
}

export default function ReschedulesInbox({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const [scope, setScope] = useState<RescheduleScope>('action')
  const inboxQ = useRescheduleInbox(1, 20, scope)
  const countsQ = useRescheduleInboxCounts()
  const statsQ = useRescheduleStats()
  const applyMut = useApplyReschedule()
  const respondMut = useRespondReschedule()
  const { showSuccess, showError } = useToast()

  const rows = inboxQ.data?.data ?? []
  const stats = statsQ.data
  const busy = applyMut.isPending || respondMut.isPending

  const apply = (row: RescheduleInboxRow) => {
    const enRoute = row.job.status === 'EN_ROUTE'
    if (enRoute && !window.confirm(
      `${row.job.assignedToName ?? 'A technician'} is already on the way to this job.\n\n` +
      'Applying this reschedule will cancel that visit. Continue?',
    )) return
    applyMut.mutate({ requestId: row.request.id, confirmEnRoute: enRoute }, {
      onSuccess: () => showSuccess(`${row.job.jobNumber} moved — back in the dispatch queue.`),
      onError: (e: any) =>
        showError(e?.response?.data?.message ?? 'Could not apply the new time.', 'Failed'),
    })
  }

  const decline = (row: RescheduleInboxRow) =>
    respondMut.mutate({ requestId: row.request.id, action: 'DECLINE' }, {
      onSuccess: () => showSuccess('Declined — the existing appointment stands.'),
      onError: (e: any) =>
        showError(e?.response?.data?.message ?? 'Could not decline.', 'Failed'),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stats && stats.total > 0 && (
        <div className="card" style={{
          padding: '12px 16px', display: 'flex', gap: 20,
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--t1)' }}>{stats.total}</b> reschedules
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--green)' }}>{stats.applied}</b> applied
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>
            <b style={{ color: 'var(--red)' }}>{stats.declined}</b> declined
          </span>
          <span style={{ width: 1, height: 18, background: 'var(--bd)' }} />
          {Object.entries(stats.byReason)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([code, count]) => (
              <span key={code} style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                <b style={{ color: 'var(--t2)' }}>{count}</b>{' '}
                {RESCHEDULE_REASON_LABELS[code] ?? code}
              </span>
            ))}
        </div>
      )}

      {/* Scope tabs — every request lives under exactly one of these. */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SCOPES.map(({ key, label }) => {
          const active = scope === key
          const count = countsQ.data?.[key]
          return (
            <button
              key={key}
              onClick={() => setScope(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${active ? 'var(--blue)' : 'var(--bd)'}`,
                background: active ? 'var(--blue-dim)' : 'var(--bg-card)',
                color: active ? 'var(--blue)' : 'var(--t2)',
              }}
            >
              {label}
              {count != null && count > 0 && (
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                  background: active ? 'var(--blue)' : 'var(--bg-card-2)',
                  color: active ? '#fff' : 'var(--t3)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {inboxQ.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Inbox size={28} style={{ color: 'var(--t4)', opacity: 0.6, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
              {SCOPES.find(s => s.key === scope)?.empty}
            </p>
            {scope === 'action' && (countsQ.data?.all ?? 0) > 0 && (
              <button
                onClick={() => setScope('all')}
                style={{
                  marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--blue)',
                }}
              >
                See all {countsQ.data?.all} reschedule requests →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row) => {
              const picked = row.request.slots.find((s) => s.id === row.request.pickedSlotId)
              const readyToApply = row.request.status === 'SLOT_PICKED' && !!picked

              return (
                <div
                  key={row.request.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    borderBottom: '1px solid var(--bd)',
                    borderLeft: `3px solid ${
                      row.isStale ? 'var(--red)' : readyToApply ? 'var(--green)' : 'var(--amber)'}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onOpenJob(row.job.id)}
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', fontFamily: 'inherit',
                          textAlign: 'left',
                        }}
                      >
                        {row.job.title}
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--t4)' }}>{row.job.jobNumber}</span>

                      {/* Who started this round — the single most important
                          missing detail: "did we ask them, or did they ask us?" */}
                      <span
                        title={`Opened by ${row.request.openedByName ?? (row.request.openedBy === 'ADMIN' ? 'your team' : 'the customer')}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10,
                          fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          color: row.request.openedBy === 'ADMIN' ? 'var(--blue)' : 'var(--violet)',
                          background: `color-mix(in srgb, ${
                            row.request.openedBy === 'ADMIN' ? 'var(--blue)' : 'var(--violet)'} 14%, transparent)`,
                        }}
                      >
                        {row.request.openedBy === 'ADMIN'
                          ? <><ArrowUpRight size={9} /> We asked</>
                          : <><User size={9} /> Customer asked</>}
                      </span>

                      {/* Status matters once the list includes resolved rows. */}
                      {STATUS_META[row.request.status] && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          color: STATUS_META[row.request.status].color,
                          background: `color-mix(in srgb, ${STATUS_META[row.request.status].color} 14%, transparent)`,
                        }}>
                          {STATUS_META[row.request.status].label}
                        </span>
                      )}

                      {row.isStale && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10,
                          fontWeight: 700, color: 'var(--red)',
                          background: 'color-mix(in srgb, var(--red) 14%, transparent)',
                          padding: '2px 7px', borderRadius: 999,
                        }}>
                          <AlertTriangle size={9} /> {daysOld(row.request.createdAt)}d no reply
                        </span>
                      )}
                    </div>
                    {row.job.assignedToName && (
                      <div style={{ marginTop: 4 }}>
                        <TechChip name={row.job.assignedToName} size={18} fontSize={11} />
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 3 }}>
                      {row.job.customerName ?? '—'}
                      {' · '}
                      {readyToApply
                        ? `chose ${formatSlot(picked!.startAt, picked!.endAt, picked!.window)}`
                        : row.request.mode === 'OPEN_ASK'
                          ? 'asked to reschedule — no time given'
                          : `proposed ${row.request.slots.length} time${row.request.slots.length === 1 ? '' : 's'}`}
                      {' · '}
                      {RESCHEDULE_REASON_LABELS[row.request.reasonCode] ?? row.request.reasonCode}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    {readyToApply ? (
                      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => apply(row)}>
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Apply
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => onOpenJob(row.job.id)}>
                        <CalendarClock size={12} /> Respond
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decline(row)}
                      style={{ color: 'var(--red)' }}>
                      Decline
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
