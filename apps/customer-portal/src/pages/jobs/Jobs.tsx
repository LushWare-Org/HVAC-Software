/**
 * My Jobs — scannable cards, not a spreadsheet (portal redesign).
 *
 * Segmented Active / Upcoming / Past tabs replace the stacked status
 * dropdowns; live jobs get a progress tracker that turns the status enum
 * into something a homeowner instantly reads; past jobs are muted but
 * readable (the old 0.65-opacity rows failed contrast). Data layer is
 * unchanged — same hooks, same detail / booking / cancel modals.
 */
import { useMemo, useState } from 'react'
import {
  Briefcase, CheckCircle, ChevronLeft, ChevronRight, Plus, Search, X,
  Calendar, MapPin, Send, Wrench, XCircle, FileText, DollarSign, Clock,
} from 'lucide-react'
import { useJobTechnicianNames, useMyJobs } from '../../hooks/useCustomerPortal'
import JobDetailModal from './JobDetailModal.tsx'
import BookServiceModal from './BookServiceModal.tsx'
import CancelJobModal from './CancelJobModal.tsx'
import type { Job } from '../../types/api'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  PENDING: { label: 'Pending', css: 'badge-amber' },
  SCHEDULED: { label: 'Scheduled', css: 'badge-violet' },
  EN_ROUTE: { label: 'En Route', css: 'badge-blue' },
  ON_SITE: { label: 'On Site', css: 'badge-blue' },
  IN_PROGRESS: { label: 'In Progress', css: 'badge-blue' },
  COMPLETED: { label: 'Completed', css: 'badge-green' },
  INVOICED: { label: 'Invoiced', css: 'badge-cyan' },
  PAID: { label: 'Paid', css: 'badge-green' },
  CANCELLED: { label: 'Cancelled', css: 'badge-red' },
  ON_HOLD: { label: 'On Hold', css: 'badge-amber' },
}

const PAST_ICON: Record<string, { icon: React.ElementType; color: string; dim: string }> = {
  COMPLETED: { icon: CheckCircle, color: 'var(--green)', dim: 'var(--green-dim)' },
  PAID: { icon: DollarSign, color: 'var(--green)', dim: 'var(--green-dim)' },
  INVOICED: { icon: FileText, color: 'var(--cyan)', dim: 'var(--cyan-dim)' },
  CANCELLED: { icon: XCircle, color: 'var(--red)', dim: 'var(--red-dim)' },
}

const LIVE_STATUSES = ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']
const OPEN_STATUSES = ['PENDING', 'SCHEDULED', 'ON_HOLD']
const TRACKER_STEPS = ['Booked', 'Confirmed', 'En route', 'On site', 'Done']
const REACHED: Record<string, number> = {
  PENDING: 0, ON_HOLD: 0, SCHEDULED: 1, EN_ROUTE: 2, ON_SITE: 3, IN_PROGRESS: 3,
  COMPLETED: 4, INVOICED: 4, PAID: 4,
}

const ITEMS_PER_PAGE = 8
type Tab = 'active' | 'upcoming' | 'past'

const JOBS_CSS = `
.mj-card { transition: transform 0.16s cubic-bezier(0.22,1,0.36,1), box-shadow 0.16s ease; }
.mj-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
`

