/**
 * JobStatusSpine — the job's life, as one line.
 *
 * A dispatcher opening a job asks two things before anything else: how far
 * along is it, and how long has it been sitting where it is. The old modal
 * answered the first with a badge and never answered the second at all, so a
 * job stuck in EN_ROUTE for four hours looked identical to one that went en
 * route a minute ago.
 *
 * Reached stages carry the timestamp they were reached. The current stage
 * carries how long it has held there, which is the number that makes someone
 * pick up the phone. Stages are a real sequence, so they are drawn as one.
 */
import { useEffect, useState } from 'react'

interface StatusHistoryRow {
  fromStatus?: string | null
  toStatus: string
  createdAt: string
}

/** The happy path. Off-path states are surfaced separately, not as a stage. */
const SPINE = [
  { key: 'PENDING',   label: 'Pending' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'EN_ROUTE',  label: 'En route' },
  { key: 'ON_SITE',   label: 'On site' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'INVOICED',  label: 'Invoiced' },
  { key: 'PAID',      label: 'Paid' },
] as const

/** IN_PROGRESS is shown at the same point as ON_SITE: same place on the job. */
const ALIAS: Record<string, string> = { IN_PROGRESS: 'ON_SITE' }

const OFF_PATH: Record<string, { label: string; tone: string }> = {
  CANCELLED: { label: 'Cancelled', tone: 'var(--red)' },
  ON_HOLD:   { label: 'On hold',   tone: 'var(--amber)' },
}

function shortTime(iso: string) {
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

/** "4h 12m" / "18m" / "3d". Coarse on purpose: nobody acts on seconds. */
export function durationSince(iso: string, now: number) {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  if (h < 24) return mins % 60 ? `${h}h ${mins % 60}m` : `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function JobStatusSpine({
  status,
  statusHistory,
  createdAt,
}: {
  status: string
  statusHistory: StatusHistoryRow[]
  createdAt?: string
}) {
  // Ticks so the dwell time stays honest while the modal sits open.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const current = ALIAS[status] ?? status
  const off = OFF_PATH[status]
  const currentIndex = SPINE.findIndex(s => s.key === current)

  // First time each stage was reached. First, not last: a job bounced back to
  // SCHEDULED and forward again was still first scheduled at the earlier time.
  const reachedAt = new Map<string, string>()
  for (const row of [...statusHistory].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  )) {
    const key = ALIAS[row.toStatus] ?? row.toStatus
    if (!reachedAt.has(key)) reachedAt.set(key, row.createdAt)
  }
  if (createdAt && !reachedAt.has('PENDING')) reachedAt.set('PENDING', createdAt)

  // When the job entered the stage it is in now — the last transition into it.
  const enteredCurrent = [...statusHistory]
    .filter(r => (ALIAS[r.toStatus] ?? r.toStatus) === current)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]?.createdAt
    ?? (current === 'PENDING' ? createdAt : undefined)

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, width: '100%' }}>
      {SPINE.map((stage, i) => {
        const reached = reachedAt.get(stage.key)
        const isCurrent = !off && i === currentIndex
        const isPast = !off && currentIndex > -1 && i < currentIndex
        const done = isPast || !!reached

        const tone = off && i > currentIndex ? 'var(--t4)'
          : isCurrent ? 'var(--blue)'
          : done ? 'var(--green)'
          : 'var(--t4)'

        return (
          <div
            key={stage.key}
            style={{
              flex: 1,
              minWidth: 0,
              paddingTop: 9,
              paddingBottom: 8,
              borderTop: `2px solid ${done || isCurrent ? tone : 'var(--bd)'}`,
              marginRight: i === SPINE.length - 1 ? 0 : 3,
              opacity: !done && !isCurrent ? 0.55 : 1,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: isCurrent ? 700 : 600,
                color: isCurrent ? 'var(--t1)' : done ? 'var(--t2)' : 'var(--t4)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stage.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono, ui-monospace), monospace',
                fontSize: 10.5,
                marginTop: 2,
                color: isCurrent ? 'var(--blue)' : 'var(--t4)',
                fontWeight: isCurrent ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              {isCurrent && enteredCurrent
                ? `${durationSince(enteredCurrent, now)} here`
                : reached
                  ? shortTime(reached)
                  : '—'}
            </div>
          </div>
        )
      })}

      {off && (
        <div
          style={{
            alignSelf: 'center',
            marginLeft: 12,
            padding: '4px 10px',
            borderRadius: 6,
            background: `color-mix(in srgb, ${off.tone} 12%, transparent)`,
            color: off.tone,
            fontSize: 11.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {off.label}
          {enteredCurrent && (
            <span style={{ fontWeight: 500, opacity: 0.85 }}>
              {' '}· {durationSince(enteredCurrent, now)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
