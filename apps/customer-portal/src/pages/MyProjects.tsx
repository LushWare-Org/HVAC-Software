/**
 * MyProjects — read-only view of the customer's long-running projects:
 * status + progress, visit history/upcoming visits, payment summary.
 * The sidebar entry only appears when the customer has ≥1 project.
 */
import { useState } from 'react'
import RescheduleBadge from '../components/reschedule/RescheduleBadge'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, MapPin, CalendarRange, ChevronDown, ChevronUp,
  Wrench, Wallet, CheckCircle2, Clock, Plus, FileText, FileSignature,
} from 'lucide-react'
import { useMyProjects, useMyProjectJobs, useMyProjectMoney, useMyProjectQuotes, type MyProject } from '../hooks/useMyProjects'
import { useMyAgreements } from '../hooks/useMyAgreements'
import { formatMoney } from '../lib/format'
import BookServiceModal from './jobs/BookServiceModal'

const QUOTE_STATUS_META: Record<string, { label: string; color: string; dim: string }> = {
  DRAFT: { label: 'Draft', color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  SENT: { label: 'Awaiting your review', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  APPROVED: { label: 'Approved', color: 'var(--green)', dim: 'var(--green-dim)' },
  DECLINED: { label: 'Declined', color: 'var(--red)', dim: 'var(--red-dim)' },
  EXPIRED: { label: 'Expired', color: 'var(--t3)', dim: 'var(--bg-card-2)' },
}

const AGREEMENT_STATUS_META: Record<string, { label: string; color: string; dim: string }> = {
  DRAFT: { label: 'Draft', color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  SENT: { label: 'Awaiting your signature', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  ACTIVE: { label: 'Active', color: 'var(--green)', dim: 'var(--green-dim)' },
  PENDING_RENEWAL: { label: 'Renewal due', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  RENEWED: { label: 'Renewed', color: 'var(--green)', dim: 'var(--green-dim)' },
  EXPIRED: { label: 'Expired', color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--red)', dim: 'var(--red-dim)' },
}

const STATUS_META: Record<MyProject['status'], { label: string; color: string; dim: string }> = {
  PLANNING: { label: 'Planning', color: 'var(--violet, #7c3aed)', dim: 'var(--violet-dim, rgba(124,58,237,0.12))' },
  ACTIVE: { label: 'In progress', color: 'var(--green, #16a34a)', dim: 'var(--green-dim, rgba(22,163,74,0.12))' },
  ON_HOLD: { label: 'On hold', color: 'var(--amber, #d97706)', dim: 'var(--amber-dim, rgba(217,119,6,0.12))' },
  COMPLETED: { label: 'Completed', color: 'var(--blue, #2563eb)', dim: 'var(--blue-dim, rgba(37,99,235,0.12))' },
  CANCELLED: { label: 'Cancelled', color: 'var(--red, #dc2626)', dim: 'var(--red-dim, rgba(220,38,38,0.12))' },
}

const DONE_STATUSES = ['COMPLETED', 'INVOICED', 'PAID']

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(String(iso).length === 10 ? `${iso}T12:00:00` : iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyProjects() {
  const { data: projects, isLoading } = useMyProjects()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderKanban size={20} style={{ color: 'var(--blue)' }} /> My Projects
        </h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>
          Larger engagements with a dedicated crew — track progress, visits and billing here.
        </p>
      </div>

      {isLoading ? (
        <div className="card" style={{ height: 120, opacity: 0.6 }} />
      ) : (projects ?? []).length === 0 ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No projects yet</p>
          <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '4px 0 0' }}>
            When your service company starts a project for you, it will appear here.
          </p>
        </div>
      ) : (
        (projects ?? []).map(p => (
          <ProjectCard key={p.id} project={p} open={openId === p.id} onToggle={() => setOpenId(openId === p.id ? null : p.id)} />
        ))
      )}
    </div>
  )
}

function ProjectCard({ project: p, open, onToggle }: { project: MyProject; open: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const meta = STATUS_META[p.status] ?? STATUS_META.PLANNING
  const jobsQ = useMyProjectJobs(open ? p.id : null)
  const moneyQ = useMyProjectMoney(open ? p.id : null)
  const quotesQ = useMyProjectQuotes(open ? p.id : null)
  const { data: agreementsData } = useMyAgreements()
  const agreements = (agreementsData?.data ?? []).filter(a => a.projectId === p.id)
  const [showBook, setShowBook] = useState(false)

  const jobs = jobsQ.data ?? []
  const done = jobs.filter(j => DONE_STATUSES.includes(j.status)).length
  const pct = jobs.length === 0 ? 0 : Math.round((done / jobs.length) * 100)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: meta.dim, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FolderKanban size={16} style={{ color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{p.name}</p>
          <p style={{ fontSize: 12, color: 'var(--t3)', margin: '3px 0 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CalendarRange size={11} /> {fmtDate(p.startDate)} → {fmtDate(p.targetEndDate)}
            </span>
            {p.siteAddress && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} /> {p.siteAddress.split(',')[0]}
              </span>
            )}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          background: meta.dim, color: meta.color, whiteSpace: 'nowrap',
        }}>
          {meta.label}
        </span>
        {open ? <ChevronUp size={16} style={{ color: 'var(--t4)' }} /> : <ChevronDown size={16} style={{ color: 'var(--t4)' }} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--bd)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {p.description && (
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>{p.description}</p>
          )}

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>
                {jobs.length === 0 ? '—' : `${done} of ${jobs.length} visits complete · ${pct}%`}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-card-2, rgba(148,163,184,0.15))', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Payment summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Invoiced', value: moneyQ.data?.invoiced, icon: Wallet, tone: 'var(--blue)' },
              { label: 'Paid', value: moneyQ.data?.paid, icon: CheckCircle2, tone: 'var(--green)' },
              { label: 'Outstanding', value: moneyQ.data?.outstanding, icon: Clock, tone: (moneyQ.data?.outstanding ?? 0) > 0 ? 'var(--amber)' : 'var(--t3)' },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-2, rgba(148,163,184,0.08))', border: '1px solid var(--bd)' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={10} /> {m.label}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: m.tone as string, margin: '4px 0 0' }}>
                    {m.value == null ? '—' : formatMoney(m.value, { decimals: 0 })}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Agreements */}
          {agreements.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Agreements
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {agreements.map(a => {
                  const am = AGREEMENT_STATUS_META[a.status] ?? { label: a.status, color: 'var(--t3)', dim: 'var(--bg-card-2)' }
                  return (
                    <button key={a.id} onClick={() => navigate('/agreements')} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                      background: 'var(--bg-card-2, rgba(148,163,184,0.08))', border: '1px solid var(--bd)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    }}>
                      <FileSignature size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.name}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', background: am.dim, color: am.color }}>
                        {am.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quotes */}
          {(quotesQ.data ?? []).length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                Quotes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(quotesQ.data ?? []).map(q => {
                  const qm = QUOTE_STATUS_META[q.status] ?? { label: q.status, color: 'var(--t3)', dim: 'var(--bg-card-2)' }
                  return (
                    <button key={q.id} onClick={() => navigate('/quotes')} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                      background: 'var(--bg-card-2, rgba(148,163,184,0.08))', border: '1px solid var(--bd)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%',
                    }}>
                      <FileText size={13} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>
                        {q.quoteNumber ?? 'Quote'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{formatMoney(q.total, { decimals: 0 })}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', background: qm.dim, color: qm.color }}>
                        {qm.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Visits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Visits
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowBook(true)}>
                <Plus size={12} /> Book a service
              </button>
            </div>
            {jobs.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No visits scheduled yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {jobs.map(j => {
                  const isDone = DONE_STATUSES.includes(j.status)
                  return (
                    <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card-2, rgba(148,163,184,0.08))', border: '1px solid var(--bd)' }}>
                      <Wrench size={13} style={{ color: isDone ? 'var(--green)' : 'var(--t3)', flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmtDate(j.scheduledStart)}</span>
                      <RescheduleBadge state={j.rescheduleState} size="sm" />
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                        background: isDone ? 'var(--green-dim, rgba(22,163,74,0.12))' : 'var(--blue-dim, rgba(37,99,235,0.12))',
                        color: isDone ? 'var(--green)' : 'var(--blue)',
                      }}>
                        {j.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showBook && (
        <BookServiceModal onClose={() => setShowBook(false)} projectId={p.id} projectName={p.name} />
      )}
    </div>
  )
}
