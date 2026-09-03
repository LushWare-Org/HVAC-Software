/**
 * CrewTimeline — one shared time axis for a whole crew.
 *
 * The signature element of the crew panel. Every member's day renders against
 * the same scale, with this job's window drawn as a vertical band cutting
 * through all rows. A conflict is then a shape intersecting the band rather
 * than a sentence to read, and members are compared by scanning a column
 * instead of reading each row separately.
 *
 * Per-row axes were the obvious alternative and are worse: they make the rows
 * independent, which is exactly the comparison the dispatcher needs to make.
 */

/** Visible span of the working day. Wider than DAY_START_H/DAY_END_H in
 *  dayPlan.ts (08:00–17:00) so an early start or a late clash is still on
 *  screen rather than clipped to the edge and invisible. */
const DAY_START_H = 7
const DAY_END_H = 19

export interface TimelineBlock {
  start: Date
  end: Date
  /** this = the job being crewed, other = their existing work, clash = an
   *  existing job that overlaps this one's window. */
  kind: 'this' | 'other' | 'clash'
  label?: string
  /** Opens the underlying job when the block is clicked. */
  jobId?: string
}

export interface TimelineRow {
  id: string
  name: string
  blocks: TimelineBlock[]
}

/** Position of a time on the axis as a percentage, clamped to the visible day. */
export function timelinePct(day: Date, t: Date): number {
  const start = new Date(day)
  start.setHours(DAY_START_H, 0, 0, 0)
  const end = new Date(day)
  end.setHours(DAY_END_H, 0, 0, 0)
  const span = end.getTime() - start.getTime()
  if (span <= 0) return 0
  const pct = ((t.getTime() - start.getTime()) / span) * 100
  return Math.max(0, Math.min(100, pct))
}

const KIND_COLOR: Record<TimelineBlock['kind'], string> = {
  this: 'var(--blue)',
  other: 'var(--t4)',
  clash: 'var(--red)',
}

export default function CrewTimeline({
  day,
  windowStart,
  windowEnd,
  rows,
  onBlockClick,
}: {
  day: Date
  windowStart: Date
  windowEnd: Date
  rows: TimelineRow[]
  onBlockClick?: (block: TimelineBlock) => void
}) {
  const bandLeft = timelinePct(day, windowStart)
  const bandWidth = Math.max(1, timelinePct(day, windowEnd) - bandLeft)

  // Every other hour, so the labels never collide at narrow widths.
  const ticks: number[] = []
  for (let h = DAY_START_H; h <= DAY_END_H; h += 2) ticks.push(h)

  if (rows.length === 0) {
    return (
      <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '8px 0' }}>
        Add a technician to see their day.
      </p>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* This job's window, behind every row so overlaps read as intersections */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: `${bandLeft}%`,
          width: `${bandWidth}%`,
          top: 18,
          bottom: 0,
          background: 'color-mix(in srgb, var(--blue) 9%, transparent)',
          borderLeft: '1.5px solid var(--blue)',
          borderRight: '1.5px solid var(--blue)',
          pointerEvents: 'none',
          borderRadius: 2,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: 'var(--t4)',
          marginBottom: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {ticks.map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>

      {rows.map((row) => (
        <div key={row.id} style={{ marginBottom: 7 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>{row.name}</div>
          <div
            style={{
              position: 'relative',
              height: 20,
              borderRadius: 4,
              background: 'var(--bg-card)',
              border: '1px solid var(--bd)',
            }}
          >
            {row.blocks.map((b, i) => {
              const left = timelinePct(day, b.start)
              // A 30-minute visit is under 3% of a 12-hour day, so enforce a
              // floor or short jobs vanish into a hairline.
              const width = Math.max(2, timelinePct(day, b.end) - left)
              const clickable = !!onBlockClick && !!b.jobId
              return (
                <button
                  key={i}
                  type="button"
                  onClick={clickable ? () => onBlockClick?.(b) : undefined}
                  title={b.label}
                  aria-label={b.label ?? 'Booking'}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 2,
                    bottom: 2,
                    borderRadius: 3,
                    border: 'none',
                    padding: '0 4px',
                    background: KIND_COLOR[b.kind],
                    color: '#fff',
                    fontSize: 8.5,
                    fontWeight: 700,
                    textAlign: 'left',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    cursor: clickable ? 'pointer' : 'default',
                  }}
                >
                  {b.label ?? ''}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
