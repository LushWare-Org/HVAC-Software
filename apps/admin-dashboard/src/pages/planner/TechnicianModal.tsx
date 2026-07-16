/**
 * TechnicianModal — technician overview for the Day Planner: identity,
 * rating, skills, and the selected day's route. Follows the system card-modal
 * pattern (card + card-header + card-body over a blurred backdrop).
 */
import { X, Phone, Star, Wrench, Clock, MapPin, CircleDot } from 'lucide-react'
import type { Job, Technician } from '../../types/api'
import Avatar from '../../components/Avatar'

const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''

export default function TechnicianModal({ tech, jobs, dayLabel, onClose, onSelectJob }: {
  tech: Technician
  jobs: Job[]
  dayLabel: string
  onClose: () => void
  onSelectJob: (j: Job) => void
}) {
  const ordered = [...jobs].sort((a, b) =>
    new Date(a.scheduledStart ?? 0).getTime() - new Date(b.scheduledStart ?? 0).getTime())

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="card anim-fade-up" style={{ width: 480, maxWidth: '95vw', maxHeight: '85vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ border: '2px solid var(--blue)', borderRadius: '50%', flexShrink: 0 }}>
              <Avatar name={tech.name} avatarUrl={tech.avatarUrl} size={40} radius={20} fontSize={14} />
            </div>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {tech.name}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                  color: tech.isActive ? 'var(--green)' : 'var(--t4)',
                }}>
                  <CircleDot size={10} /> {tech.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {tech.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {tech.phone}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={11} style={{ color: 'var(--amber)' }} />
                  {tech.rating ? `${Number(tech.rating).toFixed(1)} (${tech.totalRatings ?? 0})` : 'No ratings yet'}
                </span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Skills */}
          {tech.skills?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Wrench size={11} /> Skills
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tech.skills.map(s => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--bg-card-2)', border: '1px solid var(--bd)', color: 'var(--t2)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Day route */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
              {dayLabel} — {ordered.length} job{ordered.length === 1 ? '' : 's'}
              {tech.maxDailyJobs ? ` (max ${tech.maxDailyJobs}/day)` : ''}
            </p>
            {ordered.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--t4)', margin: 0 }}>Nothing scheduled — free to take work this day.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ordered.map(j => (
                  <button
                    key={j.id}
                    onClick={() => onSelectJob(j)}
                    style={{
                      display: 'flex', width: '100%', textAlign: 'left', gap: 12, alignItems: 'center',
                      padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                      border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 76 }}>
                      <Clock size={11} /> {fmtTime(j.scheduledStart) || '—'}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                        {j.title}
                        {j.isAgreementJob && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'color-mix(in srgb, var(--green) 18%, transparent)', color: 'var(--green)', verticalAlign: 'middle' }}>
                            AGREEMENT
                          </span>
                        )}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                        <MapPin size={10} /> {j.serviceAddress ?? j.customerName ?? '—'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
