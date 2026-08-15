/**
 * Dashboard — "Live Visit" layout (portal redesign).
 *
 * The #1 customer question — "when is someone coming?" — leads the page:
 * a hero card for the active/next visit with status, technician and actions.
 * Below it: one consolidated "needs attention" strip, clickable stat tiles
 * that deep-link to their pages, a human-readable activity list (no job-ID
 * spreadsheet), and a side column with Book CTA, offer, tip and equipment.
 * Every surface reads from CSS tokens so light / dark / black all work.
 */
import { useState } from 'react'
import { Suspense, lazy } from 'react'
import AnnouncementBanner from '../components/AnnouncementBanner'
import {
  CheckCircle, Clock, DollarSign, FileText, ChevronRight, Calendar,
  AlertCircle, ArrowRight, Star, Lightbulb, Video, Plus, MapPin,
  MessageSquare, Send, Wrench, Tag, Settings, Home,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCustomerDashboard, useJobTechnicians, useCompanyReviewStats } from '../hooks/useCustomerPortal'
import { useMyEquipment } from '../hooks/useMyEquipment'
import { useMyComponents, useMyIssueReports } from '../hooks/useMyComponent'
import ReviewModal from '../components/ReviewModal'
import { useLatestTip, usePosts } from '../hooks/usePosts'
import type { Job } from '../types/api'
import { formatMoney } from '../lib/format'

import RescheduleBanner from '../components/reschedule/RescheduleBanner'
import TechAvatar from '../components/TechAvatar'

const BookServiceModal = lazy(() => import('./jobs/BookServiceModal'))

