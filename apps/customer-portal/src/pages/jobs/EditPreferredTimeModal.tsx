import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarClock, Check, Loader2, Info } from 'lucide-react'
import {
  RESCHEDULE_WINDOWS, slotFromWindow, toDateInput, type RescheduleWindowKey,
} from '../../lib/reschedule'
import { useUpdatePreferredTime } from '../../hooks/useMyJobs'

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone
const WINDOW_KEYS = Object.keys(RESCHEDULE_WINDOWS) as RescheduleWindowKey[]

/**
 * Change the time you asked for, before the visit is scheduled.
 *
 * Deliberately lighter than the reschedule flow: no reason required, no
 * approval, no waiting. While the booking is PENDING and unassigned the time is
 * only a preference the customer stated themselves, so changing it is a plain
 * edit. The copy says so, to set the right expectation — and to make the
 * contrast clear when a later change *does* need confirming.
 */
export default function EditPreferredTimeModal({ job, onClose }: {
  job: { id: string; title: string; scheduledStart?: string | null }
  onClose: () => void
}) {
  const mutation = useUpdatePreferredTime()

  const current = job.scheduledStart ? new Date(job.scheduledStart) : null
  const [date, setDate] = useState(() => toDateInput(current ?? nextSensibleDay()))
  const [windowKey, setWindowKey] = useState<RescheduleWindowKey>(() => guessWindow(current))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    setError('')
    const slot = slotFromWindow(date, windowKey, TZ)
    mutation.mutate({
      jobId: job.id,
      preferredStart: slot.startAt.toISOString(),
      preferredEnd: slot.endAt.toISOString(),
      window: slot.window,
      note: note.trim() || undefined,
    }, {
      onSuccess: () => setDone(true),
      onError: (e: any) => setError(
        e?.response?.data?.message ?? 'We could not update that. Please try again.',
      ),
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
          background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 460,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarClock size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>
                Change your preferred time
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
              {job.title}
              {current && ` · currently ${current.toLocaleString(undefined,
                { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {done ? (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#059669',
            }}>
              Updated. We'll schedule your visit around this time.
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                background: 'var(--bg-hover)', borderRadius: 10, padding: '11px 13px',
              }}>
                <Info size={14} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 }}>
                  This visit hasn't been scheduled yet, so you can change the time yourself —
                  no need to wait for us to confirm.
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#dc2626',
                }}>{error}</div>
              )}

              <div>
                <label style={lbl}>Which day?</label>
                <input
                  type="date"
                  value={date}
                  min={toDateInput(new Date())}
                  onChange={(e) => setDate(e.target.value)}
                  style={input}
                />
              </div>

              <div>
                <label style={lbl}>What time of day?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {WINDOW_KEYS.map((k) => {
                    const w = RESCHEDULE_WINDOWS[k]
                    const active = windowKey === k
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setWindowKey(k)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                          border: `1.5px solid ${active ? 'var(--blue)' : 'var(--bd)'}`,
                          background: active ? 'var(--blue-glow, rgba(37,99,235,0.08))' : 'var(--bg-card)',
                          fontFamily: 'inherit', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{w.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{w.range}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={lbl}>Anything we should know? (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ ...input, resize: 'vertical' }}
                />
              </div>
            </>
          )}
        </div>

        <div style={{
          padding: '13px 20px', borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button className="btn btn-primary" onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save time
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Two days out — far enough to be schedulable, near enough to feel prompt. */
function nextSensibleDay(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d
}

/** Preselect the window the current time already falls in, so nothing jumps. */
function guessWindow(current: Date | null): RescheduleWindowKey {
  if (!current) return 'morning'
  const h = current.getHours()
  if (h < RESCHEDULE_WINDOWS.morning.endHour) return 'morning'
  if (h < RESCHEDULE_WINDOWS.afternoon.endHour) return 'afternoon'
  return 'evening'
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
