/**
 * ReschedulesInbox — the staff workspace for rescheduling.
 *
 * Everything currently waiting on a staff member, oldest first so the requests
 * at risk of becoming no-shows float to the top. A row where the customer has
 * already chosen a time is one click from Apply; everything else opens the job
 * so the dispatcher can respond properly.
 */
import { Loader2, Check, CalendarClock, AlertTriangle, Inbox } from 'lucide-react'
import { RESCHEDULE_REASON_LABELS, formatSlot } from '../../lib/reschedule'
import { useToast } from '../../contexts/ToastContext'
import {
  useRescheduleInbox, useApplyReschedule, useRespondReschedule, useRescheduleStats,
} from '../../hooks/useReschedule'
import type { RescheduleInboxRow } from '../../types/api'
import { TechChip } from '../../components/TechAvatar'

function daysOld(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default function ReschedulesInbox({ onOpenJob }: { onOpenJob: (jobId: string) => void }) {
  const inboxQ = useRescheduleInbox()
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {inboxQ.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Inbox size={28} style={{ color: 'var(--t4)', opacity: 0.6, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
              Nothing waiting on you. Reschedule requests from customers land here.
            </p>
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
                      {row.isStale && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10,
                          fontWeight: 700, color: '#B91C1C', background: 'rgba(220,38,38,0.12)',
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
