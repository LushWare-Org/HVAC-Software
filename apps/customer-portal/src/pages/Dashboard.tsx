import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Eye,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCustomerDashboard, useJobTechnicianNames, useCompanyReviewStats } from '../hooks/useCustomerPortal'
import ReviewModal from '../components/ReviewModal'

const JOB_STATUS: Record<string, { label: string; css: string }> = {
  PENDING: { label: 'Pending', css: 'badge-amber' },
  SCHEDULED: { label: 'Scheduled', css: 'badge-violet' },
  EN_ROUTE: { label: 'En Route', css: 'badge-blue' },
  ON_SITE: { label: 'On Site', css: 'badge-blue' },
  COMPLETED: { label: 'Completed', css: 'badge-green' },
  INVOICED: { label: 'Invoiced', css: 'badge-cyan' },
  PAID: { label: 'Paid', css: 'badge-green' },
  CANCELLED: { label: 'Cancelled', css: 'badge-red' },
  ON_HOLD: { label: 'On Hold', css: 'badge-amber' },
}

const ITEMS_PER_PAGE = 10

function fmtMoney(value: number) {
  return `$${value.toLocaleString()}`
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const [page, setPage] = useState(1)
  const [companyReviewOpen, setCompanyReviewOpen] = useState(false)
  const { data, isLoading } = useCustomerDashboard()
  const { data: reviewStats } = useCompanyReviewStats()

  const recentJobs = data?.recentJobs ?? []
  const pendingInvoices = data?.pendingInvoiceItems ?? []
  const technicianNames = useJobTechnicianNames(recentJobs)
  const totalPages = Math.max(1, Math.ceil(recentJobs.length / ITEMS_PER_PAGE))
  const paginatedJobs = recentJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const nextAppointment = data?.nextAppointment
  const statCards = [
    {
      title: 'Jobs Completed',
      value: String(data?.completedJobs ?? 0),
      icon: CheckCircle,
    },
    {
      title: 'Upcoming',
      value: String(data?.upcomingJobs ?? 0),
      icon: Calendar,
    },
    {
      title: 'Pending Invoices',
      value: String(data?.pendingInvoices ?? 0),
      icon: FileText,
    },
    {
      title: 'Total Spent',
      value: fmtMoney(data?.totalSpent ?? 0),
      icon: DollarSign,
    },
  ]

  return (
    <div className="anim-fade-up">
      {/* Rate the company banner — enjoyable nudge for overall feedback */}
      <div
        className="card card-hover anim-fade-up"
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          border: '1px solid #FCD34D',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', gap: 16, flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#fff', display: 'grid', placeItems: 'center',
            boxShadow: '0 2px 6px rgba(245,158,11,0.25)',
          }}>
            <Star size={22} fill="#F59E0B" color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#78350F' }}>
              How are we doing?
            </div>
            <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2 }}>
              {reviewStats?.companyReviews.totalRatings
                ? `${reviewStats.companyReviews.avgRating.toFixed(1)}★ from ${reviewStats.companyReviews.totalRatings} customers — add yours`
                : 'Share feedback about our service overall.'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setCompanyReviewOpen(true)}
          style={{
            padding: '9px 18px', borderRadius: 9, border: 'none',
            background: '#F59E0B', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Star size={13} fill="#fff" color="#fff" />
          Rate our service
        </button>
      </div>

      <ReviewModal
        open={companyReviewOpen}
        onClose={() => setCompanyReviewOpen(false)}
        type="COMPANY"
      />

      <div className="kpi-grid mb-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`kpi-card card-hover anim-fade-up delay-${index + 1}`}>
              <div className="kpi-card-top">
                <div className="kpi-label">{stat.title}</div>
                <Icon size={16} strokeWidth={1.5} color="var(--t3)" />
              </div>
              <div className="kpi-value">{isLoading ? '…' : stat.value}</div>
            </div>
          )
        })}
      </div>

      <div className="dashboard-main-grid">
        <div className="card card-hover anim-fade-up delay-2">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Jobs</div>
            </div>
            <Link className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue)' }} to="/jobs">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div className="card-body-flush" style={{ marginTop: 12 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--t3)' }}>Loading jobs…</td>
                    </tr>
                  ) : paginatedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: 'var(--t3)' }}>No jobs found</td>
                    </tr>
                  ) : (
                    paginatedJobs.map(job => {
                      const s = JOB_STATUS[job.status] || { label: job.status, css: 'badge-neutral' }
                      return (
                        <tr key={job.id}>
                          <td className="td-primary" style={{ fontSize: 12 }}>{job.jobNumber}</td>
                          <td className="td-primary">{job.title}</td>
                          <td style={{ fontSize: 12, color: 'var(--t3)' }}>{fmtDate(job.scheduledStart ?? job.createdAt)}</td>
                          <td>{technicianNames[job.id] || 'Unassigned'}</td>
                          <td>
                            <span className={`badge ${s.css}`}>{s.label}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link to="/jobs" className="action-btn" title="View Details">
                              <Eye size={13} />
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span className="table-count">
                Showing {recentJobs.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(page * ITEMS_PER_PAGE, recentJobs.length)} of {recentJobs.length} jobs
              </span>
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="pagination-label">Page {page} of {totalPages}</span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-hover anim-fade-up delay-3">
          <div className="card-header">
            <div>
              <div className="card-title">Next Appointment</div>
              <div className="card-subtitle">Upcoming scheduled visit</div>
            </div>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>Loading…</div>
            ) : nextAppointment ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--blue-dim)',
                  border: '1px solid var(--bd-md)',
                  display: 'flex',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--bd)',
                    fontSize: 11,
                    color: 'var(--t3)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 10, textTransform: 'uppercase' }}>Date</span>
                  <span style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 700, lineHeight: 1, textAlign: 'center' }}>
                    {fmtDate(nextAppointment.scheduledStart)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{nextAppointment.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {nextAppointment.scheduledStart ? new Date(nextAppointment.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} /> {technicianNames[nextAppointment.id] || 'To be assigned'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--t4)', padding: '24px 0' }}>
                <Calendar size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div style={{ fontSize: 13 }}>No upcoming appointments</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingInvoices.length > 0 && (
        <div
          className="card anim-fade-up delay-4 pending-banner"
          style={{
            borderColor: 'var(--amber)',
            padding: 20,
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(217, 119, 6, 0.15)',
              }}
            >
              <AlertCircle size={20} color="var(--amber)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Pending Invoices</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                You have {pendingInvoices.length} invoice(s) totaling{' '}
                <span style={{ fontWeight: 600 }}>
                  {fmtMoney(pendingInvoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0))}
                </span>
              </div>
            </div>
          </div>
          <Link className="btn btn-primary" to="/invoices">
            Pay Now <ArrowRight size={12} />
          </Link>
        </div>
      )}
    </div>
  )
}
