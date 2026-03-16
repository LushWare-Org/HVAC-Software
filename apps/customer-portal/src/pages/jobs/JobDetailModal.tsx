import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Wrench, Calendar, FileText, DollarSign, User, Clock } from 'lucide-react'
import { useJobAssignments, useMyJob, useTechnician } from '../../hooks/useCustomerPortal'
import type { Job } from '../../types/api'

interface JobDetailModalProps {
  job: Job
  onClose: () => void
  onCancel?: () => void
}

type TabType = 'overview' | 'schedule' | 'notes'

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
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const { data } = useMyJob(initialJob.id)
  const job = data ?? initialJob
  const { data: assignmentData } = useJobAssignments(job?.id ?? null)

  const assignment = [...(assignmentData?.data ?? [])]
    .sort((a, b) => new Date(b.assignedAt ?? b.createdAt).getTime() - new Date(a.assignedAt ?? a.createdAt).getTime())[0]

  const technicianId = assignment?.technicianId ?? job.assignedToId ?? null
  const { data: technician } = useTechnician(technicianId)

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
  const assignedBy = assignment?.assignedBy
    ? (assignmentRecord?.changedByName || 'Dispatch team')
    : (assignmentRecord?.changedByName || latestUpdate?.changedByName || 'Auto dispatch')

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Wrench size={14} /> },
    { id: 'schedule', label: 'Schedule & Cost', icon: <Calendar size={14} /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
  ]

  const modal = (
    <div
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

        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '13px 22px',
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
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <InfoField label="Scheduled Date" icon={<Calendar size={11} />}>
                  <div style={fieldStyle}>{fmtDate(job.scheduledStart)}</div>
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

          {activeTab === 'notes' && (
            <div>
              <InfoField label="Job Notes" icon={<Clock size={11} />}>
                <div style={{ ...fieldStyle, minHeight: 120, paddingTop: 12, lineHeight: 1.6, color: '#9CA3AF' }}>
                  {job.notes || 'No notes available for this job yet.'}
                </div>
              </InfoField>
            </div>
          )}
        </div>

        <div
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

      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
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
