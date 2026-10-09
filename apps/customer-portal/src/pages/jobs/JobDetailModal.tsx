import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Wrench, Calendar, FileText, DollarSign, User, Clock, MessageSquare, Star, ClipboardCheck, Download, CalendarClock } from 'lucide-react'
import { useJobAssignments, useMyJob, useTechnician, useJobInvoices, useJobQuotes, useJobReview, useConfirmVisit } from '../../hooks/useCustomerPortal'
import { canConfirm, isConfirmed } from '../../lib/confirm'
import ReviewModal from '../../components/ReviewModal'
import RescheduleBadge from '../../components/reschedule/RescheduleBadge'
import RescheduleModal from '../../components/reschedule/RescheduleModal'
import EditPreferredTimeModal from './EditPreferredTimeModal.tsx'
import { CUSTOMER_RESCHEDULABLE_STATUSES } from '../../lib/reschedule'
import { printServiceReport } from '../../lib/serviceReportPdf'
import type { Job } from '../../types/api'
import { formatMoney } from '../../lib/format'

interface JobDetailModalProps {
  job: Job
  onClose: () => void
  onCancel?: () => void
}

type TabType = 'overview' | 'schedule' | 'documents' | 'report' | 'notes' | 'chat'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  COMPLETED: { label: 'Completed', css: 'badge-green' },
  SCHEDULED: { label: 'Scheduled', css: 'badge-violet' },
  PENDING: { label: 'Pending', css: 'badge-amber' },
  CANCELLED: { label: 'Cancelled', css: 'badge-red' },
  EN_ROUTE: { label: 'En Route', css: 'badge-blue' },
  ON_SITE: { label: 'On Site', css: 'badge-blue' },
  INVOICED: { label: 'Invoiced', css: 'badge-cyan' },
  PAID: { label: 'Paid', css: 'badge-green' },
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  color: '#374151',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'default',
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function JobDetailModal({ job: initialJob, onClose, onCancel }: JobDetailModalProps) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [showEditTime, setShowEditTime] = useState(false)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const { data } = useMyJob(initialJob.id)
  const job = data ?? initialJob
  const confirmVisit = useConfirmVisit()
  const { data: assignmentData } = useJobAssignments(job?.id ?? null)
  const { data: jobInvoices = [] } = useJobInvoices(job?.id ?? null)
  const { data: jobQuotes = [] } = useJobQuotes(job?.id ?? null)


  const assignment = [...(assignmentData?.data ?? [])]
    .sort((a, b) => new Date(b.assignedAt ?? b.createdAt).getTime() - new Date(a.assignedAt ?? a.createdAt).getTime())[0]

  const technicianId = assignment?.technicianId ?? job.assignedToId ?? null
  const { data: technician } = useTechnician(technicianId)

  // Reviews — allow customer to rate a job once it's done/invoiced/paid
  const canReview = ['COMPLETED', 'INVOICED', 'PAID'].includes(job.status)
  const { data: existingReview } = useJobReview(canReview ? job.id : null)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    if (job) setActiveTab('overview')
  }, [job])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!job) return null

  const status = STATUS_MAP[job.status] ?? { label: job.status, css: 'badge-neutral' }
  const history = [...(job.statusHistory ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const latestUpdate = history[0]
  const assignmentRecord = history.find(h => ['SCHEDULED', 'EN_ROUTE', 'ON_SITE'].includes(h.toStatus))
  const technicianName = technician?.name || assignment?.technicianName || job.assignedToName || 'Not assigned yet'
  const assignedAt = assignment?.assignedAt ?? assignmentRecord?.createdAt ?? job.scheduledStart
  // Use assignedByName from dispatch assignment if available; fallback to T&S Team
  // (avoid showing the customer's own name as "Assigned By")
  const assignedBy = assignment?.assignedByName || (assignment ? 'T&S Team' : 'Pending assignment')

  const workOrders = job.workOrders ?? []
  const showReport = workOrders.length > 0 && ['COMPLETED', 'INVOICED', 'PAID'].includes(job.status)

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Wrench size={14} /> },
    { id: 'schedule', label: 'Schedule & Cost', icon: <Calendar size={14} /> },
    { id: 'documents', label: 'Quotes & Invoices', icon: <DollarSign size={14} />, badge: jobInvoices.length + jobQuotes.length || undefined },
    ...(showReport ? [{ id: 'report' as TabType, label: 'Service Report', icon: <ClipboardCheck size={14} /> }] : []),
    { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
    { id: 'chat', label: 'Messages', icon: <MessageSquare size={14} /> },
  ]

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cp-modal-container"
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          height: 620,
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="cp-modal-header"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            padding: '22px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ color: '#BFDBFE', fontSize: 12, fontWeight: 600, letterSpacing: '0.07em' }}>
                {job.jobNumber}
              </span>
              <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>
                {status.label}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{job.title}</h2>
            <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 3 }}>
              {technicianName !== 'Not assigned yet' ? `Assigned technician: ${technicianName}` : 'Technician assignment pending'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#BFDBFE',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cp-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '13px 18px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#2563EB' : '#6B7280',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {t.icon} {t.label}
              {t.badge ? (
                <span style={{ background: '#2563EB', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="cp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {activeTab === 'overview' && (
            <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <InfoField label="Service" icon={<Wrench size={11} />}>
                <div style={fieldStyle}>{job.title}</div>
              </InfoField>
              <InfoField label="Technician" icon={<User size={11} />}>
                <div style={fieldStyle}>{technicianName === 'Not assigned yet' ? 'To be assigned' : technicianName}</div>
              </InfoField>
              <InfoField label="Status">
                <span className={`badge ${status.css}`} style={{ fontSize: 13 }}>{status.label}</span>
              </InfoField>
              <InfoField label="Description" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, minHeight: 72, paddingTop: 10, lineHeight: 1.55 }}>
                  {job.description || 'No description provided.'}
                </div>
              </InfoField>
              <InfoField label="Assignment Details" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, minHeight: 88, lineHeight: 1.55 }}>
                  <div><strong>Technician:</strong> {technicianName}</div>
                  <div><strong>Assigned At:</strong> {fmtDateTime(assignedAt)}</div>
                  <div><strong>Assigned By:</strong> {assignedBy}</div>
                  {technician?.phone && <div><strong>Technician Phone:</strong> {technician.phone}</div>}
                  {latestUpdate && (
                    <div><strong>Latest Update:</strong> {latestUpdate.toStatus.replace(/_/g, ' ')} · {fmtDateTime(latestUpdate.createdAt)}</div>
                  )}
                </div>
              </InfoField>
              {technicianName !== 'Not assigned yet' && (
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => {
                      onClose()
                      navigate(job.assignedToId ? `/messages?tech=${encodeURIComponent(job.assignedToId)}` : '/messages?office')
                    }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 10,
                      border: '1px solid #EDE9FE', background: '#F5F3FF',
                      color: '#7C3AED', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    <MessageSquare size={14} /> Chat with Technician
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <InfoField label="Scheduled Date" icon={<Calendar size={11} />}>
                  <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {fmtDate(job.scheduledStart)}
                    <RescheduleBadge state={job.rescheduleState} size="sm" />
                  </div>
                </InfoField>
                <InfoField label="Estimated Cost" icon={<DollarSign size={11} />}>
                  <div style={fieldStyle}>—</div>
                </InfoField>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', marginBottom: 14 }}>Job Summary</h4>
                {[
                  { label: 'Job #', value: job.jobNumber },
                  { label: 'Service', value: job.title },
                  { label: 'Technician', value: technicianName === 'Not assigned yet' ? 'To be assigned' : technicianName },
                  { label: 'Date', value: fmtDate(job.scheduledStart) },
                  { label: 'Priority', value: job.priority },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: '#6B7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Quotes */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Quotes</h4>
                {jobQuotes.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No quotes for this job.</p>
                ) : jobQuotes.map((q) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 8, background: '#FAFAFA' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{q.quoteNumber}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{q.title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatMoney(q.total)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: q.status === 'ACCEPTED' ? '#D1FAE5' : q.status === 'DECLINED' ? '#FEE2E2' : '#EFF6FF', color: q.status === 'ACCEPTED' ? '#065F46' : q.status === 'DECLINED' ? '#B91C1C' : '#1D4ED8' }}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Invoices */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Invoices</h4>
                {jobInvoices.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No invoices for this job.</p>
                ) : jobInvoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 8, background: '#FAFAFA' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Due: {inv.dueDate ? fmtDate(inv.dueDate) : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatMoney(inv.total)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'OVERDUE' ? '#FEE2E2' : '#EFF6FF', color: inv.status === 'PAID' ? '#065F46' : inv.status === 'OVERDUE' ? '#B91C1C' : '#1D4ED8' }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Download button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => printServiceReport(job, workOrders, technicianName)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
              {(() => {
                const allTasks = workOrders.flatMap(w => w.taskCompletions)
                const done = allTasks.filter(t => t.isCompleted).length
                const partsTotal = workOrders
                  .flatMap(w => w.lineItems)
                  .reduce((sum, li) => sum + Number(li.lineTotal), 0)
                const onSiteMs = workOrders.reduce((sum, w) => {
                  if (!w.checkinAt || !w.checkoutAt) return sum
                  return sum + (new Date(w.checkoutAt).getTime() - new Date(w.checkinAt).getTime())
                }, 0)
                const onSiteLabel = onSiteMs > 0
                  ? `${Math.floor(onSiteMs / 3600000)}h ${Math.round((onSiteMs % 3600000) / 60000)}m`
                  : null
                const stats: { label: string; value: string }[] = [
                  ...(allTasks.length ? [{ label: 'Tasks completed', value: `${done}/${allTasks.length}` }] : []),
                  ...(onSiteLabel ? [{ label: 'Time on site', value: onSiteLabel }] : []),
                  ...(partsTotal > 0 ? [{ label: 'Parts & materials', value: formatMoney(partsTotal) }] : []),
                ]
                if (!stats.length) return null
                return (
                  <div style={{
                    display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  }}>
                    {stats.map((s, i) => (
                      <div key={s.label} style={{
                        flex: 1, padding: '14px 16px', textAlign: 'center',
                        borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none',
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                          {s.value}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              {workOrders.map(wo => {
                const completedTasks = wo.taskCompletions.filter(t => t.isCompleted)
                return (
                  <div key={wo.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{wo.workOrderNumber}</span>
                      <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <User size={12} /> {wo.technicianName}
                      </span>
                    </div>
                    {(wo.checkinAt || wo.checkoutAt) && (
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
                        On site {fmtDateTime(wo.checkinAt)} — {wo.checkoutAt ? fmtDateTime(wo.checkoutAt) : 'in progress'}
                      </div>
                    )}

                    {wo.taskCompletions.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Work performed ({completedTasks.length}/{wo.taskCompletions.length})
                        </div>
                        {wo.taskCompletions.map(t => (
                          <div key={t.id} style={{ fontSize: 13, color: '#374151', padding: '3px 0', display: 'flex', gap: 8 }}>
                            <span>{t.isCompleted ? '✅' : '⬜'}</span>
                            <span>
                              {t.taskName}
                              {t.notes && <div style={{ color: '#6B7280', fontSize: 12 }}>{t.notes}</div>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {wo.lineItems.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Parts &amp; materials
                        </div>
                        {wo.lineItems.map(li => (
                          <div key={li.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', padding: '3px 0' }}>
                            <span>{li.description} × {Number(li.quantity)}</span>
                            <span style={{ fontWeight: 600 }}>{formatMoney(li.lineTotal)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {wo.technicianNotes && (
                      <div style={{ marginBottom: wo.signatureUrl ? 14 : 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Technician notes
                        </div>
                        <div style={{ ...fieldStyle, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{wo.technicianNotes}</div>
                      </div>
                    )}

                    {wo.signatureUrl && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Customer signature
                        </div>
                        <img src={wo.signatureUrl} alt="Customer signature" style={{ maxHeight: 80, border: '1px solid #E5E7EB', borderRadius: 8, padding: 6, background: '#fff' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <InfoField label="Job Notes" icon={<Clock size={11} />}>
                <div style={{ ...fieldStyle, minHeight: 120, paddingTop: 12, lineHeight: 1.6, color: '#9CA3AF' }}>
                  {job.notes || 'No notes available for this job yet.'}
                </div>
              </InfoField>
            </div>
          )}

          {activeTab === 'chat' && (
            // Messages live in one place (Messages), so a conversation is never split across screens.
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>
                Questions about this visit? Message us and mention {job.jobNumber}.
              </p>
              <button className="btn btn-primary" onClick={() => { onClose(); navigate('/messages?office') }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <MessageSquare size={14} /> Message the office
              </button>
              {job.assignedToId && (
                <button className="btn btn-secondary" onClick={() => { onClose(); navigate(`/messages?tech=${encodeURIComponent(job.assignedToId!)}`) }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <MessageSquare size={14} /> Message {technicianName}
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className="cp-modal-footer"
          style={{
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '14px 28px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {canReview && (
            <button
              onClick={() => setReviewOpen(true)}
              style={{
                padding: '9px 16px', borderRadius: 9,
                border: '1px solid #FCD34D',
                background: existingReview ? '#fff' : '#FEF3C7',
                color: '#92400E',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              title={existingReview ? `Your rating: ${existingReview.rating}/5 — click to edit` : 'Rate this job'}
            >
              <Star size={14} fill={existingReview ? '#F59E0B' : 'transparent'} color="#F59E0B" />
              {existingReview ? `Your rating: ${existingReview.rating}/5` : 'Rate this job'}
            </button>
          )}
          {job.status === 'SCHEDULED' && job.assignedToId && isConfirmed(job) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '9px 14px', borderRadius: 9, background: 'var(--green-dim)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>Time confirmed</span>
          )}
          {canConfirm(job) && (
            <button
              onClick={() => confirmVisit.mutate(job.id)}
              disabled={confirmVisit.isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Confirm this time
            </button>
          )}
          {job.status === 'PENDING' && !job.assignedToId && (
            <button
              onClick={() => setShowEditTime(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 9,
                border: '1px solid var(--bd)', background: 'var(--bg-card)',
                color: 'var(--t2)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <CalendarClock size={14} /> Change time
            </button>
          )}
          {!(job.status === 'PENDING' && !job.assignedToId)
            && CUSTOMER_RESCHEDULABLE_STATUSES.includes(job.status) && (
            <button
              onClick={() => setShowReschedule(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 9,
                border: '1px solid var(--bd)', background: 'var(--bg-card)',
                color: 'var(--t2)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <CalendarClock size={14} /> Reschedule
            </button>
          )}
          {onCancel && ['PENDING', 'SCHEDULED'].includes(job.status) && (
            <button
              onClick={() => {
                onClose()
                onCancel()
              }}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#B91C1C',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel Job
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: 9,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes modalTypingDot { 0%, 60%, 100% { opacity: 0.2; transform: scale(0.7); } 30% { opacity: 1; transform: scale(1); } }
      `}</style>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        type="JOB"
        jobId={job.id}
        technicianId={technicianId ?? undefined}
        technicianName={technician?.name ?? assignment?.technicianName ?? job.assignedToName ?? undefined}
        existing={existingReview ?? undefined}
      />

      {showEditTime && (
        <EditPreferredTimeModal
          job={{ id: job.id, title: job.title, scheduledStart: job.scheduledStart }}
          onClose={() => setShowEditTime(false)}
        />
      )}

      {showReschedule && (
        <RescheduleModal
          job={{
            id: job.id, title: job.title, scheduledStart: job.scheduledStart,
            status: job.status, rescheduleState: job.rescheduleState,
          }}
          isOpen
          onClose={() => setShowReschedule(false)}
        />
      )}
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

function InfoField({
  label,
  icon,
  children,
  style,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
