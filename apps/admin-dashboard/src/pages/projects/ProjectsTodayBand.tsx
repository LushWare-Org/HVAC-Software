/**
 * ProjectsTodayBand — Day Planner strip: which projects are running on the
 * selected day and who's on each crew. Rostered techs are reserved capacity.
 *
 * DEMO: reads the mock store; "Manage roster" deep-links to the project's
 * roster tab. Real impl swaps the data source, same layout.
 */
import { useNavigate } from 'react-router-dom'
import { HardHat, MapPin, ChevronRight } from 'lucide-react'
import { useRostersByDate, useTechDirectory, toDateKey } from './projectsApi'
import { AvatarStack } from './shared'

export default function ProjectsTodayBand({ date }: { date: Date }) {
  const navigate = useNavigate()
  const key = toDateKey(date)
  const { data: rows } = useRostersByDate(key)
  useTechDirectory() // primes avatar names/colors

  const running = (rows ?? []).filter(r => r.techUserIds.length > 0)

  if (running.length === 0) return null

  return (
    <div className="card" style={{ padding: '14px 18px' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
        letterSpacing: '0.06em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <HardHat size={12} style={{ color: 'var(--blue)' }} />
        Projects running this day — crews are reserved
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
        {running.map(r => {
          const short = r.requiredHeadcount != null && r.techUserIds.length < r.requiredHeadcount
          return (
            <button
              key={r.projectId}
              onClick={() => navigate(`/projects/${r.projectId}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
                padding: '11px 14px', borderRadius: 12, fontFamily: 'inherit',
                background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                borderLeft: `3px solid ${short ? 'var(--amber)' : 'var(--green)'}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={10} /> {r.siteAddress?.split(',')[0] ?? '—'}
                </p>
              </div>
              <AvatarStack userIds={r.techUserIds} max={4} size={24} />
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                background: short ? 'var(--amber-dim)' : 'var(--green-dim)',
                color: short ? 'var(--amber)' : 'var(--green)',
              }}>
                {r.techUserIds.length}{r.requiredHeadcount ? `/${r.requiredHeadcount}` : ''}{short ? ' short' : ''}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
