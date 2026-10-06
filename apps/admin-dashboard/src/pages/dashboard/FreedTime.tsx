/**
 * Time handed back by cancellations, with the work that fits it. Each gap is
 * drawn on the technician's working day; pointing at a suggestion slides it
 * into place on that day so the dispatcher sees the fit before asking. Each
 * fill asks the assistant, which shows what changes and waits for Confirm.
 * Renders nothing when no cancellation has left usable time.
 */
import { useState } from 'react'
import { useGaps, type Gap, type GapFill } from '../../hooks/useGaps'
import { askAssistant } from '../../lib/assistant'

const DAY_START = 8
const DAY_END = 17

function parts(iso: string, tz: string) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(iso))
  return Number(p.find(x => x.type === 'hour')?.value ?? 0) + Number(p.find(x => x.type === 'minute')?.value ?? 0) / 60
}
/** Position on the 08:00-17:00 day as a percentage, clamped. */
function pos(iso: string, tz: string) {
  return Math.min(100, Math.max(0, ((parts(iso, tz) - DAY_START) / (DAY_END - DAY_START)) * 100))
}
function clock(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso)).toLowerCase()
}
function dayName(date: string, tz: string) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
  const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(Date.now() + 86_400_000))
  if (date === today) return 'today'
  if (date === tomorrow) return 'tomorrow'
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
}
function hours(from: string, to: string) {
  const m = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000)
  const h = Math.floor(m / 60), r = m % 60
  return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`
}

function fillLabel(f: GapFill, tz: string) {
  const who = f.customer || f.title
  if (f.kind === 'PULL_FORWARD' && f.currentStart) {
    const was = new Date(f.currentStart).toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' })
    return { main: `Bring ${f.jobNumber} forward`, sub: `${who}, now ${was} ${clock(f.currentStart, tz)}` }
  }
  return { main: `Give ${f.jobNumber} at ${clock(f.start, tz)}`, sub: `${who}${f.travelKm != null ? `, ${Math.round(f.travelKm)} km away` : ''}` }
}

function GapRow({ gap, tz }: { gap: Gap; tz: string }) {
  const [preview, setPreview] = useState<GapFill | null>(null)
  const left = pos(gap.from, tz), right = pos(gap.to, tz)
  const ticks = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

  return (
    <li className="gap-row">
      <div className="gap-text">
        <p className="brief-title">
          {gap.technicianName} is free {dayName(gap.date, tz)}, {clock(gap.from, tz)} to {clock(gap.to, tz)}
        </p>
        <p className="gap-cause">
          {gap.cancelledJobNumber}{gap.customer ? ` for ${gap.customer}` : ''} was cancelled{gap.reason ? `: ${gap.reason}` : ''}. {hours(gap.from, gap.to)} open.
        </p>
      </div>

      <div className="gap-day" aria-hidden="true">
        <div className="gap-track">
          <span className="gap-hole" style={{ left: `${left}%`, width: `${right - left}%` }} />
          <span
            className={`gap-ghost${preview ? ' is-on' : ''}${preview?.priority === 'EMERGENCY' || preview?.priority === 'HIGH' ? ' is-urgent' : ''}`}
            style={preview ? { left: `${pos(preview.start, tz)}%`, width: `${pos(preview.end, tz) - pos(preview.start, tz)}%` } : { left: `${left}%`, width: '0%' }}
          >
            {preview && <span className="gap-ghost-label">{preview.jobNumber}</span>}
          </span>
        </div>
        <div className="gap-ticks">
          {ticks.map(h => <span key={h} style={{ left: `${((h - DAY_START) / (DAY_END - DAY_START)) * 100}%` }}>{h % 12 || 12}</span>)}
        </div>
      </div>

      {gap.fills.length > 0 ? (
        <div className="gap-fills">
          {gap.fills.map(f => {
            const l = fillLabel(f, tz)
            return (
              <button
                key={f.jobId}
                type="button"
                className="gap-fill"
                onMouseEnter={() => setPreview(f)}
                onMouseLeave={() => setPreview(null)}
                onFocus={() => setPreview(f)}
                onBlur={() => setPreview(null)}
                onClick={() => askAssistant(f.request)}
                title="Opens the assistant to confirm"
              >
                <span className="gap-fill-main">
                  {(f.priority === 'EMERGENCY' || f.priority === 'HIGH') && <span className="gap-urgent">{f.priority === 'EMERGENCY' ? 'Emergency' : 'High'}</span>}
                  {l.main}
                </span>
                <span className="gap-fill-sub">{l.sub}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="gap-none">Nothing waiting fits this time. It can be offered to the next customer who calls.</p>
      )}
    </li>
  )
}

export default function FreedTime() {
  const { data } = useGaps()
  const gaps = data?.gaps ?? []
  if (!gaps.length) return null
  const tz = data!.timezone

  return (
    <section className="ops-panel brief" aria-labelledby="freed-time">
      <header className="brief-head rb-head">
        <div className="brief-headline-wrap">
          <h2 id="freed-time" className="brief-headline">
            {gaps.length === 1 ? 'A cancellation left time to fill' : `${gaps.length} cancellations left time to fill`}
          </h2>
          <p className="brief-yesterday">Point at a job to see where it lands. Nothing changes until you confirm it in the assistant.</p>
        </div>
      </header>
      <ul className="brief-rows">
        {gaps.map(g => <GapRow key={`${g.technicianId}-${g.from}`} gap={g} tz={tz} />)}
      </ul>
    </section>
  )
}
