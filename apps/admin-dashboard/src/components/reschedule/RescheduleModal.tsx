import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarClock, Loader2, Check, MessageSquareWarning } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import {
  STAFF_REASONS, RESCHEDULE_REASON_LABELS, formatSlot,
} from '../../lib/reschedule'
import {
  useRescheduleHistory, useOpenReschedule, useRespondReschedule,
  useApplyReschedule, useCancelReschedule,
} from '../../hooks/useReschedule'
import type { RescheduleRequest, RescheduleStateValue } from '../../types/api'
import SlotPicker, { emptySlotDraft, slotDraftsToInput, type SlotDraft } from './SlotPicker'
import RescheduleBadge from './RescheduleBadge'
import { TechChip } from '../TechAvatar'

export interface RescheduleJobLike {
  id: string
  title: string
  jobNumber?: string
  customerName?: string | null
  scheduledStart?: string | null
  status: string
  rescheduleState?: RescheduleStateValue | null
  assignedToName?: string | null
}

/**
 * Staff-side reschedule negotiation: open a request, answer one, read the
 * history. Which of those it shows depends on whether a round is already live —
 * there can only ever be one open request per job.
 */
export default function RescheduleModal({ job, isOpen, onClose }: {
  job: RescheduleJobLike
  isOpen: boolean
  onClose: () => void
}) {
  const { showSuccess, showError } = useToast()
  const historyQ = useRescheduleHistory(isOpen ? job.id : undefined)
  const openMut = useOpenReschedule()
  const respondMut = useRespondReschedule()
  const applyMut = useApplyReschedule()
  const cancelMut = useCancelReschedule()

  const [mode, setMode] = useState<'PROPOSE_SLOTS' | 'OPEN_ASK'>('PROPOSE_SLOTS')
  const [reasonCode, setReasonCode] = useState<string>(STAFF_REASONS[0])
  const [reason, setReason] = useState('')
  const [slots, setSlots] = useState<SlotDraft[]>([emptySlotDraft()])

  if (!isOpen) return null

  const history = historyQ.data ?? []
  const live = history.find((r) => r.status === 'AWAITING_RESPONSE' || r.status === 'SLOT_PICKED')
  const busy = openMut.isPending || respondMut.isPending || applyMut.isPending || cancelMut.isPending
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const fail = (e: any, fallback: string) =>
    showError(e?.response?.data?.message ?? fallback, 'Reschedule failed')

  const submitOpen = () => {
    openMut.mutate({
      jobId: job.id, mode, reasonCode, reason: reason.trim() || undefined,
      slots: mode === 'PROPOSE_SLOTS' ? slotDraftsToInput(slots, tz) : undefined,
    }, {
      onSuccess: () => {
        showSuccess(mode === 'PROPOSE_SLOTS'
          ? 'Times sent to the customer.'
          : "We asked the customer for their availability.")
        setReason(''); setSlots([emptySlotDraft()])
      },
      onError: (e) => fail(e, 'Could not open the reschedule request.'),
    })
  }

  // Staff picking a customer's slot applies it in the same request — the backend
  // treats a staff pick as the confirmation.
  const pickSlot = (requestId: string, slotId: string) =>
    respondMut.mutate({ requestId, action: 'PICK', pickedSlotId: slotId }, {
      onSuccess: () => showSuccess('Time confirmed — the job is back in the dispatch queue.'),
      onError: (e) => fail(e, 'Could not confirm that time.'),
    })

  const applyPicked = (requestId: string) => {
    const enRoute = job.status === 'EN_ROUTE'
    if (enRoute && !window.confirm(
      `${job.assignedToName ?? 'A technician'} is already on the way to this job.\n\n` +
      'Applying this reschedule will cancel that visit. Continue?',
    )) return
    applyMut.mutate({ requestId, confirmEnRoute: enRoute }, {
      onSuccess: () => showSuccess('New time applied. The job is back in the dispatch queue.'),
      onError: (e) => fail(e, 'Could not apply the new time.'),
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: '88vh', background: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--bd)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <CalendarClock size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Reschedule</span>
              <RescheduleBadge state={job.rescheduleState} />
            </div>
            {job.assignedToName && (
              <div style={{ margin: '0 0 4px' }}>
                <TechChip name={job.assignedToName} size={18} fontSize={11.5} />
              </div>
            )}
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t3)' }}>
              {job.title}{job.customerName ? ` · ${job.customerName}` : ''}
              {job.scheduledStart
                ? ` · currently ${new Date(job.scheduledStart).toLocaleString(undefined,
                    { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : ' · not yet scheduled'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {historyQ.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : live ? (
            <LiveRound
              request={live}
              busy={busy}
              onPick={pickSlot}
              onApply={applyPicked}
              onDecline={(id) => respondMut.mutate({ requestId: id, action: 'DECLINE' }, {
                onSuccess: () => showSuccess('Request declined — the existing appointment stands.'),
                onError: (e) => fail(e, 'Could not decline the request.'),
              })}
              onCancel={(id) => cancelMut.mutate(id, {
                onSuccess: () => showSuccess('Request withdrawn.'),
                onError: (e) => fail(e, 'Could not withdraw the request.'),
              })}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['PROPOSE_SLOTS', 'OPEN_ASK'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="btn btn-sm"
                    style={mode === m
                      ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                      : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
                  >
                    {m === 'PROPOSE_SLOTS' ? 'Offer times' : 'Ask what suits them'}
                  </button>
                ))}
              </div>

              <div>
                <label style={lblStyle}>Why is this moving?</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  style={inputStyle}
                >
                  {STAFF_REASONS.map((r) => (
                    <option key={r} value={r}>{RESCHEDULE_REASON_LABELS[r]}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>
                  Used for reporting on why jobs move. The customer sees your message below, not this.
                </p>
              </div>

              {mode === 'PROPOSE_SLOTS' && <SlotPicker value={slots} onChange={setSlots} />}

              <div>
                <label style={lblStyle}>Message to the customer (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Shown to the customer exactly as written."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {history.filter((r) => r !== live).length > 0 && (
            <PastRounds rounds={history.filter((r) => r !== live)} />
          )}
        </div>

        <div style={{
          padding: '13px 22px', borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-card-2)',
        }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          {!live && (
            <button className="btn btn-primary btn-sm" onClick={submitOpen} disabled={busy}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CalendarClock size={13} />}
              {mode === 'PROPOSE_SLOTS' ? 'Send times' : 'Ask the customer'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

const lblStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t4)',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 10, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

function LiveRound({ request, busy, onPick, onApply, onDecline, onCancel }: {
  request: RescheduleRequest
  busy: boolean
  onPick: (requestId: string, slotId: string) => void
  onApply: (requestId: string) => void
  onDecline: (requestId: string) => void
  onCancel: (requestId: string) => void
}) {
  const weOpened = request.openedBy === 'ADMIN'
  const picked = request.slots.find((s) => s.id === request.pickedSlotId)

  return (
    <div style={{
      border: '1px solid var(--bd)', borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>
        <strong>{weOpened ? 'You' : (request.openedByName ?? 'The customer')}</strong>
        {' '}{request.mode === 'OPEN_ASK' ? 'asked to reschedule' : 'proposed these times'}
        {' · '}{new Date(request.createdAt).toLocaleDateString()}
        {' · '}{RESCHEDULE_REASON_LABELS[request.reasonCode] ?? request.reasonCode}
      </div>

      {request.reason && (
        <div style={{
          background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 12px',
          fontSize: 12.5, color: 'var(--t2)',
        }}>
          {request.reason}
        </div>
      )}

      {request.status === 'SLOT_PICKED' && picked ? (
        <>
          <div style={{
            border: '1px solid rgba(5,150,105,0.3)', background: 'rgba(5,150,105,0.08)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <p style={{
              margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--green)', letterSpacing: '0.06em',
            }}>
              Customer chose
            </p>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--t1)' }}>
              {formatSlot(picked.startAt, picked.endAt, picked.window)}
            </p>
          </div>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onApply(request.id)}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Apply this time
          </button>
          <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
            Applying moves the job and returns it to the dispatch queue for reassignment.
          </p>
        </>
      ) : weOpened ? (
        <>
          {request.slots.map((s) => (
            <div key={s.id} style={{
              border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 12px',
              fontSize: 13, color: 'var(--t1)',
            }}>
              {formatSlot(s.startAt, s.endAt, s.window)}
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={12} className="animate-spin" /> Waiting for the customer to choose.
          </p>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onCancel(request.id)}
            style={{ alignSelf: 'flex-start', color: 'var(--red)' }}>
            Withdraw request
          </button>
        </>
      ) : (
        <>
          {request.slots.length > 0 ? (
            <>
              <p style={{
                fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--t4)', margin: 0, letterSpacing: '0.06em',
              }}>
                Pick one to confirm it immediately
              </p>
              {request.slots.map((s) => (
                <button
                  key={s.id}
                  disabled={busy}
                  onClick={() => onPick(request.id, s.id)}
                  style={{
                    textAlign: 'left', border: '1px solid var(--bd)', borderRadius: 10,
                    padding: '11px 13px', fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                    background: 'var(--bg-card)', cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {formatSlot(s.startAt, s.endAt, s.window)}
                </button>
              ))}
            </>
          ) : (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              background: 'var(--amber-dim)', border: '1px solid color-mix(in srgb, var(--amber) 40%, transparent)',
              borderRadius: 10, padding: '11px 13px',
            }}>
              <MessageSquareWarning size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)' }}>
                They asked to reschedule without naming a time. Decline this and open a new
                request offering them some options.
              </p>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onDecline(request.id)}
            style={{ alignSelf: 'flex-start', color: 'var(--red)' }}>
            Decline — keep the current time
          </button>
        </>
      )}
    </div>
  )
}

function PastRounds({ rounds }: { rounds: RescheduleRequest[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase',
        letterSpacing: '0.07em', marginBottom: 8,
      }}>
        Earlier rounds ({rounds.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rounds.map((r) => (
          <div key={r.id} style={{
            display: 'flex', justifyContent: 'space-between', gap: 10,
            fontSize: 11.5, color: 'var(--t3)', padding: '7px 10px',
            background: 'var(--bg-hover)', borderRadius: 8,
          }}>
            <span>
              {r.openedBy === 'ADMIN' ? 'You' : 'Customer'}
              {' · '}{r.mode === 'OPEN_ASK' ? 'asked' : `offered ${r.slots.length}`}
            </span>
            <span style={{ fontWeight: 700 }}>{r.status.replace(/_/g, ' ').toLowerCase()}</span>
            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
