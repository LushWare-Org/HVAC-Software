/**
 * JobVitalsRail — the facts that stay on screen whatever tab you are on.
 *
 * The old modal put customer, address, crew, timing and money inside the
 * Overview tab, so the moment you opened Checklist to read the work, you lost
 * who the customer was and where they are. On a phone call that is the wrong
 * trade: the tab is the thing you are working in, the vitals are the thing you
 * are working from.
 *
 * Deliberately not cards. Cards would say "seven separate objects"; this is one
 * object read top to bottom, so it is hairline-separated rows instead.
 */
import { Phone, Mail, Navigation, Users, Crown, Wallet, CalendarClock, Plus } from 'lucide-react'
import type { Job, CrewMember } from '../../types/api'
import Avatar from '../../components/Avatar'
import { formatMoney } from '../../lib/format'

const rowLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: 'var(--t4)',
  marginBottom: 5,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
}

const section: React.CSSProperties = {
  padding: '13px 15px',
  borderBottom: '1px solid var(--bd)',
}

function fmtWindow(startIso?: string | null, endIso?: string | null, durationMin?: number | null) {
  if (!startIso) return null
  const s = new Date(startIso)
  const dayLabel = s.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
  const from = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = endIso
    ? new Date(endIso)
    : durationMin ? new Date(s.getTime() + durationMin * 60000) : null
  const to = end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { dayLabel, range: to ? `${from} – ${to}` : from }
}

export default function JobVitalsRail({
  job,
  crew,
  crewLoading,
  onManageCrew,
  onOpenCustomer,
}: {
  job: Job
  crew: CrewMember[]
  crewLoading: boolean
  onManageCrew: () => void
  onOpenCustomer?: () => void
}) {
  const j = job as any
  const address = j.serviceAddress ?? j.customerAddress
  const when = fmtWindow(j.scheduledStart, j.scheduledEnd, j.estimatedDurationMins)

  // Prefer the real crew. Fall back to the denormalised single name so the rail
  // is never emptier than the old modal was, even if the crew call is slow.
  const lead = crew.find(m => m.assignment?.isLead) ?? crew[0]
  const others = crew.filter(m => m !== lead)
  const hasCrew = crew.length > 0

  const money = j.finalAmount ?? j.estimatedValue ?? j.estimatedAmount
  const moneyIsFinal = j.finalAmount != null

  const mapHref = j.serviceLatitude && j.serviceLongitude
    ? `https://www.google.com/maps/search/?api=1&query=${j.serviceLatitude},${j.serviceLongitude}`
    : address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null

  return (
    <aside
      style={{
        width: 312,
        flexShrink: 0,
        borderRight: '1px solid var(--bd)',
        background: 'var(--bg-card-2)',
        overflowY: 'auto',
      }}
    >
      {/* Customer */}
      <div style={section}>
        <div style={rowLabel}>Customer</div>
        <button
          type="button"
          onClick={onOpenCustomer}
          disabled={!onOpenCustomer}
          style={{
            all: 'unset',
            cursor: onOpenCustomer ? 'pointer' : 'default',
            display: 'block',
            fontSize: 14.5,
            fontWeight: 650,
            color: 'var(--t1)',
            lineHeight: 1.3,
          }}
        >
          {j.customerName ?? 'No customer on this job'}
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 7 }}>
          {j.customerPhone && (
            <a href={`tel:${j.customerPhone}`} style={{ fontSize: 12.5, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <Phone size={11} /> {j.customerPhone}
            </a>
          )}
          {j.customerEmail && (
            <a href={`mailto:${j.customerEmail}`} style={{ fontSize: 12.5, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Mail size={11} /> {j.customerEmail}
            </a>
          )}
        </div>
      </div>

      {/* Where */}
      <div style={section}>
        <div style={rowLabel}>Where</div>
        <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.45 }}>
          {address ?? 'No service address'}
        </div>
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, textDecoration: 'none', fontWeight: 600 }}
          >
            <Navigation size={11} /> Open in maps
          </a>
        )}
      </div>

      {/* Crew — the thing the old modal never showed */}
      <div style={section}>
        <div style={{ ...rowLabel, justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={11} /> Crew{hasCrew ? ` (${crew.length})` : ''}
          </span>
          <button
            type="button"
            onClick={onManageCrew}
            style={{ all: 'unset', cursor: 'pointer', color: 'var(--blue)', fontWeight: 700, fontSize: 11 }}
          >
            {hasCrew ? 'Change' : 'Assign'}
          </button>
        </div>

        {crewLoading && !hasCrew ? (
          <div style={{ fontSize: 12.5, color: 'var(--t4)' }}>Loading crew…</div>
        ) : hasCrew ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[lead, ...others].filter(Boolean).map(m => (
              <div key={m!.technician.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={m!.technician.name} avatarUrl={(m!.technician as any).avatarUrl} size={26} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m!.technician.name}</span>
                    {m === lead && (
                      <span title="Lead — drives the job status and is named to the customer" style={{ display: 'inline-flex', color: 'var(--amber)' }}>
                        <Crown size={11} />
                      </span>
                    )}
                  </div>
                  {m!.assignment?.status && (
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {String(m!.assignment.status).replace(/_/g, ' ').toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : j.assignedToName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={j.assignedToName} size={26} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{j.assignedToName}</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onManageCrew}
            style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12.5, color: 'var(--blue)', fontWeight: 600,
            }}
          >
            <Plus size={12} /> Assign a technician
          </button>
        )}

        {j.requiredTechCount > 0 && crew.length < j.requiredTechCount && (
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--amber)', fontWeight: 600 }}>
            Needs {j.requiredTechCount} technicians, {crew.length} assigned
          </div>
        )}
      </div>

      {/* When */}
      <div style={section}>
        <div style={rowLabel}><CalendarClock size={11} /> When</div>
        {when ? (
          <>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--t1)' }}>{when.dayLabel}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: 'var(--t2)', marginTop: 2 }}>
              {when.range}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>Not scheduled yet</div>
        )}
      </div>

      {/* Money */}
      <div style={section}>
        <div style={rowLabel}><Wallet size={11} /> {moneyIsFinal ? 'Final amount' : 'Estimated value'}</div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 19, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
          {money != null ? formatMoney(money, { currency: j.currency }) : '—'}
        </div>
      </div>

      {/* Reference */}
      <div style={{ ...section, borderBottom: 'none' }}>
        <div style={rowLabel}>Reference</div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--t2)' }}>
          {j.jobNumber ?? job.id.slice(0, 8)}
        </div>
        {j.jobTypeName && (
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{j.jobTypeName}</div>
        )}
        {j.createdAt && (
          <div style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 4 }}>
            Raised {new Date(j.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </aside>
  )
}
