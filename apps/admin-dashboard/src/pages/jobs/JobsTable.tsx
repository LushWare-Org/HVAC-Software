/**
 * The jobs table: one card per job. The row shows what you scan for (customer, service,
 * project or house, technician with photo, when, priority, status, amount) and keeps
 * its actions visible. Hovering (or focusing, or pressing the chevron) grows the row to
 * show the rest: address, job number, phone, when it was created and the description.
 */
import { useState } from 'react'
import { ChevronRight, MapPin, Navigation, Phone, Trash2, Wrench } from 'lucide-react'
import Avatar from '../../components/Avatar'
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import ProjectComponentTag from '../projects/ProjectComponentTag'
import { formatArrivalWindow, formatMoney, jobAmount } from '../../lib/format'
import type { Job } from '../../types/api'
import { PriorityLabel, StatusLabel } from './jobLabels'
import './jobsTable.css'

export const OPEN_STATUS_SET = new Set(['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'ON_HOLD'])

/** Whole days a still-open job has been past its day (0 = not missed). */
export function missedDays(j: Pick<Job, 'status' | 'scheduledStart'>): number {
  if (!OPEN_STATUS_SET.has(j.status) || !j.scheduledStart) return 0
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const day = new Date(j.scheduledStart); day.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((start.getTime() - day.getTime()) / 86_400_000))
}

/** The customer confirmed the time the visit has now (a moved visit is unconfirmed again). */
export const isVisitConfirmed = (j: Pick<Job, 'scheduledStart' | 'confirmedFor'>) =>
  !!j.scheduledStart && !!j.confirmedFor && new Date(j.scheduledStart).getTime() === new Date(j.confirmedFor).getTime()

const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function Project({ job }: { job: Job }) {
  if (!job.projectId) return <span className="jt-t2">None</span>
  return <ProjectComponentTag projectId={job.projectId} componentId={job.componentId} />
}

export default function JobsTable({ jobs, loading, onView, onDelete, avatarByUserId, empty }: {
  jobs: Job[]
  loading: boolean
  onView: (j: Job) => void
  onDelete: (j: Job) => void
  avatarByUserId: Record<string, string | undefined>
  empty: { title: string; sub?: string }
}) {
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  // "Shut": folded with the arrow while the pointer is still over the row. It stays folded until the pointer leaves.
  const [shut, setShut] = useState<Set<string>>(new Set())
  const flip = (set: Set<string>, id: string, on: boolean) => { const n = new Set(set); if (on) n.add(id); else n.delete(id); return n }
  const pin = (id: string) => {
    const wasOpen = pinned.has(id)
    setPinned(p => flip(p, id, !wasOpen))
    setShut(s => flip(s, id, wasOpen))
  }

  return (
    <div className="jt" role="table" aria-label="Jobs">
      <div className="jt-grid jt-head" role="row">
        <span />
        <span className="jt-th" role="columnheader">Customer</span>
        <span className="jt-th" role="columnheader">Service</span>
        <span className="jt-th jt-proj" role="columnheader">Project or house</span>
        <span className="jt-th" role="columnheader">Technician</span>
        <span className="jt-th" role="columnheader">Scheduled</span>
        <span className="jt-th" role="columnheader">Priority</span>
        <span className="jt-th" role="columnheader">Status</span>
        <span className="jt-th is-right jt-amount-col" role="columnheader">Amount</span>
        <span className="jt-th is-right" role="columnheader">Actions</span>
      </div>

      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="jt-row" aria-hidden="true"><div className="jt-main jt-grid"><span /><span style={{ gridColumn: '2 / -1', height: 14, borderRadius: 6, background: 'var(--bg-hover)' }} /></div></div>
      ))}

      {!loading && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)' }}>
          <Wrench size={26} style={{ opacity: 0.35, display: 'block', margin: '0 auto 10px' }} aria-hidden="true" />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>{empty.title}</div>
          {empty.sub && <div style={{ fontSize: 13, marginTop: 4 }}>{empty.sub}</div>}
        </div>
      )}

      {!loading && jobs.map(j => {
        const isPinned = pinned.has(j.id)
        const urgent = j.priority === 'EMERGENCY' || j.priority === 'URGENT'
        const amount = jobAmount(j) ?? 0
        const late = missedDays(j)
        const address = j.serviceAddress ?? j.customerAddress
        const techPhoto = j.assignedToId ? avatarByUserId[j.assignedToId] : undefined
        return (
          <div key={j.id} role="row" className={`jt-row${isPinned ? ' is-pinned' : ''}${shut.has(j.id) ? ' is-shut' : ''}${urgent ? ' is-urgent' : ''}`}
            onClick={() => onView(j)}
            onMouseLeave={() => { if (shut.has(j.id)) setShut(s => flip(s, j.id, false)) }}>
            <div className="jt-main jt-grid">
              <button type="button" className="jt-chev" aria-label={isPinned ? 'Hide details' : 'Keep details open'} aria-expanded={isPinned}
                onClick={e => { e.stopPropagation(); pin(j.id) }}>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
              <div className="jt-c" role="cell"><div className="jt-t1" title={j.customerName ?? undefined}>{j.customerName ?? 'No customer'}</div></div>
              <div className="jt-c" role="cell">
                <div className="jt-t1 is-soft jt-svc" title={j.title}>{j.title}{j.hasPartShortage && <span className="jt-parts">Parts short</span>}</div>
                <div className="jt-proj-inline jt-t2"><Project job={j} /></div>
              </div>
              <div className="jt-c jt-proj" role="cell"><Project job={j} /></div>
              <div className="jt-c jt-tech" role="cell">
                {j.assignedToName
                  ? <><Avatar name={j.assignedToName} avatarUrl={techPhoto} size={30} radius={15} fontSize={11} /><span className="jt-t1 is-soft" title={j.assignedToName}>{j.assignedToName}</span></>
                  : <><span className="jt-tech-none" aria-hidden="true" /><span className="jt-t2">Unassigned</span></>}
              </div>
              <div className="jt-c" role="cell">
                {j.scheduledStart ? (
                  <>
                    <div className="jt-t1 is-soft">{dateOf(j.scheduledStart)}</div>
                    {j.timeMode === 'WINDOW' && j.windowStart && j.windowEnd
                      ? <div className="jt-t2" title="The customer asked for an arrival window. Set an exact time when you schedule it.">{formatArrivalWindow(j.windowStart, j.windowEnd)}</div>
                      : <div className="jt-t2">{timeOf(j.scheduledStart)}</div>}
                    {j.status === 'SCHEDULED' && j.assignedToId && late === 0 && (
                      isVisitConfirmed(j)
                        ? <span className="jt-conf is-yes" title={`Confirmed by the customer${j.confirmedAt ? ` on ${new Date(j.confirmedAt).toLocaleDateString()}` : ''}`}>Confirmed</span>
                        : <span className="jt-conf" title="The customer has not confirmed this time yet. Kelvin can send a reminder.">Not confirmed</span>
                    )}
                    {late > 0 && <span className="jt-missed">Missed {late === 1 ? 'yesterday' : `${late} days ago`}</span>}
                  </>
                ) : <span className="jt-t2">Not scheduled</span>}
              </div>
              <div role="cell"><PriorityLabel priority={j.priority} /></div>
              <div role="cell"><StatusLabel status={j.status} /></div>
              <div className="jt-t1 jt-amount jt-amount-col" role="cell">{formatMoney(amount, { decimals: 0 })}</div>
              <div className="jt-actions" role="cell">
                <button type="button" className="jt-act jt-icon" aria-label={`Delete ${j.title}`} title="Delete job" onClick={e => { e.stopPropagation(); onDelete(j) }}><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            </div>

            <div className="jt-more">
              <div className="jt-more-in">
                <div className="jt-detail">
                  <div className="jt-fulltitle">{j.title}</div>
                  <div className="jt-facts">
                    <span className="jt-fact">
                      <MapPin size={13} aria-hidden="true" />
                      {address ? address : <span className="k">No address yet</span>}
                      {address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" aria-label="Directions" title="Directions" onClick={e => e.stopPropagation()}><Navigation size={13} aria-hidden="true" /></a>}
                    </span>
                    {j.windowStart && j.windowEnd && <span className="jt-fact"><span className="k">{j.timeMode === 'WINDOW' ? 'Customer asked for' : 'Customer asked for (now set to an exact time)'}</span> {dateOf(j.windowStart)}, {formatArrivalWindow(j.windowStart, j.windowEnd)}</span>}
                    <span className="jt-fact"><span className="k">Job</span> {j.jobNumber ?? j.id.slice(0, 8)}</span>
                    {j.customerPhone && <span className="jt-fact"><Phone size={13} aria-hidden="true" /><a href={`tel:${j.customerPhone}`} onClick={e => e.stopPropagation()}>{j.customerPhone}</a></span>}
                    <span className="jt-fact"><span className="k">Created</span> {new Date(j.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    {j.rescheduleState && <RescheduleBadge state={j.rescheduleState} size="sm" />}
                  </div>
                  <div className="jt-desc-row">
                    <div className={`jt-desc${j.description ? '' : ' is-empty'}`}>{j.description || 'No description'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
