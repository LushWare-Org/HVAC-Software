import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Sparkles, User } from 'lucide-react'
import type { DispatchAssignment, Job, ScoredTechnician, Technician } from '../../types/api'

interface DispatchCalendarProps {
  jobs: Job[]
  technicians: Technician[]
  assignmentByJobId: Record<string, DispatchAssignment | undefined>
  onAssign: (jobId: string, technicianId: string) => void
  onSmartAssign: (job: Job) => void
  onPickSuggestion: (technicianId: string) => void
  onDismissSuggestions: () => void
  isAssigning: boolean
  smartAssigningJobId: string | null
  smartSuggestions: ScoredTechnician[] | null
  onOpenJob: (job: Job, assignment?: DispatchAssignment) => void
}

function buildCalendarDays(currentMonth: Date) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days: Date[] = []

  let cursor = rangeStart
  while (cursor <= rangeEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}

// Statuses that mean the job is done or cancelled — should never appear in
// "Needs Assignment" or "Past Unassigned" panels.
const TERMINAL_STATUSES = new Set(['CANCELLED', 'COMPLETED', 'INVOICED', 'PAID'])

function isDispatchable(job: Job) {
  return !TERMINAL_STATUSES.has(job.status)
}

function jobDate(job: Job) {
  return job.scheduledStart ? new Date(job.scheduledStart) : null
}

