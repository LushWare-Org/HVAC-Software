import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarClock, Loader2, Check } from 'lucide-react'
import {
  CUSTOMER_REASONS, CUSTOMER_REASON_LABELS, RESCHEDULE_WINDOWS,
  slotFromWindow, formatSlot, toDateInput, type RescheduleWindowKey,
} from '../../lib/reschedule'
import {
  useMyRescheduleHistory, useRequestReschedule,
  useRespondToReschedule, useCancelMyReschedule,
} from '../../hooks/useMyReschedule'
import type { RescheduleRequest, RescheduleStateValue } from '../../types/api'
import RescheduleBadge from './RescheduleBadge'

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone
const WINDOW_KEYS = Object.keys(RESCHEDULE_WINDOWS) as RescheduleWindowKey[]

export interface RescheduleJobLike {
  id: string
  title: string
  scheduledStart?: string | null
  status: string
  rescheduleState?: RescheduleStateValue | null
}

/**
 * Customer-side reschedule. Two shapes depending on whether something is
 * already in flight:
 *  - nothing open → ask to reschedule, optionally naming a time
 *  - staff proposed times → pick one, or say none work and suggest your own
 *
 * A customer picking a slot never applies it directly; it parks for staff to
 * confirm (job-service enforces that, this UI just words it honestly).
 */