function fmtDate(iso?: string) {
  if (!iso) return 'Date TBD'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Status enum → progress bar the customer instantly understands. */
function ProgressTracker({ status }: { status: string }) {
  const reached = REACHED[status] ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {TRACKER_STEPS.map((label, i) => {
        const done = i < reached
        const current = i === reached
        return (
          <div key={label} style={{ display: 'contents' }}>
            {i > 0 && (
              <div style={{
                flex: 1, height: 3, marginTop: 12,
                background: i <= reached ? 'var(--blue)' : 'var(--bd)',
                borderRadius: 2, margin: '12px 4px 0',
              }} />
            )}
            <div style={{ textAlign: 'center', width: 54, flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', margin: '0 auto',
                background: done ? 'var(--green)' : current ? 'var(--blue)' : 'var(--bg-card)',
                border: done || current ? 'none' : '2px solid var(--bd)',
                boxShadow: current ? '0 0 0 4px var(--blue-dim)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                {done && <CheckCircle size={13} />}
                {current && <Send size={12} />}
              </div>
              <div style={{
                fontSize: 10, fontWeight: current ? 700 : 600, marginTop: 5,
                color: done ? 'var(--green)' : current ? 'var(--blue)' : 'var(--t4)',
              }}>
                {label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MyJobs() {
  const [tab, setTab] = useState<Tab | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null)

  const { data, isLoading, refetch } = useMyJobs({ page: 1, limit: 200 })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const allJobs = data?.data ?? []
  const technicianNames = useJobTechnicianNames(allJobs)

  const grouped = useMemo(() => {
    const active = allJobs
      .filter(j => LIVE_STATUSES.includes(j.status))
      .sort((a, b) => new Date(a.scheduledStart ?? a.createdAt).getTime() - new Date(b.scheduledStart ?? b.createdAt).getTime())
    const upcoming = allJobs
      .filter(j => OPEN_STATUSES.includes(j.status) && (!j.scheduledStart || new Date(j.scheduledStart) >= startOfToday))
      .sort((a, b) => {
        if (!a.scheduledStart && !b.scheduledStart) return 0
        if (!a.scheduledStart) return 1
        if (!b.scheduledStart) return -1
        return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
      })
    const activeIds = new Set([...active, ...upcoming].map(j => j.id))
    const past = allJobs
      .filter(j => !activeIds.has(j.id))
      .sort((a, b) => new Date(b.scheduledStart ?? b.createdAt).getTime() - new Date(a.scheduledStart ?? a.createdAt).getTime())
    return { active, upcoming, past }
  }, [allJobs])

  // First load: land on the tab that has something to show.
  const effectiveTab: Tab = tab ?? (grouped.active.length ? 'active' : grouped.upcoming.length ? 'upcoming' : 'past')

  const tabJobs = grouped[effectiveTab]

  const filtered = useMemo(() => {
    return tabJobs.filter(job => {
      const who = technicianNames[job.id] ?? job.assignedToName ?? ''
      const text = `${job.title} ${job.jobNumber} ${who} ${job.description ?? ''}`.toLowerCase()
      if (searchQuery && !text.includes(searchQuery.toLowerCase())) return false
      if (dateFilter !== 'all') {
        const jobDate = job.scheduledStart ? new Date(job.scheduledStart) : null
        if (!jobDate) return false
        if (dateFilter === 'today' && !(jobDate >= startOfToday && jobDate < new Date(startOfToday.getTime() + 86400000))) return false
        if (dateFilter === 'week' && jobDate < startOfWeek) return false
        if (dateFilter === 'month' && jobDate < startOfMonth) return false
      }
      return true
    })
  }, [tabJobs, searchQuery, dateFilter, technicianNames])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const switchTab = (t: Tab) => { setTab(t); setPage(1) }
  const openDetail = (job: Job) => { setSelectedJob(job); setShowDetail(true) }
  const openCancel = (job: Job) => { setJobToCancel(job); setShowCancel(true) }

  const hasFilters = !!searchQuery || dateFilter !== 'all'

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: grouped.active.length },
    { key: 'upcoming', label: 'Upcoming', count: grouped.upcoming.length },
    { key: 'past', label: 'Past', count: grouped.past.length },
  ]

  return (
    <div className="anim-fade-up">
      <style>{JOBS_CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--canvas-t1)', letterSpacing: '-0.01em' }}>My Jobs</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--canvas-t2)' }}>
            Every visit — live, scheduled and completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBook(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 18px' }}>
          <Plus size={14} /> New service
        </button>
      </div>

      {/* Segmented tabs + search + date filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{
          display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--bd)',
          borderRadius: 10, padding: 3, gap: 2,
        }}>
          {tabs.map(t => {
            const active = effectiveTab === t.key
            return (
              <button key={t.key} onClick={() => switchTab(t.key)} style={{
                fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                color: active ? '#fff' : 'var(--t3)',
                background: active ? 'var(--blue)' : 'transparent',
                border: 'none', padding: '7px 14px', borderRadius: 8,
              }}>
                {t.label} · {isLoading ? '…' : t.count}
              </button>
            )
          })}
        </div>

        <div className="filter-search" style={{ flex: 1, minWidth: 180 }}>
          <Search size={13} color="var(--t4)" />
          <input
            placeholder="Search jobs, services, technicians…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
          />
        </div>
        <select className="select" style={{ width: 140 }} value={dateFilter}
          onChange={e => { setDateFilter(e.target.value); setPage(1) }}>
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        {hasFilters && (
          <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            onClick={() => { setSearchQuery(''); setDateFilter('all'); setPage(1) }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 92, borderRadius: 14, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--blue-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Briefcase size={22} style={{ color: 'var(--blue)' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', marginBottom: 4 }}>
            {hasFilters ? 'No jobs match your filters' : `No ${effectiveTab} jobs`}
          </div>
          {hasFilters ? (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}
              onClick={() => { setSearchQuery(''); setDateFilter('all') }}>
              Clear filters
            </button>
          ) : effectiveTab !== 'past' ? (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              onClick={() => setShowBook(true)}>
              <Plus size={13} /> Book a service
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginated.map(job => {
            const s = STATUS_MAP[job.status] ?? { label: job.status, css: 'badge-neutral' }
            const who = technicianNames[job.id] ?? job.assignedToName
            const isLive = LIVE_STATUSES.includes(job.status)
            const isOpen = OPEN_STATUSES.includes(job.status)
            const startT = fmtTime(job.scheduledStart)

            if (isLive) {
              // Active job — progress tracker card
              return (
                <div key={job.id} className="mj-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 14,
                  padding: '16px 18px', cursor: 'pointer',
                }} onClick={() => openDetail(job)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
                      <span className={`badge ${s.css}`}>{s.label}</span>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--t1)' }}>{job.title}</span>
                      {who && <span style={{ fontSize: 12, color: 'var(--t3)' }}>· {who}</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', whiteSpace: 'nowrap' }}>Details ›</span>
                  </div>
                  <ProgressTracker status={job.status} />
                </div>
              )
            }

            if (isOpen) {
              // Upcoming — date badge card
              const d = job.scheduledStart ? new Date(job.scheduledStart) : null
              return (
                <div key={job.id} className="mj-card" style={{
                  background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 14,
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer', flexWrap: 'wrap',
                }} onClick={() => openDetail(job)}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, background: 'var(--violet-dim)', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--violet)',
                  }}>
                    {d ? (
                      <>
                        <span style={{ fontSize: 9, fontWeight: 500 }}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
                      </>
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {fmtDate(job.scheduledStart)}{startT ? ` · ${startT}` : ''}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Wrench size={11} /> {who ?? 'Technician TBD'}
                      </span>
                      {job.serviceAddress && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {job.serviceAddress}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${s.css}`} style={{ flexShrink: 0 }}>{s.label}</span>
                  {['PENDING', 'SCHEDULED'].includes(job.status) && (
                    <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); openCancel(job) }}>
                      Cancel
                    </button>
                  )}
                </div>
              )
            }

            // Past — muted but readable (no opacity hacks)
            const p = PAST_ICON[job.status] ?? { icon: Wrench, color: 'var(--t3)', dim: 'var(--bg-card-2)' }
            const PIcon = p.icon
            return (
              <div key={job.id} className="mj-card" style={{
                background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 14,
                padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', flexWrap: 'wrap',
              }} onClick={() => openDetail(job)}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11, background: p.dim, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PIcon size={17} style={{ color: p.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)' }}>{job.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 2 }}>
                    {fmtDate(job.scheduledStart ?? job.createdAt)}{who ? ` · ${who}` : ''}
                  </div>
                </div>
                <span className={`badge ${s.css}`} style={{ flexShrink: 0 }}>{s.label}</span>
                <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); openDetail(job) }}>
                  View details
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filtered.length > ITEMS_PER_PAGE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--t4)' }}>
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
              <ChevronLeft size={15} />
            </button>
            <span className="pagination-label">Page {safePage} of {totalPages}</span>
            <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {showDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => { setShowDetail(false); setSelectedJob(null) }}
          onCancel={() => {
            setShowDetail(false)
            setJobToCancel(selectedJob)
            setShowCancel(true)
          }}
        />
      )}
      {showBook && <BookServiceModal onClose={() => { setShowBook(false); refetch() }} />}
      {showCancel && jobToCancel && (
        <CancelJobModal
          job={jobToCancel}
          onClose={() => { setShowCancel(false); setJobToCancel(null); refetch() }}
        />
      )}
    </div>
  )
}
