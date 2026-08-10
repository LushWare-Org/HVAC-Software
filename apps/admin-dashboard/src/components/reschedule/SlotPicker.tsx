import { Plus, X } from 'lucide-react'
import { RESCHEDULE_WINDOWS, slotFromWindow, type RescheduleWindowKey } from '../../lib/reschedule'

export interface SlotDraft {
  id: string
  date: string                 // yyyy-mm-dd, straight from a native date input
  window: RescheduleWindowKey
}

export function emptySlotDraft(): SlotDraft {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    id: Math.random().toString(36).slice(2),
    date: toDateInput(tomorrow),
    window: 'morning',
  }
}

/** Local-date formatting — toISOString() would shift the day west of UTC. */
function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Converts what the user picked into the UTC intervals the API stores.
 *
 * A window slot deliberately spans the whole window: a customer who agreed to
 * "Tuesday morning" agreed to 8–12, not to 9:00 sharp, and the calendar should
 * record what they actually agreed to.
 */
export function slotDraftsToInput(drafts: SlotDraft[], timeZone: string) {
  return drafts.map((d) => {
    const { startAt, endAt, window } = slotFromWindow(d.date, d.window, timeZone)
    return { startAt: startAt.toISOString(), endAt: endAt.toISOString(), window }
  })
}

const WINDOW_KEYS = Object.keys(RESCHEDULE_WINDOWS) as RescheduleWindowKey[]

export default function SlotPicker({
  value, onChange, max = 3,
}: {
  value: SlotDraft[]
  onChange: (next: SlotDraft[]) => void
  max?: number
}) {
  const today = toDateInput(new Date())

  const update = (id: string, patch: Partial<SlotDraft>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {value.map((slot, i) => (
        <div key={slot.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid var(--bd)', borderRadius: 10, padding: '10px 12px',
          background: 'var(--bg-card-2)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', width: 18, flexShrink: 0 }}>
            {i + 1}
          </span>
          <input
            type="date"
            value={slot.date}
            min={today}
            onChange={(e) => update(slot.id, { date: e.target.value })}
            style={{
              flex: 1, minWidth: 0, padding: '7px 10px', borderRadius: 8, fontSize: 12.5,
              border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
              fontFamily: 'inherit',
            }}
          />
          <select
            value={slot.window}
            onChange={(e) => update(slot.id, { window: e.target.value as RescheduleWindowKey })}
            style={{
              padding: '7px 10px', borderRadius: 8, fontSize: 12.5,
              border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
              fontFamily: 'inherit',
            }}
          >
            {WINDOW_KEYS.map((k) => (
              <option key={k} value={k}>
                {RESCHEDULE_WINDOWS[k].label} · {RESCHEDULE_WINDOWS[k].range}
              </option>
            ))}
          </select>
          {value.length > 1 && (
            <button
              type="button"
              aria-label={`Remove option ${i + 1}`}
              onClick={() => onChange(value.filter((s) => s.id !== slot.id))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--t4)', padding: 4, flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange([...value, emptySlotDraft()])}
          style={{ alignSelf: 'flex-start' }}
        >
          <Plus size={12} /> Add another option
        </button>
      )}
      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
        Offering two or three options usually settles it in one message instead of several.
      </p>
    </div>
  )
}
