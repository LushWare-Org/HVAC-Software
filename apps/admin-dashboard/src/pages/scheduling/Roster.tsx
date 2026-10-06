/**
 * Who is working: technicians down the side, two weeks across, like the roster
 * on the office wall. A day off is struck through with stripes; a shorter day
 * shows its hours. Each day shows how many visits are booked, so marking a
 * busy day off is never a surprise. Free-time offers, running-behind and the
 * assistant all read the same entries.
 */
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAvailability, useSetDay, type ShiftEntry } from '../../hooks/useAvailability'
import { useToast } from '../../contexts/ToastContext'
import type { DispatchAssignment, Job, Technician } from '../../types/api'

const DAYS = 14

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function short(t: string) {
  const [h, m] = t.split(':').map(Number)
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, '0')}` : `${hh}`
}

type Kind = 'standard' | 'hours' | 'off'

interface Props {
  techs: Technician[]
  assignments: DispatchAssignment[]
  jobs: Job[]
}

export default function Roster({ techs, assignments, jobs }: Props) {
  const [start, setStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(start, i)), [start])
  const from = iso(days[0]), to = iso(days[DAYS - 1])
  const today = iso(new Date())

  const { data: entries = [], isLoading, isError } = useAvailability(from, to)
  const byCell = useMemo(() => new Map(entries.map(e => [`${e.technicianId}|${e.date}`, e])), [entries])

  // Visits per technician per day. Cancelled jobs leave their assignment open,
  // so the job's own status decides what still counts.
  const visits = useMemo(() => {
    const dead = new Set(jobs.filter(j => j.status === 'CANCELLED').map(j => j.id))
    const m = new Map<string, number>()
    for (const a of assignments as Array<DispatchAssignment & { scheduledStart?: string }>) {
      if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || !a.scheduledStart || dead.has(a.jobId)) continue
      const k = `${a.technicianId}|${iso(new Date(a.scheduledStart))}`
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [assignments, jobs])

  const [open, setOpen] = useState<{ techId: string; date: string } | null>(null)
  const active = techs.filter(t => t.isActive !== false)
  const range = `${days[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} to ${days[DAYS - 1].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`

  return (
    <section className="ops-panel roster" aria-labelledby="roster-title">
      <header className="roster-head">
        <div>
          <h2 id="roster-title" className="roster-title">Who's working</h2>
          <p className="roster-sub">Standard day is 8 to 5. Pick a day to mark it off or set different hours.</p>
        </div>
        <div className="roster-nav">
          <button type="button" className="ops-btn ops-btn-sm" onClick={() => { setOpen(null); setStart(d => addDays(d, -7)) }} aria-label="Previous week"><ChevronLeft size={16} /></button>
          <span className="roster-range">{range}</span>
          <button type="button" className="ops-btn ops-btn-sm" onClick={() => { setOpen(null); setStart(d => addDays(d, 7)) }} aria-label="Next week"><ChevronRight size={16} /></button>
        </div>
      </header>

      {isError && <p className="roster-msg">Days off could not be loaded. The scheduling service may be down; try again in a minute.</p>}
      {!isError && active.length === 0 && <p className="roster-msg">No technicians yet. Add one from the top bar to plan their days.</p>}

      {active.length > 0 && (
        <div className="roster-scroll">
          <table className="roster-grid" aria-busy={isLoading}>
            <thead>
              <tr>
                <th scope="col" className="roster-corner">Technician</th>
                {days.map(d => {
                  const k = iso(d)
                  const wk = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <th key={k} scope="col" className={`roster-day${k === today ? ' is-today' : ''}${wk ? ' is-weekend' : ''}`}>
                      <span className="roster-wd">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      <span className="roster-dn">{d.getDate()}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {active.map(t => (
                <TechRow
                  key={t.id}
                  tech={t}
                  days={days}
                  today={today}
                  byCell={byCell}
                  visits={visits}
                  open={open?.techId === t.id ? open.date : null}
                  onOpen={date => setOpen(o => (o?.techId === t.id && o.date === date ? null : { techId: t.id, date }))}
                  onClose={() => setOpen(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TechRow({ tech, days, today, byCell, visits, open, onOpen, onClose }: {
  tech: Technician; days: Date[]; today: string
  byCell: Map<string, ShiftEntry>; visits: Map<string, number>
  open: string | null; onOpen: (date: string) => void; onClose: () => void
}) {
  const openIndex = open ? days.findIndex(d => iso(d) === open) : -1
  return (
    <>
      <tr>
        <th scope="row" className="roster-name">{tech.name}</th>
        {days.map(d => {
          const date = iso(d)
          const e = byCell.get(`${tech.id}|${date}`)
          const n = visits.get(`${tech.id}|${date}`) ?? 0
          const kind: Kind = !e ? 'standard' : e.available ? 'hours' : 'off'
          const label = `${tech.name}, ${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${
            kind === 'off' ? `off${e?.note ? ` (${e.note})` : ''}` : kind === 'hours' ? `working ${e!.start} to ${e!.end}` : 'standard day'
          }, ${n} ${n === 1 ? 'visit' : 'visits'}`
          return (
            <td key={date} className={date === today ? 'is-today' : undefined}>
              <button
                type="button"
                className={`roster-cell is-${kind}${open === date ? ' is-open' : ''}${date < today ? ' is-past' : ''}`}
                onClick={() => onOpen(date)}
                aria-label={label}
                aria-expanded={open === date}
                disabled={date < today}
              >
                {kind === 'off' && <span className="roster-off">Off</span>}
                {kind === 'hours' && <span className="roster-hours">{short(e!.start)}–{short(e!.end)}</span>}
                {n > 0 && <span className={`roster-load${kind === 'off' ? ' is-clash' : ''}`}>{n}</span>}
              </button>
            </td>
          )
        })}
      </tr>
      {open && (
        <tr className="roster-edit-row">
          <td colSpan={days.length + 1}>
            <DayEditor
              key={open}
              tech={tech}
              date={open}
              entry={byCell.get(`${tech.id}|${open}`)}
              visits={visits.get(`${tech.id}|${open}`) ?? 0}
              pointer={(openIndex + 0.5) / days.length}
              onClose={onClose}
            />
          </td>
        </tr>
      )}
    </>
  )
}

function DayEditor({ tech, date, entry, visits, pointer, onClose }: {
  tech: Technician; date: string; entry?: ShiftEntry; visits: number; pointer: number; onClose: () => void
}) {
  const initial: Kind = !entry ? 'standard' : entry.available ? 'hours' : 'off'
  const [kind, setKind] = useState<Kind>(initial)
  const [startT, setStartT] = useState(entry?.available ? entry.start : '08:00')
  const [endT, setEndT] = useState(entry?.available ? entry.end : '12:00')
  const [note, setNote] = useState(entry?.note ?? '')
  const save = useSetDay()
  const toast = useToast()
  const day = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  const badHours = kind === 'hours' && startT >= endT

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (badHours) return
    const change = kind === 'standard'
      ? { technicianId: tech.id, date, kind } as const
      : kind === 'off'
        ? { technicianId: tech.id, date, kind, note } as const
        : { technicianId: tech.id, date, kind, start: startT, end: endT, note } as const
    save.mutate(change, {
      onSuccess: () => {
        toast.showSuccess(kind === 'off' ? `${tech.name} is off on ${day}.` : kind === 'hours' ? `${tech.name} works ${startT} to ${endT} on ${day}.` : `${tech.name} is back to a standard day on ${day}.`, 'Roster saved')
        onClose()
      },
      onError: (err: any) => toast.showError(err?.response?.data?.error ?? 'The day could not be saved. Try again.'),
    })
  }

  return (
    <form className="roster-edit" onSubmit={submit} style={{ ['--pointer' as string]: `${pointer * 100}%` }} onKeyDown={e => { if (e.key === 'Escape') onClose() }}>
      <div className="roster-edit-head">
        <h3>{tech.name}, {day}</h3>
        {visits > 0 && (
          <p className={kind === 'off' ? 'roster-warn' : 'roster-info'}>
            {visits} {visits === 1 ? 'visit is' : 'visits are'} booked.
            {kind === 'off' && ' They will show under running behind on the dashboard, with someone else to give them to.'}
          </p>
        )}
      </div>
      <fieldset className="roster-choice">
        <legend className="sr-only">This day</legend>
        {([['standard', 'Working, 8 to 5'], ['hours', 'Different hours'], ['off', 'Off']] as const).map(([k, l]) => (
          <label key={k} className={kind === k ? 'is-on' : undefined}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} autoFocus={kind === k} />
            {l}
          </label>
        ))}
      </fieldset>
      {kind === 'hours' && (
        <div className="roster-times">
          <label>From <input type="time" value={startT} onChange={e => setStartT(e.target.value)} required /></label>
          <label>To <input type="time" value={endT} onChange={e => setEndT(e.target.value)} required /></label>
          {badHours && <span className="roster-warn">The day has to end after it starts.</span>}
        </div>
      )}
      {kind !== 'standard' && (
        <label className="roster-note">
          <span className="roster-note-label">Reason <span>(optional)</span></span>
          <input type="text" value={note} maxLength={200} onChange={e => setNote(e.target.value)} placeholder={kind === 'off' ? 'Sick, annual leave, training' : 'Dentist in the afternoon'} />
        </label>
      )}
      <div className="roster-actions">
        <button type="button" className="ops-btn ops-btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="ops-btn ops-btn-sm ops-btn-primary" disabled={save.isPending || badHours || (kind === initial && kind === 'standard')}>
          {save.isPending ? 'Saving…' : 'Save day'}
        </button>
      </div>
    </form>
  )
}