const JOB_STATUS: Record<string, { label: string; css: string }> = {
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

const ACTIVITY_ICON: Record<string, { icon: React.ElementType; color: string; dim: string }> = {
  COMPLETED: { icon: CheckCircle, color: 'var(--green)', dim: 'var(--green-dim)' },
  PAID: { icon: DollarSign, color: 'var(--green)', dim: 'var(--green-dim)' },
  INVOICED: { icon: FileText, color: 'var(--cyan)', dim: 'var(--cyan-dim)' },
  SCHEDULED: { icon: Calendar, color: 'var(--violet)', dim: 'var(--violet-dim)' },
  PENDING: { icon: Clock, color: 'var(--amber)', dim: 'var(--amber-dim)' },
  EN_ROUTE: { icon: Send, color: 'var(--blue)', dim: 'var(--blue-dim)' },
  ON_SITE: { icon: Wrench, color: 'var(--blue)', dim: 'var(--blue-dim)' },
}

const PULSE_CSS = `
@keyframes hp-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--blue) 50%, transparent); }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.dash-tile { transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease; }
.dash-tile:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
.dash-row { transition: background 0.12s ease; }
.dash-row:hover { background: var(--bg-card-2); }
@media (max-width: 900px) {
  .dash-two-col { grid-template-columns: 1fr !important; }
  .dash-hero { flex-direction: column; }
  .dash-hero-side { width: 100% !important; border-left: none !important; border-top: 1px solid var(--bd); }
}
`

function fmtMoney(value: number) {
  return formatMoney(value, { decimals: 0 })
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Hero card — the active (en-route / on-site) job, else the next appointment. */
function NextVisitHero({ job, techName, techAvatarUrl, onBook }: {
  job: Job | null; techName?: string; techAvatarUrl?: string | null; onBook: () => void
}) {
  const navigate = useNavigate()

  if (!job) {
    return (
      <div className="anim-fade-up" style={{
        borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)',
        padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--blue-dim)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Calendar size={24} style={{ color: 'var(--blue)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>No visits scheduled</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>
            Book a service and we'll confirm a time window with you.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onBook}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', fontWeight: 700 }}>
          <Plus size={15} /> Book a service
        </button>
      </div>
    )
  }

  const live = ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(job.status)
  const badge = job.status === 'EN_ROUTE'
    ? { text: 'TECHNICIAN EN ROUTE', pulse: true }
    : job.status === 'ON_SITE'
      ? { text: 'TECHNICIAN ON SITE', pulse: true }
      : { text: 'YOUR NEXT VISIT', pulse: false }

  const startT = fmtTime(job.scheduledStart)
  const endT = fmtTime(job.scheduledEnd)

  return (
    <div className="dash-hero anim-fade-up" style={{
      borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)',
      overflow: 'hidden', display: 'flex',
    }}>
      {/* Left: details */}
      <div style={{ flex: 1, padding: '20px 22px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--blue-dim)', color: 'var(--blue)',
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em',
            padding: '4px 10px', borderRadius: 99,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)',
              animation: badge.pulse ? 'hp-pulse 1.6s infinite' : undefined,
            }} />
            {badge.text}
          </span>
          {live && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t4)' }}>Live</span>}
        </div>

        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', marginTop: 12, letterSpacing: '-0.01em' }}>
          {job.title}
        </div>

        <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 500, color: 'var(--t2)' }}>
            <Calendar size={14} style={{ color: 'var(--t3)' }} />
            {fmtDate(job.scheduledStart)}{startT ? ` · ${startT}${endT ? `–${endT}` : ''}` : ''}
          </span>
          {job.serviceAddress && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 500, color: 'var(--t2)' }}>
              <MapPin size={14} style={{ color: 'var(--t3)' }} /> {job.serviceAddress}
            </span>
          )}
        </div>

        {/* Technician chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: 12,
          background: 'var(--bg-card-2)', border: '1px solid var(--bd)', borderRadius: 12,
        }}>
          <TechAvatar name={techName} avatarUrl={techAvatarUrl} size={44} fontSize={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>
              {techName || 'Technician to be assigned'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>
              {techName ? 'Your technician for this visit' : "We'll confirm who's coming soon"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/jobs')}
            style={{ flex: 1, minWidth: 120, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 700 }}>
            <Send size={14} /> {live ? 'Track visit' : 'View details'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/messages')}
            style={{ flex: 1, minWidth: 120, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <MessageSquare size={14} /> Message
          </button>
        </div>
      </div>

      {/* Right: arrival focal block */}
      <div className="dash-hero-side" style={{
        width: 210, flexShrink: 0, borderLeft: '1px solid var(--bd)',
        background: 'var(--bg-card-2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '22px 16px', textAlign: 'center', gap: 2,
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {live ? 'Status' : 'Arrives'}
        </div>
        {live ? (
          <>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              {job.status === 'EN_ROUTE' ? 'On the way' : 'On site'}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green)', marginTop: 4 }}>
              {job.status === 'EN_ROUTE' ? "We'll be there soon" : 'Work in progress'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--blue)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {job.scheduledStart
                ? new Date(job.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'TBD'}
            </div>
            {startT && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', marginTop: 4 }}>
                {startT}{endT ? ` – ${endT}` : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [companyReviewOpen, setCompanyReviewOpen] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const { data, isLoading } = useCustomerDashboard()
  const { data: reviewStats } = useCompanyReviewStats()
  const { data: latestTip } = useLatestTip()
  const { data: offers = [] } = usePosts('OFFER')
  const { data: equipment = [] } = useMyEquipment()
  const { data: myComponents = [] } = useMyComponents()
  const { data: myIssues = [] } = useMyIssueReports()
  const myComponent = myComponents[0]
  const myComponentOpenIssues = myComponent ? myIssues.filter(i => i.componentId === myComponent.id && i.status !== 'RESOLVED').length : 0

  const recentJobs = data?.recentJobs ?? []
  const pendingInvoices = data?.pendingInvoiceItems ?? []
  const technicians = useJobTechnicians(recentJobs)

  // Hero: an active (en-route / on-site) job wins; otherwise the next appointment.
  const activeJob = recentJobs.find(j => ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(j.status)) ?? null
  const heroJob = activeJob ?? data?.nextAppointment ?? null

  const balanceDue = pendingInvoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0)
  const latestOffer = offers[0]
  const activityJobs = recentJobs.slice(0, 6)

  const tiles = [
    {
      label: 'Completed', value: String(data?.completedJobs ?? 0), sub: 'View history ›',
      icon: CheckCircle, accent: 'var(--green)', to: '/jobs',
    },
    {
      label: 'Upcoming', value: String(data?.upcomingJobs ?? 0), sub: 'See schedule ›',
      icon: Clock, accent: 'var(--blue)', to: '/jobs',
    },
    {
      label: 'Pending invoices', value: String(data?.pendingInvoices ?? 0),
      sub: balanceDue > 0 ? `Pay ${fmtMoney(balanceDue)} ›` : 'All settled',
      subColor: balanceDue > 0 ? 'var(--amber)' : undefined,
      icon: FileText, accent: 'var(--amber)', to: '/invoices',
    },
    {
      label: 'Total spent', value: fmtMoney(data?.totalSpent ?? 0), sub: 'Billing history ›',
      icon: DollarSign, accent: 'var(--violet)', to: '/invoices',
    },
  ]

  return (
    <div className="anim-fade-up">
      <style>{PULSE_CSS}</style>

      <AnnouncementBanner />

      {/* Above the invoice strip on purpose: an unanswered reschedule becomes a
          missed appointment, which costs more than a late payment. Renders
          nothing unless the ball is with the customer. */}
      {(data?.allJobs?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 16 }}>
          <RescheduleBanner jobs={data!.allJobs} />
        </div>
      )}

      {/* One consolidated "needs attention" strip — pay first, review later */}
      {pendingInvoices.length > 0 ? (
        <div style={{
          marginBottom: 16, borderRadius: 14, border: '1px solid var(--bd)',
          background: 'var(--bg-card)', boxShadow: 'inset 4px 0 0 var(--amber)',
          padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: 'var(--amber-dim)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={19} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>
              {pendingInvoices.length === 1 ? '1 thing needs' : `${pendingInvoices.length} things need`} your attention
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
              {pendingInvoices.length === 1 ? (
                <>Invoice <b style={{ color: 'var(--t1)' }}>{pendingInvoices[0].invoiceNumber}</b> · balance{' '}</>
              ) : (
                <>Open invoices · balance{' '}</>
              )}
              <b style={{ color: 'var(--amber)' }}>{fmtMoney(balanceDue)}</b>
            </div>
          </div>
          <Link to="/invoices" className="btn btn-sm" style={{
            background: 'var(--amber)', color: '#fff', border: 'none', fontWeight: 700,
            borderRadius: 9, padding: '9px 18px', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            Pay now <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <div
          className="card-hover"
          style={{
            marginBottom: 16, borderRadius: 14, border: '1px solid var(--bd)',
            background: 'var(--bg-card)', boxShadow: 'inset 4px 0 0 var(--amber)',
            padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14,
            flexWrap: 'wrap', cursor: 'pointer',
          }}
          onClick={() => setCompanyReviewOpen(true)}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: 'var(--amber-dim)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={18} fill="var(--amber)" color="var(--amber)" />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>How are we doing?</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
              {reviewStats?.companyReviews.totalRatings
                ? `${reviewStats.companyReviews.avgRating.toFixed(1)}★ from ${reviewStats.companyReviews.totalRatings} customers — add yours`
                : 'Share your feedback about our service.'}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setCompanyReviewOpen(true) }}
            style={{
              padding: '9px 18px', borderRadius: 9, border: 'none',
              background: 'var(--amber)', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            <Star size={13} fill="#fff" color="#fff" /> Rate our service
          </button>
        </div>
      )}

      <ReviewModal open={companyReviewOpen} onClose={() => setCompanyReviewOpen(false)} type="COMPANY" />

      {/* HERO — your next / live visit */}
      <div style={{ marginBottom: 16 }}>
        {isLoading ? (
          <div style={{ height: 180, borderRadius: 16, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }} />
        ) : (
          <NextVisitHero
            job={heroJob}
            techName={heroJob ? (technicians[heroJob.id]?.name ?? heroJob.assignedToName ?? undefined) : undefined}
            techAvatarUrl={heroJob ? technicians[heroJob.id]?.avatarUrl : undefined}
            onBook={() => setShowBook(true)}
          />
        )}
      </div>

      {/* Clickable stat tiles */}
      <div className="kpi-grid mb-5">
        {tiles.map(t => {
          const Icon = t.icon
          return (
            <Link key={t.label} to={t.to} className="dash-tile" style={{
              textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--bd)',
              borderRadius: 12, padding: '14px 15px', position: 'relative', overflow: 'hidden', display: 'block',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.accent }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--t3)' }}>{t.label}</span>
                <Icon size={15} style={{ color: t.accent }} strokeWidth={1.9} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginTop: 6 }}>
                {isLoading ? '…' : t.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: t.subColor ?? 'var(--t4)', marginTop: 1 }}>{t.sub}</div>
            </Link>
          )
        })}
      </div>

      {/* Two-column: activity + side rail */}
      <div className="dash-two-col" style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>
        {/* Recent activity — friendly rows, not a spreadsheet */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 14,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'start',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Recent activity</div>
            <Link to="/jobs" style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>
              View all ›
            </Link>
          </div>
          {isLoading ? (
            <div style={{ padding: '24px 18px', color: 'var(--t4)', fontSize: 13, textAlign: 'center' }}>Loading…</div>
          ) : activityJobs.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <Wrench size={22} style={{ color: 'var(--t4)', opacity: 0.5, marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>No service history yet</div>
            </div>
          ) : (
            activityJobs.map(job => {
              const s = JOB_STATUS[job.status] || { label: job.status, css: 'badge-neutral' }
              const a = ACTIVITY_ICON[job.status] ?? { icon: Wrench, color: 'var(--t3)', dim: 'var(--bg-card-2)' }
              const AIcon = a.icon
              const who = technicians[job.id]?.name ?? job.assignedToName
              return (
                <Link key={job.id} to="/jobs" className="dash-row" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                  borderTop: '1px solid var(--bd)', textDecoration: 'none', cursor: 'pointer',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: a.dim, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AIcon size={16} style={{ color: a.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 1 }}>
                      {who ? `${who} · ` : ''}{fmtDate(job.scheduledStart ?? job.createdAt)}
                    </div>
                  </div>
                  <span className={`badge ${s.css}`} style={{ flexShrink: 0 }}>{s.label}</span>
                  <ChevronRight size={15} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                </Link>
              )
            })
          )}
        </div>

        {/* Side rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Book CTA */}
          <button onClick={() => setShowBook(true)} style={{
            background: 'linear-gradient(135deg, var(--blue), #1D4ED8)', color: '#fff',
            border: 'none', borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.18)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={20} strokeWidth={2.1} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Book a service</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                3 quick steps · pick a time window
              </div>
            </div>
          </button>

          {/* My Property — easy access when this customer owns a project component */}
          {myComponent && (
            <Link to="/my-property" style={{
              textDecoration: 'none', background: 'var(--bg-card)',
              border: `1px solid ${myComponentOpenIssues > 0 ? 'var(--red)' : 'var(--bd)'}`,
              borderRadius: 14, overflow: 'hidden', display: 'block',
            }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${myComponentOpenIssues > 0 ? 'var(--red)' : 'var(--cyan)'}, transparent)` }} />
              <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Home size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {myComponent.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: myComponentOpenIssues > 0 ? 'var(--red)' : 'var(--t3)', marginTop: 1, fontWeight: myComponentOpenIssues > 0 ? 700 : 500 }}>
                    {myComponentOpenIssues > 0
                      ? `${myComponentOpenIssues} report${myComponentOpenIssues === 1 ? '' : 's'} in progress`
                      : 'Equipment, service history & reports'}
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--t4)', flexShrink: 0 }} />
              </div>
            </Link>
          )}

          {/* Latest offer */}
          {latestOffer && (
            <Link to="/offers" style={{
              textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--bd)',
              borderRadius: 14, overflow: 'hidden', display: 'block',
            }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, var(--green), transparent)' }} />
              <div style={{ padding: '13px 16px' }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Tag size={9} /> OFFER FROM YOUR TEAM
                </div>
                <div style={{
                  fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', marginTop: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {latestOffer.title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Redeem <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          )}

          {/* Latest tip / video */}
          {latestTip && (() => {
            const isVideo = latestTip.type === 'VIDEO'
            const accent = isVideo ? 'var(--blue)' : 'var(--amber)'
            const accentDim = isVideo ? 'var(--blue-dim)' : 'var(--amber-dim)'
            return (
              <Link to="/tips" style={{
                textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--bd)',
                borderRadius: 14, overflow: 'hidden', display: 'block',
              }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: accentDim, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isVideo ? <Video size={15} style={{ color: accent }} /> : <Lightbulb size={15} style={{ color: accent }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
                      {isVideo ? 'New video' : 'Tip from your team'}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {latestTip.title}
                    </div>
                  </div>
                  <ArrowRight size={13} style={{ color: accent, flexShrink: 0 }} />
                </div>
              </Link>
            )
          })()}

          {/* Equipment quick view */}
          {equipment.length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 14,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>Your equipment</div>
                <Link to="/equipment" style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>
                  All ›
                </Link>
              </div>
              {equipment.slice(0, 2).map(eq => (
                <Link key={eq.id} to="/equipment" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 9, marginTop: 6,
                  background: 'var(--bg-card-2)', borderRadius: 10, textDecoration: 'none',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, background: 'var(--cyan-dim)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Settings size={15} style={{ color: 'var(--cyan)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--t1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {[eq.brand, eq.model].filter(Boolean).join(' ') || eq.type}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1 }}>
                      {eq.type}{eq.installDate ? ` · installed ${new Date(eq.installDate).getFullYear()}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBook && (
        <Suspense fallback={null}>
          <BookServiceModal onClose={() => setShowBook(false)} />
        </Suspense>
      )}
    </div>
  )
}