export default function DispatchCalendar({
  jobs,
  technicians,
  assignmentByJobId,
  onAssign,
  onSmartAssign,
  onPickSuggestion,
  onDismissSuggestions,
  isAssigning,
  smartAssigningJobId,
  smartSuggestions,
  onOpenJob,
}: DispatchCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth])

  const scheduledJobs = useMemo(() => {
    return jobs
      .filter((job) => !!job.scheduledStart && job.status !== 'CANCELLED')
      .sort((left, right) => new Date(left.scheduledStart ?? 0).getTime() - new Date(right.scheduledStart ?? 0).getTime())
  }, [jobs])

  // Only dispatchable (PENDING / SCHEDULED / ON_HOLD) jobs with no assignment.
  const unscheduledJobs = useMemo(() => {
    return jobs
      .filter((job) => isDispatchable(job) && (!job.scheduledStart || !assignmentByJobId[job.id]))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [assignmentByJobId, jobs])

  const nowMs = Date.now()
  const futureUnscheduledJobs = useMemo(() => {
    return unscheduledJobs
      .filter((job) => !job.scheduledStart || new Date(job.scheduledStart).getTime() >= nowMs)
      .slice(0, 8)
  }, [nowMs, unscheduledJobs])

  const pastUnscheduledJobs = useMemo(() => {
    return unscheduledJobs
      .filter((job) => !!job.scheduledStart && new Date(job.scheduledStart).getTime() < nowMs)
      .sort((left, right) => new Date(right.scheduledStart ?? 0).getTime() - new Date(left.scheduledStart ?? 0).getTime())
      .slice(0, 6)
  }, [nowMs, unscheduledJobs])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                <CalendarDays size={16} style={{ color: 'var(--blue)' }} /> Full Calendar
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Assigned work appears with technician labels. Jobs still waiting for assignment stay amber.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="topbar-icon-btn">
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-[160px] text-center text-sm font-semibold" style={{ color: 'var(--t1)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="topbar-icon-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--t4)' }}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px" style={{ background: 'var(--bd)' }}>
            {calendarDays.map((day) => {
              const dayJobs = scheduledJobs.filter((job) => {
                const scheduledAt = jobDate(job)
                return scheduledAt ? isSameDay(scheduledAt, day) : false
              })
              const inMonth = isSameMonth(day, currentMonth)

              return (
                <div key={day.toISOString()} className="min-h-[170px] p-3 align-top" style={{ background: 'var(--bg-card)', opacity: inMonth ? 1 : 0.45 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                      style={isSameDay(day, new Date())
                        ? { background: 'var(--blue)', color: '#fff' }
                        : { color: 'var(--t2)', background: 'var(--bg-card-2)' }}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--t4)' }}>{dayJobs.length} jobs</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayJobs.slice(0, 3).map((job) => {
                      const assignment = assignmentByJobId[job.id]
                      const assigned = !!assignment
                      const tech = assignment ? technicians.find((candidate) => candidate.id === assignment.technicianId) : undefined
                      const accent = assigned ? 'var(--green)' : 'var(--amber)'
                      const accentDim = assigned ? 'var(--green-dim)' : 'var(--amber-dim)'

                      return (
                        <div
                          key={job.id}
                          onClick={() => onOpenJob(job, assignment)}
                          className="rounded-xl border px-2.5 py-2 text-left cursor-pointer transition-colors"
                          style={{ borderColor: accent, background: accentDim }}
                        >
                          <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{job.title}</div>
                          <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: 'var(--t3)' }}>
                            <Clock size={10} />
                            {job.scheduledStart ? format(new Date(job.scheduledStart), 'p') : 'Needs scheduling'}
                          </div>
                          <div className="mt-1 text-[10px] truncate" style={{ color: 'var(--t3)' }}>{job.customerName ?? 'No customer'}</div>
                          <div className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'var(--bg-card)', color: accent }}>
                            {assigned ? `Assigned to ${tech?.name ?? assignment?.technicianName ?? 'Technician'}` : 'Awaiting assignment'}
                          </div>
                        </div>
                      )
                    })}
                    {dayJobs.length > 3 && (
                      <div className="text-[10px] font-semibold" style={{ color: 'var(--t4)' }}>+{dayJobs.length - 3} more scheduled</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Needs Assignment</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Dispatch can assign from here without leaving the calendar view.</p>

            <div className="mt-4 space-y-3">
              {futureUnscheduledJobs.length === 0 && (
                <div className="rounded-xl border border-dashed px-3 py-5 text-center text-xs" style={{ borderColor: 'var(--bd)', color: 'var(--t4)' }}>
                  No upcoming jobs currently need assignment.
                </div>
              )}

              {futureUnscheduledJobs.map((job) => (
                <div key={job.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--bd)', background: 'var(--bg-card-2)' }}>
                  <button onClick={() => onOpenJob(job, assignmentByJobId[job.id])} className="w-full text-left bg-transparent border-0 cursor-pointer p-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--t1)' }}>{job.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <User size={11} /> {job.customerName ?? 'No customer'}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <MapPin size={11} /> {job.serviceAddress ?? job.customerAddress ?? 'No address'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSmartAssign(job)}
                    disabled={isAssigning}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ borderColor: 'var(--blue)', background: 'var(--blue-dim)', color: 'var(--blue)' }}
                  >
                    {smartAssigningJobId === job.id && !smartSuggestions ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {smartAssigningJobId === job.id && !smartSuggestions ? 'Scoring technicians…' : 'Smart Assign'}
                  </button>

                  <select
                    defaultValue=""
                    onChange={(event) => {
                      if (event.target.value) onAssign(job.id, event.target.value)
                      event.target.value = ''
                    }}
                    disabled={isAssigning}
                    className="mt-3 w-full rounded-lg border px-3 py-2 text-xs outline-none"
                    style={{ borderColor: 'var(--bd)', background: 'var(--bg-card)', color: 'var(--t2)' }}
                  >
                    <option value="" disabled>Assign technician…</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>{technician.name}</option>
                    ))}
                  </select>

                  {smartAssigningJobId === job.id && smartSuggestions && smartSuggestions.length > 0 && (
                    <div className="mt-3 rounded-lg border p-3" style={{ borderColor: 'var(--blue)', background: 'var(--bg-card)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>Best Matches</div>
                          <div className="mt-1 text-[11px]" style={{ color: 'var(--t3)' }}>No automatic match cleared the premium threshold. Pick one of the top scored technicians.</div>
                        </div>
                        <button
                          type="button"
                          onClick={onDismissSuggestions}
                          className="rounded-md border px-2 py-1 text-[10px] font-semibold"
                          style={{ borderColor: 'var(--bd)', background: 'var(--bg-card)', color: 'var(--t3)' }}
                        >
                          Dismiss
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {smartSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.technician.id}
                            type="button"
                            onClick={() => onPickSuggestion(suggestion.technician.id)}
                            disabled={isAssigning}
                            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ borderColor: 'var(--bd)', background: 'var(--bg-card-2)' }}
                          >
                            <div>
                              <div className="text-xs font-semibold" style={{ color: 'var(--t1)' }}>{suggestion.technician.name}</div>
                              <div className="mt-1 text-[10px]" style={{ color: 'var(--t3)' }}>
                                {suggestion.distanceKm.toFixed(1)} km away · {suggestion.activeJobs} active job{suggestion.activeJobs === 1 ? '' : 's'}
                              </div>
                            </div>
                            <div className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                              {suggestion.score.toFixed(0)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Past Unassigned Jobs</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>Past jobs are shown here for review and rescheduling instead of active assignment.</p>

            <div className="mt-4 space-y-3">
              {pastUnscheduledJobs.length === 0 && (
                <div className="rounded-xl border border-dashed px-3 py-5 text-center text-xs" style={{ borderColor: 'var(--bd)', color: 'var(--t4)' }}>
                  No overdue unassigned jobs.
                </div>
              )}

              {pastUnscheduledJobs.map((job) => (
                <div key={job.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--red)', background: 'var(--red-dim)' }}>
                  <button onClick={() => onOpenJob(job, assignmentByJobId[job.id])} className="w-full text-left bg-transparent border-0 cursor-pointer p-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--t1)' }}>{job.title}</div>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: 'var(--red)', background: 'var(--bg-card)', color: 'var(--red)' }}>Past</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <User size={11} /> {job.customerName ?? 'No customer'}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <Clock size={11} /> {job.scheduledStart ? format(new Date(job.scheduledStart), 'PP p') : 'No schedule'}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <MapPin size={11} /> {job.serviceAddress ?? job.customerAddress ?? 'No address'}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--t3)' }}>Legend</div>
            <div className="space-y-2 text-xs" style={{ color: 'var(--t2)' }}>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--green)' }} /> Assigned job task</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--amber)' }} /> Unassigned or unscheduled job</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: 'var(--violet)' }} /> Technician location on live map</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