export default function RescheduleModal({ job, isOpen, onClose }: {
  job: RescheduleJobLike
  isOpen: boolean
  onClose: () => void
}) {
  const historyQ = useMyRescheduleHistory(isOpen ? job.id : undefined)
  const requestMut = useRequestReschedule()
  const respondMut = useRespondToReschedule()
  const cancelMut = useCancelMyReschedule()

  const [wantSpecificTime, setWantSpecificTime] = useState(false)
  const [reasonCode, setReasonCode] = useState<string>(CUSTOMER_REASONS[0])
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return toDateInput(d)
  })
  const [windowKey, setWindowKey] = useState<RescheduleWindowKey>('morning')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  if (!isOpen) return null

  const history = historyQ.data ?? []
  const live = history.find((r) => r.status === 'AWAITING_RESPONSE' || r.status === 'SLOT_PICKED')
  const busy = requestMut.isPending || respondMut.isPending || cancelMut.isPending
  const fail = (e: any, fallback: string) => setError(e?.response?.data?.message ?? fallback)

  const currentSlotInput = () => {
    const s = slotFromWindow(date, windowKey, TZ)
    return { startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString(), window: s.window }
  }

  const submit = () => {
    setError('')
    requestMut.mutate({
      jobId: job.id,
      mode: wantSpecificTime ? 'PROPOSE_SLOTS' : 'OPEN_ASK',
      reasonCode,
      reason: note.trim() || undefined,
      slots: wantSpecificTime ? [currentSlotInput()] : undefined,
    }, {
      onSuccess: () => setDone(wantSpecificTime
        ? "Sent. We'll confirm that time or suggest an alternative."
        : "Sent. We'll come back to you with some times."),
      onError: (e) => fail(e, 'We could not send that request. Please try again.'),
    })
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 520,
          maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CalendarClock size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Reschedule</span>
              <RescheduleBadge state={job.rescheduleState} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
              {job.title}
              {job.scheduledStart
                ? ` · currently ${new Date(job.scheduledStart).toLocaleString(undefined,
                    { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#dc2626', marginBottom: 14,
            }}>{error}</div>
          )}
          {done && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#059669', marginBottom: 14,
            }}>{done}</div>
          )}

          {historyQ.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : live ? (
            <LiveRound
              request={live}
              busy={busy}
              date={date} setDate={setDate}
              windowKey={windowKey} setWindowKey={setWindowKey}
              onPick={(slotId) => {
                setError('')
                respondMut.mutate({ requestId: live.id, action: 'PICK', pickedSlotId: slotId }, {
                  onSuccess: () => setDone("Thanks — we're confirming that time and will be in touch shortly."),
                  onError: (e) => fail(e, 'We could not save that choice. Please try again.'),
                })
              }}
              onSuggestInstead={() => {
                setError('')
                respondMut.mutate({
                  requestId: live.id, action: 'COUNTER',
                  reasonCode: 'CUSTOMER_UNAVAILABLE',
                  slots: [currentSlotInput()],
                  note: note.trim() || undefined,
                }, {
                  onSuccess: () => setDone("Sent — we'll check that time and confirm."),
                  onError: (e) => fail(e, 'We could not send that. Please try again.'),
                })
              }}
              onWithdraw={() => {
                setError('')
                cancelMut.mutate(live.id, {
                  onSuccess: () => setDone('Request withdrawn — your original appointment stands.'),
                  onError: (e) => fail(e, 'We could not withdraw that request.'),
                })
              }}
            />
          ) : done ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Why do you need to move it?</label>
                <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} style={input}>
                  {CUSTOMER_REASONS.map((r) => (
                    <option key={r} value={r}>{CUSTOMER_REASON_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--t2)', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={wantSpecificTime}
                  onChange={(e) => setWantSpecificTime(e.target.checked)}
                />
                I have a specific time in mind
              </label>

              {wantSpecificTime && (
                <DateWindowPicker
                  date={date} setDate={setDate}
                  windowKey={windowKey} setWindowKey={setWindowKey}
                />
              )}

              <div>
                <label style={lbl}>Anything else we should know? (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{ ...input, resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '13px 20px', borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {!live && !done && (
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Send request
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--t4)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 8,
}

const input: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: '1.5px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

function DateWindowPicker({ date, setDate, windowKey, setWindowKey }: {
  date: string; setDate: (v: string) => void
  windowKey: RescheduleWindowKey; setWindowKey: (v: RescheduleWindowKey) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="date"
        value={date}
        min={toDateInput(new Date())}
        onChange={(e) => setDate(e.target.value)}
        style={{ ...input, flex: 1, minWidth: 0 }}
      />
      <select
        value={windowKey}
        onChange={(e) => setWindowKey(e.target.value as RescheduleWindowKey)}
        style={{ ...input, width: 'auto' }}
      >
        {WINDOW_KEYS.map((k) => (
          <option key={k} value={k}>{RESCHEDULE_WINDOWS[k].label}</option>
        ))}
      </select>
    </div>
  )
}

function LiveRound({
  request, busy, date, setDate, windowKey, setWindowKey,
  onPick, onSuggestInstead, onWithdraw,
}: {
  request: RescheduleRequest
  busy: boolean
  date: string; setDate: (v: string) => void
  windowKey: RescheduleWindowKey; setWindowKey: (v: RescheduleWindowKey) => void
  onPick: (slotId: string) => void
  onSuggestInstead: () => void
  onWithdraw: () => void
}) {
  const [showCounter, setShowCounter] = useState(false)
  const theyOffered = request.openedBy === 'ADMIN' && request.slots.length > 0

  if (request.status === 'SLOT_PICKED') {
    return (
      <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.7 }}>
        Thanks — we're confirming your chosen time and will be in touch shortly.
      </p>
    )
  }

  if (!theyOffered) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.7 }}>
          You've asked to reschedule this visit. We'll come back to you with some times shortly.
        </p>
        <button className="btn btn-secondary" disabled={busy} onClick={onWithdraw}
          style={{ alignSelf: 'flex-start' }}>
          Never mind — keep my original time
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13.5, color: 'var(--t1)', margin: 0, fontWeight: 600 }}>
        We'd like to move your visit. Does one of these work?
      </p>
      {request.reason && (
        <div style={{
          background: 'var(--bg-hover)', borderRadius: 8, padding: '10px 12px',
          fontSize: 12.5, color: 'var(--t2)',
        }}>
          {request.reason}
        </div>
      )}
      {request.slots.map((s) => (
        <button
          key={s.id}
          disabled={busy}
          onClick={() => onPick(s.id)}
          style={{
            textAlign: 'left', border: '1.5px solid var(--bd)', borderRadius: 12,
            padding: '13px 15px', fontSize: 13.5, fontWeight: 600, color: 'var(--t1)',
            background: 'var(--bg-card)', cursor: busy ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {formatSlot(s.startAt, s.endAt, s.window)}
        </button>
      ))}

      {!showCounter ? (
        <button className="btn btn-secondary" onClick={() => setShowCounter(true)}
          style={{ alignSelf: 'flex-start' }}>
          None of these work
        </button>
      ) : (
        <div style={{
          border: '1px solid var(--bd)', borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)' }}>When would suit you?</p>
          <DateWindowPicker date={date} setDate={setDate} windowKey={windowKey} setWindowKey={setWindowKey} />
          <button className="btn btn-primary" disabled={busy} onClick={onSuggestInstead}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} Suggest this instead
          </button>
        </div>
      )}
    </div>
  )
}
