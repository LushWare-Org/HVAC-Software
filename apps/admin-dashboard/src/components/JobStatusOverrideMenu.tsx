/**
 * JobStatusOverrideMenu — admin-only "correct this status" control.
 *
 * The normal status-changing buttons only move a job forward through the
 * state machine (STATUS_TRANSITIONS in job-service). That's right for
 * day-to-day dispatch, but it means a technician's mis-tap (e.g. hitting
 * "On Site" by accident) has no way back without going through support.
 * This is the escape hatch: a small chevron-down box sitting in the corner
 * of the existing status button(s) that opens a plain list of every status —
 * pick one and the job is force-set to it, bypassing the transition guard.
 * The backend re-checks the caller's role independently (job-service
 * jobs.service.ts updateStatus, force flag) — hiding this menu for non-admins
 * here is a UX convenience, not the actual security boundary.
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_ROLES = ['super_admin', 'company_admin', 'office_manager']

const ALL_STATUSES = ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'INVOICED', 'ON_HOLD', 'CANCELLED']

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', SCHEDULED: 'Scheduled', EN_ROUTE: 'En Route', ON_SITE: 'On Site',
  COMPLETED: 'Completed', INVOICED: 'Invoiced', ON_HOLD: 'On Hold', CANCELLED: 'Cancelled',
}

export default function JobStatusOverrideMenu({
  currentStatus, isPending, onSelect,
}: {
  currentStatus: string
  isPending?: boolean
  onSelect: (status: string) => void
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // PAID means money was actually recorded against an invoice — the backend
  // refuses to force a job into or out of it, so there's nothing to offer.
  if (!user || !ADMIN_ROLES.includes(user.role) || currentStatus === 'PAID') return null

  const options = ALL_STATUSES.filter(s => s !== currentStatus)

  const handlePick = (status: string) => {
    setOpen(false)
    const label = STATUS_LABEL[status] ?? status
    if (!window.confirm(
      `Correct this job's status to "${label}"?\n\nThis bypasses the normal workflow and should only be used to fix a mistake (e.g. a technician tapped the wrong button). The change is logged with your name.`,
    )) return
    onSelect(status)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        title="Correct status (admin)"
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 8,
          border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t3)',
          cursor: isPending ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? <Loader2 size={13} className="spin" /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
          width: 208, background: 'var(--bg-card)', border: '1px solid var(--bd)',
          borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-hover)' }}>
            <AlertTriangle size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t2)' }}>Correct status to…</span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', padding: 4 }}>
            {options.map(s => (
              <button
                key={s}
                onClick={() => handlePick(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                  fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', background: 'none',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {STATUS_LABEL[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
