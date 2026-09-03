import type { CrewCandidate } from '../../../types/api'
import TechAvatar from '../../../components/TechAvatar'

function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Ranked technicians who could join the crew.
 *
 * Renders the order the server gives rather than re-sorting. The server already
 * puts conflict-free candidates first and breaks ties by score; sorting again
 * here would be a second opinion that can silently disagree with the first.
 *
 * A clashing candidate stays clickable. Dispatchers routinely know things the
 * system does not, and a disabled row pushes them to work around the tool
 * instead of with it, so the clash is stated and the choice left open.
 */
export default function CandidateList({
  candidates,
  onAdd,
  loading,
  error,
  excludeIds,
}: {
  candidates: CrewCandidate[]
  onAdd: (c: CrewCandidate) => void
  loading: boolean
  error: boolean
  /** Technicians already on the crew, hidden so the list only offers additions. */
  excludeIds: string[]
}) {
  if (loading) {
    return (
      <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '6px 0' }}>
        Finding available technicians…
      </p>
    )
  }

  if (error) {
    // Ranking is a convenience. Assignment has to keep working without it, so
    // this says what still works rather than just reporting a failure.
    return (
      <p style={{ fontSize: 11.5, color: 'var(--amber)', margin: '6px 0', lineHeight: 1.5 }}>
        Could not load suggestions. You can still build the crew, you just will not
        see scores or clashes.
      </p>
    )
  }

  const available = candidates.filter((c) => !excludeIds.includes(c.technician.id))

  if (available.length === 0) {
    return (
      <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '6px 0' }}>
        Everyone available for this window is already on the crew.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {available.map((c) => {
        // Arrives as null when the technician is free, so it must be defaulted
        // before anything reads .length.
        const conflicts = c.conflicts ?? []
        const clash = conflicts[0]

        return (
          <button
            key={c.technician.id}
            type="button"
            onClick={() => onAdd(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              textAlign: 'left',
              padding: '7px 8px',
              borderRadius: 7,
              cursor: 'pointer',
              background: clash
                ? 'color-mix(in srgb, var(--amber) 6%, var(--bg-card))'
                : 'var(--bg-card)',
              border: `1px solid ${
                clash ? 'color-mix(in srgb, var(--amber) 45%, transparent)' : 'var(--bd)'
              }`,
            }}
          >
            <TechAvatar
              id={c.technician.id}
              name={c.technician.name}
              avatarUrl={c.technician.avatarUrl}
              size={24}
            />

            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--t1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.technician.name}
              </span>
              <span style={{ display: 'block', fontSize: 9.5, color: 'var(--t3)' }}>
                {(c.technician.skills ?? []).join(', ') || 'No skills listed'}
                {' · '}
                {c.baseDistanceKm != null
                  ? `${c.baseDistanceKm.toFixed(1)} km ${
                      c.distanceFromBase ? 'from base' : 'from last position'
                    }`
                  : 'location unknown'}
                {` · ${c.activeJobsThatDay} job${c.activeJobsThatDay === 1 ? '' : 's'} that day`}
              </span>
            </span>

            {clash ? (
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  background: 'color-mix(in srgb, var(--amber) 18%, transparent)',
                  color: 'var(--amber)',
                }}
                title={`${clash.jobNumber} · ${hhmm(clash.start)} to ${hhmm(clash.end)}`}
              >
                Clashes {hhmm(clash.start)}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  background: 'color-mix(in srgb, var(--green) 18%, transparent)',
                  color: 'var(--green)',
                }}
              >
                Free
              </span>
            )}

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--t2)',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 22,
                textAlign: 'right',
              }}
            >
              {Math.round(c.score)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
