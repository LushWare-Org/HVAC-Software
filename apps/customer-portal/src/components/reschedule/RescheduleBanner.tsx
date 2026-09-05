import { useState } from 'react'
import { CalendarClock, ChevronRight } from 'lucide-react'
import RescheduleModal from './RescheduleModal'
import type { Job } from '../../types/api'

/**
 * Shown only when the customer is the one holding things up.
 *
 * Deliberately a banner rather than a badge: an unanswered reschedule turns
 * into a missed appointment, so on the dashboard it has to be impossible to
 * scroll past. Renders nothing when the ball is with us.
 */
export default function RescheduleBanner({ jobs }: { jobs: Job[] }) {
  const [active, setActive] = useState<Job | null>(null)
  const waiting = jobs.filter((j) => j.rescheduleState === 'AWAITING_CUSTOMER')
  if (waiting.length === 0) return null

  return (
    <>
      {/* Every colour here comes from the amber tokens, which flip per theme
          (light #D97706 / dark + black #F59E0B). The previous hardcoded
          #B45309 on a translucent wash was near-invisible against the dark
          themes' card background. */}
      <div style={{
        background: 'var(--amber-dim)',
        border: '1px solid color-mix(in srgb, var(--amber) 45%, transparent)',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
          <CalendarClock size={17} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
              {waiting.length === 1
                ? 'We need a new time for your visit'
                : `We need new times for ${waiting.length} of your visits`}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--t2)' }}>
              Choose one of the times we've suggested, or tell us what suits you.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {waiting.map((job) => (
            <button
              key={job.id}
              onClick={() => setActive(job)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, background: 'var(--bg-card)',
                border: '1px solid color-mix(in srgb, var(--amber) 45%, transparent)',
                borderRadius: 10, padding: '10px 13px', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{job.title}</span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, color: 'var(--amber)', flexShrink: 0,
              }}>
                Pick a time <ChevronRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <RescheduleModal
          job={{
            id: active.id, title: active.title, scheduledStart: active.scheduledStart,
            status: active.status, rescheduleState: active.rescheduleState,
          }}
          isOpen
          onClose={() => setActive(null)}
        />
      )}
    </>
  )
}
